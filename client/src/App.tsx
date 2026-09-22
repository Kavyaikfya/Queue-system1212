import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useNotification } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { SplashScreen } from './components/SplashScreen';
import { QueueAIChatbot } from './components/QueueAIChatbot';
import { SettingsModal } from './components/SettingsModal';

import { LandingPage } from './pages/LandingPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { ServicesJourneyPage } from './pages/ServicesJourneyPage';
import { SnapAndUnderstandPage } from './pages/SnapAndUnderstandPage';
import { ServicePassportPage } from './pages/ServicePassportPage';
import { MyServicesPage } from './pages/MyServicesPage';
import { ServiceProxyPage } from './pages/ServiceProxyPage';
import { GroupBookingPage } from './pages/GroupBookingPage';
import { OpportunityRescuePage } from './pages/OpportunityRescuePage';
import { ProcessReusePage } from './pages/ProcessReusePage';
import { AlertsPage } from './pages/AlertsPage';
import { ProfilePage } from './pages/ProfilePage';

import { JoinQueuePage } from './pages/JoinQueuePage';
import { MobileScanJoinPage } from './pages/MobileScanJoinPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { QueueConfigPage } from './pages/QueueConfigPage';
import { FairnessCenterPage } from './pages/FairnessCenterPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AuthPages } from './pages/AuthPages';
import { DocumentPreCheckPage } from './pages/DocumentPreCheckPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeVisitCount, setActiveVisitCount] = useState<number>(0);

  // Check active services count for badge
  useEffect(() => {
    if (user) {
      api.getQevoraActiveServices()
        .then((res) => setActiveVisitCount(res.activeTickets?.length || 0))
        .catch(() => {});
    }
  }, [user, currentPage]);

  // Deep link handler (e.g. #/services or #/scan/:queueId or #/dashboard)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash.startsWith('scan/')) {
        const queueId = hash.replace('scan/', '');
        setCurrentPage('scan');
        setPageParams({ queueId });
      } else if (hash === 'dashboard' || hash === 'home') {
        setCurrentPage('dashboard');
      } else if (hash === 'services') {
        setCurrentPage('services');
      } else if (hash === 'my-services' || hash === 'my-visit' || hash === 'my-queue') {
        setCurrentPage('my-services');
      } else if (hash === 'alerts' || hash === 'notifications') {
        setCurrentPage('alerts');
      } else if (hash === 'snap-understand') {
        setCurrentPage('snap-understand');
      } else if (hash === 'service-passport') {
        setCurrentPage('service-passport');
      } else if (hash === 'proxy') {
        setCurrentPage('proxy');
      } else if (hash === 'group-booking') {
        setCurrentPage('group-booking');
      } else if (hash === 'opportunity-rescue') {
        setCurrentPage('opportunity-rescue');
      } else if (hash === 'process-reuse') {
        setCurrentPage('process-reuse');
      } else if (hash === 'join') {
        setCurrentPage('join');
      } else if (hash === 'profile') {
        setCurrentPage('profile');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    const hash = window.location.hash.replace('#/', '');
    if (hash.startsWith('scan/')) {
      const queueId = hash.replace('scan/', '');
      setCurrentPage('scan');
      setPageParams({ queueId });
      return;
    }
    if (hash === 'my-services' || hash === 'my-visit' || hash === 'my-queue') {
      setCurrentPage('my-services');
      return;
    }
    if (hash === 'services') {
      setCurrentPage('services');
      return;
    }
    if (hash === 'dashboard') {
      setCurrentPage('dashboard');
      return;
    }

    if (user) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAIChat = () => {
    const trigger = document.getElementById('queue-ai-trigger');
    if (trigger) {
      trigger.click();
    } else {
      handleNavigate('snap-understand');
    }
  };

  // Determine whether sidebar should be shown (for logged in workspace experience)
  const showSidebar = currentPage !== 'home' && currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'scan';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#050b18] text-slate-900 dark:text-[#f8fafc] selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Route-independent application startup splash */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Top Navbar & Mobile Header */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Workspace Layout with Desktop Left Sidebar */}
      <div className="flex-1 flex min-h-[calc(100vh-64px)]">
        {showSidebar && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onOpenAI={handleOpenAIChat}
            onOpenSettings={() => setShowSettingsModal(true)}
            unreadNotifications={unreadCount}
            activeVisitCount={activeVisitCount}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {/* Main Page Content Area */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-10 overflow-x-hidden">
          {currentPage === 'home' && <LandingPage onNavigate={handleNavigate} />}
          {currentPage === 'dashboard' && <UserDashboardPage onNavigate={handleNavigate} />}
          {currentPage === 'services' && (
            <ServicesJourneyPage
              onNavigate={handleNavigate}
              initialCategory={pageParams.category}
              initialSearch={pageParams.search}
            />
          )}
          {(currentPage === 'my-services' || currentPage === 'my-visit' || currentPage === 'my-queue') && (
            <MyServicesPage onNavigate={handleNavigate} />
          )}
          {currentPage === 'snap-understand' && (
            <SnapAndUnderstandPage onNavigate={handleNavigate} query={pageParams.query} />
          )}
          {currentPage === 'service-passport' && <ServicePassportPage onNavigate={handleNavigate} />}
          {currentPage === 'proxy' && (
            <ServiceProxyPage onNavigate={handleNavigate} serviceId={pageParams.serviceId} />
          )}
          {currentPage === 'group-booking' && <GroupBookingPage onNavigate={handleNavigate} />}
          {currentPage === 'opportunity-rescue' && (
            <OpportunityRescuePage onNavigate={handleNavigate} />
          )}
          {currentPage === 'process-reuse' && (
            <ProcessReusePage onNavigate={handleNavigate} serviceId={pageParams.serviceId} />
          )}
          {(currentPage === 'alerts' || currentPage === 'notifications') && (
            <AlertsPage onNavigate={handleNavigate} />
          )}
          {currentPage === 'documents' && <DocumentPreCheckPage onNavigate={handleNavigate} />}
          {currentPage === 'join' && (
            <JoinQueuePage onNavigate={handleNavigate} preselectedQueueId={pageParams.queueId} />
          )}
          {currentPage === 'scan' && (
            <MobileScanJoinPage queueId={pageParams.queueId} onNavigate={handleNavigate} />
          )}
          {currentPage === 'staff' && <StaffDashboardPage onNavigate={handleNavigate} />}
          {currentPage === 'admin' && <AdminDashboardPage onNavigate={handleNavigate} />}
          {currentPage === 'config' && (
            <QueueConfigPage queueId={pageParams.queueId} onNavigate={handleNavigate} />
          )}
          {currentPage === 'fairness' && <FairnessCenterPage onNavigate={handleNavigate} />}
          {(currentPage === 'audit' || currentPage === 'history') && <AuditLogPage />}
          {currentPage === 'login' && <AuthPages initialMode="login" onNavigate={handleNavigate} />}
          {currentPage === 'register' && <AuthPages initialMode="register" onNavigate={handleNavigate} />}
          {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
        </main>
      </div>

      {/* Floating Context-Aware Voice/AI Assistant */}
      <QueueAIChatbot onNavigate={handleNavigate} />

      {/* Global Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Mobile-first clean 5-Item Bottom Navigation */}
      <MobileNav currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
};
