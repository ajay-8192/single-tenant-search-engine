import React, { useState } from 'react';

const CrawlerConfig = () => {
  const [seedUrl, setSeedUrl] = useState('https://example.com');
  const [depthLimit, setDepthLimit] = useState(3);
  const [maxPages, setMaxPages] = useState(500);
  const [userAgent, setUserAgent] = useState('CrawlerOS-Bot/v2.4 (+http://internal.sys/bot)');
  const [respectRobots, setRespectRobots] = useState(true);
  const [headless, setHeadless] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('http://localhost:8080/api/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_url: seedUrl,
          crawl_depth_limit: parseInt(depthLimit),
          max_pages_per_domain: parseInt(maxPages),
          user_agent_identifier: userAgent,
        }),
      });

      if (res.ok) {
        setStatusMsg({ success: true, text: 'Crawl job successfully initialized! Monitor progress in the Live Logs tab.' });
      } else {
        const data = await res.json();
        setStatusMsg({ success: false, text: `Initialization failed: ${data.error || 'Unknown error'}` });
      }
    } catch (err) {
      setStatusMsg({ success: false, text: 'Could not connect to API Gateway. Ensure Go server is running.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto p-6">
      {/* Configuration Form (Span 8 cols) */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-level-1 rounded-xl p-6">
          <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-end">
            <div>
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#06b6d4]">hub</span>
                Seed Manager
              </h3>
              <p className="text-xs text-[#bcc9cd] mt-1">Configure target parameters for the next distributed web crawl epoch.</p>
            </div>
            <div>
              <span className="font-mono text-[9px] text-[#4edea3] bg-[#4edea3]/10 px-2.5 py-1 rounded border border-[#4edea3]/20 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#4edea3] rounded-full animate-pulse"></span>
                SYSTEM READY
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {statusMsg && (
              <div className={`p-4 rounded text-xs ${statusMsg.success ? 'bg-[#4edea3]/10 border border-[#4edea3]/20 text-[#4edea3]' : 'bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab]'}`}>
                {statusMsg.text}
              </div>
            )}

            {/* URL Input */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-[#bcc9cd] block uppercase" htmlFor="seedUrl">Seed Target URL Link</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9cd] text-[18px]">link</span>
                <input
                  type="url"
                  id="seedUrl"
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  className="w-full input-inset font-mono text-xs text-[#dae2fd] rounded-lg pl-10 pr-4 py-3 placeholder:text-[#bcc9cd]/30"
                  placeholder="https://example.com/start"
                  required
                />
              </div>
            </div>

            {/* Numeric Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#bcc9cd] block uppercase" htmlFor="crawlDepth">Crawl Depth Limit</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9cd] text-[18px]">layers</span>
                  <input
                    type="number"
                    id="crawlDepth"
                    min="1"
                    max="10"
                    value={depthLimit}
                    onChange={(e) => setDepthLimit(e.target.value)}
                    className="w-full input-inset font-mono text-xs text-[#dae2fd] rounded-lg pl-10 pr-4 py-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#bcc9cd] block uppercase" htmlFor="maxPages">Max Pages Per Domain Boundary</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9cd] text-[18px]">description</span>
                  <input
                    type="number"
                    id="maxPages"
                    min="10"
                    max="10000"
                    value={maxPages}
                    onChange={(e) => setMaxPages(e.target.value)}
                    className="w-full input-inset font-mono text-xs text-[#dae2fd] rounded-lg pl-10 pr-4 py-3"
                  />
                </div>
              </div>
            </div>

            {/* User Agent Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-[#bcc9cd] uppercase" htmlFor="userAgent">User-Agent Identifier String</label>
                <button 
                  type="button" 
                  onClick={() => setUserAgent('CrawlerOS-Bot/v2.4 (+http://internal.sys/bot)')} 
                  className="text-[#06b6d4] hover:underline text-[9px] font-mono"
                >
                  Reset Default
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9cd] text-[18px]">fingerprint</span>
                <input
                  type="text"
                  id="userAgent"
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className="w-full input-inset font-mono text-xs text-[#dae2fd] rounded-lg pl-10 pr-4 py-3"
                />
              </div>
            </div>

            {/* Additional Settings (Toggles) */}
            <div className="pt-4 border-t border-[rgba(255,255,255,0.05)] grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-[#2d3449]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={respectRobots}
                  onChange={(e) => setRespectRobots(e.target.checked)}
                  className="rounded bg-black/20 border-[#3d494c] text-[#06b6d4] focus:ring-[#06b6d4]"
                />
                <span className="text-xs text-[#dae2fd] group-hover:text-[#06b6d4] transition-colors">Respect robots.txt policies</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-[#2d3449]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={headless}
                  onChange={(e) => setHeadless(e.target.checked)}
                  className="rounded bg-black/20 border-[#3d494c] text-[#06b6d4] focus:ring-[#06b6d4]"
                />
                <span className="text-xs text-[#dae2fd] group-hover:text-[#06b6d4] transition-colors">Enable JavaScript Rendering (Headless)</span>
              </label>
            </div>

            {/* Submit buttons */}
            <div className="pt-6 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setSeedUrl('')} 
                className="text-xs text-[#bcc9cd] hover:text-[#dae2fd] transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-6 py-3 rounded-lg font-mono text-xs font-bold uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                {isSubmitting ? 'Initializing...' : 'Initialize Deep Web Crawl'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lateral Info Panel (Span 4 cols) */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        {/* Status Card */}
        <div className="bg-level-1 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#06b6d4]/5 rounded-full blur-2xl group-hover:bg-[#06b6d4]/10 transition-all duration-500"></div>
          <h4 className="font-mono text-[10px] text-[#bcc9cd] mb-4 flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-[16px]">memory</span>
            Node Allocation Status
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span className="text-[#dae2fd]">Compute Cluster Alpha</span>
                <span className="text-[#4edea3]">45%</span>
              </div>
              <div className="w-full bg-[#171f33] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span className="text-[#dae2fd]">Network Bandwidth</span>
                <span className="text-[#ffb2b7]">82%</span>
              </div>
              <div className="w-full bg-[#171f33] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ffb2b7] h-full rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span className="text-[#dae2fd]">Storage Pool (NVMe)</span>
                <span className="text-[#06b6d4]">12%</span>
              </div>
              <div className="w-full bg-[#171f33] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#06b6d4] h-full rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules Card */}
        <div className="bg-level-1 rounded-xl p-5 border-l-2 border-l-[#3d494c]">
          <h4 className="font-mono text-[10px] text-[#bcc9cd] mb-3 flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Configuration Rules
          </h4>
          <ul className="space-y-3 font-mono text-[10px] text-[#bcc9cd]">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#06b6d4] mt-0.5">check_circle</span>
              Ensure target domains are whitelisted in the Global Crawler Policy matrix.
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#06b6d4] mt-0.5">check_circle</span>
              Depth &gt; 5 requires explicit override token due to exponential request scaling.
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[14px] text-[#ffb4ab] mt-0.5">warning</span>
              Headless rendering incurs a 4x penalty on compute allocation.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CrawlerConfig;
