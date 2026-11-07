import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CaptionsView } from './components/CaptionsView';
import { PosterStudioView } from './components/PosterStudioView';
import { BrandManagerView } from './components/BrandManagerView';
import { SavedDesignsView } from './components/SavedDesignsView';
import { Toast } from './components/Toast';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'captions' && <CaptionsView />}
      {currentView === 'poster' && <PosterStudioView />}
      {currentView === 'brand' && <BrandManagerView />}
      {currentView === 'saved' && <SavedDesignsView />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0d0a08] text-[#f4eee2] flex flex-col md:flex-row font-bengali antialiased">
        <Sidebar />
        <MainContent />
        <Toast />
      </div>
    </AppProvider>
  );
}
