import React from "react";

export default function SearchBar({ value, onChange, onSelect, onFocus, onBlur, onKeyDown, suggestions, selectedETF, loading, activeSuggestionIndex, placeholder }) {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Selected ETF tag */}
        {selectedETF && (
          <span className="inline-flex items-center ml-3 mr-2 px-3 py-1.5 rounded-md bg-primary-500/20 text-primary-200 text-sm whitespace-nowrap">
            <span className="font-semibold">{selectedETF.ticker}</span>
            <span className="text-primary-300/80 ml-1.5">{selectedETF.name}</span>
          </span>
        )}

        {/* Search input */}
              <input
                type="text"
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                placeholder={selectedETF ? "" : (placeholder || "Search stock ticker (e.g., AAPL, TSLA, QQQ)...")}
                className="flex-1 min-w-0 pl-3 pr-10 py-3 bg-transparent placeholder-primary-300/70 text-primary-200 focus:outline-none"
              />

              {/* Loading spinner */}
              {loading && (
                <div className="absolute right-3 text-primary-300">
                  <svg className="animate-spin h-5 w-5 text-primary-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {/* Search icon (only if not loading) */}
              {!loading && (
                <div className="absolute right-3 text-primary-300 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
      </div>

      {/* Outer border wrapping everything */}
      <div className="absolute inset-0 border border-primary-500/20 rounded-lg pointer-events-none focus-within:border-primary-400 transition-all duration-200" />

      {/* Dropdown suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-primary-500/20 backdrop-blur-md rounded-lg shadow-xl border border-primary-500/30 overflow-hidden z-10">
                {suggestions.map((s, index) => (
                  <div
                    key={s.ticker + s.exchange} // Unique key
                    onClick={() => onSelect(s)}
                    className={`px-4 py-2 hover:bg-primary-500/30 cursor-pointer transition-all duration-150 border-b border-primary-500/20 last:border-b-0 group ${
                      index === activeSuggestionIndex ? 'bg-primary-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-primary-300 group-hover:text-primary-200 transition-colors">
                          {s.ticker}
                        </span>
                        <span className="text-primary-200/90 ml-2 text-sm">
                          {s.name} {s.exchange && `(${s.exchange})`}
                        </span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-primary-300/70 group-hover:text-primary-200 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
    </div>
  );
}