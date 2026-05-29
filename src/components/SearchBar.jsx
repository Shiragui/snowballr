import React, { useRef, useEffect } from "react";
import ETFExplorer from "./ETFExplorer";
import { formatReturnPct, formatDividendYield } from "../services/stockData";

export default function SearchBar({
  value,
  onChange,
  onSelect,
  onFocus,
  onOpenPanel,
  onKeyDown,
  suggestions,
  selectedETF,
  loading,
  activeSuggestionIndex,
  placeholder,
  isOpen,
  browseMode,
  browseView,
  onBrowseViewChange,
  categories,
  selectedCategoryId,
  onSelectCategory,
  yearReturns = {},
  returnsLoading,
  onClose,
  browseItems = [],
  browseHasMore = false,
  loadingMore = false,
  onLoadMore,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const showPanel = isOpen && (browseMode || suggestions.length > 0);

  const handleContainerClick = () => {
    inputRef.current?.focus();
    onOpenPanel?.();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="relative flex items-center cursor-text"
        onClick={handleContainerClick}
      >
        {selectedETF && (
          <span className="inline-flex items-center ml-3 mr-2 px-3 py-1.5 rounded-md bg-primary-500/20 text-primary-200 text-sm whitespace-nowrap">
            <span className="font-semibold">{selectedETF.ticker}</span>
            <span className="text-primary-300/80 ml-1.5 hidden sm:inline truncate max-w-[140px]">
              {selectedETF.name}
            </span>
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={selectedETF ? "Search another ticker…" : (placeholder || "Search stock ticker…")}
          className="flex-1 min-w-0 pl-3 pr-10 py-3 bg-transparent placeholder-primary-300/70 text-primary-200 focus:outline-none"
        />

        {loading && (
          <div className="absolute right-3 text-primary-300 pointer-events-none">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        {!loading && (
          <div className="absolute right-3 text-primary-300 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      <div className={`absolute inset-0 border rounded-lg pointer-events-none transition-all duration-200 ${
        isOpen ? "border-primary-400" : "border-primary-500/20"
      }`} />

      {showPanel && (
        <div
          className="absolute top-full mt-1 w-full min-w-[320px] sm:min-w-[480px] bg-primary-500/20 backdrop-blur-md rounded-lg shadow-xl border border-primary-500/30 overflow-hidden z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          {browseMode && (
            <div className="flex border-b border-primary-500/20 bg-primary-900/40">
              {[
                { id: "etfs", label: "ETFs" },
                { id: "stocks", label: "Popular Stocks" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onBrowseViewChange?.(tab.id)}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    browseView === tab.id
                      ? "text-primary-100 bg-primary-500/25 border-b-2 border-primary-400"
                      : "text-primary-400 hover:text-primary-200 hover:bg-primary-500/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {browseMode ? (
            <ETFExplorer
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              items={browseItems}
              yearReturns={yearReturns}
              returnsLoading={returnsLoading}
              onSelectETF={onSelect}
              activeIndex={activeSuggestionIndex}
              itemLabel={browseView === "stocks" ? "Stock" : "Fund"}
              hasMore={browseHasMore}
              loadingMore={loadingMore}
              onLoadMore={onLoadMore}
            />
          ) : (
            <>
              <div className="flex items-center px-4 py-1.5 text-[10px] uppercase tracking-wide text-primary-400/60 border-b border-primary-500/10 gap-2">
                <span className="flex-1">Results</span>
                <span className="w-[4.5rem] text-right">1Y Growth</span>
              </div>
              {suggestions.length === 0 && (
                <div className="px-4 py-3 text-sm text-primary-300/70">No matches found</div>
              )}
              {suggestions.map((s, index) => {
                const ret = yearReturns[s.ticker];
                const positive = ret != null && ret >= 0;
                const divYield = s.dividendYield;
                return (
                  <div
                    key={s.ticker + (s.exchange || "")}
                    onClick={() => onSelect(s)}
                    className={`px-4 py-2.5 hover:bg-primary-500/30 cursor-pointer transition-all duration-150 border-b border-primary-500/20 last:border-b-0 group flex items-center gap-2 ${
                      index === activeSuggestionIndex ? "bg-primary-500/30" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-primary-300 group-hover:text-primary-200">
                        {s.ticker}
                      </span>
                      <span className="text-primary-200/90 ml-2 text-sm">
                        {s.name} {s.exchange && `(${s.exchange})`}
                      </span>
                      {divYield > 0 && (
                        <span className="block text-[10px] text-amber-400/70 mt-0.5">
                          Div yield ~{formatDividendYield(divYield)}
                        </span>
                      )}
                    </div>
                    {ret != null && !isNaN(ret) ? (
                      <span className={`text-xs font-semibold tabular-nums w-[4.5rem] text-right ${positive ? "text-green-400" : "text-red-400"}`}>
                        {formatReturnPct(ret)}
                      </span>
                    ) : (
                      <span className="text-xs text-primary-300/50 w-[4.5rem] text-right">—</span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
