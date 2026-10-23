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
  payload: Record<string, unknown> = {},
  timeoutMs: number = 20000
): Promise<unknown> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. Local cache is being used.');
  }

  if (!googleConfig.configured || !googleConfig.webAppUrl) {
    throw new Error('Google Sheets not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    action,
    secretKey: googleConfig.secretKey,
    spreadsheetId: googleConfig.spreadsheetId,
    ...payload,
  };

  try {
    const response = await fetch(googleConfig.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Google Apps Script error (HTTP ${response.status}): ${response.statusText}`);
    }

    const result = await response.json();
    if (result && result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out connecting to Google Apps Script. Please check your network or URL.');
    }
    throw err;
  }
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

  // --- Create Year Spreadsheet ---
  async createYearSpreadsheet(
    googleConfig: GoogleConfig,
    year: number
  ): Promise<{ spreadsheetId: string; name: string }> {
    const result = (await googleRequest(googleConfig, 'createYearSpreadsheet', { year })) as {
      success: boolean;
      spreadsheetId: string;
      name: string;
    };
    return result;
  },

  // --- Fetch All Data from Google Sheet ---
  async fetchAllFromGoogle(googleConfig: GoogleConfig): Promise<{
    transactions?: Transaction[];
    income?: IncomeEntry[];
    investments?: Investment[];
    emergencyFund?: EmergencyFundEntry[];
    budgets?: Budget[];
    config?: Partial<AppConfig>;
  }> {
    const [txRes, incRes, invRes, efRes, budRes, cfgRes] = await Promise.all([
      googleRequest(googleConfig, 'getAll', { tab: 'Transactions' }).catch(() => ({ data: [] })) as Promise<{ data: Transaction[] }>,
      googleRequest(googleConfig, 'getAll', { tab: 'Income' }).catch(() => ({ data: [] })) as Promise<{ data: IncomeEntry[] }>,
      googleRequest(googleConfig, 'getAll', { tab: 'Investments' }).catch(() => ({ data: [] })) as Promise<{ data: Investment[] }>,
      googleRequest(googleConfig, 'getAll', { tab: 'EmergencyFund' }).catch(() => ({ data: [] })) as Promise<{ data: EmergencyFundEntry[] }>,
      googleRequest(googleConfig, 'getAll', { tab: 'Budgets' }).catch(() => ({ data: [] })) as Promise<{ data: Budget[] }>,
      googleRequest(googleConfig, 'getConfig').catch(() => ({ data: {} })) as Promise<{ data: Partial<AppConfig> }>,
    ]);

    return {
      transactions: Array.isArray(txRes?.data) ? txRes.data : [],
      income: Array.isArray(incRes?.data) ? incRes.data : [],
      investments: Array.isArray(invRes?.data) ? invRes.data : [],
      emergencyFund: Array.isArray(efRes?.data) ? efRes.data : [],
      budgets: Array.isArray(budRes?.data) ? budRes.data : [],
      config: cfgRes?.data || {},
    };
  },
};
