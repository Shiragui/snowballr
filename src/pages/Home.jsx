import React, { useState } from "react";
import { etfs } from "../data/etfs";
import SearchBar from "../components/SearchBar";

export default function Home({ onSelectETF }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSearch(value);
    setResults(etfs.filter(e => e.ticker.includes(value)));
  };

  const handleSelect = (etf) => {
    onSelectETF(etf);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>SnowballR</h1>
      <SearchBar
        value={search}
        onChange={handleChange}
        onSelect={handleSelect}
        suggestions={results}
      />
      <p>Type a ticker to see ETF details.</p>
    </div>
  );
}
