// ========================================
// Budget Page (Zero-Based Budgeting)
// ========================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  Calculator, CheckCircle, AlertTriangle, AlertCircle,
  Copy, RefreshCw, Shield, TrendingUp,
  Sparkles, DollarSign,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { GlassCard, PageHeader, StatCard } from '../components/shared';
import { MonthSelector } from '../components/shared/MonthSelector';
import { showToast } from '../hooks';
import {
  formatCurrency,
  filterTransactionsByMonth,
  filterIncomeByMonth,
  filterInvestmentsByMonth,
  getTotalIncome,
  getTotalInvested,
  getPreviousMonth,
  getRemainingDaysInMonth,
  CHART_COLORS,
} from '../lib/utils';
import type { BudgetAllocation } from '../types';

export default function BudgetPage() {
  const selectedMonth = useStore((s) => s.selectedMonth);
  const budgets = useStore((s) => s.budgets);
  const income = useStore((s) => s.income);
  const transactions = useStore((s) => s.transactions);
  const investments = useStore((s) => s.investments);
  const emergencyFund = useStore((s) => s.emergencyFund);
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const addBudget = useStore((s) => s.addBudget);
  const updateBudget = useStore((s) => s.updateBudget);

  // Find or initialize current month's budget
  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.month === selectedMonth) || null;
  }, [budgets, selectedMonth]);

  // Actual income recorded for this month
  const actualMonthIncome = useMemo(() => {
    const monthIncome = filterIncomeByMonth(income, selectedMonth);
    return getTotalIncome(monthIncome);
  }, [income, selectedMonth]);

  // Actual spend recorded for this month
  const monthTransactions = useMemo(() => {
    return filterTransactionsByMonth(transactions, selectedMonth);
  }, [transactions, selectedMonth]);

  // Actual investments for this month
  const monthInvestments = useMemo(() => {
    return getTotalInvested(filterInvestmentsByMonth(investments, selectedMonth));
  }, [investments, selectedMonth]);

  // Actual emergency fund deposits for this month
  const monthEmergencyFund = useMemo(() => {
    return emergencyFund
      .filter((e) => e.date.startsWith(selectedMonth) && e.type === 'Deposit')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [emergencyFund, selectedMonth]);

  // Category actual spend map
  const actualSpendMap = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'Spend')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });
    return map;
  }, [monthTransactions]);

  // All categories to budget: user expense categories + 'Investments' + 'Emergency Fund'
  const allBudgetCategories = useMemo(() => {
    return [...config.categories, 'Investments', 'Emergency Fund'];
  }, [config.categories]);

  // Allocations list ensuring all categories are represented
  const allocations: BudgetAllocation[] = useMemo(() => {
    if (!currentBudget) {
      return allBudgetCategories.map((cat) => ({ category: cat, allocated: 0 }));
    }
    const map = new Map<string, number>();
    currentBudget.allocations.forEach((a) => map.set(a.category, a.allocated));
    return allBudgetCategories.map((cat) => ({
      category: cat,
      allocated: map.get(cat) || 0,
    }));
  }, [currentBudget, allBudgetCategories]);

  // Expected income for the budget
  const expectedIncome = currentBudget ? currentBudget.expectedIncome : actualMonthIncome;

  // Sum of all allocations
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (Number(a.allocated) || 0), 0);
  }, [allocations]);

  // Zero-based remaining
  const unallocated = expectedIncome - totalAllocated;

  // Remaining days in month
  const remainingDays = getRemainingDaysInMonth(selectedMonth);

  // Total discretionary allocated spend vs actual
  const totalDiscretionaryAllocated = useMemo(() => {
    return allocations
      .filter((a) => a.category !== 'Rent' && a.category !== 'Investments' && a.category !== 'Emergency Fund')
      .reduce((sum, a) => sum + a.allocated, 0);
  }, [allocations]);

  const totalDiscretionarySpent = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'Spend' && t.category !== 'Rent')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const dailySafeSpend = useMemo(() => {
    if (remainingDays <= 0) return 0;
    const remaining = totalDiscretionaryAllocated - totalDiscretionarySpent;
    return Math.max(0, Math.round(remaining / remainingDays));
  }, [totalDiscretionaryAllocated, totalDiscretionarySpent, remainingDays]);

  // --- Handlers ---
  const handleUpdateExpectedIncome = (val: number) => {
    if (currentBudget) {
      updateBudget(currentBudget.id, { expectedIncome: val });
    } else {
      addBudget({
        month: selectedMonth,
        expectedIncome: val,
        allocations,
      });
    }
  };

  const handleUpdateAllocation = (category: string, amount: number) => {
    const updated = allocations.map((a) =>
      a.category === category ? { ...a, allocated: Math.max(0, amount) } : a
    );

    if (currentBudget) {
      updateBudget(currentBudget.id, { allocations: updated });
    } else {
      addBudget({
        month: selectedMonth,
        expectedIncome,
        allocations: updated,
      });
    }
  };

  const handlePrefillIncome = () => {
    if (actualMonthIncome === 0) {
      showToast({ message: 'No income entries recorded for this month yet', type: 'warning' });
      return;
    }
    handleUpdateExpectedIncome(actualMonthIncome);
    showToast({ message: `Updated expected income to ${formatCurrency(actualMonthIncome, config)}`, type: 'success' });
  };

  const handleCopyPreviousMonth = () => {
    const prevMonth = getPreviousMonth(selectedMonth);
    const prevBudget = budgets.find((b) => b.month === prevMonth);

    if (!prevBudget) {
      showToast({ message: `No budget found for previous month (${prevMonth})`, type: 'warning' });
      return;
    }

    if (currentBudget) {
      updateBudget(currentBudget.id, {
        expectedIncome: prevBudget.expectedIncome,
        allocations: prevBudget.allocations,
      });
    } else {
      addBudget({
        month: selectedMonth,
        expectedIncome: prevBudget.expectedIncome,
        allocations: prevBudget.allocations,
      });
    }

    showToast({ message: `Copied budget from ${prevMonth}!`, type: 'success' });
  };

  const handleAutoBalance = () => {
    if (unallocated === 0) return;
    const otherAlloc = allocations.find((a) => a.category === 'Other')?.allocated || 0;
    const newOther = Math.max(0, otherAlloc + unallocated);
    handleUpdateAllocation('Other', newOther);
    showToast({ message: 'Balanced remaining budget into Other category', type: 'success' });
  };

  const getActualForCategory = (category: string): number => {
    if (category === 'Investments') return monthInvestments;
    if (category === 'Emergency Fund') return monthEmergencyFund;
    return actualSpendMap.get(category) || 0;
  };

  // If budget feature is disabled
  if (!config.budgetEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Zero-Based Budget" subtitle="Give every rupee a job before the month begins" />
        <GlassCard className="p-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Calculator size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Zero-Based Budgeting is Disabled
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Zero-based budgeting helps you plan ahead by allocating every unit of expected income to expenses, investments, and savings until unallocated equals zero.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              updateConfig({ budgetEnabled: true });
              showToast({ message: 'Zero-based budgeting enabled!', type: 'success' });
            }}
          >
            Enable Zero-Based Budget
          </button>
        </GlassCard>
      </div>
    );
  }

  // Chart data: categories with either allocation or spending > 0
  const chartData = allocations
    .map((a) => {
      const actual = getActualForCategory(a.category);
      return {
        category: a.category,
        allocated: a.allocated,
        actual,
      };
    })
    .filter((d) => d.allocated > 0 || d.actual > 0)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Zero-Based Budget"
        subtitle="Give every rupee a job until your unallocated balance is zero"
      >
        <MonthSelector />
        <button
          className="btn btn-secondary text-xs sm:text-sm"
          onClick={handleCopyPreviousMonth}
          title="Clone budget from last month"
        >
          <Copy size={16} />
          <span>Copy Last Month</span>
        </button>
      </PageHeader>

      {/* Top Banner: Zero-based Balance Hero */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          {/* Expected Income Column */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Expected Monthly Income
              </span>
              <button
                className="text-xs font-medium text-indigo-500 hover:underline flex items-center gap-1"
                onClick={handlePrefillIncome}
              >
                <RefreshCw size={12} />
                Prefill ({formatCurrency(actualMonthIncome, config)})
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                {config.currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={expectedIncome || ''}
                onChange={(e) => handleUpdateExpectedIncome(Number(e.target.value) || 0)}
                placeholder="0"
                className="input text-2xl sm:text-3xl font-extrabold w-full max-w-[220px]"
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Recorded income so far: <span className="font-semibold">{formatCurrency(actualMonthIncome, config)}</span>
            </p>
          </div>

          {/* Allocation Progress Bar & Status */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Total Allocated</span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(totalAllocated, config)} / {formatCurrency(expectedIncome, config)}
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden bg-white/20 dark:bg-slate-700/50">
              <motion.div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, expectedIncome > 0 ? (totalAllocated / expectedIncome) * 100 : 0)}%`,
                  background:
                    unallocated === 0
                      ? 'var(--color-emerald)'
                      : unallocated < 0
                      ? 'var(--color-rose)'
                      : 'var(--color-primary)',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-tertiary)' }}>
                {expectedIncome > 0 ? Math.round((totalAllocated / expectedIncome) * 100) : 0}% planned
              </span>
              {unallocated > 0 && (
                <button
                  className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1"
                  onClick={handleAutoBalance}
                >
                  <Sparkles size={12} /> Auto-allocate to Other
                </button>
              )}
            </div>
          </div>

          {/* Unallocated Pill Card */}
          <div
            className={`p-4 rounded-2xl flex flex-col justify-center items-center text-center min-w-[200px] border transition-all ${
              unallocated === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : unallocated < 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {unallocated === 0 ? (
                <>
                  <CheckCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Zero-Based Goal Met</span>
                </>
              ) : unallocated < 0 ? (
                <>
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Over-Allocated</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Unallocated Left</span>
                </>
              )}
            </div>
            <div className="text-2xl font-black tabular-nums">
              {formatCurrency(Math.abs(unallocated), config)}
            </div>
            <p className="text-[11px] mt-0.5 opacity-80">
              {unallocated === 0
                ? 'Every rupee has a assigned job!'
                : unallocated < 0
                ? 'You assigned more than expected income'
                : 'Assign to categories, savings, or fund'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Planned Expenses"
          value={formatCurrency(
            allocations
              .filter((a) => a.category !== 'Investments' && a.category !== 'Emergency Fund')
              .reduce((s, a) => s + a.allocated, 0),
            config
          )}
          color="var(--color-rose)"
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Planned Investments"
          value={formatCurrency(
            allocations.find((a) => a.category === 'Investments')?.allocated || 0,
            config
          )}
          color="var(--color-primary)"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Planned Emergency Fund"
          value={formatCurrency(
            allocations.find((a) => a.category === 'Emergency Fund')?.allocated || 0,
            config
          )}
          color="var(--color-emerald)"
          icon={<Shield size={18} />}
        />
        <StatCard
          label="Daily Safe-to-Spend"
          value={formatCurrency(dailySafeSpend, config)}
          trendLabel={`${remainingDays} days left in month`}
          color="var(--color-violet)"
          icon={<Calculator size={18} />}
        />
      </div>

      {/* Main Budget Grid: Allocations vs Actuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocations Table (2 cols on large) */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Category Allocations & Tracking
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Edit budgeted amounts and track against actual spending in real time
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-500">
                {allocations.length} Categories
              </span>
            </div>

            <div className="space-y-3">
              {allocations.map((item, idx) => {
                const actual = getActualForCategory(item.category);
                const diff = item.allocated - actual;
                const isOverBudget = item.allocated > 0 && actual > item.allocated;
                const percentSpent = item.allocated > 0 ? (actual / item.allocated) * 100 : actual > 0 ? 100 : 0;
                const isSpecial = item.category === 'Investments' || item.category === 'Emergency Fund';

                return (
                  <motion.div
                    key={item.category}
                    className="budget-allocation-row p-3.5 rounded-2xl transition-all shadow-sm dark:shadow-none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSpecial
                              ? item.category === 'Investments'
                                ? 'rgba(99, 102, 241, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)'
                              : `${CHART_COLORS[idx % CHART_COLORS.length]}20`,
                            color: isSpecial
                              ? item.category === 'Investments'
                                ? 'var(--color-primary)'
                                : 'var(--color-emerald)'
                              : CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        >
                          {item.category === 'Investments' ? (
                            <TrendingUp size={16} />
                          ) : item.category === 'Emergency Fund' ? (
                            <Shield size={16} />
                          ) : (
                            <span className="text-xs font-bold">{item.category[0]}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-sm block" style={{ color: 'var(--text-primary)' }}>
                            {item.category}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            Actual: {formatCurrency(actual, config)}
                          </span>
                        </div>
                      </div>

                      {/* Input & Remaining */}
                      <div className="flex items-center gap-3 justify-between sm:justify-end flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                            {config.currencySymbol}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.allocated || ''}
                            onChange={(e) => handleUpdateAllocation(item.category, Number(e.target.value) || 0)}
                            placeholder="0"
                            className="input py-1 px-2 text-right font-semibold text-sm w-28 tabular-nums"
                          />
                        </div>

                        <div className="text-right min-w-[90px]">
                          <span
                            className={`text-xs font-bold tabular-nums block ${
                              isOverBudget
                                ? 'text-rose-500'
                                : diff >= 0
                                ? 'text-emerald-500'
                                : 'text-slate-500'
                            }`}
                          >
                            {isOverBudget
                              ? `+${formatCurrency(Math.abs(diff), config)} over`
                              : `${formatCurrency(diff, config)} left`}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {Math.round(percentSpent)}% used
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, percentSpent)}%`,
                          background: isOverBudget
                            ? 'var(--color-rose)'
                            : percentSpent > 80
                            ? 'var(--color-amber)'
                            : 'var(--color-emerald)',
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Charts & Quick Insights */}
        <div className="space-y-6">
          {/* Budget vs Actual Comparison Chart */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
              Top Categories: Budget vs Actual
            </h3>
            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                      tickFormatter={(v) => `${config.currencySymbol}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value) || 0, config), '']}
                      contentStyle={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                      }}
                    />
                    <Bar dataKey="allocated" name="Budget" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="var(--color-rose)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Enter budget allocations to see comparison chart
              </p>
            )}
          </GlassCard>

          {/* Allocation Share Donut */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Budget Distribution
            </h3>
            {totalAllocated > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocations.filter((a) => a.allocated > 0)}
                      dataKey="allocated"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {allocations
                        .filter((a) => a.allocated > 0)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${entry.category}`}
                            fill={
                              entry.category === 'Investments'
                                ? 'var(--color-primary)'
                                : entry.category === 'Emergency Fund'
                                ? 'var(--color-emerald)'
                                : CHART_COLORS[index % CHART_COLORS.length]
                            }
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0, config), 'Allocated']}
                      contentStyle={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Allocate budget amounts to see breakdown
              </p>
            )}
          </GlassCard>

          {/* Zero-Based Guide Card */}
          <GlassCard className="p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                  How Zero-Based Budgeting Works
                </h4>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Income − (Expenses + Investments + Savings) = 0.
                  Every single rupee is earmarked before it is spent, preventing impulsive drift and ensuring you hit your monthly savings goals.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
