import React, { useEffect, useState, useRef } from 'react';

const DiagnosticsTerminal = () => {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [systemEpoch, setSystemEpoch] = useState('1715424000.000');
  const terminalEndRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        // Set dynamic epoch based on last log timestamp or current time
        setSystemEpoch((Date.now() / 1000).toFixed(3));
      }
    } catch (err) {
      console.warn('Logs fetch offline fallback:', err);
    }
  };

  const handleClear = async () => {
    try {
      await fetch('http://localhost:8080/api/v1/clear-logs', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.warn('Clear logs request failed:', err);
      setLogs(['[INIT] Local log console cleared.']);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLogClass = (line) => {
    if (line.includes('[ERROR]')) return 'text-[#ffb4ab]';
    if (line.includes('[SUCCESS]')) return 'text-[#4edea3]';
    if (line.includes('[WARNING]')) return 'text-[#ffb2b7]';
    return 'text-[#06b6d4]'; // Default Info
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 bg-black rounded-lg border border-[rgba(255,255,255,0.1)] flex flex-col overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-[#171f33] px-4 py-2 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#00a572]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]/50"></div>
            </div>
            <span className="font-mono text-[10px] text-[#bcc9cd] ml-2">
              Epoch: <span className="text-[#dae2fd]">{systemEpoch}</span>
            </span>
          </div>
          <button
            onClick={handleClear}
            className="font-mono text-[9px] uppercase text-[#bcc9cd] hover:text-[#ffb4ab] transition-colors flex items-center gap-1.5 bg-transparent border border-[#3d494c] px-3 py-1 rounded hover:bg-[#ffb4ab]/10 hover:border-[#ffb4ab]/30 active:translate-y-[1px]"
          >
            <span className="material-symbols-outlined text-[12px]">delete</span>
            Clear Active Console Trace
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed scrollbar-hide bg-black">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">No logs generated. Initialize a crawl to view live system traces.</div>
          ) : (
            logs.map((line, idx) => (
              <div 
                key={idx} 
                className={`${getLogClass(line)} hover:bg-white/5 px-1 -mx-1 rounded transition-colors break-all`}
              >
                {line}
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer Status */}
        <div className="bg-[#131b2e] border-t border-[rgba(255,255,255,0.05)] px-4 py-2.5 flex justify-between items-center shrink-0 text-[10px] font-mono uppercase text-[#bcc9cd]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              TIER ACTIVE
            </span>
            <span>MEM: 4.2GB / 16GB</span>
            <span>CPU: 18%</span>
          </div>
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className="hover:text-[#06b6d4] transition-colors"
          >
            Auto-scroll <span className={autoScroll ? 'text-[#06b6d4]' : 'text-gray-500'}>{autoScroll ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsTerminal;
