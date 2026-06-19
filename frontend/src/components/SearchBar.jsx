import React, { useState } from 'react';
import { searchRequests } from '../services/api';

export default function SearchBar({ onViewDetail }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      const data = await searchRequests(value);
      setResults(data);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelect = (id) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onViewDetail(id);
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search requests, workpapers, tags..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <div key={r.id} className="search-result-item" onClick={() => handleSelect(r.id)}>
              <span className="search-result-title">#{r.id} {r.title}</span>
              <div className="search-result-meta">
                {r.workpaper_ref && <span className="search-result-wp">{r.workpaper_ref}</span>}
                {r.tags && r.tags.length > 0 && r.tags.map(t => (
                  <span key={t} className="search-result-tag">{t}</span>
                ))}
                <span>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showResults && results.length === 0 && query.length >= 2 && (
        <div className="search-results">
          <div className="search-result-item" style={{ color: '#9ca3af' }}>No results found</div>
        </div>
      )}
    </div>
  );
}
