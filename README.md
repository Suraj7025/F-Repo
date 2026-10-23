# FinFlow – Personal Finance Manager

A single-user personal finance manager crafted with Apple macOS **"Liquid Glass"** aesthetic. FinFlow gives you complete control over your financial records with **zero login**, **zero third-party data tracking**, and a **private Google Sheets backend** powered by Google Apps Script.

---

## ✨ Features

- **macOS Liquid Glass Design System**:
  - Translucent glass panels with layered backdrops (`backdrop-filter: blur(24px) saturate(180%)`).
  - Animated colorful background orbs.
  - Full **Light Mode**, **Dark Mode**, and **System Mode** toggles.
  - Tabular numbers, smooth Framer Motion micro-animations, and animated count-up numbers.
- **Interactive Bento-Grid Dashboard**:
  - Hero statistics: Income, Total Spent, Net Savings, Savings Rate %, Invested Amount, Emergency Fund balance.
  - Financial Health Score (0–100) computed from savings rate, budget adherence, and emergency fund runway.
  - Spending by category donut chart + top categories list.
  - Income vs Expense 6-month / 12-month area trend chart.
  - Daily spending heatmap / bar chart.
  - Spending by payment source (UPI, Credit Card, Bank Transfer, etc.).
  - AI-inspired Smart Insights with real-time financial comparisons.
  - Budget vs Actual overview widget.
- **Transactions Management**:
  - Filter by month, search across notes/categories/sources, sort by date/amount/category.
  - Desktop responsive table and touch-optimized mobile cards.
  - Quick-add modal, edit in-place, delete with **undo toast notifications**.
- **Income Tracking**:
  - Multi-stream income support (Salary, Freelance, Dividends, Interest, etc.).
  - Month-over-month trend analysis and breakdown by source.
- **Investments & Savings (I&S)**:
  - **Mutual Funds / Portfolio**: Track SIP, Lumpsum, and Redemptions. Portfolio value, gains/loss, category allocation, and per-fund cards.
  - **Emergency Fund Ledger**: Target tracking (months of expenses or custom amount), deposit/withdrawal history, progress ring, and runway calculation.
- **Zero-Based Budgeting**:
  - "Give every rupee a job before the month begins".
  - Expected income prefill from recorded income streams.
  - Live unallocated remaining balance indicator (turns emerald green at zero, red if over-allocated).
  - Daily safe-to-spend calculation for remaining days in the month.
  - "Copy Previous Month's Budget" and "Auto-balance to Other" actions.
- **Settings, Imports & Exports**:
  - Customizable categories, payment sources, income streams, and investment classes.
  - Full **JSON Backup & Restore**.
  - **CSV Export** for Transactions, Income, and Investments.
  - **Guided Google Sheets Integration Wizard**.

---

## 🚀 Getting Started

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build
```

FinFlow defaults to **Demo Mode** out of the box with realistic multi-month sample transactions, income streams, mutual funds, and emergency fund allocations cached in your browser's `localStorage`.

---

## ☁️ Google Sheets & Google Apps Script Setup

FinFlow uses your own Google Account as the database via a standalone Google Apps Script Web App. Your data never touches any intermediate servers.

### Step 1: Create a Google Sheet
1. Visit [sheets.new](https://sheets.new) to create a new spreadsheet.
2. Note the Spreadsheet ID from the URL (e.g. `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`).

### Step 2: Add Google Apps Script
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Erase any default code in `Code.gs` and copy the contents of [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) into the editor.
3. Replace the `SECRET_KEY` variable at the top with a secret passphrase of your choice:
   ```javascript
   const SECRET_KEY = "my-secure-finflow-passphrase";
   ```

### Step 3: Deploy as Web App
1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to *Select type* and pick **Web app**.
3. Configure the deployment:
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(required so your local browser client can send requests without OAuth popups)*
4. Click **Deploy**, authorize permissions when prompted, and copy the **Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).

### Step 4: Link FinFlow
1. In FinFlow, navigate to **Settings > Google Sheets Setup**.
2. Paste your **Spreadsheet URL or ID**, **Web App URL**, and **Secret Key**.
3. Click **Test Link** to verify the connection.
4. Click **Migrate Data Now** to push all your local records into your Google Sheet.
   - The script will automatically create the tabs with headers: `Transactions`, `Income`, `Investments`, `EmergencyFund`, `Budgets`, and `Config`.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- **Bundler**: [Vite 8](https://vite.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + Custom Apple macOS Liquid Glass Design System
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with LocalStorage persistence and Google sync abstraction
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts & Visualizations**: [Recharts](https://recharts.org)
- **Icons**: [Lucide React](https://lucide.dev)
- **Dates**: [date-fns](https://date-fns.org)

---

## 🔒 Security & Privacy

- **Single User & No Third-Party Tracking**: All state is stored in your browser's `localStorage` and synchronized strictly between your browser and your private Google Sheets Web App.
- **No Secrets in Source Code**: Credentials (Web App URL, Secret Key, and Spreadsheet ID) are configured at runtime and kept purely in client-side storage.
