import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Cloud,
  Database,
  LayoutDashboard,
  PiggyBank,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard, PageHeader } from '../components/shared';

const workflow = [
  { icon: Settings, title: 'Set up', text: 'Choose your currency, categories, and preferences.' },
  { icon: Wallet, title: 'Record', text: 'Add income and transactions as they happen.' },
  { icon: PiggyBank, title: 'Plan', text: 'Give expected income a job in the monthly budget.' },
  { icon: LayoutDashboard, title: 'Review', text: 'Use the dashboard to spot trends and follow up.' },
  { icon: ShieldCheck, title: 'Protect', text: 'Export a backup; connect Sheets if you want sync.' },
];

const destinations = [
  { to: '/', icon: LayoutDashboard, title: 'Dashboard', detail: 'Monthly totals, trends, categories, and insights.' },
  { to: '/transactions', icon: ArrowLeftRight, title: 'Transactions', detail: 'Record and review spending and credits.' },
  { to: '/income', icon: Wallet, title: 'Income', detail: 'Track salary and other income streams.' },
  { to: '/investments', icon: TrendingUp, title: 'Investments & Savings', detail: 'Track investments and the emergency fund.' },
  { to: '/budget', icon: PiggyBank, title: 'Budget', detail: 'Plan category limits and compare actual spending.' },
  { to: '/settings', icon: Settings, title: 'Settings', detail: 'Set preferences, lists, integrations, and backups.' },
];

function GuideSection({ id, title, intro, children }: {
  id: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>{intro}</p>
        <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </div>
      </GlassCard>
    </section>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--glass-border)' }}>
      <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-emerald)' }} />
      <p>{children}</p>
    </div>
  );
}

export default function Docs() {
  return (
    <div className="space-y-6">
      <PageHeader title="FinFlow Docs" subtitle="A practical guide to setting up, using, and looking after your finance tracker." />

      <GlassCard className="p-5 sm:p-7">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(79,70,229,.12)', color: 'var(--color-primary)' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>A simple monthly rhythm</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Start with preferences, keep records current, then review and adjust.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {workflow.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,70,229,.12)', color: 'var(--color-primary)' }}><Icon size={17} /></span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>0{index + 1}</span>
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.text}</p>
                {index < workflow.length - 1 && <ArrowRight className="hidden xl:block absolute -right-3 top-7 z-10" size={16} style={{ color: 'var(--text-tertiary)' }} />}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {destinations.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="glass p-3 rounded-2xl no-underline transition-transform hover:-translate-y-0.5">
              <Icon size={18} style={{ color: 'var(--color-primary)' }} />
              <div className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
              <div className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>{item.detail}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <GuideSection id="dashboard" title="Dashboard" intro="Use this as your monthly overview, not as a place to enter records.">
          <p><strong>Choose a month</strong> with the date control at the top. The selection follows you across Dashboard, Transactions, Income, Investments & Savings, and Budget. Use the calendar button to return to this month.</p>
          <p>Read the summary cards first, then use the category and trend charts to find what changed. Smart Insights and Budget vs Actual are calculated from the records currently in FinFlow.</p>
          <Tip>If totals look unexpected, check the selected month and confirm the underlying records in Transactions or Income.</Tip>
        </GuideSection>

        <GuideSection id="transactions" title="Transactions" intro="Record money spent and money received; review one month at a time.">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Select the month, then press <strong>Add transaction</strong>.</li>
            <li>Choose Spend or Credit, enter amount, date, category, payment source, and an optional note.</li>
            <li>Search notes, categories, or sources; use the filters and sort controls to narrow the list.</li>
            <li>Edit a record from its row/card. Delete offers an Undo toast for a short time.</li>
          </ol>
          <p>Use the page’s export controls for a month-specific CSV or JSON file. CSV is useful for spreadsheets; JSON is useful for structured data.</p>
          <Tip>Keep spending and income entry consistent. Dashboard totals and category tracking depend on the transaction type and selected category.</Tip>
        </GuideSection>

        <GuideSection id="income" title="Income" intro="Track each incoming stream separately so monthly totals and trends stay useful.">
          <p>Add one entry per payment or income event. Pick a source such as Salary or Freelance, enter the amount and date, and add a note if it helps identify the payment.</p>
          <p>Use the month selector to review that month’s income and compare sources. Editing or deleting an entry updates the totals used by Dashboard and Budget.</p>
          <Tip>Record income before planning your budget; the budget page can prefill expected income from income already recorded for the month.</Tip>
        </GuideSection>

        <GuideSection id="investments" title="Investments & Savings" intro="This area has separate tabs for portfolio activity and your emergency fund ledger.">
          <p><strong>Investments:</strong> record a SIP, Lumpsum, or Redemption with fund/name, investment class, amount, date, and any available value details. Use the cards and charts to review contributed amounts, current value, and category mix.</p>
          <p><strong>Emergency Fund:</strong> record each deposit or withdrawal. The target and progress display use the target rule set in Settings; the ledger provides the history behind the balance.</p>
          <Tip>Use the transaction list for day-to-day expenses. Use these investment and emergency-fund ledgers for contributions and balance tracking.</Tip>
        </GuideSection>

        <GuideSection id="budget" title="Zero-Based Budget" intro="Plan a month before spending: assign expected income across categories until nothing is unallocated.">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Enable Zero-Based Budget in Settings if it is off.</li>
            <li>Choose the month and enter expected income, or prefill from recorded income.</li>
            <li>Set an amount for each category. Use Copy Previous Month for a starting point or Auto-allocate to Other for the remainder.</li>
            <li>Compare actual spending to each allocation. The rows show actual amount, amount left or over, and percent used.</li>
          </ol>
          <p>Budget Distribution shows planned allocations. The comparison chart puts planned and actual amounts side by side. Categories with no spend remain useful as planned amounts.</p>
          <Tip>A green zero-based status means all expected income is assigned. It does not mean you have spent nothing; review the actual-versus-planned rows too.</Tip>
        </GuideSection>

        <GuideSection id="settings" title="Settings & configuration" intro="Configure the lists and preferences first; you can return here as your needs change.">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Currency & Region:</strong> choose the currency and locale used to display amounts.</li>
            <li><strong>Appearance & Theme:</strong> choose Light, Dark, or System mode. System follows your device appearance.</li>
            <li><strong>First Day of Month:</strong> set the day used for the app’s month boundary.</li>
            <li><strong>Zero-Based Budget:</strong> enable or disable the Budget page.</li>
            <li><strong>Emergency Fund Target:</strong> target a number of months of expenses or a fixed amount.</li>
            <li><strong>Categories & Sources:</strong> add or rename expense categories, payment sources, income sources, and investment classes. Renaming updates matching records where supported. Remove unused values only after checking existing records.</li>
          </ul>
          <Tip>Set your currency and category lists before entering lots of records. This keeps reports and filters tidy.</Tip>
        </GuideSection>

        <GuideSection id="google-sheets" title="Optional Google Sheets connection" intro="FinFlow works in local Demo Mode. Connect a sheet only if you want a personal remote copy and sync.">
          <div className="flex items-start gap-2"><Cloud size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} /><p>In Settings → Google Sheets Setup, follow the built-in wizard: create a spreadsheet, add the provided Apps Script, deploy it as a web app, then enter the spreadsheet ID, web app URL, and secret key. Use Test Link before migrating data.</p></div>
          <p>The spreadsheet ID can be copied from the spreadsheet URL. The web app URL comes from the Apps Script deployment. Keep the secret key private. The setup tab also provides actions to switch sheets, create a new year sheet, migrate demo records, and pull the latest data.</p>
          <Tip>After connecting, check the sync badge in the desktop sidebar. A failure shows an error state; test the connection in Settings before retrying.</Tip>
        </GuideSection>

        <GuideSection id="data" title="Backups, imports, and exports" intro="Keep a portable backup so you can recover or move your data.">
          <div className="flex items-start gap-2"><ArrowDownToLine size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} /><p>Open Settings → Data & Import/Export. Export JSON for a full backup and restore workflow; the page validates and previews a JSON import before applying it. CSV exports are available for Transactions, Income, and Investments.</p></div>
          <p>Without Google Sheets, the browser stores the app data locally. Clearing the browser’s site data can remove that local copy. Export a backup before resetting demo data or changing devices.</p>
          <Tip>Keep the downloaded JSON somewhere you control. Avoid importing a backup until its preview and record counts look right.</Tip>
        </GuideSection>

        <GuideSection id="project" title="Project map & data flow" intro="A quick orientation for anyone maintaining or extending FinFlow.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}><LayoutDashboard size={16} style={{ color: 'var(--color-primary)' }} /><p className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>Screens</p><p className="text-xs mt-1">src/pages and src/components</p></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}><Database size={16} style={{ color: 'var(--color-primary)' }} /><p className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>State & logic</p><p className="text-xs mt-1">src/lib/store.ts and src/lib</p></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}><CalendarDays size={16} style={{ color: 'var(--color-primary)' }} /><p className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>Data source</p><p className="text-xs mt-1">Local browser storage or optional Sheets API</p></div>
          </div>
          <p>React pages read and update the Zustand store. The store persists local state and uses the API layer for optional Sheets sync. Demo records are defined in <code>src/lib/demo-data.ts</code>; shared types are in <code>src/types/index.ts</code>; the Apps Script template is in <code>src/lib/google-script-template.ts</code> and its deployable source is in <code>google-apps-script/Code.gs</code>.</p>
        </GuideSection>
      </div>
    </div>
  );
}
