import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AccountMenu({
  projectionInputs,
  onLoadProjection,
  savedProjections,
  onRefreshProjections,
}) {
  const { user, isAuthenticated, schwab, logout, refreshSchwab } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!projectionInputs?.etfTicker) return;
    setSaving(true);
    setMessage('');
    try {
      await api.saveProjection(projectionInputs);
      await onRefreshProjections?.();
      setMessage('Saved!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.deleteProjection(id);
    await onRefreshProjections?.();
  };

  const handleSchwabConnect = () => {
    window.location.href = api.schwabConnectUrl();
  };

  const handleSchwabDisconnect = async () => {
    await api.schwabDisconnect();
    await refreshSchwab();
  };

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-400/20 border border-primary-400/30 text-primary-200 hover:bg-primary-400/30 transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 hover:bg-primary-500/20 transition-colors"
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary-400/30 flex items-center justify-center text-xs text-primary-200">
            {user.name?.[0] || '?'}
          </div>
        )}
        <span className="text-sm text-primary-200 hidden sm:inline max-w-[120px] truncate">
          {user.name?.split(' ')[0]}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-primary-900/95 backdrop-blur-md rounded-xl border border-primary-500/30 shadow-2xl p-4 space-y-4">
            <div>
              <p className="text-primary-200 font-medium truncate">{user.name}</p>
              <p className="text-primary-400 text-xs truncate">{user.email}</p>
            </div>

            <div className="border-t border-primary-500/20 pt-3">
              <p className="text-primary-300 text-xs font-medium uppercase tracking-wide mb-2">
                Saved projections
              </p>
              {savedProjections?.length > 0 ? (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {savedProjections.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 text-sm group"
                    >
                      <button
                        onClick={() => {
                          onLoadProjection?.(p);
                          setOpen(false);
                        }}
                        className="text-primary-200 hover:text-primary-100 truncate text-left flex-1"
                      >
                        {p.name}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-primary-500 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-primary-400 text-xs">No saved projections yet</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !projectionInputs?.etfTicker}
                className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-primary-400/30 border border-primary-400/40 text-primary-200 hover:bg-primary-400/40 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save current projection'}
              </button>
              {message && (
                <p className="text-xs text-primary-300 mt-1 text-center">{message}</p>
              )}
            </div>

            <div className="border-t border-primary-500/20 pt-3">
              <p className="text-primary-300 text-xs font-medium uppercase tracking-wide mb-2">
                Charles Schwab
              </p>
              {!schwab.configured ? (
                <p className="text-primary-400 text-xs">
                  Schwab API not configured on server yet.
                </p>
              ) : schwab.connected ? (
                <div className="space-y-2">
                  <p className="text-green-400 text-xs">Connected</p>
                  <button
                    onClick={handleSchwabDisconnect}
                    className="w-full py-2 rounded-lg text-sm border border-primary-500/30 text-primary-300 hover:bg-primary-500/20 transition-colors"
                  >
                    Disconnect Schwab
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSchwabConnect}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-colors"
                >
                  Connect Schwab account
                </button>
              )}
            </div>

            <button
              onClick={async () => {
                await logout();
                setOpen(false);
              }}
              className="w-full py-2 rounded-lg text-sm text-primary-400 hover:text-primary-200 hover:bg-primary-500/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
