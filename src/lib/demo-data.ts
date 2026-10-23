// ========================================
// FinFlow Demo Data
// ========================================

import { format, subDays, subMonths } from 'date-fns';
import type { Transaction, IncomeEntry, Investment, EmergencyFundEntry, Budget } from '../types';
import { generateId } from './utils';

const today = new Date();
const currentMonth = format(today, 'yyyy-MM');
const lastMonth = format(subMonths(today, 1), 'yyyy-MM');
const twoMonthsAgo = format(subMonths(today, 2), 'yyyy-MM');
const threeMonthsAgo = format(subMonths(today, 3), 'yyyy-MM');

function randomDate(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const day = Math.floor(Math.random() * 28) + 1;
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function makeTransactions(month: string, count: number): Transaction[] {
  const categories = [
    'Food & Dining', 'Groceries', 'Transport', 'Shopping',
    'Entertainment', 'Health & Fitness', 'Bills & Utilities', 'Rent',
    'Subscriptions', 'Personal Care', 'Education',
  ];
  const sources = ['UPI', 'Credit Card', 'Bank Transfer', 'Card Payment', 'Cash'];
  const foodNotes = ['Zomato order', 'Swiggy dinner', 'Starbucks coffee', 'Restaurant with friends', 'Office lunch'];
  const groceryNotes = ['BigBasket weekly', 'Zepto order', 'DMart shopping', 'Fruits & veggies'];
  const transportNotes = ['Uber ride', 'Ola auto', 'Metro recharge', 'Rapido bike', 'Fuel'];
  const shoppingNotes = ['Amazon order', 'Flipkart deal', 'Myntra haul', 'Local market'];
  const billNotes = ['Electricity bill', 'WiFi recharge', 'Mobile recharge', 'Water bill', 'Gas cylinder'];
  const subNotes = ['Netflix', 'Spotify Premium', 'YouTube Premium', 'iCloud storage'];

  const txns: Transaction[] = [];

  // Always add rent
  txns.push({
    id: generateId(),
    date: randomDate(month),
    type: 'Spend',
    amount: 18000,
    category: 'Rent',
    notes: 'Monthly rent payment',
    source: 'Bank Transfer',
  });

  for (let i = 0; i < count; i++) {
    const catIndex = Math.floor(Math.random() * (categories.length - 1)); // exclude Rent
    const cat = categories[catIndex];
    let amount: number;
    let notes: string;

    switch (cat) {
      case 'Food & Dining':
        amount = Math.floor(Math.random() * 1200) + 150;
        notes = foodNotes[Math.floor(Math.random() * foodNotes.length)];
        break;
      case 'Groceries':
        amount = Math.floor(Math.random() * 2000) + 500;
        notes = groceryNotes[Math.floor(Math.random() * groceryNotes.length)];
        break;
      case 'Transport':
        amount = Math.floor(Math.random() * 600) + 50;
        notes = transportNotes[Math.floor(Math.random() * transportNotes.length)];
        break;
      case 'Shopping':
        amount = Math.floor(Math.random() * 3000) + 500;
        notes = shoppingNotes[Math.floor(Math.random() * shoppingNotes.length)];
        break;
      case 'Entertainment':
        amount = Math.floor(Math.random() * 1500) + 200;
        notes = 'Movie tickets / Gaming';
        break;
      case 'Health & Fitness':
        amount = Math.floor(Math.random() * 2000) + 300;
        notes = 'Gym membership / Medicine';
        break;
      case 'Bills & Utilities':
        amount = Math.floor(Math.random() * 2000) + 300;
        notes = billNotes[Math.floor(Math.random() * billNotes.length)];
        break;
      case 'Subscriptions':
        amount = Math.floor(Math.random() * 500) + 99;
        notes = subNotes[Math.floor(Math.random() * subNotes.length)];
        break;
      case 'Personal Care':
        amount = Math.floor(Math.random() * 1000) + 200;
        notes = 'Salon / Skincare';
        break;
      case 'Education':
        amount = Math.floor(Math.random() * 3000) + 500;
        notes = 'Online course / Books';
        break;
      default:
        amount = Math.floor(Math.random() * 1000) + 100;
        notes = 'Miscellaneous';
    }

    txns.push({
      id: generateId(),
      date: randomDate(month),
      type: 'Spend',
      amount,
      category: cat,
      notes,
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }

  return txns;
}

export function generateDemoTransactions(): Transaction[] {
  return [
    ...makeTransactions(threeMonthsAgo, 25),
    ...makeTransactions(twoMonthsAgo, 28),
    ...makeTransactions(lastMonth, 30),
    ...makeTransactions(currentMonth, Math.floor(today.getDate() * 1.2)),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export function generateDemoIncome(): IncomeEntry[] {
  const months = [threeMonthsAgo, twoMonthsAgo, lastMonth, currentMonth];
  const entries: IncomeEntry[] = [];

  months.forEach((month) => {
    entries.push({
      id: generateId(),
      month,
      source: 'Salary',
      amount: 85000 + Math.floor(Math.random() * 5000),
      date: `${month}-01`,
      notes: 'Monthly salary credited',
    });
    entries.push({
      id: generateId(),
      month,
      source: 'Freelance',
      amount: 12000 + Math.floor(Math.random() * 8000),
      date: `${month}-15`,
      notes: 'Freelance project payment',
    });
    if (Math.random() > 0.5) {
      entries.push({
        id: generateId(),
        month,
        source: 'Dividends',
        amount: 2000 + Math.floor(Math.random() * 3000),
        date: `${month}-20`,
        notes: 'Dividend income',
      });
    }
  });

  return entries;
}

export function generateDemoInvestments(): Investment[] {
  const months = [threeMonthsAgo, twoMonthsAgo, lastMonth, currentMonth];
  const investments: Investment[] = [];

  const funds = [
    { name: 'Nifty 50 Index Fund', category: 'Index', sipAmount: 5000 },
    { name: 'Parag Parikh Flexi Cap', category: 'Equity', sipAmount: 5000 },
    { name: 'HDFC Short Term Debt Fund', category: 'Debt', sipAmount: 3000 },
  ];

  months.forEach((month) => {
    funds.forEach((fund) => {
      investments.push({
        id: generateId(),
        date: `${month}-05`,
        fundName: fund.name,
        type: 'SIP',
        amount: fund.sipAmount,
        units: Math.round((fund.sipAmount / (50 + Math.random() * 200)) * 100) / 100,
        category: fund.category,
        notes: 'Monthly SIP',
      });
    });
  });

  // Set current values (slightly above invested for growth)
  const niftyInvested = 5000 * months.length;
  const ppfcInvested = 5000 * months.length;
  const hdInvested = 3000 * months.length;

  investments
    .filter((i) => i.fundName === 'Nifty 50 Index Fund')
    .forEach((i, idx, arr) => {
      if (idx === arr.length - 1) {
        i.currentValue = Math.round(niftyInvested * 1.12);
      }
    });

  investments
    .filter((i) => i.fundName === 'Parag Parikh Flexi Cap')
    .forEach((i, idx, arr) => {
      if (idx === arr.length - 1) {
        i.currentValue = Math.round(ppfcInvested * 1.15);
      }
    });

  investments
    .filter((i) => i.fundName === 'HDFC Short Term Debt Fund')
    .forEach((i, idx, arr) => {
      if (idx === arr.length - 1) {
        i.currentValue = Math.round(hdInvested * 1.04);
      }
    });

  return investments;
}

export function generateDemoEmergencyFund(): EmergencyFundEntry[] {
  return [
    {
      id: generateId(),
      date: format(subDays(subMonths(today, 5), 10), 'yyyy-MM-dd'),
      type: 'Deposit',
      amount: 50000,
      notes: 'Initial deposit',
    },
    {
      id: generateId(),
      date: format(subDays(subMonths(today, 4), 5), 'yyyy-MM-dd'),
      type: 'Deposit',
      amount: 25000,
      notes: 'Monthly contribution',
    },
    {
      id: generateId(),
      date: format(subDays(subMonths(today, 3), 5), 'yyyy-MM-dd'),
      type: 'Deposit',
      amount: 25000,
      notes: 'Monthly contribution',
    },
    {
      id: generateId(),
      date: format(subDays(subMonths(today, 2), 5), 'yyyy-MM-dd'),
      type: 'Deposit',
      amount: 20000,
      notes: 'Monthly contribution',
    },
    {
      id: generateId(),
      date: format(subDays(subMonths(today, 2), 15), 'yyyy-MM-dd'),
      type: 'Withdrawal',
      amount: 15000,
      notes: 'Unexpected medical expense',
    },
    {
      id: generateId(),
      date: format(subDays(subMonths(today, 1), 5), 'yyyy-MM-dd'),
      type: 'Deposit',
      amount: 25000,
      notes: 'Monthly contribution',
    },
    {
      id: generateId(),
      date: format(subDays(today, 5), 'yyyy-MM-dd'),
      type: 'Deposit',
      amount: 20000,
      notes: 'Monthly contribution',
    },
  ];
}

export function generateDemoBudgets(): Budget[] {
  return [
    {
      id: generateId(),
      month: currentMonth,
      expectedIncome: 97000,
      allocations: [
        { category: 'Rent', allocated: 18000 },
        { category: 'Food & Dining', allocated: 8000 },
        { category: 'Groceries', allocated: 6000 },
        { category: 'Transport', allocated: 3000 },
        { category: 'Shopping', allocated: 5000 },
        { category: 'Bills & Utilities', allocated: 5000 },
        { category: 'Entertainment', allocated: 3000 },
        { category: 'Health & Fitness', allocated: 2000 },
        { category: 'Subscriptions', allocated: 1000 },
        { category: 'Personal Care', allocated: 1500 },
        { category: 'Education', allocated: 2000 },
        { category: 'Investments', allocated: 13000 },
        { category: 'Emergency Fund', allocated: 20000 },
        { category: 'Other', allocated: 9500 },
      ],
    },
    {
      id: generateId(),
      month: lastMonth,
      expectedIncome: 95000,
      allocations: [
        { category: 'Rent', allocated: 18000 },
        { category: 'Food & Dining', allocated: 7500 },
        { category: 'Groceries', allocated: 5500 },
        { category: 'Transport', allocated: 3000 },
        { category: 'Shopping', allocated: 4000 },
        { category: 'Bills & Utilities', allocated: 5000 },
        { category: 'Entertainment', allocated: 2500 },
        { category: 'Health & Fitness', allocated: 2000 },
        { category: 'Subscriptions', allocated: 1000 },
        { category: 'Personal Care', allocated: 1500 },
        { category: 'Education', allocated: 2000 },
        { category: 'Investments', allocated: 13000 },
        { category: 'Emergency Fund', allocated: 20000 },
        { category: 'Other', allocated: 10000 },
      ],
    },
  ];
}
