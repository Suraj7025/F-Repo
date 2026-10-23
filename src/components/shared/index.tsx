// ========================================
// Shared UI Components
// ========================================

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useToasts, dismissToast, useIsMobile } from '../../hooks';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useClickOutside } from '../../hooks';

// --- Glass Card ---
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function GlassCard({ children, className = '', hover = false, onClick, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      className={`glass ${hover ? 'glass-hover cursor-pointer' : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// --- Page Header ---
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
    </motion.div>
  );
}

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function Modal({ isOpen, onClose, title, children, width = '500px' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  useClickOutside(ref, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={ref}
            className="glass modal-content p-6 overflow-y-auto"
            style={{ width: isMobile ? '100%' : width, maxWidth: '95vw', maxHeight: isMobile ? '90vh' : '80vh' }}
            initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h2>
              <button className="btn-icon" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Toast Container ---
export function ToastContainer() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-[360px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="glass-sm p-3 flex items-center gap-3 text-sm"
            style={{
              borderLeft: `3px solid ${
                toast.type === 'success'
                  ? 'var(--color-emerald)'
                  : toast.type === 'error'
                  ? 'var(--color-rose)'
                  : toast.type === 'warning'
                  ? 'var(--color-amber)'
                  : 'var(--color-primary)'
              }`,
            }}
          >
            <span className="flex-1" style={{ color: 'var(--text-primary)' }}>
              {toast.message}
            </span>
            {toast.action && (
              <button
                className="font-semibold text-xs px-2 py-1 rounded-lg"
                style={{ color: 'var(--color-primary)', background: 'var(--surface-2)' }}
                onClick={() => {
                  toast.action!.onClick();
                  dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button className="btn-icon" onClick={() => dismissToast(toast.id)}>
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Skeleton Loader ---
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// --- Empty State ---
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="empty-state py-12"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {icon}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      <p className="text-sm max-w-[300px]" style={{ color: 'var(--text-tertiary)' }}>
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

// --- Stat Card ---
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
  delay?: number;
  children?: ReactNode;
}

export function StatCard({ label, value, icon, trend, trendLabel, color, delay = 0, children }: StatCardProps) {
  return (
    <GlassCard className="p-5" delay={delay}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: color ? `${color}15` : 'var(--surface-2)' }}
          >
            <span style={{ color: color || 'var(--text-secondary)' }}>{icon}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className="text-xs font-semibold"
            style={{ color: trend >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {trendLabel}
            </span>
          )}
        </div>
      )}
      {children}
    </GlassCard>
  );
}

// --- Form Field ---
interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
}

export function FormField({ label, children, error }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-rose)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
