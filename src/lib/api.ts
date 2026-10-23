// ========================================
// FinFlow API Abstraction Layer
// ========================================

import type {
  Transaction,
  IncomeEntry,
  Investment,
  EmergencyFundEntry,
  Budget,
  AppConfig,
  GoogleConfig,
} from '../types';

const STORAGE_KEYS = {
  transactions: 'finflow_transactions',
  income: 'finflow_income',
  investments: 'finflow_investments',
  emergencyFund: 'finflow_emergency_fund',
  budgets: 'finflow_budgets',
  config: 'finflow_config',
  googleConfig: 'finflow_google_config',
};

// --- Local Storage Helpers ---
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// --- Google API Helpers ---
async function googleRequest(
  googleConfig: GoogleConfig,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<unknown> {
  if (!googleConfig.configured || !googleConfig.webAppUrl) {
    throw new Error('Google Sheets not configured');
  }

  const body = {
    action,
    secretKey: googleConfig.secretKey,
    spreadsheetId: googleConfig.spreadsheetId,
    ...payload,
  };

  const response = await fetch(googleConfig.webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }
  return result;
}

// --- API Functions ---
export const api = {
  // --- Transactions ---
  getTransactions(): Transaction[] {
    return loadFromStorage<Transaction[]>(STORAGE_KEYS.transactions, []);
  },

  saveTransactions(transactions: Transaction[]): void {
    saveToStorage(STORAGE_KEYS.transactions, transactions);
  },

  async syncTransactions(googleConfig: GoogleConfig, transactions: Transaction[]): Promise<void> {
    if (!googleConfig.configured) return;
    await googleRequest(googleConfig, 'syncTransactions', { data: transactions });
  },

  async fetchTransactionsFromGoogle(googleConfig: GoogleConfig): Promise<Transaction[]> {
    const result = await googleRequest(googleConfig, 'getAll', { tab: 'Transactions' });
    return (result as { data: Transaction[] }).data;
  },

  // --- Income ---
  getIncome(): IncomeEntry[] {
    return loadFromStorage<IncomeEntry[]>(STORAGE_KEYS.income, []);
  },

  saveIncome(income: IncomeEntry[]): void {
    saveToStorage(STORAGE_KEYS.income, income);
  },

  async syncIncome(googleConfig: GoogleConfig, income: IncomeEntry[]): Promise<void> {
    if (!googleConfig.configured) return;
    await googleRequest(googleConfig, 'syncIncome', { data: income });
  },

  // --- Investments ---
  getInvestments(): Investment[] {
    return loadFromStorage<Investment[]>(STORAGE_KEYS.investments, []);
  },

  saveInvestments(investments: Investment[]): void {
    saveToStorage(STORAGE_KEYS.investments, investments);
  },

  async syncInvestments(googleConfig: GoogleConfig, investments: Investment[]): Promise<void> {
    if (!googleConfig.configured) return;
    await googleRequest(googleConfig, 'syncInvestments', { data: investments });
  },

  // --- Emergency Fund ---
  getEmergencyFund(): EmergencyFundEntry[] {
    return loadFromStorage<EmergencyFundEntry[]>(STORAGE_KEYS.emergencyFund, []);
  },

  saveEmergencyFund(entries: EmergencyFundEntry[]): void {
    saveToStorage(STORAGE_KEYS.emergencyFund, entries);
  },

  async syncEmergencyFund(googleConfig: GoogleConfig, entries: EmergencyFundEntry[]): Promise<void> {
    if (!googleConfig.configured) return;
    await googleRequest(googleConfig, 'syncEmergencyFund', { data: entries });
  },

  // --- Budgets ---
  getBudgets(): Budget[] {
    return loadFromStorage<Budget[]>(STORAGE_KEYS.budgets, []);
  },

  saveBudgets(budgets: Budget[]): void {
    saveToStorage(STORAGE_KEYS.budgets, budgets);
  },

  async syncBudgets(googleConfig: GoogleConfig, budgets: Budget[]): Promise<void> {
    if (!googleConfig.configured) return;
    await googleRequest(googleConfig, 'syncBudgets', { data: budgets });
  },

  // --- Config ---
  getConfig(): AppConfig | null {
    return loadFromStorage<AppConfig | null>(STORAGE_KEYS.config, null);
  },

  saveConfig(config: AppConfig): void {
    saveToStorage(STORAGE_KEYS.config, config);
  },

  async syncConfig(googleConfig: GoogleConfig, config: AppConfig): Promise<void> {
    if (!googleConfig.configured) return;
    await googleRequest(googleConfig, 'setConfig', { data: config });
  },

  // --- Google Config ---
  getGoogleConfig(): GoogleConfig | null {
    return loadFromStorage<GoogleConfig | null>(STORAGE_KEYS.googleConfig, null);
  },

  saveGoogleConfig(config: GoogleConfig): void {
    saveToStorage(STORAGE_KEYS.googleConfig, config);
  },

  // --- Test Connection ---
  async testConnection(googleConfig: GoogleConfig): Promise<boolean> {
    try {
      await googleRequest(googleConfig, 'ping');
      return true;
    } catch {
      return false;
    }
  },

  // --- Migrate demo data ---
  async migrateToGoogle(
    googleConfig: GoogleConfig,
    data: {
      transactions: Transaction[];
      income: IncomeEntry[];
      investments: Investment[];
      emergencyFund: EmergencyFundEntry[];
      budgets: Budget[];
      config: AppConfig;
    }
  ): Promise<void> {
    await googleRequest(googleConfig, 'bulkImport', {
      transactions: data.transactions,
      income: data.income,
      investments: data.investments,
      emergencyFund: data.emergencyFund,
      budgets: data.budgets,
      config: data.config,
    });
  },
};
