import React, { useState } from 'react';

const CrawlerConfig = ({ onboardedDomain }) => {
  const defaultSeeds = onboardedDomain
    ? `https://${onboardedDomain}\nhttps://${onboardedDomain}/docs`
    : `https://api.internal.corp/v1/docs\nhttps://staging.cluster.local/metrics`;

  const [seedPaths, setSeedPaths] = useState(defaultSeeds);
  const [hops, setHops] = useState(1);
  const [maxDocs, setMaxDocs] = useState(5000);
  const [useOAuth2, setUseOAuth2] = useState(true);
  const [useClientCert, setUseClientCert] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    // Get the first path vector entered
    const pathsList = seedPaths.split('\n').map((p) => p.trim()).filter(Boolean);
    if (pathsList.length === 0) {
      setStatusMsg({ success: false, text: 'At least one seed path vector is required.' });
      setIsSubmitting(false);
      return;
    }

    const targetUrl = pathsList[0];

    try {
      const res = await fetch('http://localhost:8080/api/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_url: targetUrl,
          crawl_depth_limit: hops,
          max_pages_per_domain: maxDocs,
          user_agent_identifier: 'CRAWL_SUITE_OS_Bot/v1.0 (Web Crawler Config)',
        }),
      });

      if (res.ok) {
        setStatusMsg({
          success: true,
          text: `⚡ Ingestion loop successfully initialized for seed URL: ${targetUrl}. View Diagnostics tab for logs!`,
        });
      } else {
        const errorData = await res.json();
        setStatusMsg({
          success: false,
          text: `Crawl loop failed: ${errorData.error || 'Server error'}`,
        });
      }
    } catch (err) {
      setStatusMsg({
        success: false,
        text: 'Could not connect to API Gateway. Ensure backend Go server is running.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto p-6 text-[#dae2fd] font-sans">
      {/* Configuration Form (Span 8 cols) */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-[#131b2e] border border-[#3b494c] rounded-xl p-6 shadow-sm">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-[#3b494c]/30 flex justify-between items-end">
            <div>
              <h3 className="text-lg font-bold text-[#dae2fd]">Guided Crawler Configuration Space</h3>
              <p className="text-xs text-[#bac9cc] mt-1">Define target parameters, execution depth, and operational constraints.</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-[#131b2e] border border-[#3d494c] rounded-xl p-4 flex items-start gap-3 relative overflow-hidden mb-6">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00daf3]"></div>
            <span className="material-symbols-outlined text-[#00daf3]" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <div>
              <h4 className="text-xs font-bold text-[#dae2fd] mb-1">Configuration Read-Only Mode</h4>
              <p className="text-xs text-[#bac9cc] leading-relaxed">
                Your current access level restricts structural modifications to root crawler targets. You may review existing parameters or request an escalation token from a System Administrator to unlock execution capabilities.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {statusMsg && (
              <div
                className={`p-4 rounded text-xs ${
                  statusMsg.success
                    ? 'bg-[#4edea3]/10 border border-[#4edea3]/20 text-[#4edea3]'
                    : 'bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab]'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            {/* Target Paths Textarea */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#00e5ff] text-base">public</span>
                <label className="text-xs font-mono text-[#bac9cc] uppercase tracking-wider">Target Path Vectors</label>
              </div>
              <p className="text-xs text-[#bac9cc] mb-2 leading-relaxed">
                Enter primary seed URLs or internal network paths. Separate multiple targets with a new line. The crawler will validate DNS resolution before execution.
              </p>
              <div className="relative">
                <textarea
                  className="w-full bg-[#0b1326] border border-[#3b494c] rounded-lg p-4 font-mono text-xs text-[#00daf3] focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] outline-none min-h-[150px] resize-y transition-colors"
                  placeholder="https://api.internal.corp/v1/docs&#10;https://staging.cluster.local/metrics"
                  value={seedPaths}
                  onChange={(e) => setSeedPaths(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-[#bac9cc]">
                <span>Supports Regex pattern matching.</span>
                <span>{seedPaths.split('\n').filter(Boolean).length} Node Target(s) Registered</span>
              </div>
            </div>

            {/* Authentication Injectors */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#3b494c]/20 pb-2">
                <span className="material-symbols-outlined text-[#00e5ff] text-base">key</span>
                <h4 className="text-xs font-mono text-[#bac9cc] uppercase tracking-wider">Authentication Injectors</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  onClick={() => setUseOAuth2(!useOAuth2)}
                  className={`flex items-center justify-between p-4 border rounded-lg bg-[#0b1326] cursor-pointer transition-colors ${
                    useOAuth2 ? 'border-[#00daf3]' : 'border-[#3b494c] hover:border-[#bac9cc]'
                  }`}
                >
                  <div>
                    <span className="block text-sm font-semibold text-[#dae2fd]">Bearer Token (OAuth2)</span>
                    <span className="block text-[10px] font-mono text-[#bac9cc] mt-0.5">Env: $CRAWL_AUTH_TOK</span>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      useOAuth2 ? 'bg-[#00daf3]' : 'bg-[#222a3d]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[#0b1326] absolute top-1 rounded-full transition-transform ${
                        useOAuth2 ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </div>
                </label>

                <label
                  onClick={() => setUseClientCert(!useClientCert)}
                  className={`flex items-center justify-between p-4 border rounded-lg bg-[#0b1326] cursor-pointer transition-colors ${
                    useClientCert ? 'border-[#00daf3]' : 'border-[#3b494c] hover:border-[#bac9cc]'
                  }`}
                >
                  <div>
                    <span className="block text-sm font-semibold text-[#dae2fd]">Client TLS Certificate</span>
                    <span className="block text-[10px] font-mono text-[#bac9cc] mt-0.5">Disabled (Requires Keystore)</span>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      useClientCert ? 'bg-[#00daf3]' : 'bg-[#222a3d]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[#0b1326] absolute top-1 rounded-full transition-transform ${
                        useClientCert ? 'right-1' : 'left-1'
                      }`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Lateral Settings Panel (Span 4 cols) */}
      <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col h-full">
        {/* Scrape Parameters Card */}
        <div className="bg-[#131b2e] border border-[#3b494c] rounded-xl p-6 shadow-sm flex-1">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#00daf3]">tune</span>
            <h3 className="text-sm font-bold uppercase tracking-wide">Scrape Parameters</h3>
          </div>

          {/* Depth Limit Segmented Controls */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-bold text-[#dae2fd]">Intensity Depth Limit</label>
              <span className="text-[10px] font-mono text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded">Hop Level</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 bg-[#0b1326] p-1 rounded-lg border border-[#3b494c]">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setHops(val)}
                  className={`py-2 text-center text-xs font-mono font-bold rounded transition-all ${
                    hops === val
                      ? 'bg-[#222a3d] text-[#00daf3] border border-[#00daf3]'
                      : 'text-[#bac9cc] hover:bg-[#222a3d]/50 hover:text-[#dae2fd]'
                  }`}
                >
                  {val} Hop{val > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#bac9cc] leading-relaxed mt-3">
              <strong className="text-[#dae2fd]">Low Complexity:</strong> 1 Hop restricts the crawler to explicitly defined seed paths. Minimal execution time, optimal for isolated endpoints.
            </p>
          </div>

          <hr className="border-[#3b494c]/30 my-4" />

          {/* Max Doc Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="text-xs font-bold text-[#dae2fd]">Max Document Cap Count</label>
              <span className="text-xs font-mono font-bold text-[#00e5ff]">{maxDocs.toLocaleString()} Nodes</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={maxDocs}
              onChange={(e) => setMaxDocs(parseInt(e.target.value))}
              className="w-full appearance-none bg-transparent accent-[#00daf3] cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #00daf3 0%, #3b494c 100%)',
                height: '4px',
                borderRadius: '2px',
              }}
            />
            <div className="flex justify-between text-[10px] font-mono text-[#bac9cc] mt-2">
              <span>100</span>
              <span>10k+</span>
            </div>
            <p className="text-[10px] text-[#bac9cc] leading-relaxed mt-3">
              <strong className="text-[#dae2fd]">Time Variance:</strong> Higher caps drastically increase memory consumption and network I/O duration. Recommend staying below 2,000 for standard audits.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-[#0b1326] border border-[#3b494c] border-t-[#00e5ff] rounded-xl p-6 shadow-[0_0_20px_rgba(0,229,255,0.05)] mt-auto">
          <div className="flex items-start gap-3 mb-6">
            <span className="material-symbols-outlined text-[#00e5ff] shrink-0 mt-0.5">warning</span>
            <p className="text-xs text-[#bac9cc] leading-relaxed">
              Initialization will temporarily allocate dedicated compute resources from the pool. Monitor via Diagnostics panel.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#00daf3] text-[#00363d] font-bold text-xs uppercase tracking-wider py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#9cf0ff] hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all disabled:opacity-50"
          >
            ⚡ {isSubmitting ? 'Initializing...' : 'Initialize Web Crawl Loop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrawlerConfig;
