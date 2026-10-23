// ========================================
// FinFlow Insight Generator
// ========================================

import type { Transaction, IncomeEntry, Investment, EmergencyFundEntry, AppConfig, Budget } from '../types';
import {
  filterTransactionsByMonth,
  filterIncomeByMonth,
  getTotalSpend,
  getTotalIncome,
  getSpendingByCategory,
  getEmergencyFundBalance,
  getSavingsRate,
  percentChange,
  formatCurrency,
  getPreviousMonth,
} from './utils';

export interface Insight {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: string;
}

export function generateInsights(
  transactions: Transaction[],
  income: IncomeEntry[],
  _investments: Investment[],
  emergencyFund: EmergencyFundEntry[],
  budgets: Budget[],
  config: AppConfig,
  month: string
): Insight[] {
  const insights: Insight[] = [];
  const prevMonth = getPreviousMonth(month);

  const currentTxns = filterTransactionsByMonth(transactions, month);
  const prevTxns = filterTransactionsByMonth(transactions, prevMonth);
  const currentIncome = filterIncomeByMonth(income, month);
  const prevIncome = filterIncomeByMonth(income, prevMonth);

  const currentSpend = getTotalSpend(currentTxns);
  const prevSpend = getTotalSpend(prevTxns);
  const currentIncomeTotal = getTotalIncome(currentIncome);
  const prevIncomeTotal = getTotalIncome(prevIncome);

  // Spending change
  if (prevSpend > 0) {
    const change = percentChange(currentSpend, prevSpend);
    if (change > 10) {
      insights.push({
        id: 'spend-up',
        text: `You spent ${Math.abs(change)}% more than last month (${formatCurrency(currentSpend, config)} vs ${formatCurrency(prevSpend, config)})`,
        type: 'warning',
        icon: 'TrendingUp',
      });
    } else if (change < -10) {
      insights.push({
        id: 'spend-down',
        text: `Great! You spent ${Math.abs(change)}% less than last month`,
        type: 'positive',
        icon: 'TrendingDown',
      });
    }
  }

  // Biggest category
  const categories = getSpendingByCategory(currentTxns);
  if (categories.length > 0) {
    insights.push({
      id: 'top-category',
      text: `Biggest expense this month: ${categories[0].category} at ${formatCurrency(categories[0].amount, config)}`,
      type: 'neutral',
      icon: 'Award',
    });
  }

  // Category comparison with last month
  const prevCategories = getSpendingByCategory(prevTxns);
  if (categories.length > 0 && prevCategories.length > 0) {
    const prevCatMap = new Map(prevCategories.map((c) => [c.category, c.amount]));
    for (const cat of categories.slice(0, 3)) {
      const prevAmount = prevCatMap.get(cat.category);
      if (prevAmount && prevAmount > 0) {
        const change = percentChange(cat.amount, prevAmount);
        if (change > 15) {
          insights.push({
            id: `cat-${cat.category}`,
            text: `You spent ${change}% more on ${cat.category} than last month`,
            type: 'negative',
            icon: 'AlertTriangle',
          });
          break;
        }
      }
    }
  }

  // Savings rate
  if (currentIncomeTotal > 0) {
    const rate = getSavingsRate(currentIncomeTotal, currentSpend);
    if (rate >= 30) {
      insights.push({
        id: 'savings-rate-good',
        text: `Savings rate is ${rate}% — excellent! Keep it up`,
        type: 'positive',
        icon: 'Sparkles',
      });
    } else if (rate >= 15) {
      insights.push({
        id: 'savings-rate-ok',
        text: `Savings rate is ${rate}%. Aim for 30%+ for long-term wealth building`,
        type: 'neutral',
        icon: 'Target',
      });
    } else if (rate >= 0) {
      insights.push({
        id: 'savings-rate-low',
        text: `Savings rate is only ${rate}%. Try cutting discretionary spending`,
        type: 'warning',
        icon: 'AlertCircle',
      });
    }
  }

  // Income change
  if (prevIncomeTotal > 0 && currentIncomeTotal > 0) {
    const change = percentChange(currentIncomeTotal, prevIncomeTotal);
    if (change > 5) {
      insights.push({
        id: 'income-up',
        text: `Income is up ${change}% vs last month`,
        type: 'positive',
        icon: 'TrendingUp',
      });
    } else if (change < -5) {
      insights.push({
        id: 'income-down',
        text: `Income dropped ${Math.abs(change)}% vs last month`,
        type: 'warning',
        icon: 'TrendingDown',
      });
    }
  }

  // Emergency fund
  const efBalance = getEmergencyFundBalance(emergencyFund);
  if (efBalance > 0) {
    const avgMonthlySpend = prevSpend > 0 ? (currentSpend + prevSpend) / 2 : currentSpend;
    if (avgMonthlySpend > 0) {
      const monthsCovered = efBalance / avgMonthlySpend;
      insights.push({
        id: 'ef-coverage',
        text: `Emergency fund covers ${monthsCovered.toFixed(1)} months of expenses`,
        type: monthsCovered >= 6 ? 'positive' : monthsCovered >= 3 ? 'neutral' : 'warning',
        icon: 'Shield',
      });
    }
  }

  // Budget adherence
  const currentBudget = budgets.find((b) => b.month === month);
  if (currentBudget && config.budgetEnabled) {
    const totalAllocated = currentBudget.allocations.reduce((sum, a) => sum + a.allocated, 0);
    const totalActual = currentSpend;
    if (totalAllocated > 0) {
      const adherence = Math.round((1 - Math.abs(totalActual - totalAllocated) / totalAllocated) * 100);
      if (totalActual > totalAllocated) {
        insights.push({
          id: 'budget-over',
          text: `You've exceeded your budget by ${formatCurrency(totalActual - totalAllocated, config)}`,
          type: 'negative',
          icon: 'AlertTriangle',
        });
      } else if (adherence > 80) {
        insights.push({
          id: 'budget-good',
          text: `Budget adherence is ${Math.max(0, adherence)}% — well done!`,
          type: 'positive',
          icon: 'CheckCircle',
        });
      }
    }
  }

  return insights.slice(0, 6);
}
