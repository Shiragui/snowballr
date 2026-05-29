import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function SchwabHoldings({ onSelectTicker }) {
  const { isAuthenticated, schwab } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !schwab.connected) {
      setPositions([]);
      return;
    }

    setLoading(true);
    setError('');
    api
      .schwabPositions()
      .then(({ positions: data }) => setPositions(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, schwab.connected]);

  if (!isAuthenticated || !schwab.connected) return null;

  return (
    <div className="bg-primary-500/10 backdrop-blur-sm rounded-lg p-4 border border-primary-500/20 w-full">
      <h4 className="text-primary-300 text-sm font-medium mb-3">Your Schwab holdings</h4>
      {loading && <p className="text-primary-400 text-xs">Loading positions…</p>}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {!loading && !error && positions.length === 0 && (
        <p className="text-primary-400 text-xs">No positions found.</p>
      )}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {positions.map((pos) => (
            <button
              key={`${pos.accountNumber}-${pos.symbol}`}
              onClick={() => onSelectTicker?.(pos.symbol)}
              className="text-left p-2 rounded-lg bg-primary-500/10 border border-primary-500/20 hover:border-primary-400/40 hover:bg-primary-500/20 transition-colors"
            >
              <div className="font-semibold text-primary-200 text-sm">{pos.symbol}</div>
              <div className="text-primary-400 text-xs">
                {pos.quantity} shares · ${Number(pos.marketValue || 0).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
