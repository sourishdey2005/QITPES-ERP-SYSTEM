# QITPES ERP System

**An India-first, AI-assisted enterprise resource planning platform for construction, infrastructure and project-driven businesses.**

Built and maintained by **[Arunima Dutta](mailto:duttaarunima50@gmail.com)** — Founder & Owner, QITPES.

![Version](https://img.shields.io/badge/version-2.0.0-b2111b)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)
![Currency](https://img.shields.io/badge/Currency-INR%20%E2%82%B9-1a7f37)

---

## Table of contents

1. [Why QITPES](#why-qitpes)
2. [At a glance](#at-a-glance)
3. [Modules and routes](#modules-and-routes)
4. [Platform capabilities](#platform-capabilities)
5. [Technology stack](#technology-stack)
6. [Architecture](#architecture)
7. [Getting started](#getting-started)
8. [Environment variables](#environment-variables)
9. [Database and schema](#database-and-schema)
10. [Demo data engine](#demo-data-engine)
11. [AI features](#ai-features)
12. [Excel import and export](#excel-import-and-export)
13. [Deployment](#deployment)
14. [Reliability and performance notes](#reliability-and-performance-notes)
15. [Security notes](#security-notes)
16. [Project documentation](#project-documentation)
17. [Roadmap](#roadmap)
18. [Author and contact](#author-and-contact)
19. [License](#license)

---

## Why QITPES

Construction and infrastructure companies run on dozens of disconnected spreadsheets: site progress in one file, RA bills in another, labour attendance in a register, GST in the accountant's laptop. QITPES brings the entire operating model into a single, fast, browser-based console:

- **One system of record** from tender to handover — business development, procurement, contracts, stores, plant, workforce, payroll, billing, accounting and compliance.
- **India-first by design** — ₹ formatting in `en-IN`, GST/CGST/SGST/TDS, GSTIN and PAN capture, Indian RTO vehicle numbers, Indian names, cities and statutory holidays.
- **Decision-ready dashboards** — revenue vs target, site allocation, cash position, AR/AP aging, project utilisation and risk heatmaps, powered by Recharts.
- **AI assistance where it matters** — Gemini-driven strategy questions, document/data analysis and CSV/Excel insight generation.
- **Works even when the network does not** — a deterministic demo dataset keeps every screen populated and usable, so the product can be reviewed and demonstrated without a database.

---

## At a glance

| Area | Details |
|------|---------|
| **Application type** | Single-page enterprise web application (SPA) |
| **Modules** | 40+ screens across 9 functional groups |
| **Database** | Supabase (PostgreSQL) with 76 tables and RLS policies |
| **Currency** | Indian Rupee (₹), `Intl.NumberFormat('en-IN')` |
| **Vehicle registry** | Real Indian RTO series (MH-12, DL-01, KA-05, TS-09, GJ-01, …) |
| **Locale** | India — GST, TDS, PAN, GSTIN, Indian financial year |
| **Auth** | Owner gate plus Supabase Auth / `approved_users` onboarding |
| **Roles** | `owner`, `director`, `accounting` |
| **AI** | Google Gemini 2.5 Flash |
| **Build tool** | Vite 6 + TypeScript 5.8 |
| **Styling** | Tailwind CSS utilities, Calibri/Inter typography |
| **Charts** | Recharts 3 |
| **Animation** | Framer Motion 12 |

---

## Modules and routes

The application uses hash routing (`HashRouter`), so every screen is directly linkable and deploys cleanly to static hosting.

### Operations

| Screen | Route | What it does |
|--------|-------|--------------|
| **Command Center** | `/` | Revenue, expenses, active project and workforce KPIs with month-on-month trend, financial growth chart, project status distribution and active project master. |
| **Projects** | `/projects` | Project master with client, budget, contract value, completion, site, fiscal utilisation and status filtering. Full create/edit/delete and Excel export. |
| **Planning** | `/planning` | Milestone scheduling with project linkage, owner, due date and status tracking. |
| **Production** | `/production` | Plant and unit activity ledger with live status stream for batching plants, crushers, precast and fabrication yards. |
| **Meetings & Rooms** | `/collaboration` | Conference room registry, meeting scheduling, organiser, department and agenda tracking. |
| **Enterprise Calendar** | `/calendar` | Unified month view of holidays, approved leave and scheduled meetings. |

### Contracts

| Screen | Route | What it does |
|--------|-------|--------------|
| **Contracts & Work Orders** | `/contracts` | Six workspaces: client contracts, subcontracts, running bills (RA bills with retention/TDS and net payable), security deposits, variation orders and contract claims. |

### Procurement and supply chain

| Screen | Route | What it does |
|--------|-------|--------------|
| **Procurement & Supply** | `/procurement` | Material requisitions, RFQ workflow, procurement inventory view, goods receipt notes and vendor performance scoring. |
| **Inventory Master** | `/inventory` | SKU registry with stock level, reorder threshold, unit price, store value and low-stock detection. |
| **Purchasing Ledger** | `/purchasing` | Purchase order creation and lifecycle (draft to delivered) with vendor and delivery tracking. |
| **Vendor Matrix** | `/vendors` | Vendor master with GSTIN, PAN, contact, bank details and quality/delivery/cost performance. |

### Human resources

| Screen | Route | What it does |
|--------|-------|--------------|
| **HR Management** | `/hr` | Employee lifecycle registry with department, role, gross salary, deductions and status. |
| **Workforce Master** | `/workforce` | Master records plus departments, appraisals, promotions, memos, transfers, exit clearances, grievances and document locker. |
| **Roster & Shifts** | `/roster` | Daily deployment board linking staff identity, division and shift node, with shift pattern management and rotation history. |
| **Site Wages** | `/site-wages` | Contract labour registry, daily attendance and wage payroll, exportable to Excel. |
| **Payroll** | `/payroll` | Monthly salary engine with gross, deductions, net payout, pay-cycle authorisation, payee management and Excel export. |
| **Performance (OKR)** | `/okr` | Company and department objectives with owner, progress and on-track/at-risk/completed status. |

### Finance

| Screen | Route | What it does |
|--------|-------|--------------|
| **Finance & Accounts** | `/finance` | Executive finance console: receivables, payables, liquidity, invoices, RA bills, cost centres, budget cost, cashflow and aging workspaces. |
| **Finance – Ledger View** | `/accounts` | Alternate finance workspace focused on inflows, outflows and reconciliation. |
| **Accounting Hub** | `/ledger` | Journals, ledger, trial balance, P&L, balance sheet, reconciliation, AR/AP and period closing with double-entry lines. |
| **Tally Registry** | `/tally` | Unified fiscal log of sales, purchases and wage disbursements with Excel export. |
| **Cost Centers** | `/cost-centers` | Site cost centres with budget, spend, utilisation and audit view. |
| **Budget & Cost** | `/budget-control` | Budget allocation, revision history, approval queue, petty cash, fixed expenses, capital expenditure and project cost breakdown. |
| **Tax Engine** | `/tax` | GST/TDS filing register with CGST, SGST, total tax, filing month and compliance status. |

### Sales and marketing

| Screen | Route | What it does |
|--------|-------|--------------|
| **Tenders & Biz-Dev** | `/biz-dev` | Tender tracking, rate analysis library, bid approvals and competitor analysis with win probability. |
| **CRM Master** | `/crm` | Clients, leads/opportunities, interaction log and CRM contracts with stage and probability. |

### Assets

| Screen | Route | What it does |
|--------|-------|--------------|
| **Machinery** | `/machinery` | Plant asset telemetry: engine hours, fuel level, health, downtime, output and maintenance cost. |
| **Fleet & Fuel** | `/fleet` | Vehicle registry with Indian RTO numbers, deployment location, odometer, lifecycle status and status updates. |

### Analytics

| Screen | Route | What it does |
|--------|-------|--------------|
| **Executive Monitor** | `/executive-monitor` | Tier-1 oversight: revenue vs target, major site delays, tender pipeline, risk-adjusted worth, pending AR, cashflow and risk heatmap. |
| **BI Analytics** | `/bi` | Six analytics lenses — finance, HR, inventory, operations, AI and sales — with anomaly detection and drill-down metrics. |
| **AI Strategy** | `/ai` | Gemini-powered strategic query console with quick prompts for forecasting and logistics optimisation. |
| **AI Assistant** | `/ai-analysis` | Conversational assistant for questions about enterprise data. |
| **AI Data Insights** | `/data-insights` | Upload CSV/Excel, generate AI analysis and visualisations. |

### Administration

| Screen | Route | What it does |
|--------|-------|--------------|
| **Workflows** | `/workflows` | Approval protocol builder per module with configurable steps and activation state. |
| **User Approval** | `/access-control` | Registration requests, active user management, role assignment and permission control. |
| **Company Settings** | `/settings` | Corporate identity, GSTIN/PAN, security toggles, thresholds, data export and portability. |
| **Audit Logs** | `/audit` | System activity trail for governance review. |
| **System Maintenance** | `/maintenance` | Infrastructure status and controlled global data purge. |
| **Login** | `/login` | Owner sign-in gate with session restoration. |

---

## Platform capabilities

### India-localised finance

- All monetary values render as ₹ with Indian digit grouping (`₹3,03,58,02,500`).
- GST computation with CGST/SGST/IGST split, taxable value, GST percentage and generated totals on client invoices.
- TDS, retention money, security deposits and performance guarantees modelled on running bills and contracts.
- Financial years (FY 2024-25 → FY 2026-27), period closing and budget revision history.
- GSTIN/PAN validation-friendly formats across vendors, clients and enterprise settings.

### Project and site control

- Project master with contract value, budget, estimated cost, paid amount and completion percentage.
- Cost breakdown by category — material, labour, machinery, subcontract and overheads.
- Risk register with impact/probability scoring, mitigation plans and status.
- Milestones, site allocation distribution and utilisation/audit views.
- Cost centres mapped to sites with budget vs spend burn rate.

### Procurement to payment

- Requisition → RFQ → vendor quotation → purchase order → GRN → bill flow.
- Preferred-vendor scoring on quality, delivery and cost.
- Warehouse and stock ledger with reorder thresholds.
- Purchase order lifecycle and delivery-date tracking.

### Workforce and payroll

- Employee master, departments, appraisals, promotions, transfers, exits, grievances, memos and documents.
- Shift patterns with allowance multipliers and nightly differentials.
- Daily roster with staff identity, division and shift node.
- Contract labour attendance and daily-wage payroll.
- Monthly payroll with per-payee deductions, net payout, pay-cycle authorisation and export.

### Contracts and billing

- Client contracts with scope, retention percentage and performance guarantee.
- Subcontract work orders with service-tax applicability and retention.
- RA bills with gross value, retention, TDS, other deductions and net payable.
- Variation orders and contract claims with settlement tracking.
- Security deposits by type (EMD, retention, performance bond) and release status.

### Analytics and oversight

- Live KPI cards with month-over-month trend calculation.
- Revenue/expense growth cycles and project status distribution.
- AR/AP aging buckets, cashflow forecasting and liquidity position.
- Executive risk heatmap and tender pipeline valuation.
- BI lenses for finance, HR, inventory, operations, sales and AI.
- Anomaly detection for cost spikes and cash drift.

### Governance

- Role scaffolding for owner, director and accounting access.
- `approved_users` onboarding with active/inactive control.
- Workflow automation per module with multi-step approval configuration.
- Audit log and maintenance console.
- Settings for corporate identity, security hardening toggles and data portability.

---

## Technology stack

| Layer | Technology |
|-------|------------|
| UI framework | React 19 with TypeScript 5.8 |
| Build tool | Vite 6 |
| Routing | React Router 7 (`HashRouter`) |
| Data fetching | TanStack React Query 5 |
| Backend / database | Supabase (PostgreSQL, RLS, Realtime) |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Animation | Framer Motion 12 |
| Styling | Tailwind CSS utility classes, Calibri/Inter |
| Spreadsheets | SheetJS (`xlsx`) for import and export |
| Hosting | Static hosting (Vercel configuration included) |

---

## Architecture

```
QITPES-ERP-SYSTEM/
├── App.tsx                  # Route table, auth context, protected routes
├── index.tsx                # React root, QueryClient and HashRouter
├── index.html               # Document shell, fonts, Tailwind CDN config
├── types.ts                 # Shared domain types (roles, projects, workflows)
├── constants.tsx            # Navigation model and shared constants
├── pages/                   # One file per screen (40+ modules)
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── FinanceManagement.tsx
│   ├── AccountingHub.tsx
│   ├── Payroll.tsx
│   ├── RosterShifts.tsx
│   └── ...
├── layouts/
│   └── DashboardLayout.tsx  # Sidebar, header, AI assistant mount, sign-out
├── components/
│   └── AIAssistant.tsx      # Floating Gemini chat widget
├── lib/
│   ├── supabase.ts          # Supabase client (wrapped by the demo layer)
│   ├── ownerAuth.ts         # Local owner session helpers
│   ├── ai-service.ts        # Gemini client, chat and analysis helpers
│   ├── genkit.ts            # Genkit model definitions
│   └── demo/
│       ├── dataset.ts       # Deterministic demo dataset for 76 tables
│       └── client.ts        # Supabase proxy: fallback reads, overlay writes
├── db.sql                   # Core schema (identity, projects, HR, finance)
├── db_*_SUITE.sql           # CRM, contracts, procurement, finance, tendering…
├── scripts/                 # Theme and colour migration utilities
└── vercel.json              # SPA rewrite configuration
```

### Data flow

1. Screens call `supabase.from(table)` through TanStack Query.
2. In production, Supabase returns live rows. Row-level security governs access.
3. If the database is unreachable, errors, or a table is empty, the demo layer serves deterministic local rows for that table.
4. Mutations are attempted against Supabase first; if the table is being served locally, the change is applied to a localStorage overlay so add/edit/delete remain functional.
5. Excel exports are generated client-side with SheetJS; charts are rendered client-side with Recharts.

---

## Getting started

### Prerequisites

- Node.js 18 or newer (Node 20 LTS recommended)
- npm 9 or newer
- A Supabase project (optional for UI review; required for persistence)
- A Google Gemini API key (optional; required for AI screens)

### Installation

```bash
git clone https://github.com/sourishdey2005/QITPES-ERP-SYSTEM.git
cd QITPES-ERP-SYSTEM
npm install
```

### Configure the environment

```bash
cp .env.example .env
```

Fill in the values described in [Environment variables](#environment-variables), then start the dev server:

```bash
npm run dev
```

Vite serves the application on **http://localhost:3000** by default. To use a different port:

```bash
npm run dev -- --port 5199
```

### Production build

```bash
npm run build     # type-aware bundling into dist/
npm run preview   # serve the production build locally
```

### First sign-in

The portal opens on the owner sign-in screen. Owner credentials are defined in `lib/ownerAuth.ts` and provisioned in `db_approved_users.sql`; they are intentionally not published here. After sign-in the session persists locally, and "Sign Out" in the sidebar clears it.

> The owner session is a local gate designed for single-tenant deployments. For multi-user rollouts, provision staff through `approved_users` and Supabase Auth.

### Available scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite in development mode with HMR |
| `npm run build` | Create a production bundle in `dist/` |
| `npm run preview` | Preview the production bundle |

---

## Environment variables

Copy `.env.example` to `.env`. Vite exposes only `VITE_*` variables to the browser.

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes (prod) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (prod) | Supabase publishable/anon key |
| `VITE_GEMINI_API_KEY` | For AI | Google Gemini API key (`VITE_API_KEY` is also accepted) |
| `GEMINI_API_KEY` | For AI tooling | Server/build-time Gemini key used by `vite.config.ts` |
| `VITE_DEMO_DATA` | No | Set to `false` to disable the local demo dataset |

The Supabase connection currently lives in `lib/supabase.ts` with the project URL and publishable key. The publishable key is safe to ship in a browser bundle; all sensitive access must remain protected by Postgres row-level security. For multi-environment deployments, move these values to `VITE_*` variables.

> Never place a Supabase **service role** key or any private secret in a `VITE_*` variable — those are compiled into the client bundle.

---

## Database and schema

QITPES ships a complete PostgreSQL schema for Supabase: **76 tables** with indexes, constraints and RLS policies.

### Apply the schema

Run the SQL files in the Supabase SQL editor, in this order:

1. `db.sql` — core identity, employees, projects, budgets, inventory, procurement, HR, finance and assets.
2. Feature suites (any order):
   - `db_CRM_SUITE.sql`
   - `db_CONTRACTS_SUITE.sql`
   - `db_PROCUREMENT_SUITE.sql`
   - `db_FINANCE_SUITE.sql`
   - `db_TENDERING_SUITE.sql`
   - `db_VENDORS_MASTER.sql`
   - `db_EXECUTIVE_SUITE.sql`
3. `db_approved_users.sql` — approved-user registry and the owner account.
4. Apply the relevant hotfix/policy files (`db_unlock_*.sql`, `db_fix_*.sql`, `db_HOTFIX_PURCHASING.sql`) only if your project predates the current schema or you are repairing policies.

### Table groups

| Domain | Tables |
|--------|--------|
| **Identity & settings** | `profiles`, `approved_users`, `enterprise_settings` |
| **Organisation** | `departments`, `cost_centers`, `financial_years`, `company_targets` |
| **Projects** | `projects`, `project_cost_breakdown`, `project_risks`, `planning_tasks`, `production_logs` |
| **Procurement & stores** | `vendors`, `vendor_performance`, `vendor_quotes`, `material_requisitions`, `procurement_rfqs`, `purchase_orders`, `grns`, `inventory`, `warehouses`, `warehouse_stock` |
| **Contracts** | `client_contracts`, `subcontracts`, `running_bills`, `variation_orders`, `contract_claims`, `security_deposits`, `contract_workers`, `contract_attendance` |
| **Finance** | `chart_of_accounts`, `journal_entries`, `journal_lines`, `general_ledger`, `ledger_entries`, `finance_transactions`, `client_invoices`, `cashflow_forecasts`, `tax_records`, `expense_approvals`, `petty_cash`, `fixed_expenses`, `capital_expenditure`, `budget_allocations`, `budget_revision_logs`, `bank_recon_logs` |
| **HR & payroll** | `employees`, `employee_documents`, `employee_appraisals`, `employee_promotions`, `transfer_requests`, `exit_clearances`, `grievances`, `internal_memos`, `leave_balances`, `holidays`, `shifts`, `shift_assignments`, `payroll_records` |
| **Sales & CRM** | `customers`, `sales_leads`, `crm_clients`, `crm_leads`, `crm_interactions`, `crm_contracts`, `tenders`, `boq_estimates`, `rate_analysis`, `competitor_analysis`, `bid_approvals` |
| **Assets & governance** | `assets`, `fleet`, `conference_rooms`, `meetings`, `okrs`, `workflows` |

### Row-level security

The schema enables RLS on operational tables and grants access to authenticated users, with owner-specific policies on `approved_users`. Because the local owner gate does not create a Supabase session, tables protected by authenticated-only policies will appear empty unless you either:

- sign in through Supabase Auth, or
- adjust policies for your deployment model, or
- rely on the demo dataset while evaluating the product.

---

## Demo data engine

The repository includes a fully deterministic demo dataset so the portal can be reviewed, demoed and developed without a live database.

### What it provides

- **220–300 rows** for every operational table and sensible counts for lookup tables (24 departments, 6 shifts, 40 cost centres, 10 rooms, 25 holidays, 3 financial years).
- **Indian RTO vehicle numbers** — `MH-12`, `MH-01`, `DL-01`, `KA-05`, `TS-09`, `GJ-01`, `RJ-14`, `TN-38` and 45+ more series, paired with realistic plant and vehicle models.
- **INR amounts everywhere** — project values, invoices, POs, salaries, budgets, petty cash and capex.
- **Indian business context** — GSTIN/PAN formats, vendor and client names, sites across Pune, Mumbai, Delhi, Bengaluru, Hyderabad and other cities, plus a statutory holiday calendar.
- **Stable output** — every table is generated from its own PRNG seed, so values do not change between reloads.

### How the fallback works

| Behaviour | Detail |
|-----------|--------|
| **Read path** | Tries Supabase first with a 2.5 s budget; falls back on error, timeout or empty result |
| **Network cooldown** | After a confirmed network failure, the DB is skipped for 60 s so pages render instantly |
| **Relations** | Joined selects such as `employees(...)`, `shifts(...)`, `projects(...)` are resolved locally |
| **Filters** | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `is`, `match`, ordering, limits and single-row queries |
| **Writes** | Insert/update/delete are attempted for real, then applied to a localStorage overlay (`qitpes_demo_overlay_v1`) |
| **Disable** | Set `VITE_DEMO_DATA=false` to serve only real Supabase data |

Demo data is illustrative and must not be treated as real company records.

---

## AI features

AI capabilities are powered by **Google Gemini 2.5 Flash** through the official `@google/genai` SDK. The client is created lazily, so a missing key never crashes the application — AI screens show a configuration message instead.

| Feature | Screen | Description |
|---------|--------|-------------|
| **AI Assistant** | Floating widget | Context-aware chat about enterprise data, available from every page |
| **AI Strategy Engine** | `/ai` | Strategic questions, headcount forecasting and logistics optimisation prompts |
| **AI Data Insights** | `/data-insights` | Upload CSV/XLSX, generate summaries, recommendations and charts |
| **BI AI lens** | `/bi` | Narrative commentary alongside BI metrics |

Set `VITE_GEMINI_API_KEY` in `.env` and restart the dev server. Gemini calls are made directly from the browser, so restrict and monitor the key in production (API key restrictions, quotas and billing alerts).

---

## Excel import and export

| Feature | Location | Format |
|---------|----------|--------|
| Project inventory export | Projects | `.xlsx` |
| Payroll register export | Payroll | `.xlsx` |
| Site wages export (registry, attendance, payroll) | Site Wages | `.xlsx` |
| Tally ledger export | Tally | `.xlsx` |
| Data file import for AI analysis | AI Data Insights | `.csv`, `.xlsx`, `.xls` |

Exports are generated entirely in the browser; no data leaves the machine for these operations.

---

## Deployment

The application is a static SPA and deploys to any static host.

### Vercel

The repository includes `vercel.json` with an SPA rewrite to `index.html`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

1. Import the repository into Vercel.
2. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
3. Add the environment variables from `.env.example`.
4. Deploy.

### Other hosts

Because routing is hash-based (`/#/projects`), Netlify, Cloudflare Pages, GitHub Pages or any static server works without rewrite rules. Upload the contents of `dist/` and point the host at `index.html`.

### Supabase

- Enable RLS on every operational table.
- Restrict policies to the roles that need each table.
- Keep the service-role key server-side only.
- Add your production domain to the allowed redirect URLs if you enable Supabase Auth.

---

## Reliability and performance notes

- **Fast cold start** — database reads are capped at 2.5 s before the local dataset takes over, and the network-down cooldown prevents repeated waits.
- **Query caching** — TanStack Query caches each dataset for the session and invalidates precisely after mutations.
- **Code splitting** — pages are bundled by Vite; icons are tree-shaken from Lucide.
- **Large bundle awareness** — the current build is ~2.4 MB minified (≈626 kB gzipped); use `manualChunks` if you need smaller initial payloads.
- **Offline-friendly** — navigation, lists, charts, forms and demo mutations all work without a reachable database.
- **Resilient UI** — missing relations and deleted reference rows render as `Unassigned`/`—` rather than crashing a screen.

---

## Security notes

- The Supabase **publishable/anon key** is intentionally public; protection comes from RLS. Never ship a service-role key to the browser.
- The owner login is a **local session gate** for this single-tenant build, not a substitute for hardened authentication. For multi-user production use, move to Supabase Auth with MFA and server-verified roles.
- Owner credentials are stored in `lib/ownerAuth.ts` and `db_approved_users.sql`. Rotate them before any public deployment and keep them out of screenshots and README files.
- Demo-mode edits live only in the browser's localStorage; they never reach the database.
- Gemini calls originate from the browser. Use restricted API keys, quotas and spending alerts.
- Enable audit logging and review `/audit` regularly in production.

---

## Project documentation

Additional notes live alongside the codebase:

- `ACCESS_CONTROL_FEATURE.md` — user approval and role management
- `AI_ASSISTANT_SETUP.md` — Gemini assistant configuration
- `AI_INTEGRATION_README.md` — AI integration overview
- `DATA_INSIGHTS_FEATURE.md` and `DATA_INSIGHTS_SETUP.md` — file-based AI insights
- `PRODUCTION_CHECKLIST.md` — go-live checklist
- `PRODUCTION_CRUD_FEATURE.md` and `PRODUCTION_CRUD_SUMMARY.md` — plant activity CRUD
- `SYMPOSIUM_CRUD_FEATURES.md` — meeting and room management
- `QUICK_TEST.md` — smoke-test walkthrough

---

## Roadmap

- [ ] Server-side PDF generation for RA bills, invoices and statements
- [ ] Automated GST/TDS return preparation and reconciliation
- [ ] Supabase Auth with MFA for every role
- [ ] Mobile-first site supervisor app (attendance, progress, material receipt)
- [ ] Document management with versioning and e-signature
- [ ] Automated test suite (unit, integration, end-to-end)
- [ ] Multi-company and multi-branch tenancy
- [ ] Offline-first sync queue for low-connectivity sites
- [ ] Role-based dashboard personalisation
- [ ] Webhook and API layer for accounting integrations

---

## Author and contact

**Arunima Dutta**
Founder & Owner, QITPES
Email: [duttaarunima50@gmail.com](mailto:duttaarunima50@gmail.com)
Repository: [github.com/sourishdey2005/QITPES-ERP-SYSTEM](https://github.com/sourishdey2005/QITPES-ERP-SYSTEM)

QITPES ERP is designed, directed and maintained by Arunima Dutta. Product decisions, module scope, financial workflows and the India-first design language reflect her operating model for project-driven enterprises.

For access, demos or partnership enquiries, write to the email above.

---

## License

Released under the MIT License. See the repository for the full text.

© 2026 QITPES. All rights reserved. "QITPES" and the QITPES wordmark are the property of the project owner.

---

<p align="center"><strong>QITPES ERP</strong> — one console for tenders, sites, stores, people, money and compliance.</p>
