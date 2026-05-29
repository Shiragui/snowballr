import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { etfCategories, allCatalogEtfs } from "../data/etfCategories";
import { stockCategories, allCatalogStocks } from "../data/stockCategories";
import SearchBar from "../components/SearchBar";
import { searchStocks, tickerFromQuery, fetchYearReturns, fetchBrowsePage } from "../services/stockData";

function dedupeByTicker(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.ticker.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Home({ onSelectETF, selectedETF }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [browseView, setBrowseView] = useState("etfs");
  const [selectedCategoryId, setSelectedCategoryId] = useState(etfCategories[0]?.id);
  const [yearReturns, setYearReturns] = useState({});
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [browseItems, setBrowseItems] = useState([]);
  const [browsePage, setBrowsePage] = useState(-1);
  const [browseHasMore, setBrowseHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef(null);
  const returnsCacheRef = useRef({});
  const loadingMoreRef = useRef(false);
  const browseItemsRef = useRef([]);
  const browsePageRef = useRef(-1);
  const loadMoreBrowseRef = useRef(null);

  browseItemsRef.current = browseItems;
  browsePageRef.current = browsePage;

  const activeCategories = browseView === "stocks" ? stockCategories : etfCategories;
  const allCatalog = browseView === "stocks" ? allCatalogStocks : allCatalogEtfs;

  const browseMode = isOpen && search.trim() === "";

  const activeCategory = useMemo(
    () => activeCategories.find((c) => c.id === selectedCategoryId) || activeCategories[0],
    [activeCategories, selectedCategoryId]
  );

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setActiveSuggestionIndex(-1);
  }, []);

  const loadReturns = useCallback(async (tickers) => {
    const missing = tickers.filter((t) => returnsCacheRef.current[t] === undefined);
    if (!missing.length) return;

    setReturnsLoading(true);
    try {
      const fetched = await fetchYearReturns(missing);
      returnsCacheRef.current = { ...returnsCacheRef.current, ...fetched };
      setYearReturns((prev) => ({ ...prev, ...fetched }));
    } finally {
      setReturnsLoading(false);
    }
  }, []);

  // Reset browse list when category or tab changes
  useEffect(() => {
    const category =
      activeCategories.find((c) => c.id === selectedCategoryId) || activeCategories[0];
    if (!category) return;
    const seeds = category.etfs || [];
    setBrowseItems(seeds);
    setBrowsePage(-1);
    setBrowseHasMore(true);
    setActiveSuggestionIndex(-1);
    if (seeds.length) loadReturns(seeds.map((e) => e.ticker));
  }, [selectedCategoryId, browseView, activeCategories, loadReturns]);

  const loadMoreBrowse = useCallback(async () => {
    if (loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const assetType = browseView === "stocks" ? "stocks" : "etfs";
    let page = browsePageRef.current + 1;
    let collected = [];
    let hasMore = true;
    const currentItems = browseItemsRef.current;

    try {
      for (let attempt = 0; attempt < 4 && collected.length === 0 && hasMore; attempt++) {
        const exclude = currentItems.map((i) => i.ticker);
        const result = await fetchBrowsePage(assetType, selectedCategoryId, page, exclude);
        collected = result.items || [];
        hasMore = result.hasMore ?? page < 7;
        if (collected.length === 0 && hasMore) page += 1;
        else break;
      }

      if (collected.length > 0) {
        setBrowseItems((prev) => dedupeByTicker([...prev, ...collected]));
        loadReturns(collected.map((i) => i.ticker));
      }

      setBrowsePage(page);
      setBrowseHasMore(hasMore);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [browseView, selectedCategoryId, loadReturns]);

  loadMoreBrowseRef.current = loadMoreBrowse;

  // Auto-load first batch when browse panel opens or category changes
  useEffect(() => {
    if (!isOpen || search.trim() !== "") return;
    const timer = setTimeout(() => {
      loadMoreBrowseRef.current?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, search, selectedCategoryId, browseView]);

  const handleBrowseViewChange = (view) => {
    setBrowseView(view);
    setActiveSuggestionIndex(-1);
    const cats = view === "stocks" ? stockCategories : etfCategories;
    setSelectedCategoryId(cats[0]?.id);
  };

  const handleSearch = useCallback(async (query) => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const apiResults = await searchStocks(query);
      const localCatalog = [...allCatalogEtfs, ...allCatalogStocks];
      const combinedResults = [
        ...localCatalog.filter(
          (e) =>
            e.ticker.toUpperCase().includes(query.toUpperCase()) ||
            e.name.toUpperCase().includes(query.toUpperCase())
        ),
        ...apiResults.filter(
          (apiR) => !localCatalog.some((e) => e.ticker.toUpperCase() === apiR.ticker.toUpperCase())
        ),
      ];
      setResults(combinedResults);
      loadReturns(combinedResults.map((r) => r.ticker).slice(0, 12));
    } catch (error) {
      console.error("Error searching stocks:", error);
      const local = allCatalog.filter((e) =>
        e.ticker.toUpperCase().includes(query.toUpperCase())
      );
      const direct = tickerFromQuery(query);
      const fallback = local.length > 0 ? local : direct ? [direct] : [];
      setResults(fallback);
      if (fallback.length) loadReturns(fallback.map((r) => r.ticker));
    } finally {
      setLoading(false);
    }
  }, [loadReturns, allCatalog]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(search);
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, handleSearch]);

  const handleChange = (e) => {
    setSearch(e.target.value);
    setActiveSuggestionIndex(-1);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (search.trim() !== "") {
      handleSearch(search);
    }
  };

  const handleSelect = (stock) => {
    onSelectETF(stock);
    setSearch("");
    setResults([]);
    closePanel();
  };

  const handleKeyDown = (e) => {
    if (browseMode && browseItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < browseItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : browseItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const idx = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
        if (browseItems[idx]) handleSelect(browseItems[idx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length) {
        setActiveSuggestionIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) {
        setActiveSuggestionIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex !== -1 && results[activeSuggestionIndex]) {
        handleSelect(results[activeSuggestionIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        const direct = tickerFromQuery(search);
        if (direct) handleSelect(direct);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    }
  };

  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id);
    setActiveSuggestionIndex(-1);
  };

  return (
    <div>
      <SearchBar
        value={search}
        onChange={handleChange}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onOpenPanel={openPanel}
        onClose={closePanel}
        onKeyDown={handleKeyDown}
        suggestions={!browseMode && isOpen ? results : []}
        selectedETF={selectedETF}
        loading={loading}
        activeSuggestionIndex={activeSuggestionIndex}
        placeholder="Search or browse ETFs & popular stocks…"
        isOpen={isOpen}
        browseMode={browseMode}
        browseView={browseView}
        onBrowseViewChange={handleBrowseViewChange}
        categories={activeCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        yearReturns={yearReturns}
        returnsLoading={returnsLoading}
        browseItems={browseItems}
        browseHasMore={browseHasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMoreBrowse}
      />
    </div>
  );
}
