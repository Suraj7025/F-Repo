import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  Database,
  LayoutDashboard,
  LifeBuoy,
  PiggyBank,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/shared';

const docsNav = [
  { id: 'start', title: 'Start here', group: 'Basics', icon: BookOpen },
  { id: 'workflow', title: 'A monthly routine', group: 'Basics', icon: CalendarDays },
  { id: 'dashboard', title: 'Dashboard', group: 'Use FinFlow', icon: LayoutDashboard },
  { id: 'transactions', title: 'Transactions', group: 'Use FinFlow', icon: ArrowLeftRight },
  { id: 'income', title: 'Income', group: 'Use FinFlow', icon: Wallet },
  { id: 'investments', title: 'Investments & Savings', group: 'Use FinFlow', icon: TrendingUp },
  { id: 'budget', title: 'Zero-Based Budget', group: 'Use FinFlow', icon: PiggyBank },
  { id: 'settings', title: 'Settings & setup', group: 'Manage your data', icon: Settings },
  { id: 'sheets', title: 'Google Sheets', group: 'Manage your data', icon: Cloud },
  { id: 'backup', title: 'Backups & exports', group: 'Manage your data', icon: ArrowDownToLine },
  { id: 'project', title: 'Project map', group: 'Manage your data', icon: Database },
];

function FinanceIllustration() {
  return (
    <svg viewBox="0 0 560 340" role="img" aria-label="Illustration of a FinFlow monthly finance dashboard" className="w-full h-auto">
      <defs>
        <linearGradient id="docsWash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="55%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#ede9fe" />
        </linearGradient>
        <linearGradient id="docsAccent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="docsShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#27365b" floodOpacity=".14" />
        </filter>
      </defs>
      <rect x="14" y="12" width="532" height="316" rx="30" fill="url(#docsWash)" />
      <circle cx="499" cy="48" r="70" fill="#c4b5fd" opacity=".38" />
      <circle cx="72" cy="284" r="82" fill="#93c5fd" opacity=".33" />
      <g filter="url(#docsShadow)">
        <rect x="80" y="45" width="400" height="244" rx="22" fill="#fff" />
        <rect x="80" y="45" width="400" height="43" rx="22" fill="#f8fafc" />
        <path d="M80 67a22 22 0 0 1 22-22h356a22 22 0 0 1 22 22v21H80z" fill="#f8fafc" />
        <circle cx="102" cy="66" r="4" fill="#f87171" />
        <circle cx="116" cy="66" r="4" fill="#fbbf24" />
        <circle cx="130" cy="66" r="4" fill="#34d399" />
        <rect x="105" y="107" width="110" height="8" rx="4" fill="#cbd5e1" />
        <rect x="105" y="126" width="164" height="25" rx="8" fill="#eef2ff" />
        <rect x="116" y="135" width="54" height="7" rx="3.5" fill="#4f46e5" />
        <rect x="283" y="107" width="81" height="48" rx="12" fill="#f8fafc" />
        <rect x="295" y="119" width="35" height="5" rx="2.5" fill="#94a3b8" />
        <rect x="295" y="132" width="53" height="9" rx="4.5" fill="#0f172a" />
        <rect x="374" y="107" width="81" height="48" rx="12" fill="#f8fafc" />
        <rect x="386" y="119" width="35" height="5" rx="2.5" fill="#94a3b8" />
        <rect x="386" y="132" width="45" height="9" rx="4.5" fill="#0f172a" />
        <rect x="105" y="169" width="215" height="96" rx="14" fill="#f8fafc" />
        <path d="M124 243l31-22 29 9 32-34 31 15 32-26 24 8" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M124 251h177" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="334" y="169" width="121" height="96" rx="14" fill="#f8fafc" />
        <circle cx="394" cy="217" r="30" fill="none" stroke="#e0e7ff" strokeWidth="12" />
        <path d="M394 187a30 30 0 0 1 27 17" fill="none" stroke="url(#docsAccent)" strokeWidth="12" strokeLinecap="round" />
        <path d="M421 213a30 30 0 0 1-22 33" fill="none" stroke="#34d399" strokeWidth="12" strokeLinecap="round" />
      </g>
      <g filter="url(#docsShadow)">
        <rect x="45" y="210" width="119" height="87" rx="18" fill="#fff" />
        <rect x="62" y="229" width="36" height="36" rx="12" fill="#ecfdf5" />
        <path d="M72 248l7 7 12-15" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="109" y="232" width="39" height="6" rx="3" fill="#cbd5e1" />
        <rect x="109" y="247" width="35" height="10" rx="5" fill="#0f172a" />
        <rect x="62" y="277" width="85" height="6" rx="3" fill="#e2e8f0" />
        <rect x="62" y="277" width="58" height="6" rx="3" fill="#34d399" />
      </g>
      <g filter="url(#docsShadow)">
        <rect x="385" y="244" width="132" height="58" rx="17" fill="#fff" />
        <rect x="402" y="260" width="30" height="27" rx="9" fill="#eef2ff" />
        <path d="M410 280v-7l7-6 7 4v9" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="443" y="261" width="55" height="6" rx="3" fill="#cbd5e1" />
        <rect x="443" y="275" width="42" height="9" rx="4.5" fill="#0f172a" />
      </g>
    </svg>
  );
}

function GuideNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-xl border p-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--glass-border)' }}>
      <Check className="mt-0.5 shrink-0" size={17} style={{ color: 'var(--color-emerald)' }} />
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </div>
  );
}

function ArticleSection({ id, eyebrow, title, intro, children }: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="docs-article-section scroll-mt-8">
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[.16em] font-bold mb-2" style={{ color: 'var(--color-primary)' }}>{eyebrow}</div>
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <p className="mt-2 max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{intro}</p>
      </div>
      <div className="docs-article-copy space-y-4 text-[15px] leading-7" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </section>
  );
}

export default function Docs() {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('start');
  const filteredNav = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? docsNav.filter((item) => `${item.title} ${item.group}`.toLowerCase().includes(normalized))
      : docsNav;
  }, [query]);
  const groups = [...new Set(filteredNav.map((item) => item.group))];

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="docs-page">
      <PageHeader title="Docs" subtitle="A practical guide to using FinFlow, setting it up, and keeping your records safe." />

      <div className="docs-layout">
        <aside className="docs-sidebar glass" aria-label="Documentation navigation">
          <div className="docs-sidebar-heading">
            <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}><BookOpen size={17} style={{ color: 'var(--color-primary)' }} /> FinFlow guide</div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Help for every part of the app</p>
          </div>
          <label className="docs-search">
            <Search size={15} />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documentation" aria-label="Search documentation" />
            <kbd>/</kbd>
          </label>
          <nav className="docs-nav-list">
            {groups.map((group) => (
              <div key={group} className="docs-nav-group">
                <div className="docs-nav-label">{group}</div>
                {filteredNav.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} className={`docs-nav-link ${activeSection === item.id ? 'is-active' : ''}`} onClick={() => jumpTo(item.id)}>
                      <Icon size={15} /> <span>{item.title}</span><ChevronRight className="docs-nav-chevron" size={14} />
                    </button>
                  );
                })}
              </div>
            ))}
            {filteredNav.length === 0 && <p className="px-3 py-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>No matching topics.</p>}
          </nav>
          <div className="docs-sidebar-footer">
            <LifeBuoy size={16} /> <span>Need a quick start?</span>
            <button onClick={() => jumpTo('workflow')} aria-label="Jump to monthly routine"><ArrowRight size={15} /></button>
          </div>
        </aside>

        <article className="docs-content">
          <section id="start" className="docs-hero scroll-mt-8">
            <div className="docs-hero-copy">
              <div className="docs-breadcrumb"><span>FINFLOW</span><ChevronRight size={13} /><span>DOCUMENTATION</span></div>
              <div className="docs-kicker">YOUR MONEY, IN GOOD ORDER</div>
              <h1>A clearer view of your finances starts here.</h1>
              <p>FinFlow brings your daily records, monthly plan, investments, and savings into one private workspace. Start with the basics, then make the routine your own.</p>
              <div className="flex flex-wrap gap-2 mt-5">
                <button className="btn-primary" onClick={() => jumpTo('workflow')}>Follow the monthly flow <ArrowRight size={16} /></button>
                <Link to="/settings" className="btn-secondary no-underline">Configure FinFlow <Settings size={15} /></Link>
              </div>
            </div>
            <div className="docs-hero-art"><FinanceIllustration /></div>
          </section>

          <div className="docs-meta-row"><span><span className="docs-status-dot" /> Start with Demo Mode</span><span>11 short guides</span><span>Works on mobile</span></div>

          <ArticleSection id="workflow" eyebrow="THE EVERYDAY FLOW" title="A simple monthly routine" intro="A little, often, works better than a big catch-up at the end of the month.">
            <div className="docs-steps">
              {[
                ['01', 'Set up once', 'Choose currency, theme, and categories in Settings.'],
                ['02', 'Record as you go', 'Add income and spending when they happen.'],
                ['03', 'Make a plan', 'In Budget, assign expected income across categories.'],
                ['04', 'Review and adjust', 'Check the dashboard and actuals; update your plan.'],
                ['05', 'Keep a backup', 'Export JSON from Settings → Data & Import/Export.'],
              ].map(([number, title, detail]) => <div className="docs-step" key={number}><span>{number}</span><div><strong>{title}</strong><p>{detail}</p></div></div>)}
            </div>
            <GuideNote>Your month selection is shared across the Dashboard, Transactions, Income, Investments & Savings, and Budget pages. Use the date control to move to a month or choose one directly.</GuideNote>
          </ArticleSection>

          <ArticleSection id="dashboard" eyebrow="01 / OVERVIEW" title="Dashboard" intro="A quick read on where your money went and how your plan is progressing.">
            <p>Choose the month at the top. Start with the summary figures, then scan the category breakdown and income-versus-expense trends. The lower panels show daily activity, payment sources, recent transactions, and budget progress.</p>
            <p>Smart Insights are calculated from the records in FinFlow. If a number looks off, use the month selector and check the records behind it.</p>
            <Link className="docs-inline-link" to="/">Open Dashboard <ArrowRight size={15} /></Link>
          </ArticleSection>

          <ArticleSection id="transactions" eyebrow="02 / DAILY RECORDS" title="Transactions" intro="Keep spending and credits organized with dates, categories, and payment sources.">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Select a month and choose <strong>Add transaction</strong>.</li>
              <li>Select Spend or Credit, then enter the amount, date, category, source, and an optional note.</li>
              <li>Search across notes, categories, and sources. Use filters and sort controls to narrow the list.</li>
              <li>Edit a record from its row or card. Delete includes a short Undo action.</li>
            </ol>
            <p>Use CSV when you want a simple table for another spreadsheet. Use JSON when you need structured transaction data.</p>
            <Link className="docs-inline-link" to="/transactions">Open Transactions <ArrowRight size={15} /></Link>
          </ArticleSection>

          <ArticleSection id="income" eyebrow="03 / MONEY IN" title="Income" intro="Track each income stream separately to make monthly totals and trends meaningful.">
            <p>Add one entry for each payment. Choose a source, enter the amount and date, and include a note when useful. The month view summarizes entries by source and compares them over time.</p>
            <GuideNote>Record income before setting up the monthly plan. Budget can prefill expected income from entries already recorded in that month.</GuideNote>
            <Link className="docs-inline-link" to="/income">Open Income <ArrowRight size={15} /></Link>
          </ArticleSection>

          <ArticleSection id="investments" eyebrow="04 / LONG-TERM TRACKING" title="Investments & Savings" intro="Use the tabs to keep portfolio activity and emergency savings in their own ledgers.">
            <p><strong>Investments:</strong> record SIP, Lumpsum, or Redemption activity with the fund name, investment class, amount, and date. Review contributions, value, gains, and allocation in the portfolio view.</p>
            <p><strong>Emergency Fund:</strong> record deposits and withdrawals. Progress uses the target you choose in Settings—months of expenses or a fixed amount—and the ledger keeps the activity visible.</p>
            <Link className="docs-inline-link" to="/investments">Open Investments & Savings <ArrowRight size={15} /></Link>
          </ArticleSection>

          <ArticleSection id="budget" eyebrow="05 / PLAN AHEAD" title="Zero-Based Budget" intro="Give expected income a job before the month begins, then compare your plan with real spending.">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Enable Zero-Based Budget in Settings if needed.</li>
              <li>Choose the month and enter expected income, or prefill it from recorded income.</li>
              <li>Set planned amounts for categories. Copy last month to get started, or auto-allocate the remainder to Other.</li>
              <li>As transactions arrive, compare each category’s actual amount, remaining balance, and percent used.</li>
            </ol>
            <p>The status shows whether income is fully allocated or over-allocated. Budget Distribution shows the plan; the comparison chart puts planned and actual values side by side.</p>
            <Link className="docs-inline-link" to="/budget">Open Budget <ArrowRight size={15} /></Link>
          </ArticleSection>

          <ArticleSection id="settings" eyebrow="06 / MAKE IT YOURS" title="Settings & setup" intro="A few choices up front make the rest of the tracker easier to use.">
            <div className="docs-settings-list">
              <p><strong>Currency & Region</strong><span>Sets the currency symbol and locale formatting.</span></p>
              <p><strong>Appearance & Theme</strong><span>Choose Light, Dark, or System to follow your device.</span></p>
              <p><strong>First Day of Month</strong><span>Sets the month boundary used by FinFlow’s monthly views.</span></p>
              <p><strong>Zero-Based Budget</strong><span>Turns the Budget section on or off.</span></p>
              <p><strong>Emergency Fund Target</strong><span>Choose a months-of-expenses target or a fixed amount.</span></p>
              <p><strong>Categories & Sources</strong><span>Manage expense categories, payment sources, income streams, and investment classes.</span></p>
            </div>
            <GuideNote>Rename a value when you want existing records to use the new name. Before removing a category or source, check whether you still need it for older records and reports.</GuideNote>
            <Link className="docs-inline-link" to="/settings">Open Settings <ArrowRight size={15} /></Link>
          </ArticleSection>

          <ArticleSection id="sheets" eyebrow="07 / OPTIONAL SYNC" title="Google Sheets" intro="FinFlow is ready to use locally. Sheets is optional when you want a spreadsheet-backed copy and sync.">
            <div className="docs-connection-flow">
              {['Create a spreadsheet', 'Add the Apps Script', 'Deploy as a web app', 'Enter details and test'].map((step, index) => <div key={step}><span>{index + 1}</span>{step}</div>)}
            </div>
            <p>Open Settings → Google Sheets Setup and follow the built-in wizard. You’ll need the spreadsheet ID, the deployed web app URL, and a secret key you set in Apps Script. Test the connection before migrating demo data.</p>
            <p>The setup screen also provides controls to switch spreadsheet, create a new year sheet, migrate demo records, and pull the latest data. The sync badge in the desktop sidebar shows current sync status.</p>
            <GuideNote>Keep your secret key private. If a sync fails, check the deployment URL and key, then use Test in Settings before retrying.</GuideNote>
          </ArticleSection>

          <ArticleSection id="backup" eyebrow="08 / DATA CARE" title="Backups & exports" intro="A JSON backup is the best way to keep a portable copy of your FinFlow records.">
            <p>Open Settings → Data & Import/Export. Export JSON for a full backup and restore workflow. Before an import is applied, FinFlow validates the file and shows a preview. CSV exports are available for Transactions, Income, and Investments.</p>
            <p>In Demo Mode, data is stored in this browser. Clearing its site data may remove your local records. Export JSON before resetting demo data or moving to another browser/device.</p>
            <GuideNote>Check the import preview and record counts before confirming a restore. Store exported files somewhere you control.</GuideNote>
          </ArticleSection>

          <ArticleSection id="project" eyebrow="09 / FOR MAINTAINERS" title="Project map" intro="The app is a React and TypeScript single-page application with a local-first store.">
            <div className="docs-project-map">
              <div><span>Interface</span><code>src/pages/</code><small>App screens and shared UI</small></div><ArrowRight size={16} />
              <div><span>State and logic</span><code>src/lib/</code><small>Zustand store, helpers, API</small></div><ArrowRight size={16} />
              <div><span>Optional backend</span><code>google-apps-script/</code><small>Sheets web app source</small></div>
            </div>
            <p>Key files: <code>src/lib/demo-data.ts</code> defines sample records; <code>src/lib/store.ts</code> owns app state and persistence; <code>src/types/index.ts</code> defines shared record shapes; <code>src/lib/google-script-template.ts</code> provides the Apps Script template.</p>
          </ArticleSection>

          <footer className="docs-footer"><ShieldCheck size={17} /><span>FinFlow keeps its core workflow local. Connect external storage only when it fits your setup.</span><Link to="/settings">Review settings <ArrowRight size={14} /></Link></footer>
        </article>
      </div>
    </div>
  );
}
