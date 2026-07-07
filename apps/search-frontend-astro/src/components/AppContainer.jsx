import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Dashboard from './Dashboard.jsx';
import CrawlerConfig from './CrawlerConfig.jsx';
import DiagnosticsTerminal from './DiagnosticsTerminal.jsx';
import DocumentExplorer from './DocumentExplorer.jsx';
import SearchResultsIsland from './SearchResultsIsland.jsx';

const AppContainer = () => {
  const [currentView, setView] = useState('dashboard');
  const [logFilterQuery, setLogFilterQuery] = useState('');
  const [systemEpoch, setSystemEpoch] = useState('1715424000');

  // Dynamically switch view content
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'config':
        return <CrawlerConfig />;
      case 'logs':
        return <DiagnosticsTerminal />;
      case 'explorer':
        return <DocumentExplorer />;
      case 'search':
        return <SearchResultsIsland />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Persistent Left Sidebar */}
      <Sidebar currentView={currentView} setView={setView} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <Header 
          query={logFilterQuery} 
          setQuery={setLogFilterQuery} 
          systemEpoch={systemEpoch} 
        />

        {/* Dynamic Canvas page content */}
        <main className="flex-1 overflow-y-auto bg-[#0f172a]">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
};

export default AppContainer;
