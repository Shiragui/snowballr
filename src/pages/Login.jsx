import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [health, setHealth] = useState(null);
  const error = searchParams.get('error');

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  const errorMessages = {
    google_auth_failed: 'Google sign-in was cancelled or failed.',
    google_token_failed: 'Could not complete Google sign-in.',
    google_profile_failed: 'Could not load your Google profile.',
    server_error: 'Something went wrong on our server.',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 px-6">
      <div className="w-full max-w-md bg-primary-500/10 backdrop-blur-sm rounded-2xl border border-primary-500/20 shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-100 drop-shadow-[0_0_10px_rgba(221,214,254,0.4)]">
            SnowballR
          </h1>
          <p className="text-primary-300 mt-2 text-sm">
            Sign in to save projections and connect your Schwab account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
            {errorMessages[error] || 'Sign-in failed. Please try again.'}
          </div>
        )}

        {health && !health.google && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs">
            Google login is not configured yet. Add OAuth credentials to your server <code className="text-amber-100">.env</code> file (see README).
          </div>
        )}

        <a
          href={api.googleLoginUrl()}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white text-gray-800 font-medium hover:bg-gray-100 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-primary-400/70 text-xs text-center mt-6">
          After signing in, you can link Charles Schwab from your account menu to pull live holdings.
        </p>

        <Link
          to="/"
          className="block text-center mt-4 text-sm text-primary-300 hover:text-primary-200 transition-colors"
        >
          Continue without signing in
        </Link>
      </div>
    </div>
  );
}
