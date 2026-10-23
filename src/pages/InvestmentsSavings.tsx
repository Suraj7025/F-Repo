// ========================================
// Investments & Savings Page
// ========================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  Plus, Trash2, TrendingUp, Shield, ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../lib/store';
import { GlassCard, PageHeader, Modal, FormField, EmptyState, StatCard } from '../components/shared';
import { useIsMobile, showToast } from '../hooks';
import {
  formatCurrency,
  getTotalInvested,
  getTotalRedemptions,
  getCurrentInvestmentValue,
  getEmergencyFundBalance,
  getLast6Months,
  getShortMonthLabel,
  filterInvestmentsByMonth,
  CHART_COLORS,
} from '../lib/utils';
import type { Investment, InvestmentType, EmergencyFundEntry, EmergencyFundEntryType } from '../types';

export default function InvestmentsSavings() {
  const [tab, setTab] = useState<'investments' | 'emergency'>('investments');

  return (
    <div>
      <PageHeader title="Investments & Savings" subtitle="Grow and protect your wealth">
        <div className="flex gap-2">
          {(['investments', 'emergency'] as const).map((t) => (
            <button
              key={t}
              className={`chip ${tab === t ? 'chip-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'investments' ? (
                <><TrendingUp size={14} /> Mutual Funds</>
              ) : (
                <><Shield size={14} /> Emergency Fund</>
              )}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Net Summary */}
      <NetSummaryCard />

      {tab === 'investments' ? <InvestmentsTab /> : <EmergencyFundTab />}
    </div>
  );
}

// --- Net Summary Card ---
function NetSummaryCard() {
  const investments = useStore((s) => s.investments);
  const emergencyFund = useStore((s) => s.emergencyFund);
  const config = useStore((s) => s.config);

  const investmentValue = getCurrentInvestmentValue(investments);
  const efBalance = getEmergencyFundBalance(emergencyFund);
  const totalWealth = investmentValue + efBalance;

  return (
    <GlassCard className="p-5 mb-6" delay={0}>
      <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Net Savings & Investments
      </h3>
      <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>
        {formatCurrency(totalWealth, config)}
      </div>
      <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>Portfolio: {formatCurrency(investmentValue, config)}</span>
        <span>Emergency: {formatCurrency(efBalance, config)}</span>
      </div>
    </GlassCard>
  );
}

// --- Investments Tab ---
function InvestmentsTab() {
  const investments = useStore((s) => s.investments);
  const config = useStore((s) => s.config);
  const selectedMonth = useStore((s) => s.selectedMonth);
  const addInvestment = useStore((s) => s.addInvestment);
  const updateInvestment = useStore((s) => s.updateInvestment);
  const isMobile = useIsMobile();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const data = useMemo(() => {
    const totalInvested = getTotalInvested(investments);
    const totalRedeemed = getTotalRedemptions(investments);
    const currentValue = getCurrentInvestmentValue(investments);
    const gain = currentValue - (totalInvested - totalRedeemed);
    const gainPct = totalInvested - totalRedeemed > 0 ? (gain / (totalInvested - totalRedeemed)) * 100 : 0;

    // By fund
    const fundMap = new Map<string, { invested: number; currentValue: number; category: string; redeemed: number }>();
    investments.forEach((inv) => {
      const f = fundMap.get(inv.fundName) || { invested: 0, currentValue: 0, category: inv.category, redeemed: 0 };
      if (inv.type === 'Redemption') {
        f.redeemed += inv.amount;
      } else {
        f.invested += inv.amount;
      }
      if (inv.currentValue !== undefined) f.currentValue = inv.currentValue;
      fundMap.set(inv.fundName, f);
    });

    const fundCards = Array.from(fundMap.entries()).map(([name, d]) => ({
      name,
      invested: d.invested,
      redeemed: d.redeemed,
      currentValue: d.currentValue || d.invested - d.redeemed,
      category: d.category,
      gain: (d.currentValue || d.invested - d.redeemed) - (d.invested - d.redeemed),
    }));

    // Allocation by category
    const catMap = new Map<string, number>();
    fundCards.forEach((f) => {
      catMap.set(f.category, (catMap.get(f.category) || 0) + f.currentValue);
    });
    const categoryAllocation = Array.from(catMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly invested (last 6 months)
    const months = getLast6Months(selectedMonth);
    const monthlyData = months.map((m) => {
      const mInv = filterInvestmentsByMonth(investments, m);
      const invested = mInv.filter((i) => i.type !== 'Redemption').reduce((s, i) => s + i.amount, 0);
      return {
        month: getShortMonthLabel(m).split(' ')[0],
        invested,
      };
    });

    return { totalInvested, totalRedeemed, currentValue, gain, gainPct, fundCards, categoryAllocation, monthlyData };
  }, [investments, selectedMonth]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Invested" value={formatCurrency(data.totalInvested, config)} color="#6366f1" delay={0.05} />
        <StatCard label="Current Value" value={formatCurrency(data.currentValue, config)} color="#8b5cf6" delay={0.1} />
        <StatCard
          label="Gain / Loss"
          value={formatCurrency(Math.abs(data.gain), config)}
          color={data.gain >= 0 ? '#10b981' : '#f43f5e'}
          delay={0.15}
          icon={data.gain >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
        />
        <StatCard
          label="Returns"
          value={`${data.gainPct >= 0 ? '+' : ''}${data.gainPct.toFixed(1)}%`}
          color={data.gainPct >= 0 ? '#10b981' : '#f43f5e'}
          delay={0.2}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly Invested Bar */}
        <GlassCard className="p-5" delay={0.25}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Monthly Invested
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    return (
                      <div className="glass-sm p-2 text-xs">
                        {formatCurrency(payload[0].value as number, config)}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="invested" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Allocation Donut */}
        <GlassCard className="p-5" delay={0.3}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Allocation by Category
          </h3>
          {data.categoryAllocation.length > 0 ? (
            <div className="flex items-center gap-6 flex-col sm:flex-row">
              <div className="w-[160px] h-[160px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryAllocation}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.categoryAllocation.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {data.categoryAllocation.map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(cat.value, config)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No investments yet
            </div>
          )}
        </GlassCard>
      </div>

      {/* Fund Cards */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Your Funds
        </h3>
        <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Entry
        </button>
      </div>

      {data.fundCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.fundCards.map((fund, i) => (
            <GlassCard className="p-5" key={fund.name} delay={0.05 * i} hover>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {fund.name}
                  </h4>
                  <span className="chip text-xs mt-1">{fund.category}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{
                  color: fund.gain >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)',
                }}>
                  {fund.gain >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {formatCurrency(Math.abs(fund.gain), config)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Invested</span>
                  <div className="font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(fund.invested, config)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Current Value</span>
                  <div className="font-semibold tabular-nums mt-0.5" style={{ color: 'var(--color-primary)' }}>
                    {formatCurrency(fund.currentValue, config)}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="No investments yet"
          description="Start tracking your mutual funds and investments"
          action={
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Investment
            </button>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <InvestmentFormModal
        isOpen={showModal || !!editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        entry={editing}
        config={config}
        onSave={(d) => {
          if (editing) {
            updateInvestment(editing.id, d);
            showToast({ message: 'Investment updated', type: 'success' });
          } else {
            addInvestment(d as Omit<Investment, 'id'>);
            showToast({ message: 'Investment added', type: 'success' });
          }
          setShowModal(false);
          setEditing(null);
        }}
      />

      {/* FAB */}
      {!showModal && !editing && (
        <motion.button
          className="btn-primary fixed z-40"
          style={{
            bottom: isMobile ? '80px' : '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
}

// --- Emergency Fund Tab ---
function EmergencyFundTab() {
  const emergencyFund = useStore((s) => s.emergencyFund);
  const transactions = useStore((s) => s.transactions);
  const config = useStore((s) => s.config);
  const addEntry = useStore((s) => s.addEmergencyFundEntry);
  const deleteEntry = useStore((s) => s.deleteEmergencyFundEntry);
  const isMobile = useIsMobile();

  const [showModal, setShowModal] = useState(false);

  const data = useMemo(() => {
    const balance = getEmergencyFundBalance(emergencyFund);
    
    // Average monthly spending (last 3 months)
    const now = new Date();
    let totalSpend = 0;
    let monthsCount = 0;
    for (let i = 1; i <= 3; i++) {
      const m = format(new Date(now.getFullYear(), now.getMonth() - i, 1), 'yyyy-MM');
      const mTxns = transactions.filter((t) => t.date.startsWith(m) && t.type === 'Spend');
      const spend = mTxns.reduce((s, t) => s + t.amount, 0);
      if (spend > 0) {
        totalSpend += spend;
        monthsCount++;
      }
    }
    const avgMonthlySpend = monthsCount > 0 ? totalSpend / monthsCount : 50000;
    
    const targetAmount = config.emergencyFundTargetType === 'months'
      ? config.emergencyFundTarget * avgMonthlySpend
      : config.emergencyFundTarget;

    const monthsCovered = avgMonthlySpend > 0 ? balance / avgMonthlySpend : 0;
    const progress = targetAmount > 0 ? Math.min((balance / targetAmount) * 100, 100) : 0;

    const sorted = [...emergencyFund].sort((a, b) => b.date.localeCompare(a.date));

    return { balance, targetAmount, monthsCovered, progress, sorted, avgMonthlySpend };
  }, [emergencyFund, transactions, config]);

  const handleDelete = (entry: EmergencyFundEntry) => {
    deleteEntry(entry.id);
    showToast({
      message: 'Entry deleted',
      type: 'info',
      action: { label: 'Undo', onClick: () => addEntry(entry) },
    });
  };

  return (
    <div>
      {/* Progress Card */}
      <GlassCard className="p-6 mb-6" delay={0.05}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
              <motion.circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke={data.progress >= 100 ? 'var(--color-emerald)' : 'var(--color-amber)'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 60}
                initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - data.progress / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {data.progress.toFixed(0)}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>funded</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                Current Balance
              </div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-amber)' }}>
                {formatCurrency(data.balance, config)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Target</span>
                <div className="font-semibold tabular-nums">{formatCurrency(data.targetAmount, config)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Months Covered</span>
                <div className="font-semibold tabular-nums">{data.monthsCovered.toFixed(1)} months</div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* History */}
      <GlassCard className="p-5" delay={0.15}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Transaction History
          </h3>
          <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Entry
          </button>
        </div>

        {data.sorted.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {data.sorted.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ background: 'var(--surface-3)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: entry.type === 'Deposit' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                    }}
                  >
                    {entry.type === 'Deposit' ? (
                      <ArrowUpRight size={18} style={{ color: 'var(--color-emerald)' }} />
                    ) : (
                      <ArrowDownRight size={18} style={{ color: 'var(--color-rose)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {entry.type}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {entry.notes} • {format(new Date(entry.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <span
                    className="font-bold tabular-nums text-sm"
                    style={{ color: entry.type === 'Deposit' ? 'var(--color-emerald)' : 'var(--color-rose)' }}
                  >
                    {entry.type === 'Deposit' ? '+' : '-'}{formatCurrency(entry.amount, config)}
                  </span>
                  <button className="btn-icon" onClick={() => handleDelete(entry)} style={{ color: 'var(--color-rose)' }}>
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={<Shield size={48} />}
            title="No entries yet"
            description="Start building your emergency fund"
            action={
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Entry
              </button>
            }
          />
        )}
      </GlassCard>

      {/* Add Modal */}
      <EFFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={(d) => {
          addEntry(d);
          showToast({ message: 'Entry added', type: 'success' });
          setShowModal(false);
        }}
      />

      {/* FAB */}
      {!showModal && (
        <motion.button
          className="btn-primary fixed z-40"
          style={{
            bottom: isMobile ? '80px' : '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
}

// --- Investment Form Modal ---
function InvestmentFormModal({
  isOpen, onClose, entry, config, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  entry: Investment | null;
  config: typeof import('../lib/constants').DEFAULT_CONFIG;
  onSave: (d: Omit<Investment, 'id'> | Partial<Investment>) => void;
}) {
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    fundName: '',
    type: 'SIP' as InvestmentType,
    amount: '',
    units: '',
    currentValue: '',
    category: config.investmentCategories[0],
    notes: '',
  });

  useState(() => {
    if (entry) {
      setForm({
        date: entry.date,
        fundName: entry.fundName,
        type: entry.type,
        amount: String(entry.amount),
        units: entry.units ? String(entry.units) : '',
        currentValue: entry.currentValue ? String(entry.currentValue) : '',
        category: entry.category,
        notes: entry.notes,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || !form.fundName) return;

    onSave({
      date: form.date,
      fundName: form.fundName,
      type: form.type,
      amount,
      units: form.units ? parseFloat(form.units) : undefined,
      currentValue: form.currentValue ? parseFloat(form.currentValue) : undefined,
      category: form.category,
      notes: form.notes,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Edit Investment' : 'Add Investment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Fund Name">
          <input
            type="text"
            placeholder="e.g. Nifty 50 Index Fund"
            value={form.fundName}
            onChange={(e) => setForm({ ...form, fundName: e.target.value })}
            required
            autoFocus
          />
        </FormField>

        <div className="flex gap-2">
          {(['SIP', 'Lumpsum', 'Redemption'] as InvestmentType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip flex-1 justify-center ${form.type === t ? 'chip-active' : ''}`}
              onClick={() => setForm({ ...form, type: t })}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Amount">
            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {config.investmentCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Units (optional)">
            <input type="number" placeholder="0" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} step="0.01" />
          </FormField>
        </div>

        <FormField label="Current Value (optional)">
          <input type="number" placeholder="0" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} min="0" />
        </FormField>

        <FormField label="Notes">
          <input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1">{entry ? 'Update' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}

// --- Emergency Fund Form Modal ---
function EFFormModal({
  isOpen, onClose, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: Omit<EmergencyFundEntry, 'id'>) => void;
}) {
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'Deposit' as EmergencyFundEntryType,
    amount: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount) return;

    onSave({
      date: form.date,
      type: form.type,
      amount,
      notes: form.notes,
    });

    setForm({ date: format(new Date(), 'yyyy-MM-dd'), type: 'Deposit', amount: '', notes: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Emergency Fund Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(['Deposit', 'Withdrawal'] as EmergencyFundEntryType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all`}
              style={{
                background: form.type === t
                  ? t === 'Deposit'
                    ? 'linear-gradient(135deg, var(--color-emerald), #059669)'
                    : 'linear-gradient(135deg, var(--color-rose), #e11d48)'
                  : 'var(--surface-2)',
                color: form.type === t ? 'white' : 'var(--text-secondary)',
              }}
              onClick={() => setForm({ ...form, type: t })}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Amount">
            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" autoFocus />
          </FormField>
        </div>

        <FormField label="Notes">
          <input type="text" placeholder="e.g. Monthly contribution" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1">Add Entry</button>
        </div>
      </form>
    </Modal>
  );
}
