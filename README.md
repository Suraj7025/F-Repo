# FinFlow – Personal Finance Manager

A modern, single-user personal finance manager crafted with Apple macOS **"Liquid Glass"** aesthetics. FinFlow gives you complete control over your financial records with **zero login**, **zero third-party tracking**, and a **private Google Sheets backend** powered by a standalone Google Apps Script Web App.

---

## ✨ Key Capabilities

- **macOS Liquid Glass Design System**:
  - Translucent glass panels with layered backdrops (`backdrop-filter: blur(24px) saturate(180%)`).
  - Animated colorful background ambient orbs.
  - Native **Light Mode**, **Dark Mode**, and **System Mode** toggles.
  - Monospace tabular numbers, fluid Framer Motion micro-animations, and animated numeric counters.
- **Interactive Bento-Grid Dashboard**:
  - Hero statistics: Income, Total Spent, Net Savings, Savings Rate %, Invested Amount, and Emergency Fund balance.
  - Financial Health Score (0–100) dynamically calculated from savings rate, budget adherence, and emergency fund runway.
  - Spending by category donut chart + top expense categories list.
  - Income vs Expense 6-month & 12-month area trend chart.
  - Daily spending heatmap / timeline bar chart.
  - Spending breakdown by payment source (UPI, Credit Card, Bank Transfer, Cash).
  - AI-inspired Smart Insights with real-time financial comparisons.
  - Zero-based Budget vs Actual real-time widget.
- **Transactions Management**:
  - Filter by month, search across notes/categories/sources, sort by date/amount/category.
  - Desktop responsive table and touch-optimized mobile cards.
  - Quick-add modal, edit in-place, delete with **undo toast notifications**.
- **Income Tracking**:
  - Multi-stream income support (Salary, Freelance, Dividends, Interest, Bonus, etc.).
  - Month-over-month trend analysis and breakdown by source.
- **Investments & Savings (I&S)**:
  - **Mutual Funds / Portfolio**: Track SIP, Lumpsum, and Redemptions. Portfolio value, unrealized gains/loss, category allocation, and per-fund cards.
  - **Emergency Fund Ledger**: Target tracking (months of expenses or custom amount), deposit/withdrawal history, progress ring, and runway calculation.
- **Zero-Based Budgeting**:
  - "Give every rupee a job before the month begins".
  - Expected income prefill from recorded income streams.
  - Live unallocated remaining balance indicator (turns emerald green at zero, red if over-allocated).
  - Daily safe-to-spend calculation for remaining days in the month.
  - "Copy Previous Month's Budget" and "Auto-balance to Other" actions.
- **Settings, Configuration & Multi-Year Management**:
  - Customizable categories, payment sources, income streams, and investment classes with in-place rename cascades.
  - Currency selector (INR ₹, USD $, EUR €, GBP £, CAD C$, AUD A$, SGD S$, AED, JPY ¥) with locale formatting.
  - Full **JSON Backup & Restore** with drag-and-drop validation & preview.
  - **CSV Export** for Transactions, Income, and Investments.
  - **Switch Spreadsheet ID**: Switch between any existing sheets with instant data pull.
  - **Start New Year Sheet**: One-click generation of fresh annual spreadsheets with pre-formatted tabs.

---

## ⚡ Google Sheets Integration Architecture

FinFlow connects directly to your private Google Sheet without any intermediate servers:

```
┌─────────────────────────────────┐
│     FinFlow (Local Client)      │
│  - React 19 + TypeScript        │
│  - Zustand Store                │
│  - localStorage Fallback Cache  │
└────────────────┬────────────────┘
                 │
                 │ HTTP POST (Content-Type: text/plain)
                 │ Body: { action, secretKey, spreadsheetId, ...data }
                 ▼
┌─────────────────────────────────┐
│ Google Apps Script Web App      │
│ (Hosted on Google Infrastructure)│
│  - Secret Key Authentication    │
│  - Auto-Creates & Styles Tabs   │
│  - ContentService JSON Output   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Your Google Sheet           │
│  - Transactions Tab             │
│  - Income Tab                   │
│  - Investments Tab              │
│  - EmergencyFund Tab            │
│  - Budgets Tab                  │
│  - Config Tab                   │
└─────────────────────────────────┘
```

### 1. Reliable Protocol (No CORS Preflight Failures)
Browser requests use `POST` with `Content-Type: text/plain` containing `secretKey` and `spreadsheetId` in the JSON body. This avoids CORS `OPTIONS` preflight issues in Google Apps Script, guaranteeing instant, reliable data transport.

### 2. Optimistic Updates with Rollback on Failure
When you create, modify, or delete any record in FinFlow:
1. **Immediate UI Update**: FinFlow snapshots the prior state, updates Zustand and browser `localStorage` instantaneously.
2. **Background Sync**: The app sends the payload to Google Sheets and sets the sync badge to `Syncing...`.
3. **Rollback on Error**: If the Google API request fails (network error, invalid secret key, timeout), FinFlow automatically rolls back the store and `localStorage` to the prior snapshot and alerts you via an error toast.

### 3. Offline Cache Fallback
- FinFlow automatically detects network status via `navigator.onLine` and `window` event listeners.
- If your device loses connection, FinFlow functions 100% offline using `localStorage`, setting the sync badge to `Offline (Cached)`.
- When connectivity returns, FinFlow automatically attempts to re-sync with Google Sheets.

### 4. Multi-Year Spreadsheets & Instant Switching
- **Start New Year Sheet**: FinFlow can instruct Google Apps Script to create a brand new spreadsheet named `FinFlow <Year>` with all headers styled and switch your active connection.
- **Switch Spreadsheet ID**: Switch back and forth between past fiscal years or test sheets at any time.

---

## 🚀 Setup Guide

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build
```

FinFlow starts with an **empty tracker**. New transactions and settings are stored in your browser's `localStorage` unless you connect Google Sheets. Use Settings → Data & Import/Export to back up your records, or Settings → Start Fresh to clear all records.

---

### Step-by-Step Google Integration Setup

#### Step 1: Create a Google Sheet
1. Visit [sheets.new](https://sheets.new) to create a new spreadsheet.
2. Note the Spreadsheet ID from the URL (e.g. `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`).

#### Step 2: Add Google Apps Script
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Erase any default code in `Code.gs` and copy the contents of [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
3. Replace the `SECRET_KEY` variable at the top with a secret passphrase:
   ```javascript
   const SECRET_KEY = "my-secure-finflow-passphrase";
   ```

#### Step 3: Deploy as Web App
1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to *Select type* and pick **Web app**.
3. Configure the deployment:
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(required so your local browser client can send requests without OAuth popups)*
4. Click **Deploy**, grant permissions when prompted, and copy the **Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).

#### Step 4: Link FinFlow
1. In FinFlow, open **Settings > Google Sheets Setup**.
2. Paste your **Spreadsheet URL or ID**, **Web App URL**, and **Secret Key**.
3. Click **Test Link** to verify connection.
4. Click **Sync Local Records to Sheet** to push current records into your Google Sheet.
   - The script will automatically create and style the tabs: `Transactions`, `Income`, `Investments`, `EmergencyFund`, `Budgets`, and `Config`.

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

- **Single User & No Central Tracking**: All state is stored in your browser's `localStorage` and synchronized strictly between your browser and your private Google Sheets Web App.
- **No Secrets in Source Code**: Credentials (Web App URL, Secret Key, and Spreadsheet ID) are configured at runtime and kept purely in client-side storage.
- **Encrypted in Transit**: All communication with Google Apps Script is encrypted via standard HTTPS.
