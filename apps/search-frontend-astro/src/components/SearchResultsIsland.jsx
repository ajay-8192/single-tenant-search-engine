import React, { useState } from 'react';

const SearchResultsIsland = () => {
  const [queryInput, setQueryInput] = useState('');
  const [resultsList, setResultsList] = useState([]);
  const [executionDelay, setExecutionDelay] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const executeSearchQuery = async (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    const trackingStart = performance.now();

    try {
      // Hit the Go Gateway Search Endpoint
      const response = await fetch(`http://localhost:8080/api/v1/search?q=${encodeURIComponent(queryInput)}`);
      if (response.ok) {
        const payloadData = await response.json();
        setResultsList(payloadData.results || []);
        setIsCached(payloadData.cached || false);
      } else {
        console.error('Failed to retrieve search results');
        setResultsList([]);
      }
    } catch (fault) {
      console.error('Search request failed:', fault);
      setResultsList([]);
    } finally {
      const trackingEnd = performance.now();
      setExecutionDelay(parseFloat((trackingEnd - trackingStart).toFixed(2)));
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6 text-slate-200">
      <div className="text-center py-6">
        <h2 className="text-3xl font-extrabold text-[#06b6d4] tracking-tight mb-2">Nexus Gateway Search</h2>
        <p className="text-xs text-[#bcc9cd]">Execute low-latency keyword queries across indexed domain clusters.</p>
      </div>

      <form onSubmit={executeSearchQuery} className="flex shadow-2xl rounded-lg overflow-hidden border border-[#3d494c] bg-[#1e293b]">
        <input 
          type="text" 
          placeholder="Enter search parameters (e.g. unmanaged memory, quantum algorithms)..." 
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          className="flex-1 bg-black/20 text-white px-4 py-3.5 text-xs outline-none placeholder-[#bcc9cd]/40 font-mono"
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white font-mono px-6 font-bold uppercase text-[10px] tracking-wide transition-all active:translate-y-[1px] disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {executionDelay !== null && (
        <div className="flex justify-between items-center px-1 font-mono text-[9px] text-[#bcc9cd] italic">
          <span>
            Resolved {resultsList.length} unique document matches in {executionDelay} ms
          </span>
          {isCached && (
            <span className="text-[#4edea3] font-bold tracking-wider bg-[#4edea3]/10 px-1.5 py-0.5 rounded border border-[#4edea3]/20">
              CACHED (REDIS)
            </span>
          )}
        </div>
      )}

      <div className="space-y-4 pt-2">
        {!hasSearched ? (
          <div className="py-20 text-center text-[#bcc9cd]/40 italic text-xs font-mono">
            Enter a search term above to begin lookup query.
          </div>
        ) : resultsList.length === 0 ? (
          <div className="py-20 text-center text-[#ffb4ab]/80 border border-[#ffb4ab]/10 rounded-xl bg-[#ffb4ab]/5 italic text-xs font-mono">
            No indexed entries matched the requested search vectors.
          </div>
        ) : (
          resultsList.map((doc, idx) => (
            <div key={idx} className="p-5 bg-[#171f33]/40 border border-[#1e293b] rounded-xl hover:border-[#06b6d4]/30 transition-all duration-300 group">
              <a href={doc.target_url} target="_blank" rel="noreferrer" className="block">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-bold text-[#06b6d4] group-hover:underline tracking-tight mb-1">
                    {doc.page_title}
                  </h3>
                  <span className="font-mono text-[9px] bg-[#06b6d4]/10 text-[#06b6d4] px-2 py-0.5 rounded border border-[#06b6d4]/20 shrink-0">
                    Score: {doc.score}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#4edea3]/80 block break-all mb-2">
                  {doc.target_url}
                </span>
                <p className="text-xs text-[#bcc9cd] leading-relaxed">
                  {doc.meta_description}
                </p>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchResultsIsland;
