import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const DocumentExplorer = () => {
  const [documents, setDocuments] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
      }
    } catch (err) {
      console.warn('Document explorer fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const urlMatch = doc.target_url?.toLowerCase().includes(searchFilter.toLowerCase());
    const titleMatch = doc.page_title?.toLowerCase().includes(searchFilter.toLowerCase());
    const descMatch = doc.meta_description?.toLowerCase().includes(searchFilter.toLowerCase());
    return urlMatch || titleMatch || descMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Indexed Document Explorer</h2>
          <p className="text-xs text-[#bcc9cd] mt-1">Navigate, manage, and inspect indexed nodes within the active crawler database.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search local documents..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-[#1e293b] border border-[rgba(255,255,255,0.1)] text-[#dae2fd] font-mono text-[11px] px-3 py-1.5 rounded focus:ring-1 focus:ring-[#06b6d4]"
          />
          <button 
            onClick={fetchDocuments}
            className="btn-secondary px-4 py-2 rounded font-mono text-[10px] uppercase flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[14px]">sync</span> Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-level-1 rounded-lg overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#171f33]/50 flex justify-between items-center text-xs">
          <div className="font-mono text-[#bcc9cd]">
            Showing <span className="text-[#06b6d4] font-bold">{filteredDocs.length}</span> of{' '}
            <span className="text-[#dae2fd] font-bold">{documents.length}</span> entries
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-[#171f33] border-b border-[rgba(255,255,255,0.1)] text-[10px] uppercase font-mono tracking-wider text-[#bcc9cd]">
              <tr>
                <th className="px-4 py-3 font-semibold">Document URL</th>
                <th className="px-4 py-3 font-semibold">SEO Title</th>
                <th className="px-4 py-3 font-semibold">Meta Description</th>
                <th className="px-4 py-3 font-semibold">Crawled At</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)] font-mono text-[11px] text-[#dae2fd]">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-500 italic">
                    Loading indexed documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-500 italic">
                    No matching indexed documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr key={doc.document_id || idx} className="zebra-row transition-colors group">
                    <td className="px-4 py-3 max-w-[200px] truncate" title={doc.target_url}>
                      <a href={doc.target_url} target="_blank" rel="noreferrer" className="text-[#06b6d4] hover:underline">
                        {doc.target_url}
                      </a>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate" title={doc.page_title}>
                      {doc.page_title}
                    </td>
                    <td className="px-4 py-3 max-w-[240px] truncate text-[#bcc9cd]" title={doc.meta_description}>
                      {doc.meta_description}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {doc.crawled_at ? new Date(doc.crawled_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 rounded hover:bg-[#2d3449] text-[#bcc9cd] hover:text-[#06b6d4]" title="Details">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between items-center bg-[#171f33]/30">
          <button className="btn-secondary px-3 py-1.5 rounded font-mono text-[9px] uppercase disabled:opacity-50" disabled>
            Previous
          </button>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded bg-[#06b6d4] text-white font-mono text-xs flex items-center justify-center">1</button>
          </div>
          <button className="btn-secondary px-3 py-1.5 rounded font-mono text-[9px] uppercase disabled:opacity-50" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentExplorer;
