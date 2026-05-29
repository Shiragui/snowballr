const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  getMe: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  googleLoginUrl: () => `${API_BASE}/api/auth/google`,

  listProjections: () => request('/api/projections'),
  saveProjection: (body) =>
    request('/api/projections', { method: 'POST', body: JSON.stringify(body) }),
  deleteProjection: (id) =>
    request(`/api/projections/${id}`, { method: 'DELETE' }),

  schwabStatus: () => request('/api/schwab/status'),
  schwabConnectUrl: () => `${API_BASE}/api/schwab/connect`,
  schwabDisconnect: () => request('/api/schwab/disconnect', { method: 'POST' }),
  schwabAccounts: () => request('/api/schwab/accounts'),
  schwabPositions: () => request('/api/schwab/positions'),
};
