import React, { useState } from 'react';

const AuthenticationGateway = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Simple corporate email validation (must end with .local, .dev, or contain valid structure)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMsg('Please enter a valid company email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Root passphrase is required.');
      return;
    }

    // Call onLogin parent handler on success
    if (onLogin) {
      onLogin(email);
    }
  };

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen flex items-center justify-center p-4 relative font-sans w-full">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#9cf0ff]/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#6ffbbe]/5 blur-[120px]"></div>
      </div>

      <main className="w-full max-w-[480px] z-10 relative">
        {/* Main Card */}
        <div className="bg-[#131b2e] border border-[#3b494c] rounded-xl overflow-hidden shadow-2xl relative">
          {/* Highlight bar top */}
          <div className="h-1 w-full bg-gradient-to-r from-[#c3f5ff] to-[#4edea3]"></div>
          <div className="p-8 sm:p-8">
            {/* Header */}
            <div className="mb-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#222a3d] border border-[#3b494c] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,218,243,0.1)]">
                <span className="material-symbols-outlined text-[#00daf3] text-[32px]">security</span>
              </div>
              <h1 className="text-2xl font-bold text-[#c3f5ff] tracking-tight mb-2">CRAWL_SUITE</h1>
              <p className="text-xs font-semibold text-[#bac9cc] tracking-wider uppercase">COMPLIANT AUTHENTICATION GATEWAY</p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#dae2fd] uppercase tracking-wide" htmlFor="email">
                  Corporate Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#849396] text-[20px]">mail</span>
                  </div>
                  <input
                    className={`block w-full pl-10 pr-3 py-3 bg-[#0b1326] border ${
                      errorMsg && email === '' ? 'border-[#ffb4ab]' : 'border-[#3b494c]'
                    } rounded focus:ring-1 focus:ring-[#00daf3] focus:border-[#00daf3] text-[#dae2fd] text-sm placeholder-[#3b494c] transition-colors`}
                    id="email-input"
                    name="email"
                    placeholder="user@company.com"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errorMsg && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">error</span>
                    </div>
                  )}
                </div>
                {errorMsg && (
                  <p className="text-xs text-[#ffb4ab] mt-1 flex items-center gap-1" id="error-msg">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Passphrase Field */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-[#dae2fd] uppercase tracking-wide" htmlFor="password">
                    Root Passphrase
                  </label>
                  <a href="#" className="text-xs text-[#c3f5ff] hover:text-[#9cf0ff] transition-colors">
                    Recover Access
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#849396] text-[20px]">key</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-10 py-3 bg-[#0b1326] border border-[#3b494c] rounded focus:ring-1 focus:ring-[#00daf3] focus:border-[#00daf3] text-[#dae2fd] text-sm placeholder-[#3b494c] transition-colors"
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-[#c3f5ff] transition-colors text-[#849396]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-2 pb-2">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-[#3b494c] bg-[#0b1326] text-[#c3f5ff] focus:ring-[#00daf3] focus:ring-offset-[#0b1326]"
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="ml-2 block text-xs font-medium text-[#bac9cc]" htmlFor="remember-me">
                    Retain session state
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded bg-[#c3f5ff] text-[#00363d] text-sm font-bold hover:bg-[#9cf0ff] hover:shadow-[0_0_15px_rgba(0,218,243,0.3)] transition-all active:scale-[0.98]"
                type="submit"
              >
                INITIALIZE SESSION
                <span className="material-symbols-outlined text-[20px]">login</span>
              </button>
            </form>
          </div>

          {/* Footer area within card */}
          <div className="bg-[#2d3449] px-8 py-4 border-t border-[#3b494c]">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#849396] text-[20px] mt-0.5">info</span>
              <p className="text-xs text-[#bac9cc] leading-relaxed">
                Standard corporate single-tenant instance. Initial secure credentials are pre-provisioned by your infrastructure manager.
              </p>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="mt-8 text-center opacity-60">
          <p className="text-xs text-[#bac9cc] uppercase tracking-wider">
            SECURE CONNECTION ESTABLISHED • ENCRYPTED TUNNEL
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthenticationGateway;
