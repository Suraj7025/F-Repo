// ========================================
// FinFlow Zustand Store
// ========================================

import { create } from 'zustand';
import type { AppState, Transaction, IncomeEntry, Investment, EmergencyFundEntry, Budget, GoogleConfig } from '../types';
import { DEFAULT_CONFIG, DEFAULT_GOOGLE_CONFIG } from './constants';
import { api } from './api';
import { generateId, getCurrentMonth } from './utils';
import { showToast } from '../hooks';
import {
  generateDemoTransactions,
  generateDemoIncome,
  generateDemoInvestments,
  generateDemoEmergencyFund,
  generateDemoBudgets,
} from './demo-data';

// Helper for optimistic mutations with rollback on sync failure
async function syncWithRollback<T>(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  prevData: T,
  rollback: (prev: T) => void,
  syncFn: (cfg: GoogleConfig) => Promise<void>
) {
  const { googleConfig } = get();
  if (!googleConfig.configured) {
    // Running in local/demo mode
    set({ syncStatus: 'offline' });
    return;
  }

  // Local cache fallback when device is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    set({ syncStatus: 'offline' });
    showToast({ message: 'Saved to local cache (device offline)', type: 'info' });
    return;
  }

  set({ syncStatus: 'syncing' });
  try {
    await syncFn(googleConfig);
    set({ syncStatus: 'synced' });
  } catch (err: any) {
    console.error('Google Sheets sync failed, rolling back:', err);
    rollback(prevData);
    set({ syncStatus: 'error' });
    showToast({
      message: `Sync failed: ${err.message || 'Error communicating with Google'}. Changes rolled back.`,
      type: 'error',
    });
  }
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  transactions: [],
  income: [],
  investments: [],
  emergencyFund: [],
  budgets: [],
  config: DEFAULT_CONFIG,
  googleConfig: DEFAULT_GOOGLE_CONFIG,
  syncStatus: 'offline',
  isLoading: true,
  selectedMonth: getCurrentMonth(),
  yearView: false,

  // Load data from storage or generate demo data
  loadData: () => {
    const savedConfig = api.getConfig();
    const savedGoogleConfig = api.getGoogleConfig();
    const config = savedConfig || DEFAULT_CONFIG;
    const googleConfig = savedGoogleConfig || DEFAULT_GOOGLE_CONFIG;

    let transactions = api.getTransactions();
    let income = api.getIncome();
    let investments = api.getInvestments();
    let emergencyFund = api.getEmergencyFund();
    let budgets = api.getBudgets();

    // If no data, generate demo data
    if (transactions.length === 0 && income.length === 0) {
      transactions = generateDemoTransactions();
      income = generateDemoIncome();
      investments = generateDemoInvestments();
      emergencyFund = generateDemoEmergencyFund();
      budgets = generateDemoBudgets();

      // Save demo data
      api.saveTransactions(transactions);
      api.saveIncome(income);
      api.saveInvestments(investments);
      api.saveEmergencyFund(emergencyFund);
      api.saveBudgets(budgets);
      api.saveConfig(config);
    }

    set({
      transactions,
      income,
      investments,
      emergencyFund,
      budgets,
      config,
      googleConfig,
      isLoading: false,
      syncStatus: googleConfig.configured ? (navigator.onLine ? 'synced' : 'offline') : 'offline',
    });
  },

  // --- Transaction Actions (Optimistic with Rollback) ---
  addTransaction: (t: Omit<Transaction, 'id'>) => {
    const prev = get().transactions;
    const transaction = { ...t, id: generateId() };
    const next = [transaction, ...prev];
    api.saveTransactions(next);
    set({ transactions: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveTransactions(p);
        set({ transactions: p });
      },
      (cfg) => api.syncTransactions(cfg, next)
    );
  },

  updateTransaction: (id: string, updates: Partial<Transaction>) => {
    const prev = get().transactions;
    const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
    api.saveTransactions(next);
    set({ transactions: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveTransactions(p);
        set({ transactions: p });
      },
      (cfg) => api.syncTransactions(cfg, next)
    );
  },

  deleteTransaction: (id: string) => {
    const prev = get().transactions;
    const next = prev.filter((t) => t.id !== id);
    api.saveTransactions(next);
    set({ transactions: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveTransactions(p);
        set({ transactions: p });
      },
      (cfg) => api.syncTransactions(cfg, next)
    );
  },

  importTransactions: (newTxns: Omit<Transaction, 'id'>[]) => {
    const prev = get().transactions;
    const withIds = newTxns.map((t) => ({ ...t, id: generateId() }));
    const next = [...withIds, ...prev];
    api.saveTransactions(next);
    set({ transactions: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveTransactions(p);
        set({ transactions: p });
      },
      (cfg) => api.syncTransactions(cfg, next)
    );
  },

  // --- Income Actions (Optimistic with Rollback) ---
  addIncome: (i: Omit<IncomeEntry, 'id'>) => {
    const prev = get().income;
    const entry = { ...i, id: generateId() };
    const next = [entry, ...prev];
    api.saveIncome(next);
    set({ income: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveIncome(p);
        set({ income: p });
      },
      (cfg) => api.syncIncome(cfg, next)
    );
  },

  updateIncome: (id: string, updates: Partial<IncomeEntry>) => {
    const prev = get().income;
    const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
    api.saveIncome(next);
    set({ income: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveIncome(p);
        set({ income: p });
      },
      (cfg) => api.syncIncome(cfg, next)
    );
  },

  deleteIncome: (id: string) => {
    const prev = get().income;
    const next = prev.filter((i) => i.id !== id);
    api.saveIncome(next);
    set({ income: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveIncome(p);
        set({ income: p });
      },
      (cfg) => api.syncIncome(cfg, next)
    );
  },

  // --- Investment Actions (Optimistic with Rollback) ---
  addInvestment: (i: Omit<Investment, 'id'>) => {
    const prev = get().investments;
    const investment = { ...i, id: generateId() };
    const next = [investment, ...prev];
    api.saveInvestments(next);
    set({ investments: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveInvestments(p);
        set({ investments: p });
      },
      (cfg) => api.syncInvestments(cfg, next)
    );
  },

  updateInvestment: (id: string, updates: Partial<Investment>) => {
    const prev = get().investments;
    const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
    api.saveInvestments(next);
    set({ investments: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveInvestments(p);
        set({ investments: p });
      },
      (cfg) => api.syncInvestments(cfg, next)
    );
  },

  deleteInvestment: (id: string) => {
    const prev = get().investments;
    const next = prev.filter((i) => i.id !== id);
    api.saveInvestments(next);
    set({ investments: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveInvestments(p);
        set({ investments: p });
      },
      (cfg) => api.syncInvestments(cfg, next)
    );
  },

  // --- Emergency Fund Actions (Optimistic with Rollback) ---
  addEmergencyFundEntry: (e: Omit<EmergencyFundEntry, 'id'>) => {
    const prev = get().emergencyFund;
    const entry = { ...e, id: generateId() };
    const next = [entry, ...prev];
    api.saveEmergencyFund(next);
    set({ emergencyFund: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveEmergencyFund(p);
        set({ emergencyFund: p });
      },
      (cfg) => api.syncEmergencyFund(cfg, next)
    );
  },

  deleteEmergencyFundEntry: (id: string) => {
    const prev = get().emergencyFund;
    const next = prev.filter((e) => e.id !== id);
    api.saveEmergencyFund(next);
    set({ emergencyFund: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveEmergencyFund(p);
        set({ emergencyFund: p });
      },
      (cfg) => api.syncEmergencyFund(cfg, next)
    );
  },

  // --- Budget Actions (Optimistic with Rollback) ---
  addBudget: (b: Omit<Budget, 'id'>) => {
    const prev = get().budgets;
    const budget = { ...b, id: generateId() };
    const next = [budget, ...prev];
    api.saveBudgets(next);
    set({ budgets: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveBudgets(p);
        set({ budgets: p });
      },
      (cfg) => api.syncBudgets(cfg, next)
    );
  },

  updateBudget: (id: string, updates: Partial<Budget>) => {
    const prev = get().budgets;
    const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
    api.saveBudgets(next);
    set({ budgets: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveBudgets(p);
        set({ budgets: p });
      },
      (cfg) => api.syncBudgets(cfg, next)
    );
  },

  deleteBudget: (id: string) => {
    const prev = get().budgets;
    const next = prev.filter((b) => b.id !== id);
    api.saveBudgets(next);
    set({ budgets: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveBudgets(p);
        set({ budgets: p });
      },
      (cfg) => api.syncBudgets(cfg, next)
    );
  },

  // --- Config Actions (Optimistic with Rollback) ---
  updateConfig: (updates) => {
    const prev = get().config;
    const next = { ...prev, ...updates };
    api.saveConfig(next);
    set({ config: next });

    syncWithRollback(
      get,
      set,
      prev,
      (p) => {
        api.saveConfig(p);
        set({ config: p });
      },
      (cfg) => api.syncConfig(cfg, next)
    );
  },

  updateGoogleConfig: (updates) => {
    const googleConfig = { ...get().googleConfig, ...updates };
    api.saveGoogleConfig(googleConfig);
    set({
      googleConfig,
      syncStatus: googleConfig.configured ? (navigator.onLine ? 'synced' : 'offline') : 'offline',
    });
  },

  // --- UI Actions ---
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setYearView: (yearView) => set({ yearView }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  // --- Full Sync ---
  syncToGoogle: async () => {
    const state = get();
    if (!state.googleConfig.configured) {
      set({ syncStatus: 'offline' });
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      set({ syncStatus: 'offline' });
      showToast({ message: 'Device is offline. Local cache is active.', type: 'info' });
      return;
    }

    set({ syncStatus: 'syncing' });
    try {
      await Promise.all([
        api.syncTransactions(state.googleConfig, state.transactions),
        api.syncIncome(state.googleConfig, state.income),
        api.syncInvestments(state.googleConfig, state.investments),
        api.syncEmergencyFund(state.googleConfig, state.emergencyFund),
        api.syncBudgets(state.googleConfig, state.budgets),
        api.syncConfig(state.googleConfig, state.config),
      ]);
      set({ syncStatus: 'synced' });
      showToast({ message: 'Synced with Google Sheets', type: 'success' });
    } catch (error: any) {
      console.error('Sync failed:', error);
      set({ syncStatus: 'error' });
      showToast({ message: `Sync failed: ${error.message || 'Check Google connection'}`, type: 'error' });
    }
  },

  // --- Migrate Local Data to Google ---
  migrateToGoogle: async () => {
    const state = get();
    if (!state.googleConfig.configured) {
      throw new Error('Google integration not configured');
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Device is offline. Please check your internet connection.');
    }

    set({ syncStatus: 'syncing' });
    try {
      await api.migrateToGoogle(state.googleConfig, {
        transactions: state.transactions,
        income: state.income,
        investments: state.investments,
        emergencyFund: state.emergencyFund,
        budgets: state.budgets,
        config: state.config,
      });
      set({ syncStatus: 'synced' });
    } catch (error) {
      console.error('Migration failed:', error);
      set({ syncStatus: 'error' });
      throw error;
    }
  },

  // --- Pull Latest Data from Google Sheet ---
  pullFromGoogle: async () => {
    const state = get();
    if (!state.googleConfig.configured) {
      throw new Error('Google integration not configured');
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Device is offline. Please check your internet connection.');
    }

    set({ syncStatus: 'syncing' });
    try {
      const data = await api.fetchAllFromGoogle(state.googleConfig);
      if (data.transactions) {
        set({ transactions: data.transactions });
        api.saveTransactions(data.transactions);
      }
      if (data.income) {
        set({ income: data.income });
        api.saveIncome(data.income);
      }
      if (data.investments) {
        set({ investments: data.investments });
        api.saveInvestments(data.investments);
      }
      if (data.emergencyFund) {
        set({ emergencyFund: data.emergencyFund });
        api.saveEmergencyFund(data.emergencyFund);
      }
      if (data.budgets) {
        set({ budgets: data.budgets });
        api.saveBudgets(data.budgets);
      }
      if (data.config && Object.keys(data.config).length > 0) {
        const merged = { ...state.config, ...data.config };
        set({ config: merged });
        api.saveConfig(merged);
      }
      set({ syncStatus: 'synced' });
      showToast({ message: 'Latest data pulled from Google Sheet!', type: 'success' });
    } catch (err: any) {
      set({ syncStatus: 'error' });
      showToast({ message: `Pull failed: ${err.message}`, type: 'error' });
      throw err;
    }
  },

  // --- Switch Spreadsheet ID & Load ---
  switchSpreadsheetId: async (spreadsheetIdOrUrl: string) => {
    const match = spreadsheetIdOrUrl.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = match && match[1] ? match[1] : spreadsheetIdOrUrl.trim();
    if (!cleanId) {
      throw new Error('Invalid Google Sheet ID or URL');
    }

    const current = get().googleConfig;
    const updated = { ...current, spreadsheetId: cleanId, configured: true };
    api.saveGoogleConfig(updated);
    set({ googleConfig: updated, syncStatus: 'syncing' });

    try {
      const data = await api.fetchAllFromGoogle(updated);
      set({
        transactions: data.transactions || [],
        income: data.income || [],
        investments: data.investments || [],
        emergencyFund: data.emergencyFund || [],
        budgets: data.budgets || [],
        config: data.config && Object.keys(data.config).length > 0 ? { ...get().config, ...data.config } : get().config,
        syncStatus: 'synced',
      });
      if (data.transactions) api.saveTransactions(data.transactions);
      if (data.income) api.saveIncome(data.income);
      if (data.investments) api.saveInvestments(data.investments);
      if (data.emergencyFund) api.saveEmergencyFund(data.emergencyFund);
      if (data.budgets) api.saveBudgets(data.budgets);
      showToast({ message: `Switched to Sheet (${cleanId.slice(0, 8)}...) & loaded data!`, type: 'success' });
    } catch (err: any) {
      set({ syncStatus: 'error' });
      showToast({ message: `Switched ID, but failed to load remote data: ${err.message}`, type: 'warning' });
      throw err;
    }
  },

  // --- Start New Year Sheet ---
  startNewYearSheet: async (year?: number) => {
    const state = get();
    if (!state.googleConfig.configured) {
      throw new Error('Google integration not configured');
    }
    const targetYear = year || new Date().getFullYear() + 1;
    set({ syncStatus: 'syncing' });
    const res = await api.createYearSpreadsheet(state.googleConfig, targetYear);
    if (!res.spreadsheetId) {
      set({ syncStatus: 'error' });
      throw new Error('Failed to create new spreadsheet');
    }

    const updatedConfig = { ...state.googleConfig, spreadsheetId: res.spreadsheetId };
    api.saveGoogleConfig(updatedConfig);
    set({ googleConfig: updatedConfig });

    // Sync categories and settings to new sheet
    await api.syncConfig(updatedConfig, state.config);
    set({ syncStatus: 'synced' });
    showToast({ message: `Created "${res.name}" sheet and linked as active!`, type: 'success' });
    return res.spreadsheetId;
  },
}));

// Automatic online / offline network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const { googleConfig, syncStatus } = useStore.getState();
    if (googleConfig.configured && (syncStatus === 'offline' || syncStatus === 'error')) {
      useStore.getState().syncToGoogle();
    }
  });

  window.addEventListener('offline', () => {
    useStore.getState().setSyncStatus('offline');
  });
}
