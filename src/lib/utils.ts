// ========================================
// FinFlow Utility Functions
// ========================================

import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isWithinInterval, differenceInDays } from 'date-fns';
import type { Transaction, IncomeEntry, Investment, EmergencyFundEntry, AppConfig } from '../types';

// --- ID Generation ---
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// --- Currency Formatting ---
export function formatCurrency(amount: number, config: AppConfig): string {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, config: AppConfig): string {
  if (amount >= 10000000) {
    return `${config.currencySymbol}${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `${config.currencySymbol}${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${config.currencySymbol}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, config);
}

// --- Date Helpers ---
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthLabel(month: string): string {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
}

export function getShortMonthLabel(month: string): string {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(date, 'MMM yyyy');
}

export function getMonthRange(month: string): { start: Date; end: Date } {
  const date = parse(month, 'yyyy-MM', new Date());
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getDaysInMonth(month: string): Date[] {
  const { start, end } = getMonthRange(month);
  return eachDayOfInterval({ start, end });
}

export function getPreviousMonth(month: string): string {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(subMonths(date, 1), 'yyyy-MM');
}

export function getLast6Months(month: string): string[] {
  const months: string[] = [];
  let current = month;
  for (let i = 0; i < 6; i++) {
    months.unshift(current);
    current = getPreviousMonth(current);
  }
  return months;
}

export function getLast12Months(month: string): string[] {
  const months: string[] = [];
  let current = month;
  for (let i = 0; i < 12; i++) {
    months.unshift(current);
    current = getPreviousMonth(current);
  }
  return months;
}

export function getRemainingDaysInMonth(month: string): number {
  const { end } = getMonthRange(month);
  const today = new Date();
  const endDate = end;
  if (today > endDate) return 0;
  return differenceInDays(endDate, today) + 1;
}

// --- Data Filtering ---
export function filterTransactionsByMonth(transactions: Transaction[], month: string): Transaction[] {
  const { start, end } = getMonthRange(month);
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return isWithinInterval(date, { start, end });
  });
}

export function filterIncomeByMonth(income: IncomeEntry[], month: string): IncomeEntry[] {
  return income.filter((i) => i.month === month);
}

export function filterInvestmentsByMonth(investments: Investment[], month: string): Investment[] {
  const { start, end } = getMonthRange(month);
  return investments.filter((i) => {
    const date = new Date(i.date);
    return isWithinInterval(date, { start, end });
  });
}

// --- Aggregations ---
export function getTotalSpend(transactions: Transaction[]): number {
  return transactions.filter((t) => t.type === 'Spend').reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalCredit(transactions: Transaction[]): number {
  return transactions.filter((t) => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalIncome(income: IncomeEntry[]): number {
  return income.reduce((sum, i) => sum + i.amount, 0);
}

export function getTotalInvested(investments: Investment[]): number {
  return investments
    .filter((i) => i.type !== 'Redemption')
    .reduce((sum, i) => sum + i.amount, 0);
}

export function getTotalRedemptions(investments: Investment[]): number {
  return investments
    .filter((i) => i.type === 'Redemption')
    .reduce((sum, i) => sum + i.amount, 0);
}

export function getCurrentInvestmentValue(investments: Investment[]): number {
  // Group by fund name
  const fundMap = new Map<string, { invested: number; currentValue: number; redeemed: number }>();
  
  investments.forEach((inv) => {
    const existing = fundMap.get(inv.fundName) || { invested: 0, currentValue: 0, redeemed: 0 };
    if (inv.type === 'Redemption') {
      existing.redeemed += inv.amount;
    } else {
      existing.invested += inv.amount;
    }
    if (inv.currentValue !== undefined) {
      existing.currentValue = inv.currentValue;
    }
    fundMap.set(inv.fundName, existing);
  });

  let totalValue = 0;
  fundMap.forEach((fund) => {
    totalValue += fund.currentValue > 0 ? fund.currentValue : fund.invested - fund.redeemed;
  });
  return totalValue;
}

export function getEmergencyFundBalance(entries: EmergencyFundEntry[]): number {
  return entries.reduce((sum, e) => {
    return e.type === 'Deposit' ? sum + e.amount : sum - e.amount;
  }, 0);
}

export function getSpendingByCategory(transactions: Transaction[]): { category: string; amount: number }[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'Spend')
    .forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getSpendingBySource(transactions: Transaction[]): { source: string; amount: number }[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'Spend')
    .forEach((t) => {
      map.set(t.source, (map.get(t.source) || 0) + t.amount);
    });
  return Array.from(map.entries())
    .map(([source, amount]) => ({ source, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getDailySpending(transactions: Transaction[], month: string): { date: string; amount: number }[] {
  const days = getDaysInMonth(month);
  const map = new Map<string, number>();
  
  days.forEach((day) => {
    map.set(format(day, 'yyyy-MM-dd'), 0);
  });

  transactions
    .filter((t) => t.type === 'Spend')
    .forEach((t) => {
      const existing = map.get(t.date) || 0;
      map.set(t.date, existing + t.amount);
    });

  return Array.from(map.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getSavingsRate(income: number, spending: number): number {
  if (income === 0) return 0;
  return Math.round(((income - spending) / income) * 100);
}

// --- Financial Health Score ---
export function calculateHealthScore(
  savingsRate: number,
  emergencyFundMonths: number,
  budgetAdherence: number // 0-100
): number {
  // Savings rate: 0-40 points (24%+ = max)
  const savingsScore = Math.min(40, (savingsRate / 24) * 40);
  
  // Emergency fund: 0-30 points (6 months = max)
  const emergencyScore = Math.min(30, (emergencyFundMonths / 6) * 30);
  
  // Budget adherence: 0-30 points
  const budgetScore = (budgetAdherence / 100) * 30;

  return Math.round(Math.max(0, Math.min(100, savingsScore + emergencyScore + budgetScore)));
}

// --- Color Helpers ---
export const CHART_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a78bfa', // violet light
  '#c084fc', // purple
  '#e879f9', // fuchsia
  '#f472b6', // pink
  '#fb923c', // orange
  '#fbbf24', // amber
  '#34d399', // emerald
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#818cf8', // indigo light
];

export function getHealthScoreColor(score: number): string {
  if (score >= 75) return '#10b981'; // emerald
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Needs Work';
  return 'Critical';
}

// --- Percentage Change ---
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
