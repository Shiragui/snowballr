import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'store.json');

const defaultStore = {
  users: [],
  projections: [],
  schwabConnections: [],
};

function readStore() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return structuredClone(defaultStore);
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return structuredClone(defaultStore);
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

export function createId() {
  return crypto.randomUUID();
}

export function findUserByGoogleId(googleId) {
  const store = readStore();
  return store.users.find((u) => u.googleId === googleId) ?? null;
}

export function findUserById(id) {
  const store = readStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export function upsertUser({ googleId, email, name, picture }) {
  const store = readStore();
  let user = store.users.find((u) => u.googleId === googleId);
  if (user) {
    user.email = email;
    user.name = name;
    user.picture = picture;
    user.updatedAt = new Date().toISOString();
  } else {
    user = {
      id: createId(),
      googleId,
      email,
      name,
      picture,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(user);
  }
  writeStore(store);
  return user;
}

export function listProjections(userId) {
  const store = readStore();
  return store.projections
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function createProjection(userId, data) {
  const store = readStore();
  const projection = {
    id: createId(),
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.projections.push(projection);
  writeStore(store);
  return projection;
}

export function deleteProjection(userId, projectionId) {
  const store = readStore();
  const index = store.projections.findIndex(
    (p) => p.id === projectionId && p.userId === userId
  );
  if (index === -1) return false;
  store.projections.splice(index, 1);
  writeStore(store);
  return true;
}

export function getSchwabConnection(userId) {
  const store = readStore();
  return store.schwabConnections.find((c) => c.userId === userId) ?? null;
}

export function saveSchwabConnection(userId, tokens) {
  const store = readStore();
  const existing = store.schwabConnections.findIndex((c) => c.userId === userId);
  const connection = {
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 1800) * 1000,
    refreshExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    updatedAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    store.schwabConnections[existing] = connection;
  } else {
    store.schwabConnections.push(connection);
  }
  writeStore(store);
  return connection;
}

export function deleteSchwabConnection(userId) {
  const store = readStore();
  const before = store.schwabConnections.length;
  store.schwabConnections = store.schwabConnections.filter((c) => c.userId !== userId);
  writeStore(store);
  return store.schwabConnections.length < before;
}
