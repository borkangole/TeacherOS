<div align="center">

# TeacherOS

**A secure offline desktop system for managing teacher personnel records and student enrollment data**

Built for the Department of Education (DepEd) — Cuartero District

[![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Private-lightgrey)](#)

</div>

---

## Overview

TeacherOS is a fully offline desktop application built to digitize and centralize teacher personnel records and multi-year student enrollment data across 20+ elementary and secondary schools. It replaced a fragmented, error-prone Excel-based workflow with a single, polished, installable Windows application — usable by a non-technical school administrator with zero setup or internet dependency.

Built end-to-end as a real client engagement: from understanding messy, inconsistent spreadsheet formats actually used in the field, to shipping a signed, branded `.exe` installer.

---

## Features

- 🔐 **Secure local authentication** — SHA-256 hashed passwords with salt, no plaintext storage, password reset flow
- 📋 **Teacher records management** — full CRUD across 16 personnel fields (GSIS, TIN, PhilHealth, PAGIBIG, appointment history, position)
- 📥 **Smart Excel/CSV import** — auto-detects header rows in messy real-world spreadsheets, intelligent column mapping, multi-sheet support
- 🎓 **Multi-year enrollment tracking** — Kinder through Grade 12, with dynamic Elementary/Secondary views
- 📊 **Dashboard analytics** — live KPIs, incomplete record alerts, position/school breakdowns
- 📦 **One-click Windows installer** — bundled sample data, custom branding, zero technical setup for the end user

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Electron 29 (Chromium + Node.js) |
| **Backend / IPC** | Node.js |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Data storage** | JSON file-based (atomic writes) |
| **Excel/CSV parsing** | SheetJS (xlsx) |
| **Auth** | Node.js Crypto (built-in, SHA-256 + salt) |
| **Packaging** | electron-builder (NSIS installer) |
| **Tooling** | VS Code, Git, npm |

---

## Project Structure

```
teacher-records-app/
├── assets/
│   ├── icon.ico              # App + installer icon
│   └── logo.png              # In-app branding
├── data/
│   ├── teacher_records.json       # Bundled sample data
│   └── enrollment_records.json
├── renderer/
│   ├── login.html            # Auth screens (login/setup/reset)
│   ├── dashboard.html        # Analytics dashboard
│   ├── index.html            # Teacher records CRUD + import
│   └── enrollment.html       # Enrollment tracking
├── main.js                   # Electron main process, IPC handlers, auth
├── preload.js                 # contextBridge API exposure
├── package.json                # electron-builder config
└── README.md
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/teacheros.git
cd teacheros
npm install
```

### Run in development

```bash
npm start
```

### Build a Windows installer

```bash
npm run build
```

Output: `dist/Teacher Records System Setup 1.0.0.exe`

> **Note:** Run your terminal as Administrator on Windows — electron-builder requires elevated permissions to create symbolic links during packaging.

---

## Core Modules

**Authentication** — First-time setup, hashed login, change password, admin-key recovery, session-gated IPC handlers.

**Teacher Records** — Searchable, sortable table with Elementary/Secondary auto-classification, full detail view (computed age, years of service), CSV export.

**Excel/CSV Import** — Scans the first 25 rows to locate the true header row even with stray data above it, auto-maps columns by keyword matching, supports multi-sheet workbooks with a sheet picker.

**Enrollment Tracking** — Kinder–Grade 12 across multiple school years, dynamic grade-level columns per school type, segmented filter tabs with live counts.

**Dashboard** — Total teachers/schools/enrollment KPIs, missing critical ID alerts, recently added records feed.

---

## Real-World Engineering Notes

A meaningful part of this build involved handling **messy, real client data** rather than clean test fixtures:

- Source Excel files had inconsistent header row positions, stray top rows, and differing formats year over year
- Manually verified and corrected a totals discrepancy by cross-checking all 20 schools individually against a faulty `SUM()` range in the client's original spreadsheet
- Built defensive row-padding and type-coercion logic to survive format drift across multiple academic years' files
- Resolved real Windows deployment issues: symbolic link permission errors during `electron-builder` packaging, browser/antivirus blocking of unsigned executables, and corrupted icon file encoding

---

## Impact

- **355+** teacher personnel records digitized
- **93+** enrollment records across **4 school years** (2022–2027)
- **20+** elementary and secondary schools centralized into one system

---

## Author

**Mhel B. Bustamante**
Portfolio: [mhel.vercel.app](https://mhel.vercel.app)

---

## License

This project was built as a private client engagement for DepEd Cuartero District. Source code shared here is for portfolio purposes — not licensed for redistribution or commercial reuse without permission.
