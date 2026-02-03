import React, { useState, useEffect, useRef, useCallback } from "react";
import { etfs } from "../data/etfs";
import SearchBar from "../components/SearchBar";
import { searchStocks } from "../services/stockData";

export default function Home({ onSelectETF, selectedETF }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);

  const handleSearch = useCallback(async (query) => {
    if (query.trim() === "") {
      setResults(etfs); // Show default ETFs if search is empty
      return;
    }
    setLoading(true);
    try {
      const apiResults = await searchStocks(query);
      // Combine local ETFs with API results, prioritizing exact ticker matches
      const combinedResults = [
        ...etfs.filter(e => e.ticker.toUpperCase().includes(query.toUpperCase())),
        ...apiResults.filter(apiR => !etfs.some(e => e.ticker.toUpperCase() === apiR.ticker.toUpperCase()))
      ];
      setResults(combinedResults);
    } catch (error) {
      console.error("Error searching stocks:", error);
      setResults(etfs.filter(e => e.ticker.toUpperCase().includes(query.toUpperCase()))); // Fallback to local
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(search);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, handleSearch]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setActiveSuggestionIndex(-1); // Reset active suggestion on change
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (search === "") {
      setResults(etfs); // Show all ETFs when focused and empty
    } else {
      handleSearch(search); // Re-run search on focus if there's a query
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setActiveSuggestionIndex(-1);
    }, 200);
  };

  const handleSelect = (stock) => {
    onSelectETF(stock);
    setSearch("");
    setResults([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prevIndex =>
        (prevIndex + 1) % results.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prevIndex =>
        (prevIndex - 1 + results.length) % results.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex !== -1 && results[activeSuggestionIndex]) {
        handleSelect(results[activeSuggestionIndex]);
      } else if (results.length > 0) {
        // If no suggestion is active, select the first one
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div>
      <SearchBar
        value={search}
        onChange={handleChange}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        suggestions={isFocused ? results : []}
        selectedETF={selectedETF}
        loading={loading}
        activeSuggestionIndex={activeSuggestionIndex}
        placeholder="Search stock ticker (e.g., AAPL, TSLA, QQQ)..."
      />
    </div>
  );
}