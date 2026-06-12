# 🛡️ WebAudit Pro — Professional Open-Source Security Audit Platform

WebAudit Pro is a premium, developer-focused, passive web security scanner built on **Next.js 16 (App Router)** and styled with a custom **Cyber-Physical Security System (obsidian & cyber-blue)** palette. It performs high-velocity, non-intrusive audits across **15 distinct security domains** by aggregating data from industry-leading security registries, passive certificate intelligence logs, and passive port registries—achieving zero-budget execution.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
*   [Node.js v20.x or higher](https://nodejs.org)
*   [npm](https://www.npmjs.com) or [pnpm](https://pnpm.io)

### 2. Environment Configurations
Create a `.env` file in the root directory:
```env
# Database Credentials (Supabase PostgreSQL / Local sqlite)
DATABASE_URL="file:./dev.db"

# Optional External API Credentials (Zero-Budget Free Keys)
# Register at: https://nvd.nist.gov/developers/request-an-api-key
NVD_API_KEY=""
# Register at: https://www.abuseipdb.com/register
ABUSEIPDB_API_KEY=""
# Register at: https://www.virustotal.com/gui/join-us
VIRUSTOTAL_API_KEY=""
# Register at: https://ipinfo.io/signup
IPINFO_API_KEY=""
```

### 3. Local Installation
```bash
# Clone the repository
git clone https://github.com/webauditpro/webauditpro.git
cd webauditpro

# Install production-ready dependencies
npm install

# Run database migrations (Prisma)
npx prisma db push

# Start the optimized Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🎨 Design Theme & Core Accents
Following the **Cyber-Physical Security (Soft-Industrial)** design specifications, WebAudit Pro incorporates a sleek, compact, and high-contrast color scheme:
*   **Background Base**: `#0A0A0A` (obsidian dark mode base)
*   **Surface Containers**: `#131313` & `#1A1A1A` with `#2A2A2A` subtle borders.
*   **Primary Accent**: `#00A3FF` (Cyber Blue)
*   **Secondary Elements**: `#c8c6c5` (Secondary Slate) & `#ffb77d` (Soft Amber) for intermediate risk levels.
*   **Risk Metric Styling**:
    *   🔴 **Critical**: `#93000a` (Deep crimson)
    *   🟠 **High**: `#eb8104` (Pure amber-orange)
    *   🟡 **Medium**: `#ffb77d` (Warm bronze-yellow)
    *   🟢 **Low / Pass**: `#10b981` (Cyber emerald)
    *   🔵 **Info**: `#00A3FF` (Cyber blue)

---

## 🗺️ Page Mapping & File Structure

Here is a map of the pages and API endpoints developed for this project, optimized for standard width grids:

### Front-End Routing (Compact Layouts)
*   **`/` (Landing Page)**: Main input viewport featuring interactive scan triggers, real-time SSE progress trackers, core features highlights, and telemetry overviews.
*   **`/report/[scanId]` (Detailed Security Report)**: High-end executive report containing executive summary percentages, vulnerability scores, radar distribution metrics, findings list, compliance check matrices, and PDF/HTML/JSON export buttons.
*   **`/scans` (Scan Repository)**: Catalog of recent domain audits, their respective security grades, and deep links to past reports.
*   **`/docs` (Developer APIs & Guides)**: REST endpoint integration guidelines and manual descriptions of the passive audit methodologies.
*   **`/about` (Mission & Architecture)**: Insights on the open-source mission, technology stacks, and zero-budget engineering solutions.
*   **`/contact` (Inquiries & Bug Tracker)**: Interactive contact form capturing name, email, and message payloads.
*   **`/admin` (Admin Control Center)**: Executive control dashboard with multiple nested widgets.

### API Architecture
*   `POST /api/audit/start`: Verifies target URLs, creates a `PENDING` db state, and starts the asynchronous thread.
*   `GET /api/audit/stream`: Establishes the real-time **Server-Sent Events (SSE)** channel streaming scan steps.
*   `GET /api/audit/[scanId]`: Returns the complete detailed audit report JSON payload.
*   `GET/POST /api/admin/config`: Accesses and persists Dynamic CMS settings inside the database.
*   `GET/POST/PATCH /api/admin/leads`: Manages captured sales pipeline leads.
*   `GET/POST/DELETE /api/admin/schedules`: Automates cron-like recurrences for target monitoring scans.
*   `GET/PATCH /api/admin/users`: Manages subscription access levels and limits.

---

## 💼 Essential Admin Command Center Features

To elevate the scanner into a full enterprise-grade platform, `/admin` is equipped with a comprehensive operations suite divided into several high-performance sections:

### 1. Telemetry & Analytics Overview
*   **Interactive Area Chart (Recharts)**: Monitors daily scan volume versus discovered security anomalies.
*   **Interactive Bar Chart (Recharts)**: Visualizes vulnerabilities mapped by categories (SSL/TLS, HTTP Headers, Port exposures, OWASP compliance).
*   **Live Event Logs**: Dynamic terminal-style widgets showing active scan triggers and audit outputs.

### 2. Historical Scan Diffing Engine
Allows admins to select a target domain and compare historic reports (**Scan A** and **Scan B**) side-by-side:
*   Visualizes variations in the overall security grade.
*   Tracks resolved vulnerabilities and new anomalies.
*   Calculates relative score improvements or risk percentage escalations.

### 3. Dynamic CMS & Accent Customization
Allows non-technical admins to white-label the scanner on the fly. Values are stored in Supabase PostgreSQL and populated across the landing page:
*   **Brand Customizer**: Edit corporate name, custom reports footer text, and visual brand accent colors.
*   **Copywriting Editors**: Instantly adjust the hero title, main subtitle, and CTA button text.
*   **Paywall Toggle**: Enable/disable Stripe integrations to lock deep-scan parameters behind premium payment walls.

---

## 🔋 Zero-Budget Free Integrations Matrix

All integrated services operate on **100% Free Tiers** requiring no active billing:

| Service Provider | Security Domain | Auth Required | Free Limits | API Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSL Labs (Qualys)** | SSL/TLS & Ciphers | **No** | 25 req/day | Validates handshake protocols, cipher suites, and trust chains. |
| **Mozilla Observatory** | HTTP Security Headers | **No** | Unlimited | Scans for correct CSP, HSTS, X-Frame, and CORS configurations. |
| **Shodan InternetDB** | Port & CVE Mapping | **No** | Unlimited | Passive identification of open database ports and hardware bugs. |
| **Google DoH** | DNS Records & DNSSEC | **No** | Unlimited | High-speed retrieval of MX, SPF, DMARC, TXT, and CAA variables. |
| **crt.sh** | Subdomain & Cert Logs | **No** | Unlimited | Passive cert log parsing to list active child domains and paths. |
| **OSV.dev** | Packages Vulnerability | **No** | Unlimited | Checks third-party libraries against open vulnerability records. |
| **HackerTarget** | DNS Zone & Subdomains | **No** | 100 req/day | Aggregates subdomains, DNS parameters, and records history. |
| **NVD (NIST)** | CVE Database Lookup | **Yes (Free)** | 50 req/30s | Resolves hardware/software CVE IDs to obtain CVSS scores. |
| **AbuseIPDB** | IP Reputation History | **Yes (Free)** | 1k req/day | Calculates abuse confidence score and logs historic malware flags. |
| **IPInfo.io** | Geolocation & ASN | **Yes (Free)** | 50k req/mo | Pulls hosting provider metadata and accurate physical node details. |
| **VirusTotal** | Malware Check URL | **Yes (Free)** | 500 req/day | Cross-references domains against 70+ antiviruses and blocks. |

---

## 📄 Open Source License
This project is licensed under the **MIT License** — permitting private, commercial, and modifying usages free of charge. See the LICENSE file for details.
