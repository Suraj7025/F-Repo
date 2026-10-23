// ========================================
// FinFlow Zustand Store
// ========================================

import { create } from 'zustand';
import type { AppState, Transaction, IncomeEntry, Investment, EmergencyFundEntry, Budget } from '../types';
import { DEFAULT_CONFIG, DEFAULT_GOOGLE_CONFIG } from './constants';
import { api } from './api';
import { generateId, getCurrentMonth } from './utils';
import {
  generateDemoTransactions,
  generateDemoIncome,
  generateDemoInvestments,
  generateDemoEmergencyFund,
  generateDemoBudgets,
} from './demo-data';

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
      syncStatus: googleConfig.configured ? 'synced' : 'offline',
    });
  },

  // --- Transaction Actions ---
  addTransaction: (t: Omit<Transaction, 'id'>) => {
    const transaction = { ...t, id: generateId() };
    const transactions = [transaction, ...get().transactions];
    api.saveTransactions(transactions);
    set({ transactions });
    get().syncToGoogle();
  },

  updateTransaction: (id: string, updates: Partial<Transaction>) => {
    const transactions = get().transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    api.saveTransactions(transactions);
    set({ transactions });
    get().syncToGoogle();
  },

  deleteTransaction: (id: string) => {
    const transactions = get().transactions.filter((t) => t.id !== id);
    api.saveTransactions(transactions);
    set({ transactions });
    get().syncToGoogle();
  },

  importTransactions: (newTxns: Omit<Transaction, 'id'>[]) => {
    const withIds = newTxns.map((t) => ({ ...t, id: generateId() }));
    const transactions = [...withIds, ...get().transactions];
    api.saveTransactions(transactions);
    set({ transactions });
    get().syncToGoogle();
  },

  // --- Income Actions ---
  addIncome: (i: Omit<IncomeEntry, 'id'>) => {
    const entry = { ...i, id: generateId() };
    const income = [entry, ...get().income];
    api.saveIncome(income);
    set({ income });
    get().syncToGoogle();
  },

  updateIncome: (id: string, updates: Partial<IncomeEntry>) => {
    const income = get().income.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    api.saveIncome(income);
    set({ income });
    get().syncToGoogle();
  },

  deleteIncome: (id: string) => {
    const income = get().income.filter((i) => i.id !== id);
    api.saveIncome(income);
    set({ income });
    get().syncToGoogle();
  },

  // --- Investment Actions ---
  addInvestment: (i: Omit<Investment, 'id'>) => {
    const investment = { ...i, id: generateId() };
    const investments = [investment, ...get().investments];
    api.saveInvestments(investments);
    set({ investments });
    get().syncToGoogle();
  },

  updateInvestment: (id: string, updates: Partial<Investment>) => {
    const investments = get().investments.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    api.saveInvestments(investments);
    set({ investments });
    get().syncToGoogle();
  },

  deleteInvestment: (id: string) => {
    const investments = get().investments.filter((i) => i.id !== id);
    api.saveInvestments(investments);
    set({ investments });
    get().syncToGoogle();
  },

  // --- Emergency Fund Actions ---
  addEmergencyFundEntry: (e: Omit<EmergencyFundEntry, 'id'>) => {
    const entry = { ...e, id: generateId() };
    const emergencyFund = [entry, ...get().emergencyFund];
    api.saveEmergencyFund(emergencyFund);
    set({ emergencyFund });
    get().syncToGoogle();
  },

  deleteEmergencyFundEntry: (id: string) => {
    const emergencyFund = get().emergencyFund.filter((e) => e.id !== id);
    api.saveEmergencyFund(emergencyFund);
    set({ emergencyFund });
    get().syncToGoogle();
  },

  // --- Budget Actions ---
  addBudget: (b: Omit<Budget, 'id'>) => {
    const budget = { ...b, id: generateId() };
    const budgets = [budget, ...get().budgets];
    api.saveBudgets(budgets);
    set({ budgets });
    get().syncToGoogle();
  },

  updateBudget: (id: string, updates: Partial<Budget>) => {
    const budgets = get().budgets.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    api.saveBudgets(budgets);
    set({ budgets });
    get().syncToGoogle();
  },

  deleteBudget: (id: string) => {
    const budgets = get().budgets.filter((b) => b.id !== id);
    api.saveBudgets(budgets);
    set({ budgets });
    get().syncToGoogle();
  },

  // --- Config Actions ---
  updateConfig: (updates) => {
    const config = { ...get().config, ...updates };
    api.saveConfig(config);
    set({ config });
    get().syncToGoogle();
  },

  updateGoogleConfig: (updates) => {
    const googleConfig = { ...get().googleConfig, ...updates };
    api.saveGoogleConfig(googleConfig);
    set({ googleConfig });
  },

  // --- UI Actions ---
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setYearView: (yearView) => set({ yearView }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  // --- Sync ---
  syncToGoogle: async () => {
    const state = get();
    if (!state.googleConfig.configured) return;

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
    } catch (error) {
      console.error('Sync failed:', error);
      set({ syncStatus: 'error' });
    }
  },

  migrateToGoogle: async () => {
    const state = get();
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
}));
