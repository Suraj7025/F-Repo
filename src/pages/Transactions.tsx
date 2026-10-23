// ========================================
// Transactions Page
// ========================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Edit3, Trash2,
  TrendingDown, TrendingUp, ArrowUpDown, Download, Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../lib/store';
import { GlassCard, PageHeader, Modal, FormField, EmptyState } from '../components/shared';
import { MonthSelector } from '../components/shared/MonthSelector';
import { useIsMobile, showToast } from '../hooks';
import {
  formatCurrency,
  filterTransactionsByMonth,
  getTotalSpend,
  getTotalCredit,
} from '../lib/utils';
import type { Transaction, TransactionType } from '../types';

type SortField = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

export default function Transactions() {
  const transactions = useStore((s) => s.transactions);
  const config = useStore((s) => s.config);
  const selectedMonth = useStore((s) => s.selectedMonth);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const importTransactions = useStore((s) => s.importTransactions);

  const isMobile = useIsMobile();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<TransactionType>('Spend');
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterType, setFilterType] = useState<'' | TransactionType>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showImport, setShowImport] = useState(false);

  const monthTxns = useMemo(() => {
    let filtered = filterTransactionsByMonth(transactions, selectedMonth);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.notes.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.source.toLowerCase().includes(q)
      );
    }
    if (filterCategory) filtered = filtered.filter((t) => t.category === filterCategory);
    if (filterSource) filtered = filtered.filter((t) => t.source === filterSource);
    if (filterType) filtered = filtered.filter((t) => t.type === filterType);

    filtered.sort((a, b) => {
      const aVal = sortField === 'amount' ? a.amount : sortField === 'category' ? a.category : a.date;
      const bVal = sortField === 'amount' ? b.amount : sortField === 'category' ? b.category : b.date;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return filtered;
  }, [transactions, selectedMonth, search, filterCategory, filterSource, filterType, sortField, sortDir]);

  const totalSpend = getTotalSpend(monthTxns);
  const totalCredit = getTotalCredit(monthTxns);

  const openAddTransaction = (type: TransactionType = 'Spend') => {
    setEditingTxn(null);
    setNewTransactionType(type);
    setShowAddModal(true);
  };

  const handleDelete = (txn: Transaction) => {
    const restored = { ...txn };
    deleteTransaction(txn.id);
    showToast({
      message: `Deleted "${txn.notes || txn.category}"`,
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => {
          addTransaction(restored);
        },
      },
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleExportJSON = () => {
    const data = monthTxns.map(({ id: _id, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finflow-transactions-${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Exported successfully', type: 'success' });
  };

  const handleExportCSV = () => {
    const headers = 'Date,Type,Amount,Category,Notes,Source\n';
    const rows = monthTxns
      .map((t) => `${t.date},${t.type},${t.amount},"${t.category}","${t.notes}","${t.source}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finflow-transactions-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Exported CSV', type: 'success' });
  };

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Track every rupee in and out">
        <MonthSelector />
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-4" delay={0}>
          <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Total Spent</div>
          <div className="text-xl font-bold tabular-nums mt-1" style={{ color: 'var(--color-rose)' }}>
            {formatCurrency(totalSpend, config)}
          </div>
        </GlassCard>
        <GlassCard className="p-4" delay={0.05}>
          <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Credits</div>
          <div className="text-xl font-bold tabular-nums mt-1" style={{ color: 'var(--color-emerald)' }}>
            {formatCurrency(totalCredit, config)}
          </div>
        </GlassCard>
        <GlassCard className="p-4 col-span-2 sm:col-span-1" delay={0.1}>
          <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Count</div>
          <div className="text-xl font-bold tabular-nums mt-1" style={{ color: 'var(--text-primary)' }}>
            {monthTxns.length}
          </div>
        </GlassCard>
      </div>

      {/* Toolbar */}
      <GlassCard className="p-4 mb-6" delay={0.12}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ borderRadius: '12px' }}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm"
              style={{ minWidth: '120px', borderRadius: '12px' }}
            >
              <option value="">All Categories</option>
              {config.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-sm"
              style={{ minWidth: '100px', borderRadius: '12px' }}
            >
              <option value="">All Sources</option>
              {config.sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as '' | TransactionType)}
              className="text-sm"
              style={{ minWidth: '90px', borderRadius: '12px' }}
            >
              <option value="">All Types</option>
              <option value="Spend">Spend</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex items-center gap-2">
              <button className="btn-secondary flex-1 sm:flex-none" onClick={() => openAddTransaction('Credit')}>
                <TrendingUp size={16} /> Add Credit
              </button>
              <button className="btn-primary flex-1 sm:flex-none" onClick={() => openAddTransaction('Spend')}>
                <Plus size={16} /> Add Spend
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button className="btn-secondary text-xs shrink-0" onClick={handleExportJSON}>
                <Download size={14} /> JSON
              </button>
              <button className="btn-secondary text-xs shrink-0" onClick={handleExportCSV}>
                <Download size={14} /> CSV
              </button>
              <button className="btn-secondary text-xs shrink-0" onClick={() => setShowImport(true)}>
                <Upload size={14} /> Import
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Transaction List */}
      {monthTxns.length > 0 ? (
        isMobile ? (
          <TransactionCardList
            transactions={monthTxns}
            config={config}
            onEdit={setEditingTxn}
            onDelete={handleDelete}
          />
        ) : (
          <GlassCard className="overflow-x-auto" delay={0.15}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="cursor-pointer" onClick={() => toggleSort('date')}>
                    Date <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th>Type</th>
                  <th className="cursor-pointer" onClick={() => toggleSort('amount')}>
                    Amount <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="cursor-pointer" onClick={() => toggleSort('category')}>
                    Category <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th>Notes</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {monthTxns.map((txn) => (
                    <motion.tr
                      key={txn.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <td className="tabular-nums whitespace-nowrap">
                        {format(new Date(txn.date), 'MMM d, yyyy')}
                      </td>
                      <td>
                        <span
                          className="chip text-xs"
                          style={{
                            background: txn.type === 'Spend' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                            color: txn.type === 'Spend' ? 'var(--color-rose)' : 'var(--color-emerald)',
                            border: 'none',
                          }}
                        >
                          {txn.type === 'Spend' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          {txn.type}
                        </span>
                      </td>
                      <td
                        className="font-semibold tabular-nums"
                        style={{ color: txn.type === 'Spend' ? 'var(--color-rose)' : 'var(--color-emerald)' }}
                      >
                        {txn.type === 'Spend' ? '-' : '+'}{formatCurrency(txn.amount, config)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{txn.category}</td>
                      <td className="max-w-[200px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                        {txn.notes}
                      </td>
                      <td>
                        <span className="chip text-xs">{txn.source}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn-icon" onClick={() => setEditingTxn(txn)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(txn)} style={{ color: 'var(--color-rose)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </GlassCard>
        )
      ) : (
        <EmptyState
          icon={filterType === 'Credit' ? <TrendingUp size={48} /> : <Filter size={48} />}
          title={filterType === 'Credit' ? 'No credits this month' : 'No transactions found'}
          description={filterType === 'Credit' ? 'Add a refund, cashback, or other credit to see it here.' : 'Add your first transaction or adjust filters'}
          action={
            <button className="btn-primary" onClick={() => openAddTransaction(filterType === 'Credit' ? 'Credit' : 'Spend')}>
              <Plus size={16} /> {filterType === 'Credit' ? 'Add Credit' : 'Add Transaction'}
            </button>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <TransactionFormModal
        key={editingTxn ? `edit-${editingTxn.id}` : `new-${newTransactionType}-${showAddModal}`}
        isOpen={showAddModal || !!editingTxn}
        onClose={() => { setShowAddModal(false); setEditingTxn(null); }}
        transaction={editingTxn}
        initialType={newTransactionType}
        config={config}
        onSave={(data) => {
          if (editingTxn) {
            updateTransaction(editingTxn.id, data);
            showToast({ message: 'Transaction updated', type: 'success' });
          } else {
            addTransaction(data as Omit<Transaction, 'id'>);
            showToast({ message: 'Transaction added', type: 'success' });
          }
          setShowAddModal(false);
          setEditingTxn(null);
        }}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={(txns) => {
          importTransactions(txns);
          showToast({ message: `Imported ${txns.length} transactions`, type: 'success' });
          setShowImport(false);
        }}
      />

      {/* FAB */}
      {!showAddModal && !editingTxn && (
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
          onClick={() => openAddTransaction('Spend')}
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
}

// --- Transaction Card List (Mobile) ---
function TransactionCardList({
  transactions,
  config,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  config: typeof import('../lib/constants').DEFAULT_CONFIG;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {transactions.map((txn, i) => (
          <motion.div
            key={txn.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: i * 0.02 }}
            className="glass-sm p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: txn.type === 'Spend' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                }}
              >
                {txn.type === 'Spend' ? (
                  <TrendingDown size={18} style={{ color: 'var(--color-rose)' }} />
                ) : (
                  <TrendingUp size={18} style={{ color: 'var(--color-emerald)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {txn.notes || txn.category}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {txn.category} • {txn.source} • {format(new Date(txn.date), 'MMM d')}
                    </div>
                  </div>
                  <span
                    className="font-bold tabular-nums text-sm flex-shrink-0"
                    style={{ color: txn.type === 'Spend' ? 'var(--color-rose)' : 'var(--color-emerald)' }}
                  >
                    {txn.type === 'Spend' ? '-' : '+'}{formatCurrency(txn.amount, config)}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="btn-icon text-xs" onClick={() => onEdit(txn)}>
                    <Edit3 size={14} />
                  </button>
                  <button className="btn-icon text-xs" onClick={() => onDelete(txn)} style={{ color: 'var(--color-rose)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Transaction Form Modal ---
function TransactionFormModal({
  isOpen,
  onClose,
  transaction,
  initialType,
  config,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  initialType: TransactionType;
  config: typeof import('../lib/constants').DEFAULT_CONFIG;
  onSave: (data: Omit<Transaction, 'id'> | Partial<Transaction>) => void;
}) {
  const [formData, setFormData] = useState(() => transaction ? {
    date: transaction.date,
    type: transaction.type,
    amount: String(transaction.amount),
    category: transaction.category,
    notes: transaction.notes,
    source: transaction.source,
  } : {
    date: format(new Date(), 'yyyy-MM-dd'),
    type: initialType,
    amount: '',
    category: config.categories[0] || 'Other',
    notes: '',
    source: config.sources[0] || 'Cash',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;

    onSave({
      date: formData.date,
      type: formData.type,
      amount,
      category: formData.category,
      notes: formData.notes,
      source: formData.source,
    });

    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Spend',
      amount: '',
      category: config.categories[0],
      notes: '',
      source: config.sources[0],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          {(['Spend', 'Credit'] as TransactionType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                formData.type === type ? 'text-white' : ''
              }`}
              style={{
                background:
                  formData.type === type
                    ? type === 'Spend'
                      ? 'linear-gradient(135deg, var(--color-rose), #e11d48)'
                      : 'linear-gradient(135deg, var(--color-emerald), #059669)'
                    : 'var(--surface-2)',
                color: formData.type === type ? 'white' : 'var(--text-secondary)',
                border: '1px solid transparent',
              }}
              onClick={() => setFormData({ ...formData, type })}
            >
              {type === 'Spend' ? <TrendingDown size={14} className="inline mr-1" /> : <TrendingUp size={14} className="inline mr-1" />}
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Amount">
            <input
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
              step="0.01"
              autoFocus
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {config.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Source">
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              {config.sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Notes">
          <input
            type="text"
            placeholder="What was this for?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            {transaction ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// --- Import Modal ---
function ImportModal({
  isOpen,
  onClose,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (txns: Omit<Transaction, 'id'>[]) => void;
}) {
  const [preview, setPreview] = useState<Omit<Transaction, 'id'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const config = useStore((s) => s.config);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) {
          setErrors(['File must contain a JSON array']);
          return;
        }

        const valid: Omit<Transaction, 'id'>[] = [];
        const errs: string[] = [];

        data.forEach((row: Record<string, unknown>, i: number) => {
          if (!row.date || !row.type || !row.amount) {
            errs.push(`Row ${i + 1}: Missing required fields (date, type, amount)`);
            return;
          }
          if (row.type !== 'Spend' && row.type !== 'Credit') {
            errs.push(`Row ${i + 1}: type must be "Spend" or "Credit"`);
            return;
          }
          valid.push({
            date: String(row.date),
            type: row.type as TransactionType,
            amount: Number(row.amount),
            category: String(row.category || 'Other'),
            notes: String(row.notes || ''),
            source: String(row.source || 'Other'),
          });
        });

        setPreview(valid);
        setErrors(errs);
      } catch {
        setErrors(['Invalid JSON file']);
      }
    };
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const sample = [
      { date: '2026-10-15', type: 'Spend', amount: 450, category: 'Food & Dining', notes: 'Lunch', source: 'UPI' },
      { date: '2026-10-14', type: 'Credit', amount: 85000, category: 'Other', notes: 'Salary', source: 'Bank Transfer' },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finflow-sample-import.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Transactions" width="600px">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upload a JSON file with your transactions. Each entry should have: date, type, amount, category, notes, source.
        </p>

        <button className="btn-secondary text-sm" onClick={downloadSample}>
          <Download size={14} /> Download Sample JSON
        </button>

        <input type="file" accept=".json" onChange={handleFile} className="text-sm" />

        {errors.length > 0 && (
          <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--color-rose)' }}>
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        {preview.length > 0 && (
          <>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Preview: {preview.length} valid transactions
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {preview.slice(0, 10).map((t, i) => (
                <div key={i} className="text-xs p-2 rounded-lg flex justify-between" style={{ background: 'var(--surface-3)' }}>
                  <span>{t.date} • {t.category}</span>
                  <span className="font-semibold tabular-nums" style={{ color: t.type === 'Spend' ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                    {formatCurrency(t.amount, config)}
                  </span>
                </div>
              ))}
              {preview.length > 10 && (
                <div className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  ...and {preview.length - 10} more
                </div>
              )}
            </div>
            <button
              className="btn-primary w-full"
              onClick={() => {
                onImport(preview);
                setPreview([]);
                setErrors([]);
              }}
            >
              Import {preview.length} Transactions
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
