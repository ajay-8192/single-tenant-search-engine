import React, { useState } from 'react';

const OnboardingWizard = ({ onOnboardComplete }) => {
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFinalize = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Simple validation
    if (!domain.trim()) {
      setErrorMsg('Target domain context is required.');
      return;
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      setErrorMsg('Please enter a valid domain context (e.g. company.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Trigger initial search crawl index on the backend gateway
      const seedUrl = `https://${domain.trim()}`;
      const response = await fetch('http://localhost:8080/api/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_url: seedUrl,
          crawl_depth_limit: 1,
          max_pages_per_domain: 500,
          user_agent_identifier: 'CRAWL_SUITE_OS_Bot/v1.0',
        }),
      });

      if (response.ok) {
        if (onOnboardComplete) {
          onOnboardComplete(domain.trim());
        }
      } else {
        const errorData = await response.json();
        setErrorMsg(`Failed to initialize crawl: ${errorData.error || 'Server error'}`);
        setIsSubmitting(false);
      }
    } catch (err) {
      // Offline fallback: allow local development progress
      console.warn('Backend API offline during onboarding. Proceeding in mock mode.');
      if (onOnboardComplete) {
        onOnboardComplete(domain.trim());
      }
    }
  };

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen flex items-center justify-center p-4 font-sans w-full">
      {/* Top AppBar */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 h-16 bg-[#0b1326] border-b border-[#3b494c] z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00e5ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
            terminal
          </span>
          <span className="text-lg font-black text-[#00e5ff] tracking-tighter">CRAWL_SUITE_OS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-[#bac9cc] tracking-widest uppercase">SETUP SEQUENCE</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-[640px] mt-16 pt-8">
        {/* Progress Indicators */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#00e5ff] flex items-center justify-center text-[#00363d] font-mono text-xs font-bold shadow-[0_0_8px_rgba(0,229,255,0.5)]">
              1
            </div>
            <div className="h-1 flex-1 mx-2 bg-[#00e5ff]"></div>
          </div>
          <div className="flex-1 flex items-center">
            <div className="w-8 h-8 rounded-full border border-[#00e5ff] flex items-center justify-center text-[#00e5ff] font-mono text-xs">
              2
            </div>
            <div className="h-1 flex-1 mx-2 bg-[#222a3d]"></div>
          </div>
          <div className="flex-1 flex items-center">
            <div className="w-8 h-8 rounded-full border border-[#3b494c] flex items-center justify-center text-[#849396] font-mono text-xs">
              3
            </div>
          </div>
        </div>

        {/* Setup Card */}
        <div className="bg-[#131b2e] border border-[#3b494c] rounded-xl p-8 shadow-lg relative overflow-hidden">
          {/* Decorative subtle glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00e5ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#00e5ff] mb-2">Define Core Domain Scaffolding</h1>
            <p className="text-sm text-[#bac9cc]">Initialize the primary operational perimeter for the crawler engine.</p>
          </div>

          <form onSubmit={handleFinalize}>
            {/* Input Section */}
            <div className="space-y-4 mb-6 relative z-10">
              <div>
                <label className="block text-xs font-mono text-[#bac9cc] mb-2 uppercase tracking-wider" htmlFor="domain">
                  TARGET DOMAIN CONTEXT
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#3b494c]">
                    <span className="material-symbols-outlined text-[20px]">language</span>
                  </span>
                  <input
                    className="w-full bg-[#0b1326] border border-[#3b494c] text-[#dae2fd] rounded pl-10 pr-4 py-3 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-colors placeholder:text-[#3b494c] text-sm"
                    id="domain"
                    placeholder="e.g. company.com"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-[#ffb4ab] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errorMsg}
                </p>
              )}

              {/* Warning Banner */}
              <div className="bg-[#93000a]/20 border border-[#ffb4ab]/30 rounded-lg p-4 flex gap-3">
                <span className="material-symbols-outlined text-[#ffb4ab] mt-0.5 shrink-0">warning</span>
                <div>
                  <h4 className="text-xs font-bold text-[#ffb4ab] mb-1 uppercase tracking-wide">Security Lockdown</h4>
                  <p className="text-xs text-[#ffdad6] leading-relaxed">
                    Your engine will permanently restrict all web scraping paths within this domain context to prevent data contamination. This setting cannot be altered post-initialization without root privileges.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="border-t border-[#3b494c] pt-6 flex flex-col items-end relative z-10">
              <h3 className="text-lg font-semibold text-[#dae2fd] mb-4 self-start">Launch Core Indexing</h3>
              <button
                className="w-full sm:w-auto bg-[#4edea3] hover:bg-[#6ffbbe] transition-colors duration-200 text-[#003824] text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(78,222,163,0.3)] hover:shadow-[0_0_16px_rgba(78,222,163,0.5)] disabled:opacity-50"
                type="submit"
                disabled={isSubmitting}
              >
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                {isSubmitting ? 'Initializing Search Index...' : 'Finalize Setup & Automate First Search Index'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default OnboardingWizard;
