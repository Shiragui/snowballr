import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import {
  getSchwabConnection,
  saveSchwabConnection,
  deleteSchwabConnection,
} from '../db.js';

const router = Router();
const pendingSchwabStates = new Map();

const SCHWAB_AUTH_URL = 'https://api.schwabapi.com/v1/oauth/authorize';
const SCHWAB_TOKEN_URL = 'https://api.schwabapi.com/v1/oauth/token';
const SCHWAB_API_BASE = 'https://api.schwabapi.com';

function isSchwabConfigured() {
  return Boolean(
    process.env.SCHWAB_CLIENT_ID &&
      process.env.SCHWAB_CLIENT_SECRET &&
      process.env.SCHWAB_REDIRECT_URI
  );
}

function basicAuthHeader() {
  const creds = Buffer.from(
    `${process.env.SCHWAB_CLIENT_ID}:${process.env.SCHWAB_CLIENT_SECRET}`
  ).toString('base64');
  return `Basic ${creds}`;
}

async function refreshSchwabToken(connection) {
  const res = await fetch(SCHWAB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refreshToken,
    }),
  });

  const tokens = await res.json();
  if (!res.ok) {
    throw new Error(tokens.error_description || tokens.error || 'Token refresh failed');
  }

  return saveSchwabConnection(connection.userId, tokens);
}

async function getValidConnection(userId) {
  let connection = getSchwabConnection(userId);
  if (!connection) return null;

  if (Date.now() >= connection.expiresAt - 60_000) {
    connection = await refreshSchwabToken(connection);
  }
  return connection;
}

async function schwabFetch(userId, path) {
  const connection = await getValidConnection(userId);
  if (!connection) {
    throw new Error('Schwab not connected');
  }

  const res = await fetch(`${SCHWAB_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${connection.accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Schwab API error ${res.status}`);
  }

  return res.json();
}

router.get('/status', requireAuth, (req, res) => {
  const connection = getSchwabConnection(req.user.id);
  res.json({
    configured: isSchwabConfigured(),
    connected: Boolean(connection),
    refreshExpiresAt: connection?.refreshExpiresAt ?? null,
  });
});

router.get('/connect', requireAuth, (req, res) => {
  if (!isSchwabConfigured()) {
    return res.status(503).json({
      error: 'Schwab is not configured. Set SCHWAB_CLIENT_ID, SCHWAB_CLIENT_SECRET, and SCHWAB_REDIRECT_URI.',
    });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingSchwabStates.set(state, {
    userId: req.user.id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: process.env.SCHWAB_CLIENT_ID,
    redirect_uri: process.env.SCHWAB_REDIRECT_URI,
    response_type: 'code',
    state,
  });

  res.redirect(`${SCHWAB_AUTH_URL}?${params}`);
});

router.get('/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.redirect(`${frontendUrl}/?schwab=error`);
  }

  const pending = pendingSchwabStates.get(state);
  pendingSchwabStates.delete(state);

  if (!pending || Date.now() > pending.expiresAt) {
    return res.redirect(`${frontendUrl}/?schwab=invalid_state`);
  }

  try {
    const tokenRes = await fetch(SCHWAB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SCHWAB_REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Schwab token error:', tokens);
      return res.redirect(`${frontendUrl}/?schwab=token_failed`);
    }

    saveSchwabConnection(pending.userId, tokens);
    res.redirect(`${frontendUrl}/?schwab=connected`);
  } catch (err) {
    console.error('Schwab callback error:', err);
    res.redirect(`${frontendUrl}/?schwab=error`);
  }
});

router.post('/disconnect', requireAuth, (req, res) => {
  deleteSchwabConnection(req.user.id);
  res.json({ ok: true });
});

router.get('/accounts', requireAuth, async (req, res) => {
  try {
    const data = await schwabFetch(req.user.id, '/trader/v1/accounts?fields=positions');
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/positions', requireAuth, async (req, res) => {
  try {
    const accounts = await schwabFetch(req.user.id, '/trader/v1/accounts?fields=positions');
    const positions = (accounts || []).flatMap((account) => {
      const acct = account.securitiesAccount || account;
      return (acct.positions || []).map((pos) => ({
        accountNumber: acct.accountNumber,
        symbol: pos.instrument?.symbol,
        quantity: pos.longQuantity,
        averagePrice: pos.averagePrice,
        marketValue: pos.marketValue,
      }));
    });
    res.json({ positions });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
