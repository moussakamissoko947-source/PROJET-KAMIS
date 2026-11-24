import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { LegalModal } from './components/LegalModal';
import { DevMailboxDrawer } from './components/DevMailboxDrawer';
import { UpgradeModal } from './components/UpgradeModal';
import { api } from './api/client';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { notify } = useNotification();

  // Navigation route state
  const [route, setRoute] = useState<string>('home');
  const [tokenParam, setTokenParam] = useState<string>('');

  // Global filters
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isDevMailboxOpen, setIsDevMailboxOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // URL routing sync
  useEffect(() => {
    const handleUrlChange = () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token') || '';
      setTokenParam(token);

      const path = url.pathname;
      const hash = window.location.hash.replace('#', '');

      if (path.includes('verify-email') || hash === 'verify-email') {
        setRoute('verify-email');
      } else if (path.includes('reset-password') || hash === 'reset-password') {
        setRoute('reset-password');
      } else if (hash === 'register') {
        setRoute('register');
      } else if (hash === 'forgot-password') {
        setRoute('forgot-password');
      } else if (hash === 'settings') {
        setRoute('settings');
      } else {
        setRoute('home');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (newRoute: string) => {
    window.location.hash = newRoute === 'home' ? '' : newRoute;
    setRoute(newRoute);
  };

  const handleOpenUrlFromDevMailbox = (url: string) => {
    try {
      const parsed = new URL(url);
      window.history.pushState({}, '', parsed.pathname + parsed.search);
      window.dispatchEvent(new Event('popstate'));
    } catch {
      window.location.href = url;
    }
  };

  const handleResendVerification = async (email: string) => {
    try {
      await api.auth.resendVerification(email);
      notify('info', 'Un nouveau lien de validation a été envoyé. Vérifiez votre boîte de réception.');
    } catch (err: any) {
      notify('error', err.message || 'Impossible de renvoyer le lien.');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wide">Ouverture de Kamis Docs...</p>
      </div>
    );
  }

  // Public unauthenticated routes
  if (route === 'verify-email') {
    return (
      <>
        <VerifyEmailPage
          initialToken={tokenParam}
          onNavigateLogin={() => navigateTo('home')}
        />
        <DevMailboxDrawer
          isOpen={isDevMailboxOpen}
          onClose={() => setIsDevMailboxOpen(false)}
          onOpenUrl={handleOpenUrlFromDevMailbox}
        />
      </>
    );
  }

  if (route === 'reset-password') {
    return (
      <>
        <ResetPasswordPage
          initialToken={tokenParam}
          onNavigateLogin={() => navigateTo('home')}
        />
        <DevMailboxDrawer
          isOpen={isDevMailboxOpen}
          onClose={() => setIsDevMailboxOpen(false)}
          onOpenUrl={handleOpenUrlFromDevMailbox}
        />
      </>
    );
  }

  if (!isAuthenticated) {
    if (route === 'register') {
      return (
        <>
          <RegisterPage
            onNavigateLogin={() => navigateTo('home')}
            onOpenLegal={() => setIsLegalModalOpen(true)}
          />
          <LegalModal
            isOpen={isLegalModalOpen}
            onClose={() => setIsLegalModalOpen(false)}
          />
          <DevMailboxDrawer
            isOpen={isDevMailboxOpen}
            onClose={() => setIsDevMailboxOpen(false)}
            onOpenUrl={handleOpenUrlFromDevMailbox}
          />
        </>
      );
    }

    if (route === 'forgot-password') {
      return (
        <>
          <ForgotPasswordPage onNavigateLogin={() => navigateTo('home')} />
          <DevMailboxDrawer
            isOpen={isDevMailboxOpen}
            onClose={() => setIsDevMailboxOpen(false)}
            onOpenUrl={handleOpenUrlFromDevMailbox}
          />
        </>
      );
    }

    // Default unauthenticated: Login
    return (
      <>
        <LoginPage
          onNavigateRegister={() => navigateTo('register')}
          onNavigateForgotPassword={() => navigateTo('forgot-password')}
          onResendVerification={handleResendVerification}
        />
        <DevMailboxDrawer
          isOpen={isDevMailboxOpen}
          onClose={() => setIsDevMailboxOpen(false)}
          onOpenUrl={handleOpenUrlFromDevMailbox}
        />
      </>
    );
  }

  // Authenticated Application
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => navigateTo('settings')}
        onOpenLegal={() => setIsLegalModalOpen(true)}
        onOpenDevMailbox={() => setIsDevMailboxOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentCategory={currentCategory}
          onSelectCategory={(cat) => {
            setCurrentCategory(cat);
            if (route !== 'home') navigateTo('home');
          }}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenSettings={() => navigateTo('settings')}
          onOpenLegal={() => setIsLegalModalOpen(true)}
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0">
          {route === 'settings' ? (
            <SettingsPage onBack={() => navigateTo('home')} />
          ) : (
            <DashboardPage
              currentCategory={currentCategory}
              searchQuery={searchQuery}
              isUploadModalOpen={isUploadModalOpen}
              onCloseUploadModal={() => setIsUploadModalOpen(false)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          )}
        </main>
      </div>

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <DevMailboxDrawer
        isOpen={isDevMailboxOpen}
        onClose={() => setIsDevMailboxOpen(false)}
        onOpenUrl={handleOpenUrlFromDevMailbox}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
