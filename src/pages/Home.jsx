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
      <SearchBar
        value={search}
        onChange={handleChange}
        onSelect={handleSelect}
        suggestions={results}
      />
      
    </div>
  );
}
