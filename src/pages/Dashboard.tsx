// ========================================
// Dashboard Page
// ========================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import {
  Wallet, TrendingDown, TrendingUp, PiggyBank,
  Shield, Target, Sparkles, Award, AlertTriangle,
  AlertCircle, CheckCircle, ArrowRight,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { GlassCard, PageHeader, StatCard } from '../components/shared';
import { MonthSelector } from '../components/shared/MonthSelector';
import { useAnimatedCounter } from '../hooks';
import {
  formatCurrency,
  filterTransactionsByMonth,
  filterIncomeByMonth,
  filterInvestmentsByMonth,
  getTotalSpend,
  getTotalIncome,
  getTotalInvested,
  getEmergencyFundBalance,
  getSpendingByCategory,
  getSpendingBySource,
  getDailySpending,
  getSavingsRate,
  calculateHealthScore,
  getHealthScoreColor,
  getHealthScoreLabel,
  percentChange,
  getLast6Months,
  getShortMonthLabel,
  getRemainingDaysInMonth,
  CHART_COLORS,
  getCurrentInvestmentValue,
} from '../lib/utils';
import { generateInsights } from '../lib/insights';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// Icon map for insights
const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  TrendingUp, TrendingDown, Award, AlertTriangle,
  AlertCircle, Sparkles, Target, Shield, CheckCircle,
};

export default function Dashboard() {
  const transactions = useStore((s) => s.transactions);
  const income = useStore((s) => s.income);
  const investments = useStore((s) => s.investments);
  const emergencyFund = useStore((s) => s.emergencyFund);
  const budgets = useStore((s) => s.budgets);
  const config = useStore((s) => s.config);
  const selectedMonth = useStore((s) => s.selectedMonth);

  const data = useMemo(() => {
    const monthTxns = filterTransactionsByMonth(transactions, selectedMonth);
    const monthIncome = filterIncomeByMonth(income, selectedMonth);
    const monthInvestments = filterInvestmentsByMonth(investments, selectedMonth);
    
    const prevMonth = selectedMonth.split('-').map(Number);
    const prevMonthStr = prevMonth[1] === 1
      ? `${prevMonth[0] - 1}-12`
      : `${prevMonth[0]}-${String(prevMonth[1] - 1).padStart(2, '0')}`;
    const prevTxns = filterTransactionsByMonth(transactions, prevMonthStr);
    const prevIncome = filterIncomeByMonth(income, prevMonthStr);

    const totalSpend = getTotalSpend(monthTxns);
    const totalIncome = getTotalIncome(monthIncome);
    const prevTotalSpend = getTotalSpend(prevTxns);
    const prevTotalIncome = getTotalIncome(prevIncome);
    const netSavings = totalIncome - totalSpend;
    const savingsRate = getSavingsRate(totalIncome, totalSpend);
    const totalInvested = getTotalInvested(monthInvestments);
    const efBalance = getEmergencyFundBalance(emergencyFund);
    const investmentValue = getCurrentInvestmentValue(investments);

    const avgMonthlySpend = prevTotalSpend > 0 ? (totalSpend + prevTotalSpend) / 2 : totalSpend;
    const efMonths = avgMonthlySpend > 0 ? efBalance / avgMonthlySpend : 0;

    const budget = budgets.find((b) => b.month === selectedMonth);
    const budgetTotal = budget ? budget.allocations.reduce((s, a) => s + a.allocated, 0) : 0;
    const budgetAdherence = budget && budgetTotal > 0
      ? Math.max(0, Math.round((1 - Math.max(0, totalSpend - budgetTotal) / budgetTotal) * 100))
      : 70;

    // A default adherence value is useful once the user has financial activity,
    // but it should not manufacture a score for a completely fresh account.
    const hasHealthData = totalIncome > 0 || totalSpend > 0 || efBalance > 0 || budgetTotal > 0;
    const healthScore = hasHealthData
      ? calculateHealthScore(savingsRate, efMonths, budgetAdherence)
      : 0;

    // Category spending
    const categorySpending = getSpendingByCategory(monthTxns);
    const sourceSpending = getSpendingBySource(monthTxns);
    const dailySpending = getDailySpending(monthTxns, selectedMonth);

    // Trend data (last 6 months)
    const months = getLast6Months(selectedMonth);
    const trendData = months.map((m) => {
      const mTxns = filterTransactionsByMonth(transactions, m);
      const mIncome = filterIncomeByMonth(income, m);
      return {
        month: getShortMonthLabel(m).split(' ')[0],
        income: getTotalIncome(mIncome),
        expense: getTotalSpend(mTxns),
      };
    });

    // Insights
    const insights = generateInsights(transactions, income, investments, emergencyFund, budgets, config, selectedMonth);

    // Recent transactions
    const recentTxns = monthTxns.slice(0, 5);

    const remainingDays = getRemainingDaysInMonth(selectedMonth);
    const dailySafe = budget && remainingDays > 0
      ? Math.max(0, (budgetTotal - totalSpend) / remainingDays)
      : 0;

    return {
      totalSpend, totalIncome, netSavings, savingsRate, totalInvested, efBalance,
      investmentValue,
      prevTotalSpend, prevTotalIncome,
      categorySpending, sourceSpending, dailySpending, trendData,
      healthScore, hasHealthData, efMonths, insights, recentTxns, budget, budgetTotal,
      dailySafe, remainingDays, budgetAdherence,
    };
  }, [transactions, income, investments, emergencyFund, budgets, config, selectedMonth]);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your financial overview at a glance">
        <MonthSelector />
      </PageHeader>

      {/* Hero Stats */}
      <div className="bento-grid mb-6">
        <AnimatedStatCard
          label="Income"
          value={data.totalIncome}
          icon={<Wallet size={18} />}
          color="#6366f1"
          trend={percentChange(data.totalIncome, data.prevTotalIncome)}
          trendLabel="vs last month"
          delay={0}
          config={config}
        />
        <AnimatedStatCard
          label="Spent"
          value={data.totalSpend}
          icon={<TrendingDown size={18} />}
          color="#f43f5e"
          trend={percentChange(data.totalSpend, data.prevTotalSpend)}
          trendLabel="vs last month"
          delay={0.05}
          config={config}
        />
        <AnimatedStatCard
          label="Net Savings"
          value={data.netSavings}
          icon={<PiggyBank size={18} />}
          color="#10b981"
          delay={0.1}
          config={config}
          extraInfo={`${data.savingsRate}% savings rate`}
        />
        <AnimatedStatCard
          label="Invested (month)"
          value={data.totalInvested}
          icon={<TrendingUp size={18} />}
          color="#8b5cf6"
          delay={0.15}
          config={config}
        />
        <AnimatedStatCard
          label="Portfolio Value"
          value={data.investmentValue}
          icon={<TrendingUp size={18} />}
          color="#6366f1"
          delay={0.2}
          config={config}
        />
        <AnimatedStatCard
          label="Emergency Fund"
          value={data.efBalance}
          icon={<Shield size={18} />}
          color="#f59e0b"
          delay={0.25}
          config={config}
          extraInfo={`${data.efMonths.toFixed(1)} months covered`}
        />
      </div>

      {/* Charts Row */}
      <div className="bento-grid mb-6">
        {/* Spending by Category Donut */}
        <GlassCard className="p-5 bento-span-2" delay={0.15}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Spending by Category
          </h3>
          {data.categorySpending.length > 0 ? (
            <div className="flex items-center gap-6 flex-col lg:flex-row">
              <div className="w-[180px] h-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categorySpending.slice(0, 8)}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.categorySpending.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="glass-sm p-2 text-xs">
                            <span className="font-semibold">{d.category}</span>: {formatCurrency(d.amount, config)}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {data.categorySpending.slice(0, 5).map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-3 text-sm">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {cat.category}
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(cat.amount, config)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No spending data this month
            </div>
          )}
        </GlassCard>

        {/* Income vs Expense Trend */}
        <GlassCard className="p-5 bento-span-2" delay={0.2}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Income vs Expense Trend
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload?.length) return null;
                    return (
                      <div className="glass-sm p-3 text-xs space-y-1">
                        <div className="font-semibold">{label}</div>
                        {payload.map((p) => (
                          <div key={p.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span>{p.name}: {formatCurrency(p.value as number, config)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#6366f1" fill="url(#gradIncome)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="url(#gradExpense)" strokeWidth={2} name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Second Row */}
      <div className="bento-grid mb-6">
        {/* Daily Spending */}
        <GlassCard className="p-5 bento-span-2" delay={0.25}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Daily Spending
          </h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) => format(new Date(d), 'd')}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="glass-sm p-2 text-xs">
                        <div className="font-semibold">{format(new Date(d.date), 'MMM d')}</div>
                        <div>{formatCurrency(d.amount, config)}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Spend by Source */}
        <GlassCard className="p-5" delay={0.3}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Spend by Source
          </h3>
          {data.sourceSpending.length > 0 ? (
            <div className="space-y-3">
              {data.sourceSpending.map((source, i) => {
                const pct = data.totalSpend > 0 ? (source.amount / data.totalSpend) * 100 : 0;
                return (
                  <div key={source.source}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{source.source}</span>
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(source.amount, config)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-bar-fill"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * i }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No data
            </div>
          )}
        </GlassCard>

        {/* Health Score */}
        <GlassCard className="p-5 flex flex-col items-center justify-center" delay={0.35}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Financial Health
          </h3>
          <HealthScoreRing score={data.healthScore} hasData={data.hasHealthData} />
          <span
            className="text-sm font-semibold mt-2"
            style={{ color: data.hasHealthData ? getHealthScoreColor(data.healthScore) : 'var(--text-tertiary)' }}
          >
            {data.hasHealthData ? getHealthScoreLabel(data.healthScore) : 'No data yet'}
          </span>
        </GlassCard>
      </div>

      {/* Third Row */}
      <div className="bento-grid mb-6">
        {/* Budget vs Actual Widget */}
        {config.budgetEnabled && (
          <GlassCard className="p-5 bento-span-2" delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Budget vs Actual
                  </h3>
                  {data.budget && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                      Zero-Based
                    </span>
                  )}
                </div>
                {data.budget && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {formatCurrency(data.totalSpend, config)} spent of {formatCurrency(data.budgetTotal, config)} planned
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {data.dailySafe > 0 && (
                  <div className="chip text-xs">
                    Safe: {formatCurrency(Math.round(data.dailySafe), config)}/day
                  </div>
                )}
                <Link to="/budget" className="btn-icon text-xs" title="Manage Zero-Based Budget">
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {data.budget ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {data.budget.allocations
                  .filter((a) => a.allocated > 0 || (data.categorySpending.find((c) => c.category === a.category)?.amount || 0) > 0)
                  .map((alloc) => {
                    const actual = alloc.category === 'Investments'
                      ? data.totalInvested
                      : alloc.category === 'Emergency Fund'
                      ? emergencyFund.filter(e => e.date.startsWith(selectedMonth) && e.type === 'Deposit').reduce((s, e) => s + e.amount, 0)
                      : data.categorySpending.find((c) => c.category === alloc.category)?.amount || 0;
                    const pct = alloc.allocated > 0 ? (actual / alloc.allocated) * 100 : actual > 0 ? 100 : 0;
                    const isOver = alloc.allocated > 0 && actual > alloc.allocated;
                    const remaining = alloc.allocated - actual;

                    return (
                      <div key={alloc.category} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {alloc.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-semibold tabular-nums"
                              style={{ color: isOver ? 'var(--color-rose)' : 'var(--text-secondary)' }}
                            >
                              {formatCurrency(actual, config)} / {formatCurrency(alloc.allocated, config)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isOver
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : remaining >= 0
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isOver ? `+${formatCurrency(Math.abs(remaining), config)} over` : `${formatCurrency(remaining, config)} left`}
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <motion.div
                            className="progress-bar-fill"
                            style={{
                              background: isOver
                                ? 'linear-gradient(90deg, var(--color-rose), #e11d48)'
                                : pct > 80
                                ? 'linear-gradient(90deg, var(--color-amber), var(--color-amber-light))'
                                : 'linear-gradient(90deg, var(--color-primary), var(--color-violet))',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  No budget defined for this month yet.
                </p>
                <Link to="/budget" className="btn btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5">
                  Plan Zero-Based Budget <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </GlassCard>
        )}

        {/* Insights */}
        <GlassCard className={`p-5 ${config.budgetEnabled ? 'bento-span-2' : 'bento-span-4'}`} delay={0.45}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles size={14} className="inline mr-1" style={{ color: 'var(--color-amber)' }} />
              Smart Insights
            </h3>
          </div>
          {data.insights.length > 0 ? (
            <div className="space-y-3">
              {data.insights.map((insight, i) => {
                const InsightIcon = iconMap[insight.icon] || Sparkles;
                const colorMap = {
                  positive: 'var(--color-emerald)',
                  negative: 'var(--color-rose)',
                  warning: 'var(--color-amber)',
                  neutral: 'var(--color-primary)',
                };
                return (
                  <motion.div
                    key={insight.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--surface-3)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <InsightIcon size={16} style={{ color: colorMap[insight.type], flexShrink: 0, marginTop: 2 }} />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {insight.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Add more data to see insights
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Transactions */}
      <GlassCard className="p-5 mb-6" delay={0.5}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Recent Transactions
          </h3>
          <Link
            to="/transactions"
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {data.recentTxns.length > 0 ? (
          <div className="space-y-2">
            {data.recentTxns.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'var(--surface-3)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: txn.type === 'Spend' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                  }}
                >
                  {txn.type === 'Spend' ? (
                    <TrendingDown size={16} style={{ color: 'var(--color-rose)' }} />
                  ) : (
                    <TrendingUp size={16} style={{ color: 'var(--color-emerald)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {txn.notes || txn.category}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {txn.category} • {format(new Date(txn.date), 'MMM d')}
                  </div>
                </div>
                <span
                  className="font-semibold text-sm tabular-nums flex-shrink-0"
                  style={{ color: txn.type === 'Spend' ? 'var(--color-rose)' : 'var(--color-emerald)' }}
                >
                  {txn.type === 'Spend' ? '-' : '+'}{formatCurrency(txn.amount, config)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No transactions this month
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// --- Animated Stat Card with count-up ---
interface AnimatedStatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  trendLabel?: string;
  delay: number;
  config: typeof import('../lib/constants').DEFAULT_CONFIG;
  extraInfo?: string;
}

function AnimatedStatCard({ label, value, icon, color, trend, trendLabel, delay, config, extraInfo }: AnimatedStatCardProps) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <StatCard
      label={label}
      value={formatCurrency(animatedValue, config)}
      icon={icon}
      color={color}
      trend={trend}
      trendLabel={trendLabel}
      delay={delay}
    >
      {extraInfo && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {extraInfo}
        </div>
      )}
    </StatCard>
  );
}

// --- Health Score Ring ---
function HealthScoreRing({ score, hasData }: { score: number; hasData: boolean }) {
  const color = getHealthScoreColor(score);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative">
      <svg width="130" height="130" viewBox="0 0 130 130" className="health-ring">
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="10"
        />
        <motion.circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(90deg)' }}>
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {hasData ? score : '—'}
        </span>
      </div>
    </div>
  );
}
