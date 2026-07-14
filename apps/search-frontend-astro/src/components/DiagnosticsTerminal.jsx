import React, { useEffect, useState, useRef } from 'react';

const DiagnosticsTerminal = () => {
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [systemEpoch, setSystemEpoch] = useState('1715424000.000');
  const terminalEndRef = useRef(null);

  const fetchLogs = async () => {
    if (isPaused) return; // Stop fetching if stream is paused
    try {
      const res = await fetch('http://localhost:8080/api/v1/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setSystemEpoch((Date.now() / 1000).toFixed(3));
      }
    } catch (err) {
      console.warn('Logs fetch offline fallback:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const handleDownload = () => {
    const text = logs.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crawl_suite_logs_${Math.floor(Date.now() / 1000)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLogClass = (line) => {
    if (line.includes('[ERROR]')) return 'text-[#ffb4ab] border-l-2 border-l-[#ffb4ab] pl-2';
    if (line.includes('[SUCCESS]')) return 'text-[#4edea3]';
    if (line.includes('[WARNING]')) return 'text-[#ffb2b7]';
    if (line.includes('[SETUP]')) return 'text-[#00daf3]';
    return 'text-[#dae2fd]'; // Default Info
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)] font-sans text-[#dae2fd]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#00daf3]">System Trace Log</h2>
          <p className="text-xs text-[#bac9cc] mt-1">Live Unix Domain Socket pipeline stream.</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto font-mono text-xs">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded font-semibold transition-colors ${
              isPaused
                ? 'border-[#4edea3] text-[#4edea3] hover:bg-[#4edea3]/10'
                : 'border-[#00daf3] text-[#00daf3] hover:bg-[#00daf3]/10'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
            <span>{isPaused ? 'Resume Log Stream' : 'Pause Log Stream View'}</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#00daf3] text-[#00363d] hover:bg-[#9cf0ff] rounded font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Download Complete Log Data String
          </button>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="flex-1 bg-[#060e20] border border-[#3b494c] rounded-lg overflow-hidden flex flex-col shadow-lg shadow-black/50">
        {/* Terminal Header Bar */}
        <div className="bg-[#131b2e] border-b border-[#3b494c] px-4 py-2 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffb4ab]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffc681]"></div>
            <div className="w-3 h-3 rounded-full bg-[#4edea3]"></div>
          </div>
          
          <div className="font-mono text-[10px] text-[#bac9cc] flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">settings_ethernet</span>
            /var/run/crawl_suite.sock
          </div>
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75 ${isPaused ? 'hidden' : ''}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 bg-[#4edea3] ${isPaused ? 'opacity-50' : ''}`}></span>
            </span>
            <span className="font-mono text-[10px] font-bold text-[#4edea3] uppercase tracking-widest">
              {isPaused ? 'Paused' : 'Live'}
            </span>
          </div>
        </div>

        {/* Terminal Output Area */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#060e20] space-y-1">
          {logs.length === 0 ? (
            <div className="text-[#3b494c] italic">
              [INIT] Awaiting logs stream transmission from gateway daemon...
            </div>
          ) : (
            logs.map((line, idx) => (
              <div
                key={idx}
                className={`${getLogClass(line)} hover:bg-white/5 px-2 -mx-2 rounded transition-colors break-all flex gap-4`}
              >
                <span className="text-[#3d494c] shrink-0 select-none">
                  {idx + 1}
                </span>
                <span>{line}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Status Bar below terminal */}
      <div className="flex justify-between items-center pt-3 border-t border-[#3b494c]/50 text-[10px] font-mono text-[#bac9cc]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00daf3] text-[18px]">dns</span>
            <span>UDS Pipe: {isPaused ? 'SUSPENDED' : 'ACTIVE'}</span>
          </div>
          <div className="h-4 w-px bg-[#3b494c]"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">speed</span>
            <span>Throughput: {isPaused ? '0.0 GB/s' : '1.2 GB/s'}</span>
          </div>
        </div>
        <div>
          Displaying last {logs.length} lines (Epoch: {systemEpoch})
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsTerminal;
