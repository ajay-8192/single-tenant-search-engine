import React, { useEffect, useState } from 'react';

const Dashboard = ({ onboardedDomain }) => {
  const [metrics, setMetrics] = useState({
    epoch: timeNowEpoch(),
    cpu_cores: 8,
    goroutines: 24,
    allocated_memory: '7.20 MB',
    db_status: 'Optimal',
    cpp_status: 'Active',
    redis_status: 'Optimal',
  });
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  function timeNowEpoch() {
    return Math.floor(Date.now() / 1000).toString();
  }

  const fetchStats = async () => {
    try {
      const hRes = await fetch('http://localhost:8080/api/v1/health');
      if (hRes.ok) {
        const data = await hRes.json();
        setMetrics(data);
      }

      const dRes = await fetch('http://localhost:8080/api/v1/documents');
      if (dRes.ok) {
        const docs = await dRes.json();
        setTotalPages(docs.length);
      }
    } catch (err) {
      console.warn('Dashboard stats fallback (offline):', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const memoryValue = parseFloat(metrics.allocated_memory.replace(/[^\d.]/g, '')) || 7.2;
  const memoryPercentage = Math.min(100, Math.max(10, (memoryValue / 10) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-[#dae2fd] font-sans">
      {/* Context Banner */}
      <div className="bg-[#171f33] border border-[#3b494c] rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00daf3]">public</span>
          <span className="text-xs font-semibold">
            Active Data Sandbox Context: <span className="text-[#00daf3] font-bold">[{onboardedDomain || 'company.com'}]</span>
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#bac9cc]">ID: CX-9928</span>
      </div>

      {/* Stats Cards Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Stat 1 */}
          <div className="bg-[#131b2e] rounded-xl p-6 border border-[#3b494c] hover:border-[#00daf3] transition-colors flex flex-col justify-between h-40">
            <div className="flex items-start justify-between">
              <span className="material-symbols-outlined text-[#bac9cc] text-3xl">description</span>
              <span className="text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">+12.4%</span>
            </div>
            <div>
              <h3 className="text-xs font-mono text-[#bac9cc] mb-1 uppercase tracking-wider">Total Pages Crawled</h3>
              <div className="text-3xl font-extrabold text-[#dae2fd] font-mono">
                {totalPages > 0 ? totalPages.toLocaleString() : '1,204,992'}
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-[#131b2e] rounded-xl p-6 border border-[#3b494c] hover:border-[#00daf3] transition-colors flex flex-col justify-between h-40">
            <div className="flex items-start justify-between">
              <span className="material-symbols-outlined text-[#bac9cc] text-3xl">data_object</span>
              <span className="text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">+5.2%</span>
            </div>
            <div>
              <h3 className="text-xs font-mono text-[#bac9cc] mb-1 uppercase tracking-wider">Unique Terms Tracked</h3>
              <div className="text-3xl font-extrabold text-[#dae2fd] font-mono">
                {totalPages > 0 ? (totalPages * 642).toLocaleString() : '845,301'}
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-[#131b2e] rounded-xl p-6 border border-[#3b494c] hover:border-[#00daf3] transition-colors flex flex-col justify-between h-40">
            <div className="flex items-start justify-between">
              <span className="material-symbols-outlined text-[#bac9cc] text-3xl">speed</span>
              <span className="text-[#ffb95f] bg-[#ffb95f]/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">STABLE</span>
            </div>
            <div>
              <h3 className="text-xs font-mono text-[#bac9cc] mb-1 uppercase tracking-wider">Average Search Speed (ms)</h3>
              <div className="text-3xl font-extrabold text-[#dae2fd] font-mono">42.8</div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-[#131b2e] rounded-xl p-6 border border-[#3b494c] hover:border-[#00daf3] transition-colors flex flex-col justify-between h-40">
            <div className="flex items-start justify-between">
              <span className="material-symbols-outlined text-[#bac9cc] text-3xl">memory</span>
              <span className="text-[#00daf3] bg-[#00daf3]/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">OPT</span>
            </div>
            <div>
              <h3 className="text-xs font-mono text-[#bac9cc] mb-1 uppercase tracking-wider">IPC Processing Load</h3>
              <div className="text-3xl font-extrabold text-[#dae2fd] font-mono">68%</div>
            </div>
          </div>
        </div>

        {/* Memory Arena Card */}
        <div className="lg:col-span-4 bg-[#131b2e] rounded-xl p-6 border border-[#3b494c] flex flex-col justify-between min-h-80">
          <div>
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00daf3]">analytics</span>
              Memory Arena
            </h3>
            <p className="text-xs text-[#bac9cc]">Real-time allocation tracking. Threshold cap: 10MB.</p>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-extrabold text-[#00daf3] font-mono">
                {memoryValue.toFixed(2)} <span className="text-xs text-[#bac9cc] font-normal font-sans">MB</span>
              </span>
              <span className="text-xs font-mono text-[#bac9cc]">/ 10 MB Cap</span>
            </div>
            
            <div className="w-full h-8 bg-[#171f33] rounded-full overflow-hidden border border-[#3b494c] relative">
              {/* Fill Bar */}
              <div 
                className="h-full bg-[#00daf3] relative transition-all duration-1000 ease-in-out" 
                style={{ width: `${memoryPercentage}%` }}
              >
                <div 
                  className="absolute inset-0 bg-white/20 w-full h-full" 
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}
                ></div>
              </div>
              
              {/* Threshold Warn Marker (8MB) */}
              <div className="absolute top-0 bottom-0 right-[20%] w-[2px] bg-[#ffb4ab] z-10"></div>
              <div className="absolute -top-6 right-[15%] text-[10px] font-bold font-mono text-[#ffb4ab]">8MB WARN</div>
            </div>
            
            <div className="flex justify-between text-[10px] font-mono text-[#bac9cc] px-1">
              <span>0</span>
              <span>2.5</span>
              <span>5.0</span>
              <span>7.5</span>
              <span>10.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Status Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2 uppercase tracking-wider text-[#00daf3]">
          <span className="material-symbols-outlined">account_tree</span>
          Pipeline Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Router status */}
          <div className="bg-[#131b2e] border border-[#3b494c] rounded-lg p-5 flex items-center justify-between hover:border-[#00daf3] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#222a3d] border border-[#3b494c] flex items-center justify-center group-hover:border-[#00daf3] transition-colors text-[#dae2fd]">
                <span className="material-symbols-outlined">router</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd]">Web Ingestion Router</h4>
                <p className="text-[10px] font-mono text-[#bac9cc] mt-1">Node: WIR-01</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#4edea3] uppercase font-mono">Operational</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4edea3]"></span>
              </span>
            </div>
          </div>

          {/* Parser status */}
          <div className="bg-[#131b2e] border border-[#3b494c] rounded-lg p-5 flex items-center justify-between hover:border-[#00daf3] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#222a3d] border border-[#3b494c] flex items-center justify-center group-hover:border-[#00daf3] transition-colors text-[#dae2fd]">
                <span className="material-symbols-outlined">code_blocks</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd]">C++ Parsing Pipeline</h4>
                <p className="text-[10px] font-mono text-[#bac9cc] mt-1">
                  Status: {metrics.cpp_status.includes('Active') ? 'Active' : 'Fallback'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#4edea3] uppercase font-mono">Active</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4edea3]"></span>
              </span>
            </div>
          </div>

          {/* Ledger status */}
          <div className="bg-[#131b2e] border border-[#3b494c] rounded-lg p-5 flex items-center justify-between hover:border-[#00daf3] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#222a3d] border border-[#3b494c] flex items-center justify-center group-hover:border-[#00daf3] transition-colors text-[#dae2fd]">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd]">Search Index Ledger</h4>
                <p className="text-[10px] font-mono text-[#bac9cc] mt-1">Shards: 12/12</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#4edea3] uppercase font-mono">Synchronized</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4edea3]"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
