import React from 'react';

const Header = ({ query, setQuery, systemEpoch }) => {
  return (
    <header className="flex justify-between items-center w-full px-6 h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] sticky top-0 z-10 shrink-0">
      {/* Query Filter Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#bcc9cd] text-[18px]">search</span>
          <input
            type="text"
            value={query || ''}
            onChange={(e) => setQuery && setQuery(e.target.value)}
            className="bg-[#1e293b] border-none text-[#dae2fd] font-mono text-xs pl-9 pr-4 py-1.5 rounded focus:ring-1 focus:ring-[#06b6d4] w-64 placeholder-[#bcc9cd]/50"
            placeholder="Query node logs..."
          />
        </div>
      </div>

      {/* Center System Epoch */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
        <span className="text-sm text-[#dae2fd] font-bold tracking-tight">
          System Epoch: <span className="font-mono text-[#06b6d4]">{systemEpoch || '1715424000'}</span>
        </span>
      </div>

      {/* Trailing Icon Actions */}
      <div className="flex items-center gap-4">
        <button className="text-[#bcc9cd] hover:text-[#06b6d4] transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#ffb4ab] rounded-full"></span>
        </button>
        <button className="text-[#bcc9cd] hover:text-[#06b6d4] transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
