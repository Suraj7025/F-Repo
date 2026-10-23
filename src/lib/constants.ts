// ========================================
// FinFlow Default Configuration
// ========================================

import type { AppConfig, GoogleConfig } from '../types';

export const DEFAULT_CONFIG: AppConfig = {
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
  categories: [
    'Food & Dining',
    'Groceries',
    'Transport',
    'Shopping',
    'Entertainment',
    'Health & Fitness',
    'Bills & Utilities',
    'Rent',
    'Education',
    'Travel',
    'Personal Care',
    'Gifts & Donations',
    'Insurance',
    'EMI',
    'Subscriptions',
    'Other',
  ],
  sources: [
    'UPI',
    'Credit Card',
    'Bank Transfer',
    'Card Payment',
    'Cash',
    'Wallet',
  ],
  incomeSources: ['Salary', 'Freelance', 'Dividends', 'Interest', 'Other'],
  investmentCategories: ['Equity', 'Debt', 'Hybrid', 'Index', 'Gold', 'Other'],
  emergencyFundTarget: 6,
  emergencyFundTargetType: 'months',
  budgetEnabled: true,
  theme: 'light',
  firstDayOfMonth: 1,
};

export const DEFAULT_GOOGLE_CONFIG: GoogleConfig = {
  spreadsheetId: '',
  webAppUrl: '',
  secretKey: '',
  configured: false,
};
