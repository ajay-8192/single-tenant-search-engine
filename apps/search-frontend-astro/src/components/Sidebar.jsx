import React from 'react';

const Sidebar = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
    { id: 'config', name: 'Crawler Config', icon: 'settings_ethernet' },
    { id: 'logs', name: 'Live Logs', icon: 'terminal' },
    { id: 'explorer', name: 'Document Explorer', icon: 'database' },
    { id: 'search', name: 'Search Engine', icon: 'search' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 border-r border-[rgba(255,255,255,0.05)] bg-[#171f33] flex flex-col z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-[#06b6d4]/20 flex items-center justify-center border border-[#06b6d4]/30">
          <span className="material-symbols-outlined text-[#06b6d4]">hub</span>
        </div>
        <div>
          <h1 className="font-bold text-[#06b6d4] text-lg leading-tight">CrawlerOS</h1>
          <p className="font-mono text-[10px] text-[#bcc9cd] uppercase tracking-wider">V-Search Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded text-left transition-all ${
                isActive
                  ? 'bg-[#06b6d4]/10 text-[#06b6d4] border-r-2 border-[#06b6d4]'
                  : 'text-[#bcc9cd] hover:text-[#dae2fd] hover:bg-[#2d3449]/50'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Footer / Status */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.05)] flex flex-col gap-4">
        <button 
          onClick={() => setView('config')}
          className="btn-primary w-full py-2.5 rounded font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          Initialize Crawl
        </button>
        
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#1e293b] flex items-center justify-center text-xs text-[#06b6d4] font-bold">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#dae2fd]">SYS_ADMIN</span>
            <span className="font-mono text-[9px] text-[#bcc9cd] opacity-70">UID: 0x8F9A</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
