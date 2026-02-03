import React, { useState } from "react";
import { etfs } from "../data/etfs";
import SearchBar from "../components/SearchBar";

export default function Home({ onSelectETF, selectedETF }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSearch(value);
    setResults(etfs.filter(e => e.ticker.includes(value)));
  };

  const handleSelect = (etf) => {
    onSelectETF(etf);
    setSearch("");
    setResults([]);
  };

  return (
    <div>
      <SearchBar
        value={search}
        onChange={handleChange}
        onSelect={handleSelect}
        suggestions={results}
        selectedETF={selectedETF}
      />
    </div>
  );
}