import React from 'react';

const Header = ({ query, setQuery, systemEpoch }) => {
  return (
    <header className="bg-[#0b1326] border-b border-[#3b494c] flex justify-between items-center w-full px-6 h-16 ml-[280px] max-w-[calc(100%-280px)] sticky top-0 z-40 shrink-0 font-sans text-[#dae2fd]">
      <div className="flex items-center gap-6">
        <span className="text-md font-black text-[#00daf3] tracking-tighter uppercase font-mono">CRAWL_SUITE_OS</span>
        <nav className="hidden lg:flex items-center gap-6">
          <a className="text-xs font-mono text-[#bac9cc] hover:text-[#00daf3] uppercase tracking-wider transition-colors" href="#">Docs</a>
          <a className="text-xs font-mono text-[#bac9cc] hover:text-[#00daf3] uppercase tracking-wider transition-colors" href="#">Support</a>
          <a className="text-xs font-mono text-[#bac9cc] hover:text-[#00daf3] uppercase tracking-wider transition-colors" href="#">API</a>
        </nav>
      </div>

      <div className="flex-1"></div>

      {/* Right Side: Search & Icons */}
      <div className="flex items-center gap-6">
        {/* Simulated Search Bar */}
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bac9cc] text-sm">search</span>
          <input
            className="bg-[#131b2e] border border-[#3b494c] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#dae2fd] focus:outline-none focus:border-[#00daf3] transition-colors w-48 placeholder-[#bac9cc]/50"
            placeholder="Search resources..."
            type="text"
            value={query || ''}
            onChange={(e) => setQuery && setQuery(e.target.value)}
          />
        </div>

        {/* Trailing Icons */}
        <div className="flex items-center gap-2 border-l border-[#3b494c] pl-4">
          <button className="text-[#bac9cc] hover:text-[#00daf3] transition-all p-2 rounded-full hover:bg-[#222a3d] relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ffb4ab] rounded-full"></span>
          </button>
          <button className="text-[#bac9cc] hover:text-[#00daf3] transition-all p-2 rounded-full hover:bg-[#222a3d]">
            <span className="material-symbols-outlined text-[20px]">security</span>
          </button>
          <button className="text-[#bac9cc] hover:text-[#00daf3] transition-all p-2 rounded-full hover:bg-[#222a3d]">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
