import React, { useEffect, useState } from 'react';

const DocumentScanner = () => {
  const [documents, setDocuments] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [targetPurgeId, setTargetPurgeId] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
      }
    } catch (err) {
      console.warn('Document scanner fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleForceReIndex = async (targetUrl) => {
    setActionStatus({ text: `Initializing re-index for: ${targetUrl}...`, type: 'info' });
    try {
      const res = await fetch('http://localhost:8080/api/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_url: targetUrl,
          crawl_depth_limit: 0,
          max_pages_per_domain: 1,
          user_agent_identifier: 'CRAWL_SUITE_OS_Bot/v1.0 (Re-Index)',
        }),
      });

      if (res.ok) {
        setActionStatus({ text: `Successfully scheduled re-index for ${targetUrl}! Check logs for detail.`, type: 'success' });
        setTimeout(() => setActionStatus(null), 5000);
      } else {
        setActionStatus({ text: 'Failed to schedule re-index.', type: 'error' });
      }
    } catch (err) {
      setActionStatus({ text: 'API Gateway offline. Failed to re-index.', type: 'error' });
    }
  };

  const triggerPurgeModal = (id) => {
    setTargetPurgeId(id);
    setShowPurgeModal(true);
  };

  const handleConfirmPurge = async () => {
    if (!targetPurgeId) return;
    setIsPurging(true);
    setActionStatus(null);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/documents/${targetPurgeId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setActionStatus({ text: 'Document successfully purged from index.', type: 'success' });
        setDocuments(documents.filter((doc) => doc.document_id !== targetPurgeId));
        setTimeout(() => setActionStatus(null), 4000);
      } else {
        setActionStatus({ text: 'Failed to purge document.', type: 'error' });
      }
    } catch (err) {
      setActionStatus({ text: 'API Gateway offline. Failed to purge document.', type: 'error' });
    } finally {
      setIsPurging(false);
      setShowPurgeModal(false);
      setTargetPurgeId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const query = searchFilter.toLowerCase();
    const urlMatch = doc.target_url?.toLowerCase().includes(query);
    const titleMatch = doc.page_title?.toLowerCase().includes(query);
    const descMatch = doc.meta_description?.toLowerCase().includes(query);
    return urlMatch || titleMatch || descMatch;
  });

  // Calculate simulated keyword count based on title and description contents
  const estimateKeywords = (title, desc) => {
    const text = `${title || ''} ${desc || ''}`;
    const clean = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const words = clean.split(/\s+/).filter(w => w.length > 3);
    const unique = new Set(words);
    return Math.max(5, unique.size);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0b1326] relative font-sans text-[#dae2fd]">
      {/* Header & Filter Bar */}
      <header className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0b1326]/50 border-b border-[#3b494c] shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#c3f5ff] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00daf3]">plagiarism</span>
            INDEXED DOCUMENT SCANNER
          </h2>
          <p className="text-xs text-[#bac9cc] mt-1">Data Repository Explorer / Live View</p>
        </div>
        
        {/* Filter Bar */}
        <div className="w-full sm:w-auto flex items-center bg-[#131b2e] border border-[#3b494c] rounded px-3 py-2 focus-within:border-[#00e5ff] transition-colors min-w-[320px]">
          <span className="material-symbols-outlined text-[#bac9cc] mr-2 text-sm">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-[#dae2fd] text-xs w-full placeholder-[#bac9cc]/50 p-0 outline-none"
            placeholder="Filter Target URL, Document Title, or Snippet..."
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#3b494c]">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.4)] animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#4edea3] uppercase tracking-widest font-mono">Live</span>
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionStatus && (
        <div className="px-6 py-2 shrink-0">
          <div
            className={`p-3 rounded text-xs flex items-center gap-2 ${
              actionStatus.type === 'success'
                ? 'bg-[#4edea3]/10 border border-[#4edea3]/20 text-[#4edea3]'
                : actionStatus.type === 'error'
                ? 'bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab]'
                : 'bg-[#c3f5ff]/10 border border-[#c3f5ff]/20 text-[#c3f5ff]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {actionStatus.type === 'success' ? 'check_circle' : actionStatus.type === 'error' ? 'error' : 'info'}
            </span>
            {actionStatus.text}
          </div>
        </div>
      )}

      {/* Repository Table Canvas */}
      <div className="flex-1 overflow-auto p-6 relative">
        <div className="bg-[#131b2e] border border-[#3b494c] rounded-lg overflow-hidden flex flex-col h-full shadow-[0_0_15px_rgba(0,229,255,0.03)]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#3b494c] bg-[#222a3d]/50 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-[#bac9cc]">
            <div className="col-span-3">Target URL</div>
            <div className="col-span-3">Page Document Title</div>
            <div className="col-span-4">Description Summary Snippet</div>
            <div className="col-span-1 text-right">Keywords</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#3b494c]/20">
            {isLoading ? (
              <div className="py-12 text-center text-[#bac9cc] italic text-xs font-mono">
                Loading indexed documents...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-12 text-center text-[#bac9cc] italic text-xs font-mono">
                No matching indexed documents found.
              </div>
            ) : (
              filteredDocs.map((doc, idx) => {
                const isErrorState = doc.page_title.includes('PII') || doc.page_title.includes('Spillage') || doc.page_title.includes('Error');
                return (
                  <div
                    key={doc.document_id || idx}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center group transition-colors relative ${
                      isErrorState 
                        ? 'bg-[#93000a]/5 hover:bg-[#93000a]/10 border-l-4 border-l-[#ffb4ab]' 
                        : 'hover:bg-[#222a3d]/20'
                    }`}
                  >
                    <div 
                      className={`col-span-3 text-xs font-mono truncate ${isErrorState ? 'text-[#ffb4ab]' : 'text-[#06b6d4]'}`} 
                      title={doc.target_url}
                    >
                      <a href={doc.target_url} target="_blank" rel="noreferrer" className="hover:underline">
                        {doc.target_url}
                      </a>
                    </div>
                    
                    <div className={`col-span-3 text-sm font-semibold truncate ${isErrorState ? 'text-[#ffb4ab] flex items-center gap-1.5' : 'text-[#dae2fd]'}`}>
                      {isErrorState && <span className="material-symbols-outlined text-[16px]">warning</span>}
                      {doc.page_title}
                    </div>
                    
                    <div className="col-span-4 text-xs text-[#bac9cc] truncate opacity-85 group-hover:opacity-100 transition-opacity">
                      {doc.meta_description}
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                        isErrorState 
                          ? 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30' 
                          : 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30'
                      }`}>
                        {estimateKeywords(doc.page_title, doc.meta_description)}
                      </span>
                    </div>
                    
                    <div className="col-span-1 flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleForceReIndex(doc.target_url)}
                        className="p-1 rounded text-[#00daf3] hover:bg-[#00daf3]/10 border border-transparent hover:border-[#00daf3]/30 transition-all"
                        title="Force Re-Index"
                      >
                        <span className="material-symbols-outlined text-[20px]">sync</span>
                      </button>
                      <button
                        onClick={() => triggerPurgeModal(doc.document_id)}
                        className="p-1 rounded text-[#ffb4ab] hover:bg-[#ffb4ab]/10 border border-transparent hover:border-[#ffb4ab]/30 transition-all"
                        title="Purge Document"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Table Footer / Pagination */}
          <div className="px-6 py-3 border-t border-[#3b494c] bg-[#222a3d]/50 flex justify-between items-center shrink-0 text-xs font-mono text-[#bac9cc]">
            <div>
              Showing 1 - {filteredDocs.length} of {documents.length} Indexed Nodes
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded hover:text-[#00daf3] disabled:opacity-50 disabled:hover:text-[#bac9cc]" disabled>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="text-[10px]">Page 1 of 1</span>
              <button className="p-1 rounded hover:text-[#00daf3] disabled:opacity-50 disabled:hover:text-[#bac9cc]" disabled>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Confirmation Overlay */}
      {showPurgeModal && (
        <div className="absolute inset-0 bg-[#0b1326]/80 backdrop-blur-sm z-40 flex items-center justify-center p-6">
          <div className="bg-[#131b2e] border border-[#ffb4ab]/30 rounded-lg p-6 max-w-md w-full shadow-[0_0_30px_rgba(255,180,171,0.1)]">
            <div className="flex items-center gap-3 mb-4 text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <h3 className="text-lg font-bold uppercase tracking-wide">Purge Document?</h3>
            </div>
            <p className="text-xs text-[#bac9cc] leading-relaxed mb-6">
              This action will forcefully remove the selected node from the index repository and clear associated cache maps. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 font-mono text-xs">
              <button
                className="px-4 py-2 rounded border border-[#3b494c] text-[#dae2fd] hover:bg-[#222a3d] transition-colors"
                onClick={() => {
                  setShowPurgeModal(false);
                  setTargetPurgeId(null);
                }}
                disabled={isPurging}
              >
                CANCEL
              </button>
              <button
                className="px-4 py-2 rounded bg-[#ffb4ab] text-[#67001b] hover:bg-[#ffb4ab]/90 transition-colors font-bold flex items-center gap-2 disabled:opacity-50"
                onClick={handleConfirmPurge}
                disabled={isPurging}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                {isPurging ? 'PURGING...' : 'CONFIRM PURGE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentScanner;
