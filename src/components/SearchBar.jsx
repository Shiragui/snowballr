import React from "react";

export default function SearchBar({ value, onChange, onSelect, suggestions }) {
  return (
    <div className="relative mb-4">
      {/* Search input with gradient border effect */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Search ETFs (e.g. VOO, SPY, QQQ)"
          className="w-full px-4 py-2 rounded-lg bg-gray-800/50 backdrop-blur-sm placeholder-gray-500 text-white border border-gray-700 focus:outline-none focus:border-emerald-400 focus:bg-gray-800/80 transition-all duration-200"
        />
        {/* Search icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 overflow-hidden z-10">
          {suggestions.map((s) => (
            <div
              key={s.ticker}
              onClick={() => onSelect(s)}
              className="px-4 py-2 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-emerald-400/10 cursor-pointer transition-all duration-150 border-b border-gray-700/50 last:border-b-0 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {s.ticker}
                  </span>
                  <span className="text-gray-400 ml-2 text-sm">
                    {s.name}
                  </span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 text-gray-600 group-hover:text-emerald-400 transition-colors" 
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