// ========================================
// Settings Page (Configuration, Google Setup, Import/Export)
// ========================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Cloud,
  FileSpreadsheet,
  Upload,
  Download,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  X,
  FileText,
  Key,
  Database,
  Moon,
  Sun,
  Laptop,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { GlassCard, PageHeader, Modal, FormField } from '../components/shared';
import { showToast } from '../hooks';
import { api } from '../lib/api';
import { generateDemoTransactions, generateDemoIncome, generateDemoInvestments, generateDemoEmergencyFund, generateDemoBudgets } from '../lib/demo-data';
import type { GoogleConfig, Transaction } from '../types';

type SettingsTab = 'config' | 'categories' | 'google' | 'import-export';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound (£)' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar (A$)' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar (S$)' },
  { code: 'AED', symbol: 'AED', locale: 'ar-AE', name: 'UAE Dirham (AED)' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen (¥)' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('config');

  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const googleConfig = useStore((s) => s.googleConfig);
  const updateGoogleConfig = useStore((s) => s.updateGoogleConfig);
  const migrateToGoogle = useStore((s) => s.migrateToGoogle);
  const transactions = useStore((s) => s.transactions);
  const income = useStore((s) => s.income);
  const investments = useStore((s) => s.investments);
  const emergencyFund = useStore((s) => s.emergencyFund);
  const budgets = useStore((s) => s.budgets);
  const importTransactions = useStore((s) => s.importTransactions);

  // Form states for adding items
  const [newCategory, setNewCategory] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newIncomeSource, setNewIncomeSource] = useState('');
  const [newInvestmentCategory, setNewInvestmentCategory] = useState('');

  // Google Setup Form State
  const [sheetUrlInput, setSheetUrlInput] = useState(googleConfig.spreadsheetId || '');
  const [webAppUrlInput, setWebAppUrlInput] = useState(googleConfig.webAppUrl || '');
  const [secretKeyInput, setSecretKeyInput] = useState(googleConfig.secretKey || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCreatingNewYear, setIsCreatingNewYear] = useState(false);

  // Import State
  const [parsedRows, setParsedRows] = useState<{ data: Partial<Transaction>; valid: boolean; error?: string }[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Edit / Rename Modal State
  const [editingItem, setEditingItem] = useState<{
    type: 'category' | 'source' | 'incomeSource' | 'investmentCategory';
    original: string;
    value: string;
  } | null>(null);

  // Confirmation Modals
  const [showResetModal, setShowResetModal] = useState(false);

  // Extract spreadsheet ID from link or text
  const extractSpreadsheetId = (input: string) => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleSaveGoogleSetup = () => {
    const extractedId = extractSpreadsheetId(sheetUrlInput);
    if (!extractedId || !webAppUrlInput || !secretKeyInput) {
      showToast({ message: 'Please fill in all Google Sheets fields', type: 'error' });
      return;
    }

    updateGoogleConfig({
      spreadsheetId: extractedId,
      webAppUrl: webAppUrlInput.trim(),
      secretKey: secretKeyInput.trim(),
      configured: true,
    });

    showToast({ message: 'Google configuration saved!', type: 'success' });
  };

  const handleTestConnection = async () => {
    const extractedId = extractSpreadsheetId(sheetUrlInput);
    if (!webAppUrlInput || !secretKeyInput) {
      showToast({ message: 'Please provide Web App URL and Secret Key', type: 'error' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    const testConf: GoogleConfig = {
      spreadsheetId: extractedId,
      webAppUrl: webAppUrlInput.trim(),
      secretKey: secretKeyInput.trim(),
      configured: true,
    };

    try {
      const ok = await api.testConnection(testConf);
      if (ok) {
        setTestResult({ success: true, message: 'Connection successful! Web App replied correctly.' });
        showToast({ message: 'Connected to Google Sheets successfully!', type: 'success' });
      } else {
        setTestResult({ success: false, message: 'Could not connect. Check Web App URL and Secret Key.' });
        showToast({ message: 'Connection failed', type: 'error' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
      showToast({ message: 'Connection error', type: 'error' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleMigrate = async () => {
    if (!googleConfig.configured) {
      showToast({ message: 'Please save configuration first', type: 'warning' });
      return;
    }
    setIsMigrating(true);
    try {
      await migrateToGoogle();
      showToast({ message: 'Local data migrated to Google Sheets!', type: 'success' });
    } catch (err: any) {
      showToast({ message: `Migration error: ${err.message}`, type: 'error' });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCreateNewYearSheet = async () => {
    if (!googleConfig.configured) {
      showToast({ message: 'Please configure Google integration first', type: 'warning' });
      return;
    }
    setIsCreatingNewYear(true);
    const nextYear = new Date().getFullYear() + 1;
    try {
      const res: any = await fetch(googleConfig.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'createYearSpreadsheet',
          secretKey: googleConfig.secretKey,
          year: nextYear,
        }),
      }).then((r) => r.json());

      if (res.success && res.spreadsheetId) {
        updateGoogleConfig({ spreadsheetId: res.spreadsheetId });
        setSheetUrlInput(res.spreadsheetId);
        showToast({ message: `Created "${res.name}" sheet and switched!`, type: 'success' });
      } else {
        throw new Error(res.error || 'Failed to create sheet');
      }
    } catch (e: any) {
      showToast({ message: e.message || 'Failed to create new year sheet', type: 'error' });
    } finally {
      setIsCreatingNewYear(false);
    }
  };

  // --- Category / Source Helpers ---
  const handleAddCategory = () => {
    const val = newCategory.trim();
    if (!val) return;
    if (config.categories.includes(val)) {
      showToast({ message: 'Category already exists', type: 'warning' });
      return;
    }
    updateConfig({ categories: [...config.categories, val] });
    setNewCategory('');
    showToast({ message: `Added "${val}" category`, type: 'success' });
  };

  const handleDeleteCategory = (cat: string) => {
    if (config.categories.length <= 1) {
      showToast({ message: 'At least one category is required', type: 'warning' });
      return;
    }
    updateConfig({ categories: config.categories.filter((c) => c !== cat) });
    showToast({ message: `Removed "${cat}"`, type: 'info' });
  };

  const handleAddSource = () => {
    const val = newSource.trim();
    if (!val) return;
    if (config.sources.includes(val)) {
      showToast({ message: 'Source already exists', type: 'warning' });
      return;
    }
    updateConfig({ sources: [...config.sources, val] });
    setNewSource('');
    showToast({ message: `Added source "${val}"`, type: 'success' });
  };

  const handleDeleteSource = (src: string) => {
    if (config.sources.length <= 1) {
      showToast({ message: 'At least one source is required', type: 'warning' });
      return;
    }
    updateConfig({ sources: config.sources.filter((s) => s !== src) });
  };

  const handleAddIncomeSource = () => {
    const val = newIncomeSource.trim();
    if (!val) return;
    if (config.incomeSources.includes(val)) {
      showToast({ message: 'Income source already exists', type: 'warning' });
      return;
    }
    updateConfig({ incomeSources: [...config.incomeSources, val] });
    setNewIncomeSource('');
    showToast({ message: `Added "${val}" to income sources`, type: 'success' });
  };

  const handleDeleteIncomeSource = (src: string) => {
    if (config.incomeSources.length <= 1) {
      showToast({ message: 'At least one income source is required', type: 'warning' });
      return;
    }
    updateConfig({ incomeSources: config.incomeSources.filter((s) => s !== src) });
  };

  const handleAddInvestmentCategory = () => {
    const val = newInvestmentCategory.trim();
    if (!val) return;
    if (config.investmentCategories.includes(val)) {
      showToast({ message: 'Investment category already exists', type: 'warning' });
      return;
    }
    updateConfig({ investmentCategories: [...config.investmentCategories, val] });
    setNewInvestmentCategory('');
    showToast({ message: `Added "${val}" to investment categories`, type: 'success' });
  };

  const handleDeleteInvestmentCategory = (cat: string) => {
    if (config.investmentCategories.length <= 1) {
      showToast({ message: 'At least one category is required', type: 'warning' });
      return;
    }
    updateConfig({ investmentCategories: config.investmentCategories.filter((c) => c !== cat) });
  };

  const handleSaveRename = () => {
    if (!editingItem) return;
    const newVal = editingItem.value.trim();
    if (!newVal || newVal === editingItem.original) {
      setEditingItem(null);
      return;
    }

    if (editingItem.type === 'category') {
      if (config.categories.includes(newVal)) {
        showToast({ message: 'Category already exists', type: 'warning' });
        return;
      }
      const updated = config.categories.map((c) => (c === editingItem.original ? newVal : c));
      updateConfig({ categories: updated });

      // Update existing transactions with renamed category
      const updatedTxns = transactions.map((t) => (t.category === editingItem.original ? { ...t, category: newVal } : t));
      useStore.setState({ transactions: updatedTxns });
      api.saveTransactions(updatedTxns);

      // Update existing budget allocations
      const updatedBudgets = budgets.map((b) => ({
        ...b,
        allocations: b.allocations.map((a) => (a.category === editingItem.original ? { ...a, category: newVal } : a)),
      }));
      useStore.setState({ budgets: updatedBudgets });
      api.saveBudgets(updatedBudgets);

      showToast({ message: `Renamed category to "${newVal}"`, type: 'success' });
    } else if (editingItem.type === 'source') {
      if (config.sources.includes(newVal)) {
        showToast({ message: 'Source already exists', type: 'warning' });
        return;
      }
      const updated = config.sources.map((s) => (s === editingItem.original ? newVal : s));
      updateConfig({ sources: updated });

      const updatedTxns = transactions.map((t) => (t.source === editingItem.original ? { ...t, source: newVal } : t));
      useStore.setState({ transactions: updatedTxns });
      api.saveTransactions(updatedTxns);

      showToast({ message: `Renamed payment source to "${newVal}"`, type: 'success' });
    } else if (editingItem.type === 'incomeSource') {
      if (config.incomeSources.includes(newVal)) {
        showToast({ message: 'Income source already exists', type: 'warning' });
        return;
      }
      const updated = config.incomeSources.map((s) => (s === editingItem.original ? newVal : s));
      updateConfig({ incomeSources: updated });

      const updatedIncome = income.map((i) => (i.source === editingItem.original ? { ...i, source: newVal } : i));
      useStore.setState({ income: updatedIncome });
      api.saveIncome(updatedIncome);

      showToast({ message: `Renamed income stream to "${newVal}"`, type: 'success' });
    } else if (editingItem.type === 'investmentCategory') {
      if (config.investmentCategories.includes(newVal)) {
        showToast({ message: 'Investment class already exists', type: 'warning' });
        return;
      }
      const updated = config.investmentCategories.map((c) => (c === editingItem.original ? newVal : c));
      updateConfig({ investmentCategories: updated });

      const updatedInv = investments.map((inv) => (inv.category === editingItem.original ? { ...inv, category: newVal } : inv));
      useStore.setState({ investments: updatedInv });
      api.saveInvestments(updatedInv);

      showToast({ message: `Renamed investment class to "${newVal}"`, type: 'success' });
    }

    setEditingItem(null);
  };

  // --- Import / Export Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      validateJson(content);
    };
    reader.readAsText(file);
  };

  const validateJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        showToast({ message: 'JSON must be an array of transaction objects', type: 'error' });
        return;
      }

      const rows = parsed.map((item: any) => {
        let error = '';
        if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          error = 'Invalid date (YYYY-MM-DD required)';
        } else if (item.type !== 'Spend' && item.type !== 'Credit') {
          error = 'Type must be "Spend" or "Credit"';
        } else if (typeof item.amount !== 'number' || item.amount <= 0) {
          error = 'Amount must be positive number';
        } else if (!item.category) {
          error = 'Category is required';
        } else if (!item.source) {
          error = 'Source is required';
        }

        return {
          data: item,
          valid: !error,
          error,
        };
      });

      const validCount = rows.filter((r) => r.valid).length;
      setParsedRows(rows);
      setImportSummary({
        total: rows.length,
        valid: validCount,
        invalid: rows.length - validCount,
      });
    } catch {
      showToast({ message: 'Invalid JSON format', type: 'error' });
    }
  };

  const handleConfirmImport = () => {
    const validItems = parsedRows.filter((r) => r.valid).map((r) => r.data as Omit<Transaction, 'id'>);
    if (validItems.length === 0) {
      showToast({ message: 'No valid rows to import', type: 'warning' });
      return;
    }
    importTransactions(validItems);
    showToast({ message: `Successfully imported ${validItems.length} transactions!`, type: 'success' });
    setParsedRows([]);
    setImportSummary(null);
  };

  const handleDownloadSample = () => {
    const sample: Omit<Transaction, 'id'>[] = [
      {
        date: '2026-10-15',
        type: 'Spend',
        amount: 850,
        category: 'Food & Dining',
        notes: 'Lunch with colleagues',
        source: 'UPI',
      },
      {
        date: '2026-10-16',
        type: 'Spend',
        amount: 1400,
        category: 'Groceries',
        notes: 'Supermarket weekly essentials',
        source: 'Credit Card',
      },
      {
        date: '2026-10-18',
        type: 'Credit',
        amount: 2500,
        category: 'Other',
        notes: 'Refund from merchant',
        source: 'Bank Transfer',
      },
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finflow_sample_transactions.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Sample JSON downloaded', type: 'success' });
  };

  const handleExportJson = () => {
    const fullBackup = {
      transactions,
      income,
      investments,
      emergencyFund,
      budgets,
      config,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Full backup exported to JSON!', type: 'success' });
  };

  const handleExportCsv = (type: 'transactions' | 'income' | 'investments') => {
    let csv = '';
    let filename = '';

    if (type === 'transactions') {
      csv = 'id,date,type,amount,category,source,notes\n' +
        transactions
          .map((t) => `"${t.id}","${t.date}","${t.type}",${t.amount},"${t.category}","${t.source}","${(t.notes || '').replace(/"/g, '""')}"`)
          .join('\n');
      filename = `finflow_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === 'income') {
      csv = 'id,month,source,amount,date,notes\n' +
        income
          .map((i) => `"${i.id}","${i.month}","${i.source}",${i.amount},"${i.date}","${(i.notes || '').replace(/"/g, '""')}"`)
          .join('\n');
      filename = `finflow_income_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      csv = 'id,date,fundName,type,amount,units,currentValue,category,notes\n' +
        investments
          .map((inv) => `"${inv.id}","${inv.date}","${inv.fundName}","${inv.type}",${inv.amount},${inv.units || ''},${inv.currentValue || ''},"${inv.category}","${(inv.notes || '').replace(/"/g, '""')}"`)
          .join('\n');
      filename = `finflow_investments_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: `Exported ${type} to CSV!`, type: 'success' });
  };

  // Reset demo data handler
  const handleResetDemoData = () => {
    const demoTxns = generateDemoTransactions();
    const demoInc = generateDemoIncome();
    const demoInv = generateDemoInvestments();
    const demoEf = generateDemoEmergencyFund();
    const demoBud = generateDemoBudgets();

    api.saveTransactions(demoTxns);
    api.saveIncome(demoInc);
    api.saveInvestments(demoInv);
    api.saveEmergencyFund(demoEf);
    api.saveBudgets(demoBud);

    useStore.setState({
      transactions: demoTxns,
      income: demoInc,
      investments: demoInv,
      emergencyFund: demoEf,
      budgets: demoBud,
    });

    setShowResetModal(false);
    showToast({ message: 'Reset to realistic demo dataset!', type: 'success' });
  };

  // Apps Script snippet for display
  const appsScriptCode = `// FinFlow Google Apps Script Web App Backend (Code.gs)
// Replace SECRET_KEY with your own private passphrase:
const SECRET_KEY = "${secretKeyInput || 'YOUR_SECRET_PASSPHRASE'}";

const TAB_HEADERS = {
  Transactions: ["id", "date", "type", "amount", "category", "notes", "source"],
  Income: ["id", "month", "source", "amount", "date", "notes"],
  Investments: ["id", "date", "fundName", "type", "amount", "units", "currentValue", "category", "notes"],
  EmergencyFund: ["id", "date", "type", "amount", "notes"],
  Budgets: ["id", "month", "expectedIncome", "allocations"],
  Config: ["key", "value"]
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.secretKey !== SECRET_KEY) {
      return jsonResponse({ error: "Unauthorized: Invalid Secret Key" });
    }
    if (payload.action === "ping") {
      return jsonResponse({ success: true, message: "Connected to FinFlow!" });
    }
    const ss = SpreadsheetApp.openById(payload.spreadsheetId);
    ensureAllTabs(ss);
    
    if (payload.action === "getAll") {
      return jsonResponse({ success: true, data: getTabObjects(ss, payload.tab) });
    }
    if (payload.action.startsWith("sync")) {
      const tab = payload.action.replace("sync", "");
      overwriteTabData(ss, tab, payload.data || []);
      return jsonResponse({ success: true });
    }
    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Integrations"
        subtitle="Manage your personal preferences, Google Sheets sync, categories, and backups"
      />

      {/* Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'config', label: 'General & Preferences', icon: SettingsIcon },
          { id: 'categories', label: 'Categories & Sources', icon: Database },
          { id: 'google', label: 'Google Sheets Setup', icon: Cloud },
          { id: 'import-export', label: 'Data & Import/Export', icon: Upload },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`chip ${activeTab === tab.id ? 'chip-active' : ''}`}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: General Configuration */}
      {activeTab === 'config' && (
        <motion.div
          key="config"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Currency & Locale */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Currency & Region
            </h3>
            <FormField label="Preferred Currency">
              <select
                className="select w-full"
                value={config.currency}
                onChange={(e) => {
                  const sel = CURRENCIES.find((c) => c.code === e.target.value);
                  if (sel) {
                    updateConfig({
                      currency: sel.code,
                      currencySymbol: sel.symbol,
                      locale: sel.locale,
                    });
                    showToast({ message: `Currency set to ${sel.name}`, type: 'success' });
                  }
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/20 dark:bg-slate-800/30">
                <span className="text-[11px] block" style={{ color: 'var(--text-tertiary)' }}>
                  Symbol
                </span>
                <span className="text-xl font-bold">{config.currencySymbol}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/20 dark:bg-slate-800/30">
                <span className="text-[11px] block" style={{ color: 'var(--text-tertiary)' }}>
                  Active Locale
                </span>
                <span className="text-sm font-semibold">{config.locale}</span>
              </div>
            </div>
          </GlassCard>

          {/* Theme & Display */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Appearance & Theme
            </h3>
            <FormField label="Color Mode">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = config.theme === th.id;
                  return (
                    <button
                      key={th.id}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 font-bold'
                          : 'border-white/20 dark:border-white/5 hover:bg-white/20'
                      }`}
                      onClick={() => {
                        updateConfig({ theme: th.id as 'light' | 'dark' | 'system' });
                        if (th.id === 'dark') document.documentElement.classList.add('dark');
                        else if (th.id === 'light') document.documentElement.classList.remove('dark');
                        showToast({ message: `Theme set to ${th.label}`, type: 'info' });
                      }}
                    >
                      <Icon size={18} className="mb-1" />
                      <span className="text-xs">{th.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            <FormField label="First Day of Month">
              <select
                className="select w-full"
                value={config.firstDayOfMonth}
                onChange={(e) => updateConfig({ firstDayOfMonth: Number(e.target.value) })}
              >
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <option key={d} value={d}>
                    Day {d} of each month
                  </option>
                ))}
              </select>
            </FormField>
          </GlassCard>

          {/* Budgeting Engine Toggle */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Zero-Based Budget
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Enable zero-based budgeting to assign every rupee of income before spending.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.budgetEnabled}
                onChange={(e) => {
                  updateConfig({ budgetEnabled: e.target.checked });
                  showToast({
                    message: e.target.checked ? 'Budgeting module enabled' : 'Budgeting module disabled',
                    type: 'info',
                  });
                }}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
          </GlassCard>

          {/* Emergency Fund Target */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Emergency Fund Target
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  config.emergencyFundTargetType === 'months'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-white/20 hover:bg-white/20'
                }`}
                onClick={() => updateConfig({ emergencyFundTargetType: 'months' })}
              >
                Months of Expenses
              </button>
              <button
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  config.emergencyFundTargetType === 'fixed'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-white/20 hover:bg-white/20'
                }`}
                onClick={() => updateConfig({ emergencyFundTargetType: 'fixed' })}
              >
                Fixed Amount
              </button>
            </div>

            <FormField
              label={
                config.emergencyFundTargetType === 'months'
                  ? 'Target Duration (Months)'
                  : `Target Balance (${config.currencySymbol})`
              }
            >
              <input
                type="number"
                min="1"
                step={config.emergencyFundTargetType === 'months' ? '1' : '10000'}
                value={config.emergencyFundTarget}
                onChange={(e) => updateConfig({ emergencyFundTarget: Number(e.target.value) || 1 })}
                className="input w-full"
              />
            </FormField>
          </GlassCard>
        </motion.div>
      )}

      {/* TAB 2: Categories & Sources */}
      {activeTab === 'categories' && (
        <motion.div
          key="categories"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Expense Categories */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Expense Categories
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Used across Transactions, Analytics, and Budgeting
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="input py-1.5 px-3 text-sm w-44"
                />
                <button className="btn btn-primary py-1.5 px-3 text-xs" onClick={handleAddCategory}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.categories.map((cat) => (
                <div
                  key={cat}
                  className="chip group flex items-center gap-1.5 py-1.5 px-3 bg-white/40 dark:bg-slate-800/40"
                >
                  <span className="text-xs font-medium">{cat}</span>
                  <button
                    className="text-slate-400 hover:text-indigo-500 transition-colors p-0.5"
                    onClick={() => setEditingItem({ type: 'category', original: cat, value: cat })}
                    title={`Rename ${cat}`}
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                    onClick={() => handleDeleteCategory(cat)}
                    title={`Delete ${cat}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Payment Sources */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Payment Sources
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Accounts, cards, wallets, or transfer methods
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New payment source..."
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                  className="input py-1.5 px-3 text-sm w-44"
                />
                <button className="btn btn-primary py-1.5 px-3 text-xs" onClick={handleAddSource}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.sources.map((src) => (
                <div
                  key={src}
                  className="chip group flex items-center gap-1.5 py-1.5 px-3 bg-white/40 dark:bg-slate-800/40"
                >
                  <span className="text-xs font-medium">{src}</span>
                  <button
                    className="text-slate-400 hover:text-indigo-500 transition-colors p-0.5"
                    onClick={() => setEditingItem({ type: 'source', original: src, value: src })}
                    title={`Rename ${src}`}
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                    onClick={() => handleDeleteSource(src)}
                    title={`Delete ${src}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Income Sources & Investment Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Sources */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Income Sources
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New income stream..."
                    value={newIncomeSource}
                    onChange={(e) => setNewIncomeSource(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIncomeSource()}
                    className="input py-1 px-2.5 text-xs w-36"
                  />
                  <button className="btn btn-primary py-1 px-2 text-xs" onClick={handleAddIncomeSource}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.incomeSources.map((src) => (
                  <div key={src} className="chip flex items-center gap-1.5 py-1 px-2.5 bg-white/40 dark:bg-slate-800/40">
                    <span className="text-xs">{src}</span>
                    <button
                      className="text-slate-400 hover:text-indigo-500 p-0.5"
                      onClick={() => setEditingItem({ type: 'incomeSource', original: src, value: src })}
                      title={`Rename ${src}`}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                      onClick={() => handleDeleteIncomeSource(src)}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Investment Categories */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Investment Classes
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New class (e.g. Gold)..."
                    value={newInvestmentCategory}
                    onChange={(e) => setNewInvestmentCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInvestmentCategory()}
                    className="input py-1 px-2.5 text-xs w-36"
                  />
                  <button className="btn btn-primary py-1 px-2 text-xs" onClick={handleAddInvestmentCategory}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.investmentCategories.map((cat) => (
                  <div key={cat} className="chip flex items-center gap-1.5 py-1 px-2.5 bg-white/40 dark:bg-slate-800/40">
                    <span className="text-xs">{cat}</span>
                    <button
                      className="text-slate-400 hover:text-indigo-500 p-0.5"
                      onClick={() => setEditingItem({ type: 'investmentCategory', original: cat, value: cat })}
                      title={`Rename ${cat}`}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                      onClick={() => handleDeleteInvestmentCategory(cat)}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </motion.div>
      )}

      {/* TAB 3: Google Sheets Setup Wizard */}
      {activeTab === 'google' && (
        <motion.div
          key="google"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              googleConfig.configured
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {googleConfig.configured ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <div>
                <h4 className="font-bold text-sm">
                  {googleConfig.configured ? 'Google Sheets Sync Active' : 'Running in Local Demo Mode'}
                </h4>
                <p className="text-xs opacity-90">
                  {googleConfig.configured
                    ? `Connected to Spreadsheet ID: ${googleConfig.spreadsheetId.slice(0, 10)}...`
                    : 'Follow the 4-step wizard below to link your own private Google Sheet.'}
                </p>
              </div>
            </div>

            {googleConfig.configured && (
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary text-xs py-1.5 px-3"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  <RefreshCw size={14} className={isTestingConnection ? 'animate-spin' : ''} />
                  Test
                </button>
              </div>
            )}
          </div>

          {/* 4-Step Guided Wizard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1 & 2 */}
            <div className="space-y-6">
              {/* Step 1 */}
              <GlassCard className="p-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Create Google Sheet
                  </h3>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Create an empty Google Spreadsheet. All required tabs (Transactions, Income, Investments, etc.) will be automatically created with styled headers by the script!
                </p>
                <div className="pt-1">
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary text-xs inline-flex items-center gap-2"
                  >
                    <ExternalLink size={14} /> Open sheets.new
                  </a>
                </div>
              </GlassCard>

              {/* Step 2 */}
              <GlassCard className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      Copy Apps Script Code
                    </h3>
                  </div>
                  <button
                    className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptCode);
                      showToast({ message: 'Apps Script code copied to clipboard!', type: 'success' });
                    }}
                  >
                    <Copy size={13} /> Copy Code
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  In your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong>. Delete any placeholder code and paste this script:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono max-h-48 overflow-y-auto leading-relaxed border border-slate-700/50">
                  <pre>{appsScriptCode}</pre>
                </div>
                <p className="text-[11px] text-indigo-500 dark:text-indigo-400">
                  Tip: A copy is also saved locally in <code>/google-apps-script/Code.gs</code>
                </p>
              </GlassCard>
            </div>

            {/* Step 3 & 4 */}
            <div className="space-y-6">
              {/* Step 3 */}
              <GlassCard className="p-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Deploy as Web App
                  </h3>
                </div>
                <ol className="text-xs space-y-1.5 list-decimal pl-5 text-slate-600 dark:text-slate-300">
                  <li>In Apps Script editor, click blue <strong>Deploy &gt; New deployment</strong> button.</li>
                  <li>Click gear icon next to "Select type" and choose <strong>Web app</strong>.</li>
                  <li>Set <strong>Execute as</strong> to: <em>Me (your Google email)</em>.</li>
                  <li>Set <strong>Who has access</strong> to: <em>Anyone</em> (required for browser fetch).</li>
                  <li>Click <strong>Deploy</strong> and copy the generated <strong>Web App URL</strong>.</li>
                </ol>
              </GlassCard>

              {/* Step 4 */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Connect & Authenticate
                  </h3>
                </div>

                <FormField label="Google Sheet URL or Spreadsheet ID">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit or 1abc..."
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    className="input w-full text-xs"
                  />
                </FormField>

                <FormField label="Google Apps Script Web App URL">
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={webAppUrlInput}
                    onChange={(e) => setWebAppUrlInput(e.target.value)}
                    className="input w-full text-xs"
                  />
                </FormField>

                <FormField label="Secret Key (Passphrase set in Code.gs)">
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter the SECRET_KEY from your script..."
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      className="input w-full text-xs pr-8"
                    />
                    <Key size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
                  </div>
                </FormField>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button className="btn btn-primary text-xs flex-1" onClick={handleSaveGoogleSetup}>
                    <Check size={14} /> Save Configuration
                  </button>
                  <button
                    className="btn btn-secondary text-xs"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    <RefreshCw size={14} className={isTestingConnection ? 'animate-spin' : ''} />
                    Test Link
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {testResult.success ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>

          {/* Advanced Google Actions */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Data Synchronization & Multi-Year Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/20 dark:bg-slate-800/30 space-y-2">
                <h4 className="font-semibold text-xs text-indigo-500">Migrate Local Demo Data to Sheet</h4>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Upload all current transactions, income, investments, and budgets from localStorage directly into your connected Google Sheet.
                </p>
                <button
                  className="btn btn-secondary text-xs"
                  onClick={handleMigrate}
                  disabled={isMigrating || !googleConfig.configured}
                >
                  <Cloud size={14} /> {isMigrating ? 'Migrating...' : 'Migrate Data Now'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/20 dark:bg-slate-800/30 space-y-2">
                <h4 className="font-semibold text-xs text-indigo-500">Start New Year Sheet</h4>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Creates a fresh Google Sheet for next financial year and points FinFlow to it seamlessly.
                </p>
                <button
                  className="btn btn-secondary text-xs"
                  onClick={handleCreateNewYearSheet}
                  disabled={isCreatingNewYear || !googleConfig.configured}
                >
                  <FileSpreadsheet size={14} /> {isCreatingNewYear ? 'Creating...' : 'Create New Year Sheet'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              🔒 <strong>Security Guarantee:</strong> Your Google credentials and API keys remain stored strictly inside your browser's private localStorage. No central server has access to your financial data.
            </p>
          </GlassCard>
        </motion.div>
      )}

      {/* TAB 4: Import / Export & Data Management */}
      {activeTab === 'import-export' && (
        <motion.div
          key="import-export"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* JSON Transactions Import */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Import Transactions (JSON)
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Upload an array of transaction objects with preview and validation before committing.
                </p>
              </div>
              <button className="btn btn-secondary text-xs" onClick={handleDownloadSample}>
                <Download size={14} /> Download Sample JSON
              </button>
            </div>

            {/* Dropzone with Drag & Drop */}
            <div
              className={`border-2 border-dashed transition-all rounded-2xl p-6 text-center cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01]'
                  : 'border-indigo-500/30 hover:border-indigo-500/60 bg-white/10 dark:bg-slate-800/20'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const content = event.target?.result as string;
                    validateJson(content);
                  };
                  reader.readAsText(file);
                }
              }}
            >
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-file-input"
              />
              <label htmlFor="json-file-input" className="cursor-pointer space-y-2 block">
                <Upload size={32} className="mx-auto text-indigo-500" />
                <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                  {isDragging ? 'Drop your JSON file here' : 'Click to select a JSON file or drag it here'}
                </span>
                <span className="text-xs block text-slate-400">
                  Expected schema: date (YYYY-MM-DD), type ("Spend" | "Credit"), amount, category, source, notes
                </span>
              </label>
            </div>

            {/* Validation Summary & Preview */}
            {importSummary && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/20 dark:bg-slate-800/40">
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span>Total parsed: {importSummary.total}</span>
                    <span className="text-emerald-500">Valid: {importSummary.valid}</span>
                    {importSummary.invalid > 0 && (
                      <span className="text-rose-500">Errors: {importSummary.invalid}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-primary text-xs py-1.5 px-3"
                    onClick={handleConfirmImport}
                    disabled={importSummary.valid === 0}
                  >
                    Confirm Import ({importSummary.valid} items)
                  </button>
                </div>

                {/* Preview Table */}
                <div className="max-h-60 overflow-y-auto rounded-xl border border-white/20 dark:border-white/10 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2">Status</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {parsedRows.slice(0, 50).map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.valid ? 'hover:bg-white/10' : 'bg-rose-500/10 text-rose-500'}
                        >
                          <td className="p-2 font-medium">
                            {row.valid ? (
                              <CheckCircle size={14} className="text-emerald-500" />
                            ) : (
                              <span title={row.error} className="flex items-center gap-1 text-rose-500">
                                <AlertCircle size={14} /> {row.error}
                              </span>
                            )}
                          </td>
                          <td className="p-2">{row.data.date || '-'}</td>
                          <td className="p-2">{row.data.type || '-'}</td>
                          <td className="p-2">{row.data.amount ?? '-'}</td>
                          <td className="p-2">{row.data.category || '-'}</td>
                          <td className="p-2">{row.data.source || '-'}</td>
                          <td className="p-2 truncate max-w-[120px]">{row.data.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Export Options */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Export & Backup Data
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Download your complete financial records anytime for local archival or spreadsheet analysis.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                className="btn btn-secondary flex flex-col items-center justify-center p-4 h-auto gap-2 text-center"
                onClick={handleExportJson}
              >
                <Database size={20} className="text-indigo-500" />
                <span className="text-xs font-semibold">Full JSON Backup</span>
              </button>

              <button
                className="btn btn-secondary flex flex-col items-center justify-center p-4 h-auto gap-2 text-center"
                onClick={() => handleExportCsv('transactions')}
              >
                <FileText size={20} className="text-emerald-500" />
                <span className="text-xs font-semibold">Transactions CSV</span>
              </button>

              <button
                className="btn btn-secondary flex flex-col items-center justify-center p-4 h-auto gap-2 text-center"
                onClick={() => handleExportCsv('income')}
              >
                <FileText size={20} className="text-violet-500" />
                <span className="text-xs font-semibold">Income CSV</span>
              </button>

              <button
                className="btn btn-secondary flex flex-col items-center justify-center p-4 h-auto gap-2 text-center"
                onClick={() => handleExportCsv('investments')}
              >
                <FileText size={20} className="text-amber-500" />
                <span className="text-xs font-semibold">Investments CSV</span>
              </button>
            </div>
          </GlassCard>

          {/* Reset Demo Data */}
          <GlassCard className="p-6 border-rose-500/20 bg-rose-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-rose-500">Reset to Demo Dataset</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Restore 3-4 months of realistic sample transactions, income streams, mutual funds, and emergency fund entries for testing.
                </p>
              </div>
              <button
                className="btn py-2 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5"
                onClick={() => setShowResetModal(true)}
              >
                <RotateCcw size={14} /> Reset Demo Data
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset to Demo Data?"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This action will replace your current local transactions, income, investments, and budgets with fresh realistic demo data. Are you sure?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn btn-secondary text-xs" onClick={() => setShowResetModal(false)}>
              Cancel
            </button>
            <button
              className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4"
              onClick={handleResetDemoData}
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename Item Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={`Rename ${
          editingItem?.type === 'category'
            ? 'Category'
            : editingItem?.type === 'source'
            ? 'Payment Source'
            : editingItem?.type === 'incomeSource'
            ? 'Income Stream'
            : 'Investment Class'
        }`}
      >
        <div className="space-y-4">
          <FormField label="Item Name">
            <input
              type="text"
              value={editingItem?.value || ''}
              onChange={(e) =>
                setEditingItem(editingItem ? { ...editingItem, value: e.target.value } : null)
              }
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
              className="input w-full"
              autoFocus
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-secondary text-xs" onClick={() => setEditingItem(null)}>
              Cancel
            </button>
            <button className="btn btn-primary text-xs" onClick={handleSaveRename}>
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
