import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/Navbar.js';
import { AnnouncementBanner } from './components/AnnouncementBanner.js';
import { Global3DBackground } from './components/Global3DBackground.js';
import { LandingPage } from './pages/LandingPage.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { TeamLoginPage } from './pages/TeamLoginPage.js';
import { TeamDiscoveryPage } from './pages/TeamDiscoveryPage.js';

function pathToView(path: string): string {
  if (path.startsWith('/admin/dashboard')) return 'admin-dashboard';
  if (path.startsWith('/admin/login')) return 'admin-login';
  if (path.startsWith('/admin')) return 'admin-dashboard';
  if (path.startsWith('/team/discover')) return 'team-discover';
  if (path.startsWith('/team/login')) return 'team-login';
  if (path.startsWith('/team')) return 'team-discover';
  return 'landing';
}

function viewToPath(view: string): string {
  switch (view) {
    case 'admin-dashboard': return '/admin/dashboard';
    case 'admin-login': return '/admin/login';
    case 'team-discover': return '/team/discover';
    case 'team-login': return '/team/login';
    default: return '/';
  }
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => pathToView(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(pathToView(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (view: string) => {
    setCurrentView(view);
    const path = viewToPath(view);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection
  useEffect(() => {
    if (loading) return;

    if (currentView === 'admin-dashboard' && user?.role !== 'admin') {
      navigate('admin-login');
    }

    if (currentView === 'team-discover' && user?.role !== 'team') {
      navigate('team-login');
    }
  }, [currentView, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03050a] flex flex-col items-center justify-center p-4 relative z-50">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-300">
          INITIALIZING DIGITAL UNIVERSE...
        </span>
        <span className="text-[11px] font-mono text-slate-500 mt-1">
          SYNCHRONIZING GLOBAL 3D ENVIRONMENT
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200 relative">
      {/* ONE SINGLE COMMON GLOBAL 3D BACKGROUND MOUNTED ONCE */}
      <Global3DBackground />

      <Navbar currentView={currentView} onNavigate={navigate} />

      <main className="flex-1 relative z-10">
        {currentView === 'landing' && <LandingPage onNavigate={navigate} />}
        {currentView === 'admin-login' && <AdminLoginPage onNavigate={navigate} />}
        {currentView === 'admin-dashboard' && <AdminDashboardPage onNavigate={navigate} />}
        {currentView === 'team-login' && <TeamLoginPage onNavigate={navigate} />}
        {currentView === 'team-discover' && <TeamDiscoveryPage onNavigate={navigate} />}
      </main>

      <AnnouncementBanner />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
