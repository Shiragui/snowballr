import React, { useRef, useEffect } from 'react';
import { formatReturnPct, formatDividendYield, formatExpenseRatio } from '../services/stockData';
import { categoryShowsDividend } from '../data/etfCategories';

function GrowthBadge({ value, loading }) {
  if (loading && (value == null || isNaN(value))) {
    return <span className="text-[10px] text-primary-300/50 w-[4.5rem] text-right">…</span>;
  }
  if (value == null || isNaN(value)) {
    return <span className="text-xs text-primary-300/50 w-[4.5rem] text-right">—</span>;
  }
  const positive = value >= 0;
  return (
    <span
      className={`text-xs font-semibold tabular-nums w-[4.5rem] text-right ${
        positive ? 'text-green-400' : 'text-red-400'
      }`}
      title="Price change over the past 12 months"
    >
      {formatReturnPct(value)}
    </span>
  );
}

function DividendBadge({ value }) {
  if (value == null || isNaN(value) || value === 0) {
    return <span className="text-xs text-primary-300/50 w-[4.5rem] text-right">—</span>;
  }
  return (
    <span
      className="text-xs font-semibold tabular-nums w-[4.5rem] text-right text-amber-400/90"
      title="Approximate annual dividend yield"
    >
      {formatDividendYield(value)}
    </span>
  );
}

export default function ETFExplorer({
  categories,
  selectedCategoryId,
  onSelectCategory,
  items = [],
  yearReturns,
  returnsLoading,
  onSelectETF,
  activeIndex = -1,
  itemLabel = 'Fund',
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) {
  const listRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const category =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // IntersectionObserver — fires when sentinel enters the scroll area
  useEffect(() => {
    loadingRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current && hasMore) {
          onLoadMore?.();
        }
      },
      { root, rootMargin: '120px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, items.length, selectedCategoryId]);

  if (!category) return null;

  const showDividend = categoryShowsDividend(category);

  return (
    <div className="flex min-h-[300px] max-h-[400px] overflow-hidden">
      <div className="w-36 sm:w-40 flex-shrink-0 border-r border-primary-500/20 bg-primary-900/30 overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelectCategory(cat.id)}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-primary-500/10 last:border-b-0 ${
              cat.id === category.id
                ? 'bg-primary-500/25 text-primary-100'
                : 'text-primary-300 hover:bg-primary-500/15 hover:text-primary-200'
            }`}
          >
            <div className="font-medium leading-tight text-xs sm:text-sm">{cat.label}</div>
            <div className="text-[10px] text-primary-400/70 mt-0.5">scroll for more</div>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <div className="px-4 py-2 border-b border-primary-500/20 bg-primary-500/5 flex-shrink-0">
          <div className="text-sm font-medium text-primary-200">{category.label}</div>
          <div className="text-xs text-primary-400/80">{category.description}</div>
        </div>

        <div className="flex items-center px-4 py-1.5 text-[10px] uppercase tracking-wide text-primary-400/60 border-b border-primary-500/10 gap-2 flex-shrink-0">
          <span className="flex-1 min-w-0">{itemLabel}</span>
          {showDividend && (
            <span className="w-[4.5rem] text-right" title="Approximate annual dividend yield">
              Div Yield
            </span>
          )}
          <span className="w-[4.5rem] text-right" title="Price change over the past 12 months">
            1Y Growth
          </span>
        </div>

        <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
          {items.map((etf, index) => {
            const isActive = activeIndex === index;
            const feeLabel = formatExpenseRatio(etf.expenseRatio);
            const divYield = etf.dividendYield;

            return (
              <button
                key={`${etf.ticker}-${index}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectETF(etf)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors border-b border-primary-500/10 last:border-b-0 group ${
                  isActive ? 'bg-primary-500/30' : 'hover:bg-primary-500/20'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary-200 group-hover:text-primary-100">
                    {etf.ticker}
                  </div>
                  <div className="text-xs text-primary-300/80 truncate">{etf.name}</div>
                  {feeLabel && (
                    <div className="text-[10px] text-primary-400/50 mt-0.5">{feeLabel}</div>
                  )}
                </div>
                {showDividend && (
                  <DividendBadge value={divYield != null && divYield !== 'N/A' ? divYield : null} />
                )}
                <GrowthBadge value={yearReturns[etf.ticker]} loading={returnsLoading} />
              </button>
            );
          })}

          <div ref={sentinelRef} className="h-1" aria-hidden="true" />

          {loadingMore && (
            <div className="px-4 py-3 text-xs text-primary-300/70 text-center animate-pulse">
              Loading more…
            </div>
          )}

          {!loadingMore && hasMore && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onLoadMore?.()}
              className="w-full px-4 py-3 text-xs font-medium text-primary-300 hover:text-primary-100 hover:bg-primary-500/15 transition-colors border-t border-primary-500/10"
            >
              Load more ↓
            </button>
          )}

          {!loadingMore && !hasMore && items.length > 0 && (
            <div className="px-4 py-2 text-[10px] text-primary-400/40 text-center">
              End of list — try another category or search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
