import { Router } from 'express';
import { upsertUser } from '../db.js';
import { requireAuth, signToken, setAuthCookie } from '../middleware/auth.js';

const router = Router();

function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.API_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

router.get('/google', (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    });
  }
  res.redirect(getGoogleAuthUrl());
});

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.API_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Google token error:', tokens);
      return res.redirect(`${frontendUrl}/login?error=google_token_failed`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok) {
      return res.redirect(`${frontendUrl}/login?error=google_profile_failed`);
    }

    const user = upsertUser({
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    const jwt = signToken(user);
    setAuthCookie(res, jwt);
    res.redirect(`${frontendUrl}/?login=success`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    },
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('snowballr_token', { path: '/' });
  res.json({ ok: true });
});

export default router;
