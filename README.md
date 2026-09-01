<div align="center">

  # 🏢 BMSCE Hostel Management System
  ### *Enterprise-Grade Digital Campus Administration, Safety & Financial Platform*

  <p align="center">
    <strong>A next-generation full-stack hostel administration ecosystem built for BMS College of Engineering (BMSCE).</strong><br/>
    Unifying automated night roll-calls, cryptographic QR passports, ACID-compliant fee payments, live room inventory, multimedia complaint resolution, and 5-tier role-based governance.
  </p>

  <p align="center">
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-5.0-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15+-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma_ORM-5.0-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" /></a>
    <a href="https://razorpay.com/"><img src="https://img.shields.io/badge/Razorpay-Payment_Gateway-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" alt="Razorpay" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>

  <p align="center">
    <a href="#-executive-summary">Executive Summary</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-security--compliance-framework">Security & Compliance</a> •
    <a href="#-role-based-access-control-rbac">Roles (RBAC)</a> •
    <a href="#-technology-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a>
  </p>

</div>

---

## 🏛️ Executive Summary

Traditional hostel management relies on fragmented paper registers, manual cash/receipt reconciliation, and unverified roll-calls. This introduces administrative overhead, human error, attendance tampering, and financial blind spots.

The **BMSCE Hostel Management System** delivers a unified, zero-trust digital infrastructure custom-engineered for BMS College of Engineering. It replaces paper workflows with:

1. **Tamper-Proof Night Safety:** Cryptographic QR scans verified in real time against active approved leaves and hostel assignments.
2. **Guaranteed Financial Integrity:** Bank-grade Razorpay payment processing with HMAC-SHA256 signature verification and automated vector PDF receipts.
3. **Real-Time Room Allocation Engine:** High-concurrency room reservations with pessimistic database row-locking and automatic expiration timers.
4. **Transparent Governance:** Isolated role portals for Students, Wardens, Security Personnel, Accountants, and College Administrators.

---

## ✨ Key Features

```
                                  SYSTEM CAPABILITIES
                                  
  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
  │   🌙 NIGHT ATTENDANCE   │   │   📱 QR SMART PASSPORT  │   │   💳 FINANCIAL SUITE    │
  │ • Real-time leave cross │   │ • Unguessable UUIDv4    │   │ • Razorpay Gateway      │
  │ • Scoped security guards│   │ • Zero-PII gate checks  │   │ • HMAC-SHA256 checks    │
  │ • Instant CSV exports   │   │ • Instant fee status    │   │ • Vector PDF receipts   │
  └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
  │   🛏️ ROOM ALLOCATION    │   │   📸 COMPLAINTS HUB     │   │   ✈️ LEAVE & VISITORS   │
  │ • Live bed inventory    │   │ • Photo/video proofs    │   │ • Warden leave workflow │
  │ • Pessimistic row locks │   │ • Interactive lightbox  │   │ • Exit/return gate logs │
  │ • 4-min hold timers     │   │ • Base64 cloud storage  │   │ • Visitor photo ID logs │
  └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

---

### 🌙 1. Digital QR Night Attendance & Anti-Proxy Engine
- **Hostel-Scoped Security Assignment:** Administrators bind security guards strictly to designated hostel blocks. Guards cannot scan or access records for unassigned blocks.
- **On-Demand Session Control:** Security personnel start, pause, and resume attendance sessions dynamically without rigid operational locks.
- **Automated Leave Reconciliation:** The scanning engine checks active approved leaves in real time. Students on approved leave are automatically flagged as **ON LEAVE** rather than triggering false-absent alerts.
- **Zero-Proxy Guarantee:** Database-level compound unique constraints (`@@unique([sessionId, studentId])`) prevent duplicate scans or proxy roll-calls.
- **Live Register & Institutional CSV Audit:** Wardens and Administrators access real-time registers categorizing students as **Present**, **On Leave**, or **Absent** with instant CSV export.

---

### 📱 2. Cryptographic Student QR Passport & Gate Verification
- **Unguessable 128-Bit Cryptographic Tokens:** Generated via RFC 4122 Version 4 UUIDs, rendering brute-force or sequential token guessing impossible.
- **Data-Minimization Gate Verification:** When guards scan a student at the main gate, the system displays the identity badge, room allocation, and fee clearance while **strictly hiding sensitive contact and home details**.
- **Dynamic Token Revocation:** Instant token regeneration invalidates old printed cards or unauthorized screenshots.

---

### 💳 3. Financial & Fee Management Engine
- **End-to-End Razorpay Gateway:** Seamless digital fee settlement supporting UPI, NetBanking, Credit/Debit Cards, and Wallets.
- **Cryptographic Verification:** Webhook and client payment payloads are verified via HMAC-SHA256 signatures using `crypto.timingSafeEqual` to eliminate timing attacks.
- **ACID Serializable Concurrency:** Allocation and payment confirmations execute under PostgreSQL's highest isolation level (`Serializable`) with pessimistic row locking (`SELECT FOR UPDATE`), preventing double-booking.
- **Automated Vector PDF Receipts & Email:** Sequential receipt numbers (`REC-YYYY-XXXXXX`) rendered in vector PDF format and delivered automatically to students via transactional email (Resend).

---

### 🛏️ 4. Live Room Booking & Allocation Engine
- **Interactive Inventory Hierarchy:** Visual navigation of Hostel $\rightarrow$ Block $\rightarrow$ Floor $\rightarrow$ Room with live capacity indicators.
- **Atomic Reservation Lock:** Temporary 4-minute reservation locks safeguard selected beds while students complete checkout.
- **Administrative Allocation Overrides:** Wardens and Admins retain direct bed management and transfer privileges.

---

### 📸 5. Multimedia Complaint Tracking with Lightbox
- **Photo & Video Proof Uploads:** Students can attach up to 5 multimedia proofs (`JPEG`, `PNG`, `WebP`, `MP4`, `MOV`, `WebM`) per complaint.
- **In-Browser Inspection:** Wardens can inspect high-resolution images or stream video proofs in an interactive lightbox.
- **Permanent Base64 Database Storage:** Attachments are persisted directly in PostgreSQL as Data URIs, surviving cloud and container restarts.
- **Lifecycle Progression:** Status tracking from `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` with priority and category tags.

---

### ✈️ 6. Leave Management, Visitors & Campus Announcements
- **Leave Request Workflow:** Students apply online; Wardens approve or reject with custom remarks.
- **Physical Gate Exit & Return Logs:** Security guards log physical departure and arrival timestamps at the gate.
- **Visitor Pass System:** Student visitor logging with mandatory Photo ID verification and check-in/out timestamps.
- **Targeted Announcements:** Notices targeted by entire campus, specific hostel, study year, or department with read receipt tracking.

---

## 👥 Role-Based Access Control (RBAC)

The system implements strict institutional role separation across 5 distinct user categories:

| Role | Badges | Permissions & Capabilities | Security Scoping |
| :--- | :---: | :--- | :--- |
| **👑 Admin** | Global | Full platform governance, hostel configuration, security-to-hostel assignment, warden assignment, audit reports. | Global System-Wide Scope |
| **👨‍💼 Warden** | Block | Leave approvals/rejections, complaint resolution, bed reallocations, live attendance registers & CSV exports. | Restricted to Managed Hostels |
| **💰 Accountant** | Finance | Annual mess fee configuration, offline fee updates, financial ledger oversight, receipt regeneration. | Restricted to Fee Ledgers |
| **🛡️ Security** | Gate/Floor | Public QR passport verification, night roll-call scanner, visitor check-in/out logging, gate logs. | Restricted to Assigned Hostel Block |
| **🎓 Student** | Self | Room booking, digital fee payments, QR passport, leave requests, complaint submission, monthly calendar. | Strictly Self-Profile Scoped |

---

## 🛡️ Security & Compliance Framework

```
                          MULTI-LAYER DEFENSE IN DEPTH
                          
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  1. APPLICATION LAYER                                                   │
    │  • Bcrypt (12 Salt Rounds)            • Ephemeral 15m JWT Access Tokens │
    │  • Single-Use Refresh Token Rotation  • Instant Session Purge on Reset  │
    │  • Strict Zod Schema Validation       • Production Error Masking        │
    └────────────────────────────────────┬────────────────────────────────────┘
                                         │
    ┌────────────────────────────────────┴────────────────────────────────────┐
    │  2. GATEWAY & IDENTITY LAYER                                            │
    │  • UUIDv4 Unguessable QR Tokens       • Zero-PII Data Minimization Gate │
    │  • Hostel-Scoped Guard Scanners       • Real-Time Approved Leave Checks │
    │  • Multer Media MIME-Type Filtering   • CORS Origin Allowlisting        │
    └────────────────────────────────────┬────────────────────────────────────┘
                                         │
    ┌────────────────────────────────────┴────────────────────────────────────┐
    │  3. DATABASE & TRANSACTION LAYER                                        │
    │  • PostgreSQL Serializable Isolation  • Pessimistic Row Locking         │
    │  • Unique Compound Constraints        • 100% Parameterized Prisma SQLi  │
    │  • HMAC-SHA256 Timing-Safe Checks     • Sequential Receipt Audit Trail  │
    └─────────────────────────────────────────────────────────────────────────┘
```

### Security Highlights:
* 🔐 **Bcrypt (12 Salt Rounds):** Computationally resistant to brute-force and dictionary attacks.
* ⏱️ **Dual-Token Architecture:** 15-minute access tokens paired with 7-day single-use rotating refresh tokens.
* 💳 **Timing-Safe Payments:** HMAC-SHA256 payment verification via `crypto.timingSafeEqual` prevents side-channel timing analysis.
* 🔒 **PostgreSQL Serializable Transactions:** Highest ACID isolation level eliminates dirty reads, non-repeatable reads, and write skew.
* 🛡️ **SQL Injection Immunity:** All queries utilize Prisma ORM with 100% parameterized queries.
* 📂 **Safe Media Ingestion:** Multer restricts uploads to safe image/video MIME types, enforcing a strict 5MB limit.

---

## 🏗️ System Architecture

### 🔄 Night Attendance & Leave Reconciliation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Guard as Security Guard
    actor Student as Student
    participant Scanner as Mobile / Web Scanner
    participant API as Attendance Service
    participant DB as PostgreSQL Database

    Guard->>Scanner: Start Session (Hostel Block A)
    Scanner->>API: POST /api/v1/attendance/start
    API->>DB: Check unique(hostelId, date) & Create Session
    DB-->>API: Active Session Confirmed
    
    Student->>Guard: Presents Cryptographic QR Passport
    Guard->>Scanner: Scans QR Code
    Scanner->>API: POST /api/v1/attendance/scan (token)
    
    API->>DB: Query Student Profile & Active Allocations
    API->>DB: Check Active Approved Leave for Today
    
    alt Student is on Approved Leave
        DB-->>API: Approved Leave Record Found
        API-->>Scanner: ✈️ Status: ON_LEAVE (Logged, not marked present)
    else Belongs to Different Hostel
        API-->>Scanner: ❌ Status: WRONG_HOSTEL (Access Denied)
    else Valid Hostel & No Leave
        API->>DB: INSERT into attendance_records (sessionId, studentId)
        alt First scan today
            DB-->>API: Success
            API-->>Scanner: ✅ Status: PRESENT (Timestamped)
        else Duplicate scan attempt
            DB-->>API: Unique Constraint Violation (P2002)
            API-->>Scanner: ⚠️ Status: ALREADY_MARKED (Ignored)
        end
    end
```

---

### 💳 Payment & Room Allocation Concurrency Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant UI as React Frontend
    participant Server as Express Backend
    participant RZP as Razorpay Gateway
    participant DB as PostgreSQL Database

    Student->>UI: Selects Bed & Clicks Book
    UI->>Server: POST /api/v1/booking/reserve
    Server->>DB: Create Reservation (Expires in 4 mins)
    
    Student->>UI: Clicks Pay Now
    UI->>Server: POST /api/v1/booking/create-order
    Server->>RZP: Create Order (INR Amount)
    RZP-->>Server: Return order_id
    Server-->>UI: Razorpay Checkout Modal Opens
    
    Student->>RZP: Completes Payment (UPI / Cards / NetBanking)
    RZP-->>UI: Returns (orderId, paymentId, signature)
    
    UI->>Server: POST /api/v1/booking/verify-payment
    Server->>Server: Compute HMAC-SHA256 & crypto.timingSafeEqual
    
    rect rgb(240, 248, 255)
    Note over Server,DB: Serializable Transaction + Pessimistic Row Lock
    Server->>DB: SELECT * FROM rooms WHERE id = ? FOR UPDATE
    Server->>DB: Verify room capacity & bed vacancy
    Server->>DB: Create RoomAllocation (ACTIVE)
    Server->>DB: Create Fee Record (PAID)
    Server->>DB: Convert Reservation Status to CONVERTED
    end
    
    Server->>Server: Generate Vector PDF Receipt (REC-YYYY-XXXXXX)
    Server-->>Student: Dispatches Receipt via Transactional Email
    Server-->>UI: Allocation Confirmed ✅
```

---

## 🛠️ Technology Stack

<div align="center">
  <table>
    <thead>
      <tr>
        <th>Domain</th>
        <th>Technologies</th>
        <th>Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Frontend</b></td>
        <td>React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, TanStack Query v5, <code>html5-qrcode</code></td>
        <td>Responsive, aesthetic SPA with dark/light UI, QR scanner, and offline resilience.</td>
      </tr>
      <tr>
        <td><b>Backend</b></td>
        <td>Node.js, Express.js 5, TypeScript, Zod, Multer, PDFKit</td>
        <td>Type-safe REST API gateway, strict validation, and vector PDF receipt engine.</td>
      </tr>
      <tr>
        <td><b>Database & ORM</b></td>
        <td>PostgreSQL 15+, Prisma ORM</td>
        <td>Relational integrity, ACID serializable transactions, and automated migration control.</td>
      </tr>
      <tr>
        <td><b>Security & Auth</b></td>
        <td>Bcrypt.js, JSON Web Tokens (JWT), Node.js Crypto (HMAC-SHA256), UUIDv4</td>
        <td>Enterprise hashing, stateless 15m JWTs, rotational refresh tokens, and constant-time checks.</td>
      </tr>
      <tr>
        <td><b>Integrations</b></td>
        <td>Razorpay API, Resend Transactional Email</td>
        <td>Automated fee payments and PDF receipt email dispatch.</td>
      </tr>
      <tr>
        <td><b>DevOps</b></td>
        <td>Render, Vercel, Git, ESLint, Prettier</td>
        <td>Continuous deployment, cloud database hosting, and code quality pipelines.</td>
      </tr>
    </tbody>
  </table>
</div>

---

## 📂 Project Architecture

```text
.
├── client/                               # React 18 + TypeScript Client
│   ├── src/
│   │   ├── api/                          # Axios API clients (auth, hostel, attendance, operations)
│   │   ├── components/                   # Reusable UI (PageHeader, StatusBadge, Lightbox, etc.)
│   │   ├── features/                     # Domain modules:
│   │   │   ├── attendance/               # Camera QR scanner & live registers
│   │   │   ├── complaints/               # Complaints list & multimedia viewer
│   │   │   ├── dashboard/                # Dashboards for all 5 roles
│   │   │   ├── fees/                     # Hostel & Mess fee payments
│   │   │   ├── hostel/                   # Room booking & inventory explorer
│   │   │   ├── leave/                    # Leave application & approvals
│   │   │   ├── profile/                  # Student Profile & Attendance Calendar
│   │   │   └── verify/                   # Public QR verification badge
│   │   ├── layouts/                      # AppShell, Sidebar, Header & Navigation
│   │   ├── providers/                    # AuthProvider, ThemeProvider, QueryProvider
│   │   └── routes/                       # ProtectedRoute & RBAC Route Guards
│   └── package.json
│
└── server/                               # Express 5 + TypeScript Backend
    ├── prisma/
    │   ├── schema.prisma                 # PostgreSQL database schema & relational models
    │   └── seed.ts                       # Database seed script with sample data
    ├── src/
    │   ├── config/                       # Environment (Zod validated), DB & Razorpay setup
    │   ├── middleware/                   # Auth (JWT), RBAC, Upload (Multer), Validation, Error
    │   ├── modules/                      # Domain feature controllers, services & routes:
    │   │   ├── attendance/               # Night roll-call sessions & scanning logic
    │   │   ├── auth/                     # Login, register, JWT refresh & password reset
    │   │   ├── booking/                  # Room reservation engine & Razorpay checkout
    │   │   ├── hostel/                   # Hostel, Block, Floor & Room CRUD
    │   │   ├── mess-fee/                 # Mess fee billing & verification
    │   │   ├── operations/               # Complaints, leaves, visitors, allocations
    │   │   ├── receipt/                  # Vector PDF generation & Resend email delivery
    │   │   ├── user/                     # Profile & staff management
    │   │   └── verify/                   # Public zero-PII student QR verification
    │   └── utils/                        # ApiError, ApiResponse, Hash & JWT utilities
    └── package.json
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js:** `v18.0.0` or higher
- **PostgreSQL:** Local PostgreSQL instance or Cloud Database (Render / Supabase / Neon)
- **Razorpay Account:** Test API keys for payment gateway testing
- **Resend API Key:** (Optional) For receipt email delivery

---

### 🛠️ Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/Omkarpmath/Hostel-System.git
cd Hostel-System
```

#### 2. Configure & Initialize Backend
```bash
cd server
npm install

# Create environment configuration
cp .env.example .env
```

Configure your `server/.env`:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/bmsce_hostel"
JWT_ACCESS_SECRET="your_super_secret_access_key"
JWT_REFRESH_SECRET="your_super_secret_refresh_key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RESEND_API_KEY="re_xxxxxx"
```

Push database schema and seed sample data:
```bash
npx prisma db push
npm run db:seed
```

#### 3. Configure & Initialize Frontend
```bash
cd ../client
npm install
```

---

### 💻 Running Locally

Launch both servers in separate terminals:

<details open>
<summary><b>Terminal 1: Backend API (Port 5001)</b></summary>

```bash
cd server
npm run dev
```
</details>

<details open>
<summary><b>Terminal 2: Frontend Application (Port 5173)</b></summary>

```bash
cd client
npm run dev
```
</details>

- **Frontend Client:** `http://localhost:5173`
- **Backend API:** `http://localhost:5001`
- **Health Check:** `http://localhost:5001/api/v1/health`

---

## 🔑 Demo Access Credentials

| Role | Email Address | Default Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@bmsce.ac.in` | `Admin@123` | Entire System |
| **👨‍💼 Warden** | `warden@bmsce.ac.in` | `Warden@123` | Boys Hostel Block 1 |
| **🛡️ Security** | `security@bmsce.ac.in` | `Security@123` | Boys Hostel Scanner |
| **💰 Accountant** | `accountant@bmsce.ac.in` | `Account@123` | Financial Ledgers |
| **🎓 Student** | `student@bmsce.ac.in` | `Student@123` | Self Dashboard |

---

## 🌐 Production Deployment Guide

The platform is optimized for seamless zero-downtime deployment on platforms like **Render**, **Vercel**, and **Supabase**:

### Backend Service (e.g. Render Web Service)
- **Environment:** Node.js
- **Build Command:** `npm run build && npx prisma db push`
- **Start Command:** `npm run start`
- **Port:** `5001` (or dynamic `$PORT`)

### Frontend Static Site (e.g. Render / Vercel)
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** `VITE_API_URL=https://<your-backend-url>.onrender.com`

---

<div align="center">
  <br/>
  <p><strong>Developed for B.M.S. College of Engineering (BMSCE)</strong></p>
  <p>Designed with ❤️ for institutional excellence, student safety, and administrative efficiency.</p>
</div>
