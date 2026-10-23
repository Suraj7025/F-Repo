// ========================================
// Sidebar Navigation
// ========================================

import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  PiggyBank,
  Settings,
  ChevronLeft,
  Menu,
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useIsMobile } from '../../hooks';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/income', icon: Wallet, label: 'Income' },
  { path: '/investments', icon: TrendingUp, label: 'I&S' },
  { path: '/budget', icon: PiggyBank, label: 'Budget' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function SyncBadge() {
  const syncStatus = useStore((s) => s.syncStatus);
  const isGoogle = useStore((s) => s.googleConfig.configured);
  const syncToGoogle = useStore((s) => s.syncToGoogle);

  const statusConfig = {
    synced: { icon: Cloud, label: 'Synced', className: 'sync-synced', tooltip: 'All changes synced. Click to re-sync.' },
    syncing: { icon: Loader2, label: 'Syncing...', className: 'sync-syncing', tooltip: 'Syncing changes to Google Sheets...' },
    offline: { icon: CloudOff, label: isGoogle ? 'Offline (Cached)' : 'Demo Mode', className: 'sync-offline', tooltip: isGoogle ? 'Device offline. Changes stored in local cache.' : 'Running in local demo mode. Connect Google in Settings.' },
    error: { icon: AlertCircle, label: 'Sync Error', className: 'sync-error', tooltip: 'Sync failed. Click to retry sync.' },
  };

  const config = statusConfig[syncStatus];
  const Icon = config.icon;

  return (
    <button
      type="button"
      className={`sync-indicator ${config.className} cursor-pointer hover:opacity-90 transition-all text-left w-full border-none outline-none`}
      title={config.tooltip}
      onClick={() => {
        if (isGoogle && syncStatus !== 'syncing') {
          syncToGoogle();
        }
      }}
    >
      <Icon size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
      <span>{config.label}</span>
    </button>
  );
}

export function Sidebar() {
  const isMobile = useIsMobile();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed);
  const location = useLocation();

  // Mobile: bottom tab bar
  if (isMobile) {
    return <MobileTabBar />;
  }

  return (
    <motion.aside
      className="glass !fixed left-4 top-4 bottom-4 z-50 flex flex-col overflow-hidden"
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: '16px',
        bottom: '16px',
        left: '16px',
        zIndex: 50,
        borderRadius: 'var(--glass-radius-lg)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                FinFlow
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          className="btn-icon"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
              style={{
                color: isActive ? 'white' : 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-violet))',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon size={20} className="relative z-10 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 font-medium text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Sync Status */}
      <div className="px-4 pb-4">
        {!collapsed && <SyncBadge />}
      </div>
    </motion.aside>
  );
}

function MobileTabBar() {
  const location = useLocation();

  const mobileItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Txns' },
    { path: '/income', icon: Wallet, label: 'Income' },
    { path: '/investments', icon: TrendingUp, label: 'I&S' },
    { path: '/budget', icon: PiggyBank, label: 'Budget' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div
      className="glass !fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 safe-area-pb"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderRadius: '20px 20px 0 0',
      }}
    >
      {mobileItems.map((item) => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all"
            style={{
              color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)',
              textDecoration: 'none',
              minWidth: '56px',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="mobile-nav-active"
                className="absolute -top-0.5 w-8 h-1 rounded-full"
                style={{ background: 'var(--color-primary)' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
