// ========================================
// FinFlow Type Definitions
// ========================================

// --- Sync Status ---
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

// --- Transaction Types ---
export type TransactionType = 'Spend' | 'Credit';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  category: string;
  notes: string;
  source: string;
}

// --- Income Types ---
export interface IncomeEntry {
  id: string;
  month: string; // YYYY-MM
  source: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes: string;
}

// --- Investment Types ---
export type InvestmentType = 'SIP' | 'Lumpsum' | 'Redemption';

export interface Investment {
  id: string;
  date: string;
  fundName: string;
  type: InvestmentType;
  amount: number;
  units?: number;
  currentValue?: number;
  category: string; // Equity, Debt, Hybrid, Index, Other
  notes: string;
}

// --- Emergency Fund Types ---
export type EmergencyFundEntryType = 'Deposit' | 'Withdrawal';

export interface EmergencyFundEntry {
  id: string;
  date: string;
  type: EmergencyFundEntryType;
  amount: number;
  notes: string;
}

// --- Budget Types ---
export interface BudgetAllocation {
  category: string;
  allocated: number;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  expectedIncome: number;
  allocations: BudgetAllocation[];
}

// --- Config Types ---
export interface AppConfig {
  currency: string;
  currencySymbol: string;
  locale: string;
  categories: string[];
  sources: string[];
  incomeSources: string[];
  investmentCategories: string[];
  emergencyFundTarget: number;
  emergencyFundTargetType: 'months' | 'fixed';
  budgetEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  firstDayOfMonth: number;
}

// --- Google Setup ---
export interface GoogleConfig {
  spreadsheetId: string;
  webAppUrl: string;
  secretKey: string;
  configured: boolean;
}

// --- Store Types ---
export interface AppState {
  // Data
  transactions: Transaction[];
  income: IncomeEntry[];
  investments: Investment[];
  emergencyFund: EmergencyFundEntry[];
  budgets: Budget[];
  config: AppConfig;
  googleConfig: GoogleConfig;

  // UI State
  syncStatus: SyncStatus;
  isLoading: boolean;
  selectedMonth: string; // YYYY-MM
  yearView: boolean;

  // Actions - Transactions
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;

  // Actions - Income
  addIncome: (i: Omit<IncomeEntry, 'id'>) => void;
  updateIncome: (id: string, i: Partial<IncomeEntry>) => void;
  deleteIncome: (id: string) => void;

  // Actions - Investments
  addInvestment: (i: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, i: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  // Actions - Emergency Fund
  addEmergencyFundEntry: (e: Omit<EmergencyFundEntry, 'id'>) => void;
  deleteEmergencyFundEntry: (id: string) => void;

  // Actions - Budget
  addBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Actions - Config
  updateConfig: (c: Partial<AppConfig>) => void;
  updateGoogleConfig: (g: Partial<GoogleConfig>) => void;

  // Actions - UI
  setSelectedMonth: (month: string) => void;
  setYearView: (yearView: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;

  // Actions - Data
  loadData: () => void;
  syncToGoogle: () => Promise<void>;
  migrateToGoogle: () => Promise<void>;
}
