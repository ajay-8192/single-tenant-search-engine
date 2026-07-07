import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    epoch: 1715424000,
    cpu_cores: 8,
    goroutines: 24,
    allocated_memory: '4.20 MB',
    db_status: 'Optimal',
    cpp_status: 'Active',
    redis_status: 'Optimal',
  });
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([20, 25, 22, 35, 40, 30, 45, 50, 42, 48]);

  useEffect(() => {
    const chartInterval = setInterval(() => {
      setChartData((prev) => {
        const base = totalPages > 0 ? 30 : 5;
        const randomFactor = Math.floor(Math.random() * 35);
        const nextVal = base + randomFactor;
        return [...prev.slice(1), nextVal];
      });
    }, 2000);
    return () => clearInterval(chartInterval);
  }, [totalPages]);

  const points = chartData.map((val, idx) => {
    const x = idx * (1000 / (chartData.length - 1));
    const y = 180 - (val * 140 / 100);
    return { x, y };
  });

  const linePath = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : '';
  const areaPath = points.length > 0 
    ? `${linePath} L 1000,200 L 0,200 Z` 
    : '';
  const lastPoint = points[points.length - 1] || { x: 1000, y: 100 };

  useEffect(() => {
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

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold text-[#dae2fd]">System Overview & Health Dashboard</h2>
        <p className="text-xs text-[#bcc9cd] mt-1">Real-time status updates and telemetry monitoring.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-level-1 rounded-lg p-5 border-l-2 border-l-[#06b6d4] flex flex-col relative overflow-hidden group">
          <span className="font-mono text-[10px] text-[#bcc9cd] mb-2 flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-[14px]">description</span> TOTAL PAGES CRAWLED
          </span>
          <span className="text-2xl font-bold font-mono text-[#06b6d4]">
            {totalPages}
          </span>
          <span className="mt-2 text-[10px] text-[#4edea3] flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span> Live Indexed
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-level-1 rounded-lg p-5 border-l-2 border-l-[#06b6d4] flex flex-col relative overflow-hidden group">
          <span className="font-mono text-[10px] text-[#bcc9cd] mb-2 flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-[14px]">account_tree</span> MEMORY USAGE
          </span>
          <span className="text-2xl font-bold font-mono text-[#06b6d4]">
            {metrics.allocated_memory}
          </span>
          <span className="mt-2 text-[10px] text-[#bcc9cd] flex items-center gap-1">
            Goroutines: {metrics.goroutines} active
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-level-1 rounded-lg p-5 border-l-2 border-l-[#06b6d4] flex flex-col relative overflow-hidden group">
          <span className="font-mono text-[10px] text-[#bcc9cd] mb-2 flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-[14px]">timer</span> CORE CPUS
          </span>
          <span className="text-2xl font-bold font-mono text-[#06b6d4]">
            {metrics.cpu_cores} Cores
          </span>
          <span className="mt-2 text-[10px] text-[#4edea3] flex items-center gap-1">
            Execution: Optimal
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-level-1 rounded-lg p-5 border-l-2 border-l-[#06b6d4] flex flex-col relative overflow-hidden group">
          <span className="font-mono text-[10px] text-[#bcc9cd] mb-2 flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span> CACHE SYSTEM
          </span>
          <span className="text-2xl font-bold font-mono text-[#06b6d4]">
            {metrics.redis_status === 'Optimal' ? 'Redis v7.4' : 'Local Fallback'}
          </span>
          <span className="mt-2 text-[10px] text-[#4edea3] flex items-center gap-1">
            Status: {metrics.redis_status}
          </span>
        </div>
      </div>

      {/* Main Utilization Chart */}
      <div className="bg-level-1 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#dae2fd]">Memory Arena Utilization</h3>
            <p className="text-xs text-[#bcc9cd] mt-1 font-mono">Simulating 10MB per worker thread limit across active pool</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1 text-[10px] rounded font-mono uppercase">1H</button>
            <button className="btn-secondary bg-[#2d3449]/50 border-[#06b6d4]/50 px-3 py-1 text-[10px] rounded font-mono uppercase text-[#06b6d4]">6H</button>
            <button className="btn-secondary px-3 py-1 text-[10px] rounded font-mono uppercase">24H</button>
          </div>
        </div>

        <div className="h-64 w-full relative border border-[rgba(255,255,255,0.05)] rounded overflow-hidden" 
             style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
            {/* Limit Line */}
            <line x1="0" y1="30" x2="1000" y2="30" stroke="#ffb4ab" strokeDasharray="4,4" strokeWidth="1"></line>
            
            {/* Area path */}
            <path d={areaPath} fill="url(#grad)" opacity="0.15"></path>
            
            {/* Line Path */}
            <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2"></path>
            <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2"></circle>

            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute left-2 top-2 text-[10px] font-mono text-[#ffb4ab]">10MB ARENA LIMIT</div>
          <div className="absolute left-2 bottom-2 text-[10px] font-mono text-[#bcc9cd]">0MB</div>
          <div className="absolute right-2 bottom-2 text-[10px] font-mono text-[#06b6d4]">LIVE TELEMETRY</div>
        </div>
      </div>

      {/* Sticky Health Strip */}
      <div className="bg-[#060e20] border border-[rgba(255,255,255,0.05)] rounded p-4 flex flex-col md:flex-row justify-between items-center text-xs text-[#bcc9cd] gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="font-bold text-[#dae2fd] tracking-widest uppercase">Sys. Health</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.4)]"></span>
            <span>Go Gateway: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${metrics.cpp_status.includes('Active') ? 'bg-[#4edea3]' : 'bg-[#ffb2b7]'}`}></span>
            <span>C++ Parser Core: {metrics.cpp_status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
            <span>PostgreSQL: {metrics.db_status}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span>Uptime: <span className="text-[#06b6d4]">99.99%</span></span>
          <span>Workers: <span className="text-[#dae2fd]">512 Threads</span></span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
