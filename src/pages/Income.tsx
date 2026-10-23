// ========================================
// Income Page
// ========================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { Plus, Edit3, Trash2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../lib/store';
import { GlassCard, PageHeader, Modal, FormField, EmptyState } from '../components/shared';
import { MonthSelector } from '../components/shared/MonthSelector';
import { useIsMobile, showToast } from '../hooks';
import {
  formatCurrency,
  filterIncomeByMonth,
  getTotalIncome,
  getLast6Months,
  getShortMonthLabel,
  percentChange,
  CHART_COLORS,
} from '../lib/utils';
import type { IncomeEntry } from '../types';

export default function Income() {
  const income = useStore((s) => s.income);
  const config = useStore((s) => s.config);
  const selectedMonth = useStore((s) => s.selectedMonth);
  const addIncome = useStore((s) => s.addIncome);
  const updateIncome = useStore((s) => s.updateIncome);
  const deleteIncome = useStore((s) => s.deleteIncome);
  const isMobile = useIsMobile();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IncomeEntry | null>(null);

  const data = useMemo(() => {
    const monthEntries = filterIncomeByMonth(income, selectedMonth);
    const totalIncome = getTotalIncome(monthEntries);

    // By source
    const bySource = new Map<string, number>();
    monthEntries.forEach((e) => {
      bySource.set(e.source, (bySource.get(e.source) || 0) + e.amount);
    });
    const sourceTotals = Array.from(bySource.entries())
      .map(([source, amount]) => ({ source, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Previous month comparison
    const prevMonth = selectedMonth.split('-').map(Number);
    const prevMonthStr = prevMonth[1] === 1
      ? `${prevMonth[0] - 1}-12`
      : `${prevMonth[0]}-${String(prevMonth[1] - 1).padStart(2, '0')}`;
    const prevEntries = filterIncomeByMonth(income, prevMonthStr);
    const prevTotal = getTotalIncome(prevEntries);

    // Trend (last 6 months)
    const months = getLast6Months(selectedMonth);
    const trendData = months.map((m) => {
      const mEntries = filterIncomeByMonth(income, m);
      const sourceMap: Record<string, number> = {};
      config.incomeSources.forEach((s) => {
        const amt = mEntries.filter((e) => e.source === s).reduce((sum, e) => sum + e.amount, 0);
        if (amt > 0) sourceMap[s] = amt;
      });
      return {
        month: getShortMonthLabel(m).split(' ')[0],
        total: getTotalIncome(mEntries),
        ...sourceMap,
      };
    });

    return { monthEntries, totalIncome, sourceTotals, prevTotal, trendData };
  }, [income, selectedMonth, config.incomeSources]);

  const handleDelete = (entry: IncomeEntry) => {
    const restored = { ...entry };
    deleteIncome(entry.id);
    showToast({
      message: `Deleted income: ${entry.source}`,
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => addIncome(restored),
      },
    });
  };

  return (
    <div>
      <PageHeader title="Income" subtitle="Track all your income sources">
        <MonthSelector />
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-5" delay={0}>
          <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>
            Total Income
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: 'var(--color-primary)' }}>
            {formatCurrency(data.totalIncome, config)}
          </div>
          {data.prevTotal > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className="text-xs font-semibold"
                style={{
                  color: data.totalIncome >= data.prevTotal ? 'var(--color-emerald)' : 'var(--color-rose)',
                }}
              >
                {percentChange(data.totalIncome, data.prevTotal) >= 0 ? '+' : ''}
                {percentChange(data.totalIncome, data.prevTotal)}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>vs last month</span>
            </div>
          )}
        </GlassCard>

        {data.sourceTotals.slice(0, 2).map((s, i) => (
          <GlassCard className="p-5" delay={0.05 * (i + 1)} key={s.source}>
            <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>
              {s.source}
            </div>
            <div className="text-xl font-bold tabular-nums mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(s.amount, config)}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Trend Chart */}
      <GlassCard className="p-5 mb-6" delay={0.15}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Income Trend (Last 6 Months)
        </h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                width={55}
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
              {config.incomeSources.map((source, i) => (
                <Bar
                  key={source}
                  dataKey={source}
                  stackId="income"
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={i === config.incomeSources.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Income Entries */}
      <GlassCard className="p-5" delay={0.2}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Income Entries
          </h3>
          <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Income
          </button>
        </div>

        {data.monthEntries.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {data.monthEntries.map((entry, i) => (
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.1)' }}
                  >
                    <Wallet size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {entry.source}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {entry.notes} • {format(new Date(entry.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--color-emerald)' }}>
                    +{formatCurrency(entry.amount, config)}
                  </span>
                  <div className="flex gap-1">
                    <button className="btn-icon" onClick={() => { setEditing(entry); setShowModal(true); }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(entry)} style={{ color: 'var(--color-rose)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={<Wallet size={48} />}
            title="No income recorded"
            description="Add your income entries for this month"
            action={
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Income
              </button>
            }
          />
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      <IncomeFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        entry={editing}
        config={config}
        selectedMonth={selectedMonth}
        onSave={(data) => {
          if (editing) {
            updateIncome(editing.id, data);
            showToast({ message: 'Income updated', type: 'success' });
          } else {
            addIncome(data as Omit<IncomeEntry, 'id'>);
            showToast({ message: 'Income added', type: 'success' });
          }
          setShowModal(false);
          setEditing(null);
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

// --- Income Form Modal ---
function IncomeFormModal({
  isOpen,
  onClose,
  entry,
  config,
  selectedMonth,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  entry: IncomeEntry | null;
  config: typeof import('../lib/constants').DEFAULT_CONFIG;
  selectedMonth: string;
  onSave: (data: Omit<IncomeEntry, 'id'> | Partial<IncomeEntry>) => void;
}) {
  const [formData, setFormData] = useState({
    month: selectedMonth,
    source: config.incomeSources[0],
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  useState(() => {
    if (entry) {
      setFormData({
        month: entry.month,
        source: entry.source,
        amount: String(entry.amount),
        date: entry.date,
        notes: entry.notes,
      });
    } else {
      setFormData({
        month: selectedMonth,
        source: config.incomeSources[0],
        amount: '',
        date: `${selectedMonth}-01`,
        notes: '',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;

    onSave({
      month: formData.month,
      source: formData.source,
      amount,
      date: formData.date,
      notes: formData.notes,
    });

    setFormData({
      month: selectedMonth,
      source: config.incomeSources[0],
      amount: '',
      date: `${selectedMonth}-01`,
      notes: '',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Edit Income' : 'Add Income'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Source">
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              {config.incomeSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount">
            <input
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
              autoFocus
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Month">
            <input
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Date">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <input
            type="text"
            placeholder="e.g. Monthly salary credited"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            {entry ? 'Update' : 'Add Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
