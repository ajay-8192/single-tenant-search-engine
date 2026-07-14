import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Dashboard from './Dashboard.jsx';
import CrawlerConfig from './CrawlerConfig.jsx';
import DiagnosticsTerminal from './DiagnosticsTerminal.jsx';
import DocumentScanner from './DocumentScanner.jsx';
import SearchResultsIsland from './SearchResultsIsland.jsx';
import UserDirectory from './UserDirectory.jsx';
import AuthenticationGateway from './AuthenticationGateway.jsx';
import OnboardingWizard from './OnboardingWizard.jsx';

const AppContainer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [onboardedDomain, setOnboardedDomain] = useState('');
  const [currentView, setView] = useState('dashboard');
  const [logFilterQuery, setLogFilterQuery] = useState('');
  const [systemEpoch, setSystemEpoch] = useState('1715424000');

  // Load session states from localStorage on initial render
  useEffect(() => {
    const cachedLogin = localStorage.getItem('crawl_session_active') === 'true';
    const cachedEmail = localStorage.getItem('crawl_session_email') || '';
    const cachedDomain = localStorage.getItem('crawl_onboarded_domain') || '';
    
    if (cachedLogin) {
      setIsLoggedIn(true);
      setUserEmail(cachedEmail);
    }
    if (cachedDomain) {
      setOnboardedDomain(cachedDomain);
    }
  }, []);

  const handleLogin = (email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('crawl_session_active', 'true');
    localStorage.setItem('crawl_session_email', email);
  };

  const handleOnboardComplete = (domain) => {
    setOnboardedDomain(domain);
    localStorage.setItem('crawl_onboarded_domain', domain);
    setView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setOnboardedDomain('');
    setView('dashboard');
    localStorage.removeItem('crawl_session_active');
    localStorage.removeItem('crawl_session_email');
    localStorage.removeItem('crawl_onboarded_domain');
  };

  // Dynamically switch view content
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onboardedDomain={onboardedDomain} />;
      case 'users':
        return <UserDirectory />;
      case 'config':
        return <CrawlerConfig onboardedDomain={onboardedDomain} />;
      case 'logs':
        return <DiagnosticsTerminal />;
      case 'explorer':
        return <DocumentScanner />;
      case 'search':
        return <SearchResultsIsland />;
      default:
        return <Dashboard onboardedDomain={onboardedDomain} />;
    }
  };

  // 1. Session Auth Router Block
  if (!isLoggedIn) {
    return <AuthenticationGateway onLogin={handleLogin} />;
  }

  // 2. Onboarding Scaffolding Router Block
  if (!onboardedDomain) {
    return <OnboardingWizard onOnboardComplete={handleOnboardComplete} />;
  }

  // 3. Main Console Portal Shell Layout
  return (
    <div className="min-h-screen flex bg-[#0f172a] font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <Header 
          query={logFilterQuery} 
          setQuery={setLogFilterQuery} 
          systemEpoch={systemEpoch} 
        />

        {/* Dynamic Canvas page content */}
        <main className="flex-1 overflow-y-auto bg-[#0b1326]">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
};

export default AppContainer;
