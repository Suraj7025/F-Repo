// ========================================
// FinFlow Main Application
// ========================================

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './lib/store';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/shared';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Income from './pages/Income';
import InvestmentsSavings from './pages/InvestmentsSavings';
import BudgetPage from './pages/Budget';
import SettingsPage from './pages/Settings';
import Docs from './pages/Docs';
import { useIsMobile } from './hooks';

export default function App() {
  const theme = useStore((s) => s.config.theme);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const isMobile = useIsMobile();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <BrowserRouter>
      {/* Background Animated Liquid Glass Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[12%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[130px] opacity-40 dark:opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, #c084fc 100%)', animationDuration: '9s' }}
        />
        <div
          className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-35 dark:opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 100%)', animationDuration: '11s', animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-[12%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-30 dark:opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, #f472b6 0%, #c084fc 100%)', animationDuration: '13s', animationDelay: '4s' }}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Sidebar / Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className={`min-h-screen transition-all duration-300 ease-in-out ${
            isMobile
              ? 'px-4 pt-4 pb-28'
              : sidebarCollapsed
              ? 'pl-[104px] pr-6 pt-6 pb-16'
              : 'pl-[296px] pr-6 pt-6 pb-16'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/income" element={<Income />} />
              <Route path="/investments" element={<InvestmentsSavings />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Toast Container for Undo & Notifications */}
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
