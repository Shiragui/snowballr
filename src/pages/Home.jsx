import React, { useState } from "react";
import { etfs } from "../data/etfs";
import SearchBar from "../components/SearchBar";

export default function Home({ onSelectETF, selectedETF }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSearch(value);
    if (value === "") {
      setResults(isFocused ? etfs : []);
    } else {
      setResults(etfs.filter(e => e.ticker.includes(value)));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show all ETFs when focused
    if (search === "") {
      setResults(etfs);
    } else {
      setResults(etfs.filter(e => e.ticker.includes(search)));
    }
  };

  const handleBlur = () => {
    // Delay to allow click events to fire
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const handleSelect = (etf) => {
    onSelectETF(etf);
    setSearch("");
    setResults([]);
    setIsFocused(false);
  };

  // Determine what to show
  const showSuggestions = isFocused ? (search === "" ? etfs : results) : [];

  return (
    <div>
      <SearchBar
        value={search}
        onChange={handleChange}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        suggestions={showSuggestions}
        selectedETF={selectedETF}
      />
    </div>
  );
}