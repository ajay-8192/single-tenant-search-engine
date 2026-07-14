import React from 'react';

const Sidebar = ({ currentView, setView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
    { id: 'users', name: 'Users', icon: 'group' },
    { id: 'config', name: 'Crawler Config', icon: 'settings_input_component' },
    { id: 'logs', name: 'Diagnostics', icon: 'terminal' },
    { id: 'explorer', name: 'Document Scanner', icon: 'search_insights' },
    { id: 'search', name: 'Search Engine', icon: 'search' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-[280px] bg-[#131b2e] border-r border-[#3b494c] flex flex-col py-8 z-50 font-sans text-[#dae2fd]">
      {/* Header */}
      <div className="px-6 mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#00e5ff] flex items-center justify-center shrink-0 border border-[#00e5ff]/30 shadow-[0_0_8px_rgba(0,229,255,0.2)]">
            <span className="material-symbols-outlined text-[#00363d] text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              terminal
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter text-[#00e5ff]">CRAWL_SUITE</h1>
            <p className="text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider">V1.0.4-STABLE</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <ul className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
                  isActive
                    ? 'text-[#00daf3] font-bold border-r-2 border-[#00daf3] bg-[#222a3d] scale-[0.98]'
                    : 'text-[#bac9cc] hover:bg-[#2d3449]/50 hover:text-[#00daf3]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Actions */}
      <div className="px-3 shrink-0 flex flex-col gap-3 mt-auto pt-4 border-t border-[#3b494c]/30 mx-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#ffb4ab]/50 text-[#ffb4ab] rounded font-semibold text-xs uppercase tracking-wider hover:bg-[#ffb4ab] hover:text-[#690005] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">lock</span>
          Root Safety Lock
        </button>
        
        <ul className="flex flex-col gap-1 font-mono text-[10px] text-[#bac9cc]">
          <li>
            <button
              onClick={() => setView('dashboard')}
              className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2d3449]/30 hover:text-[#00daf3] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-sm">monitor_heart</span>
              <span>System Health</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setView('config')}
              className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2d3449]/30 hover:text-[#00daf3] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
