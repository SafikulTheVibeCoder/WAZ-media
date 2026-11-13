import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CaptionsView } from './components/CaptionsView';
import { PosterStudioView } from './components/PosterStudioView';
import { BrandManagerView } from './components/BrandManagerView';
import { SavedDesignsView } from './components/SavedDesignsView';
import { LandingPageView } from './components/LandingPageView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { BulkPlannerView } from './components/BulkPlannerView';
import { Toast } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { AccessDeniedModal } from './components/AccessDeniedModal';
import { PricingUpgradeModal } from './components/PricingUpgradeModal';

const MainContent: React.FC = () => {
  const { currentView } = useApp();
  const isLanding = currentView === 'landing';

  if (isLanding) {
    return (
      <main className="flex-1 w-full">
        <LandingPageView />
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-10">
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'captions' && <CaptionsView />}
      {currentView === 'planner' && <BulkPlannerView />}
      {currentView === 'poster' && <PosterStudioView />}
      {currentView === 'brand' && <BrandManagerView />}
      {currentView === 'saved' && <SavedDesignsView />}
      {currentView === 'admin' && <AdminDashboardView />}
    </main>
  );
};

const AppShell: React.FC = () => {
  const { currentView } = useApp();
  const isLanding = currentView === 'landing';

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-[#f5f3ee] flex flex-col md:flex-row font-bengali antialiased">
      {!isLanding && <Sidebar />}
      <MainContent />
      <Toast />
      <AuthModal />
      <AccessDeniedModal />
      <PricingUpgradeModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
