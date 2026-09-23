<div align="center">

  # 🏢 BMSET Hostel Management System
  ### *Enterprise-Grade Digital Campus Administration, Safety & Financial Ecosystem*

  <p align="center">
    <strong>A mission-critical full-stack residence management platform engineered for the BMS Educational Trust (BMSET) and BMS College of Engineering (BMSCE).</strong><br/>
    Featuring 30-second cryptographic rotating QR passports, automated leave-reconciled night roll-calls, dual-duty security operations (Hostel & Mess), ACID-compliant serializable room bookings, bank-grade Razorpay payment settlement with PDF receipts, and 5-tier role-based governance.
  </p>

  <p align="center">
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
    <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS 4" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-22+-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 22" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-5.1-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma_ORM-6.9-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma 6" /></a>
    <a href="https://razorpay.com/"><img src="https://img.shields.io/badge/Razorpay-Payment_Gateway-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" alt="Razorpay" /></a>
    <a href="https://resend.com/"><img src="https://img.shields.io/badge/Resend-Transactional_Email-000000?style=for-the-badge&logo=resend&logoColor=white" alt="Resend" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  </p>

  <p align="center">
    <a href="#-executive-summary">Executive Summary</a> •
    <a href="#-core-capabilities--subsystems">System Capabilities</a> •
    <a href="#-system-architecture">Architecture Flows</a> •
    <a href="#-role-based-access-control-rbac">Roles (RBAC)</a> •
    <a href="#-defense-in-depth-security-framework">Security & Compliance</a> •
    <a href="#-technology-stack">Tech Stack</a> •
    <a href="#-rest-api-documentation">API Reference</a> •
    <a href="#-project-structure">Project Tree</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-deployment--devops">Deployment & DevOps</a>
  </p>

</div>

---

## 🏛️ Executive Summary

Hostel administration across premier educational institutions like **B.M.S. College of Engineering** involves managing thousands of resident students across multiple hostel blocks, dining halls, and entry gates. Traditional management relies on fragmented paper ledgers, unverified proxy roll-calls, manual bank challans, lost maintenance slips, and error-prone allocation queues during admission season.

The **BMSET Hostel Management System** delivers a unified, zero-trust digital infrastructure custom-engineered for modern residential institutions:

1. **Anti-Screenshot 30-Second Cryptographic Dynamic QR Passports:** Replaces static cards with HMAC-SHA256 rotating QR tokens (`DQR_...`) that expire every 30 seconds, defeating screenshot sharing, proxy attendance, and unauthorized gate access.
2. **Automated Leave-Reconciled Night Attendance:** Eliminates false-absent panics by cross-referencing approved leaves in real time during scanning. Scoped security guards conduct roll-calls with instant institutional CSV export capabilities.
3. **Dual-Duty Security Architecture:** Intelligently provisions security personnel between **Hostel Block Night Roll-Calls** and **Mess Dining Hall Headcount Scanners** with dedicated route guards (`SecurityDutyRoute`).
4. **ACID-Compliant Serializable Room Booking Engine:** Prevents double-booking during admissions rush using temporary 10-minute atomic reservation holds and PostgreSQL `Serializable` transactions with pessimistic row-locking (`SELECT FOR UPDATE`).
5. **Bank-Grade Financial Suite & Automated Vector PDF Receipts:** Full Razorpay payment integration with timing-safe HMAC-SHA256 signature verification, offline fee receipt approvals, sequential numbering (`REC-YYYY-XXXXXX`), and automated transactional email dispatch via Resend.
6. **Multimedia Maintenance Hub with Interactive Lightbox:** Enables students to submit up to 5 photo/video proofs per complaint, inspected seamlessly by Wardens in an in-browser streaming lightbox.
7. **Institutional Governance & Audit Compliance:** Complete audit trail tracking (`AuditLog`), academic year rollovers, automated notification feeds, and targeted campus announcements with per-user read receipt monitoring.

---

## 🌟 Core Capabilities & Subsystems

```
                                  SYSTEM CAPABILITIES MATRIX
                                  
  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
  │   🌙 NIGHT ATTENDANCE   │   │  📱 DYNAMIC QR PASSPORT │   │   💳 FINANCIAL ENGINE   │
  │ • Real-time leave match │   │ • 30s HMAC-SHA256 rotate│   │ • Razorpay Gateway      │
  │ • Anti-proxy unique keys│   │ • Zero-PII gate checks  │   │ • Timing-safe HMAC verif│
  │ • Scoped security guards│   │ • Anti-screenshot TTL   │   │ • Vector PDF receipts   │
  │ • Filtered CSV registers│   │ • Fallback UUID tokens  │   │ • Resend email delivery │
  └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
  │   🛏️ ROOM INVENTORY     │   │   🍽️ MESS MANAGEMENT    │   │   📸 COMPLAINTS HUB     │
  │ • Live bed availability │   │ • Dual-duty mess scanner│   │ • Photo/video proofs    │
  │ • 10-min hold timers    │   │ • Daily dining counters │   │ • Fullscreen Lightbox   │
  │ • Pessimistic row locks │   │ • Semester mess billing │   │ • 4-tier lifecycle      │
  │ • Emergency room blocks │   │ • Student meal verify   │   │ • Warden resolution log │
  └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
  │   ✈️ LEAVES & VISITORS  │   │   📢 ANNOUNCEMENTS      │   │   📜 AUDIT & BULK OPS   │
  │ • Warden review workflow│   │ • Targeted year/hostel  │   │ • System AuditLog audit │
  │ • Gate exit/return logs │   │ • Read receipt tracking │   │ • Bulk student CSV sync │
  │ • Mandatory Photo IDs   │   │ • Priority urgency tiers│   │ • Bulk room CSV import  │
  │ • Check-in/out stamps   │   │ • Real-time notice bell │   │ • Academic year rollover│
  └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

---

### 🌙 1. Digital Night Attendance & Anti-Proxy Session Engine
- **Hostel-Scoped Security Duty:** Administrators assign security personnel to specific hostel blocks. Guards cannot access or scan students outside their designated building.
- **Dynamic Session Lifecycle:** Security starts, pauses, and completes attendance sessions per block. Compound database constraints (`@@unique([hostelId, date])`) ensure exactly one active session per hostel per date.
- **Real-Time Leave Reconciliation:** When a student presents their QR passport, the engine checks active approved leaves (`LeaveRequest`) for the current date. Students on approved leave are marked **ON LEAVE** instead of falsely triggering disciplinary absences.
- **Anti-Proxy Database Guarantee:** Scans are written with compound unique indexes (`@@unique([sessionId, studentId])`), rejecting duplicate scans or proxy roll-calls instantly.
- **Institutional Register & CSV Audit Export:** Wardens and Admins monitor a live, color-coded register categorized as **Present**, **On Leave**, or **Absent**, with one-click institutional CSV audit export.

---

### 📱 2. Anti-Screenshot 30-Second Cryptographic Dynamic QR Passport
- **Short-Lived Dynamic QR Tokens (`DQR_...`):** Students generate a cryptographic QR passport signed with HMAC-SHA256 via `generateDynamicQrToken()`. Each token embeds the student ID, USN, issued timestamp, expiration timestamp, and a random cryptographic nonce.
- **Zero-Grace Anti-Screenshot Policy:** Tokens rotate strictly every **30 seconds** with zero grace period. Unauthorized screenshots or captured photos shared via messaging apps expire before they can be scanned at the gate.
- **Zero-PII Data Minimization Public Gateway:** When gate staff scan the QR code via `/api/v1/verify/student/:token`, the system displays the identity badge, room allocation, active hostel, and fee status, while **deliberately withholding sensitive phone numbers, home addresses, and private guardian details**.
- **SSL Camera Scanning:** Developed with `@vitejs/plugin-basic-ssl` and `html5-qrcode` to enable hardware camera barcode/QR scanning directly on physical mobile devices over local LAN Wi-Fi.

---

### 🍽️ 3. Mess Management & Dual-Duty Security Architecture
- **Dual-Duty Guard Provisioning:** Security personnel can be assigned to **HOSTEL** duty or **MESS** duty. The frontend navigation dynamically adapts via `SecurityDutyRoute.tsx`:
  - *Hostel Guards:* Directed to Night Attendance scanner, Attendance Register, and Visitor Gate Management.
  - *Mess Guards:* Directed to the Mess Entry QR Scanner and Dining History logs.
- **Real-Time Dining Admission Scanner:** Security scans student QR passports at the mess entrance to verify active registration, meal plan (Veg / Non-Veg), and fee clearance before entry.
- **Daily Headcount Aggregation:** Tracks dining admissions in real time via `MessDailyCount`, providing hostel administration with accurate daily meal analytics to prevent food waste.
- **Mess Billing Suite:** Configurable per-semester mess fee rates with dedicated payment clearance workflows and student status badges.

---

### 🛏️ 4. Concurrency-Safe Room Booking & Inventory Engine
- **Live Visual Hierarchy:** Navigate **Hostel $\rightarrow$ Block $\rightarrow$ Floor $\rightarrow$ Room** with live capacity gauges and room status indicators (`AVAILABLE`, `PARTIALLY_OCCUPIED`, `FULL`, `MAINTENANCE`, `RESERVED`, `BLOCKED`).
- **Atomic 10-Minute Hold Locks:** Selecting a bed creates a temporary `Reservation` holding the slot for 10 minutes (`RESERVATION_TIMEOUT_MINUTES`), preventing other students from reserving the same bed during checkout.
- **Automated Background Cleanup Job:** A `node-cron` daemon continuously cleans expired reservations, resetting occupied counts safely back to the pool.
- **PostgreSQL Serializable Concurrency:** Room allocation and payment confirmation execute within a PostgreSQL `Serializable` transaction using pessimistic row-locking (`SELECT * FROM rooms WHERE id = ? FOR UPDATE`).
- **Emergency Room Blocking:** Wardens and Admins can immediately block rooms for maintenance or quarantine, logging the blocking reason and staff ID.
- **Academic Year Rollover:** Built-in rollover endpoint (`/api/v1/rollover`) automatically graduates or promotes student batches and resets room occupancy safely.

---

### 💳 5. Financial Suite, Vector PDF Receipts & Resend Email
- **Unified Razorpay Gateway:** Supports UPI (Google Pay, PhonePe, Paytm), NetBanking (all major Indian banks), Credit/Debit Cards, and Wallets.
- **Timing-Safe HMAC Verification:** Client checkout signatures and webhooks are validated using HMAC-SHA256 signatures evaluated with `crypto.timingSafeEqual`, preventing side-channel timing attacks.
- **Sequential Vector PDF Receipts:** Automatically renders audit-ready vector PDF receipts using **PDFKit** with institutional headers, student metadata, transaction references, and sequential receipt identifiers (`REC-YYYY-XXXXXX`).
- **Transactional Email Dispatch:** Dispatches PDF receipts automatically to student email addresses via the **Resend API**.
- **Offline Challan / Bank Payment Workflow:** Students can submit offline bank transfer details with screenshot payment proof. Accountants review, verify, and approve offline fees with transaction notes.
- **Defaulter Reporting:** Dedicated financial reports filter fee defaulters across hostels, years, and semesters.

---

### 📸 6. Multimedia Maintenance Hub with Interactive Lightbox
- **Multi-Proof Uploads:** Students can attach up to 5 photos or videos (`JPEG`, `PNG`, `WebP`, `MP4`, `MOV`, `WebM`) with each maintenance ticket.
- **Safe Media Ingestion:** Handled through **Multer** with strict MIME-type allowlists and a 5MB per-file size barrier.
- **In-Browser Lightbox Player:** Wardens and Admins inspect high-resolution images with zoom controls or stream video evidence directly within an interactive modal.
- **4-Stage Resolution Lifecycle:** Tickets progress through `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED` with Warden assignee notes and resolution timestamps.

---

### ✈️ 7. Leave Management, Visitor Gate Passes & Announcements
- **Online Leave Requests:** Students apply for `HOME_LEAVE`, `MEDICAL`, `EMERGENCY`, or `OTHER`. Wardens review and approve/reject with contextual remarks.
- **Physical Gate Exit & Return Logging:** Security guards record exact departure (`EXIT`) and return (`RETURN`) timestamps at the campus perimeter gate.
- **Visitor Gate Pass System:** Student visitors register mandatory relationship details, visit purpose, and government Photo ID proof numbers. Guards log gate check-in and check-out times.
- **Targeted Campus Announcements:** Publish notices scoped to `ALL_HOSTELS`, `SPECIFIC_HOSTEL`, `SPECIFIC_YEAR`, or `SPECIFIC_DEPARTMENT` with urgency badges (`NORMAL`, `IMPORTANT`, `URGENT`).
- **Audited Read Receipts:** Tracks student read events in `AnnouncementRead` to verify whether vital safety circulars were received.
- **Real-Time Notification Bell:** In-app notification center tracking 10 event types (leave approval, complaint update, visitor registration, etc.) with unread count badges.

---

## 👥 Role-Based Access Control (RBAC)

The system enforces institutional separation of duties across 5 authenticated roles, plus a public gate verification route:

| Role | Badge / Scope | Core Capabilities & Permissions | Route Prefix |
| :--- | :---: | :--- | :--- |
| **👑 Admin** | **Global System** | Complete system governance, hostel/block/floor/room creation, bulk student & room CSV imports, security-to-hostel/mess assignment, academic year rollover, financial & audit reports. | `/admin/*` |
| **👨‍💼 Warden** | **Hostel Block** | Managed hostel block oversight, room allocations/vacates, emergency room blocking, leave approvals, multimedia complaint resolution, live attendance register with CSV export. | `/warden/*` |
| **🛡️ Security** | **Hostel / Mess Scoped** | Duty-dependent access via `SecurityDutyRoute`: Night QR attendance scanner, live attendance log, visitor check-in/out, or Mess entry QR scanner and daily dining verification. | `/security/*` |
| **💰 Accountant** | **Financial Ledgers** | Hostel and mess fee ledger oversight, per-semester mess fee amount configuration, offline fee payment screenshot verification, receipt re-downloading, fee defaulter tracking. | `/accountant/*` |
| **🎓 Student** | **Self-Profile** | Room browsing & live reservation, Razorpay fee settlement, 30s Dynamic QR passport, leave applications, multimedia complaint submission, monthly night attendance calendar. | `/student/*` |
| **🌐 Public** | **Zero-PII Gate** | Scan student QR code to inspect photo, name, USN, hostel, room, and fee clearance status. Excludes all private contact info. No login required. | `/verify/student/:token` |

---

## 🏗️ System Architecture

### 1. Night Attendance & Real-Time Leave Reconciliation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Guard as Security Guard
    actor Student as Student
    participant Scanner as Web Scanner (html5-qrcode)
    participant API as Attendance Service (/api/v1/attendance)
    participant DB as PostgreSQL 16 (Prisma ORM)

    Guard->>Scanner: Selects Block & Clicks "Start Session"
    Scanner->>API: POST /api/v1/attendance/start { hostelId }
    API->>DB: Check unique(hostelId, date) & Create AttendanceSession
    DB-->>API: Session ID Confirmed (ACTIVE)
    
    Student->>Scanner: Presents 30s Dynamic QR Passport
    Scanner->>API: POST /api/v1/attendance/scan { token, sessionId }
    
    API->>API: Verify HMAC-SHA256 signature & check token expiry (<=30s)
    API->>DB: Query Student Profile & Active Room Allocation
    API->>DB: Query Active Approved Leave for Current Date
    
    alt Student is on Approved Leave for Today
        DB-->>API: Approved LeaveRecord Found
        API-->>Scanner: ✈️ Status: ON_LEAVE (Logged; false-absent prevented)
    else Belongs to Different Hostel Block
        API-->>Scanner: ❌ Status: WRONG_HOSTEL (Access Denied to this block)
    else Valid Hostel Block & No Leave
        API->>DB: INSERT into attendance_records (sessionId, studentId)
        alt First scan today
            DB-->>API: Record Created Successfully
            API-->>Scanner: ✅ Status: PRESENT (Scanned & Timestamped)
        else Duplicate scan attempt
            DB-->>API: Unique Constraint Violation (P2002 @@unique)
            API-->>Scanner: ⚠️ Status: ALREADY_MARKED (Duplicate Ignored)
        end
    end
```

---

### 2. ACID Serializable Room Booking & Razorpay Concurrency Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant UI as React 19 Client
    participant API as Express 5 Backend
    participant RZP as Razorpay Gateway
    participant DB as PostgreSQL 16 (Serializable)

    Student->>UI: Selects Bed & Clicks "Reserve"
    UI->>API: POST /api/v1/booking/reserve { roomId }
    API->>DB: Create Reservation (10-min countdown timer)
    DB-->>UI: Reservation Active (Lock acquired)

    Student->>UI: Clicks "Proceed to Payment"
    UI->>API: POST /api/v1/booking/create-order
    API->>RZP: Create Order (INR Amount, Receipt ID)
    RZP-->>API: Returns razorpay_order_id
    API-->>UI: Return Order Payload

    UI->>RZP: Launch Razorpay Modal (UPI / Card / NetBanking)
    Student->>RZP: Authorizes Payment
    RZP-->>UI: Returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }

    UI->>API: POST /api/v1/booking/verify-payment
    API->>API: Validate HMAC-SHA256 via crypto.timingSafeEqual

    rect rgb(238, 246, 255)
    Note over API,DB: PostgreSQL Serializable Transaction + Pessimistic Row Lock
    API->>DB: BEGIN TRANSACTION (ISOLATION LEVEL SERIALIZABLE)
    API->>DB: SELECT * FROM rooms WHERE id = ? FOR UPDATE
    API->>DB: Verify room capacity & bed vacancy
    API->>DB: INSERT INTO room_allocations (status: ACTIVE)
    API->>DB: INSERT INTO fees (status: PAID, receiptNumber: REC-YYYY-XXXXXX)
    API->>DB: UPDATE reservations SET status = 'CONVERTED'
    API->>DB: COMMIT TRANSACTION
    end

    API->>API: Generate Vector PDF Receipt (PDFKit)
    API->>API: Dispatch Receipt via Resend Transactional Email
    API-->>UI: Allocation Confirmed ✅ Room Ready
```

---

### 3. Dual-Duty Security Mess Entry & Dining Headcount Flow

```mermaid
sequenceDiagram
    autonumber
    actor Guard as Mess Security Guard
    actor Student as Dining Student
    participant Scanner as Mess Scanner UI (/security/mess-entry)
    participant API as Mess Service (/api/v1/mess-entry)
    participant DB as PostgreSQL 16

    Student->>Scanner: Presents Dynamic QR Passport
    Scanner->>API: POST /api/v1/mess-entry/verify { token, messId }
    API->>API: Verify HMAC-SHA256 signature (<=30s TTL)
    API->>DB: Find StudentProfile, RoomAllocation & MessFee status
    
    alt Mess Fee Unpaid
        API-->>Scanner: ❌ DENIED: Mess Fee Pending
    else Mess Fee Cleared
        API->>DB: INSERT into mess_entries (studentId, messId, date, scannedAt)
        API->>DB: UPSERT mess_daily_counts (increment count for today)
        DB-->>API: Entry Logged
        API-->>Scanner: ✅ VERIFIED: Student Name, USN, Meal Plan (Veg/Non-Veg)
    end
```

---

## 🛡️ Defense-in-Depth Security Framework

```
                          MULTI-LAYER DEFENSE ARCHITECTURE
                          
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  1. APPLICATION LAYER                                                   │
    │  • Bcrypt (12 Salt Rounds)            • Ephemeral 15m JWT Access Tokens │
    │  • Single-Use 7d Refresh Tokens (DB)  • Strict Zod Schema Sanitization  │
    │  • Multi-Tier Rate Limiting           • Helmet Security HTTP Headers    │
    │  • In-Memory Response Compression     • Uniform Error Sanitization      │
    └────────────────────────────────────┬────────────────────────────────────┘
                                         │
    ┌────────────────────────────────────┴────────────────────────────────────┐
    │  2. GATEWAY & IDENTITY LAYER                                            │
    │  • 30s HMAC-SHA256 Dynamic QR Tokens  • Zero-PII Public Gate Minimization│
    │  • Security Duty Guards (Hostel/Mess) • Real-Time Approved Leave Filter │
    │  • Multer Media MIME & 5MB Limit      • Strict CORS Origin Allowlist    │
    └────────────────────────────────────┬────────────────────────────────────┘
                                         │
    ┌────────────────────────────────────┴────────────────────────────────────┐
    │  3. DATABASE & TRANSACTION LAYER                                        │
    │  • PostgreSQL Serializable Isolation  • Pessimistic Row Locking         │
    │  • Compound Constraints (Anti-Proxy)  • 100% Parameterized Prisma SQLi  │
    │  • crypto.timingSafeEqual Signatures  • Sequential Audit Log (AuditLog) │
    └─────────────────────────────────────────────────────────────────────────┘
```

### Security Highlights:
* 🔐 **Bcrypt (12 Salt Rounds):** Computationally hardened password storage resistant to offline rainbow table and dictionary attacks.
* ⏱️ **Dual-Token Authentication:** 15-minute stateless JWT access tokens paired with 7-day single-use rotating refresh tokens persisted in the database.
* 🛡️ **Rate Limiting Suite:** Dedicated rate limiting per sensitive action:
  - `authRateLimiter`: 5 attempts per 15 minutes for `/auth/login`.
  - `bookingActionRateLimiter`: 10 requests per minute for reservation and order creation.
  - `qrScanRateLimiter`: 60 scans per minute for public QR gate lookups.
  - `apiGlobalRateLimiter`: 500 requests per 15 minutes across all endpoints.
* 💳 **Timing-Safe Cryptography:** Razorpay HMAC-SHA256 verification and dynamic QR signature parsing use `crypto.timingSafeEqual` to eliminate side-channel timing analysis.
* 🔒 **PostgreSQL Serializable Isolation & Pessimistic Locks:** Highest ANSI/ISO SQL transaction isolation level combined with `SELECT FOR UPDATE` prevents race conditions, dirty reads, and write skew.
* 📜 **Immutable System Audit Trail:** All critical administrative operations (bed allocations, vacations, room blocking, security assignments) are recorded in the `AuditLog` table with actor role, entity ID, JSON metadata, and client IP address.
* 🌐 **Zero-PII Data Minimization:** Public QR verification reveals only identity verification indicators, suppressing home addresses, mobile numbers, and personal identifiers.

---

## 🛠️ Technology Stack

<div align="center">
  <table>
    <thead>
      <tr>
        <th>Domain</th>
        <th>Technologies</th>
        <th>Version</th>
        <th>Purpose & Implementation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Frontend Core</b></td>
        <td>React, TypeScript, Vite</td>
        <td><code>19.2</code> / <code>5.8</code> / <code>8.2</code></td>
        <td>Modern single-page application built on React 19 compiler paradigms and blazing fast Vite 8 bundling.</td>
      </tr>
      <tr>
        <td><b>Styling & Animation</b></td>
        <td>Tailwind CSS, Framer Motion, Lucide React</td>
        <td><code>4.3</code> / <code>13.0</code> / <code>1.28</code></td>
        <td>Utility-first responsive design, dynamic micro-interactions, dark/light theme engine, and accessible iconography.</td>
      </tr>
      <tr>
        <td><b>Data & Forms</b></td>
        <td>TanStack Query v5, React Hook Form, Zod</td>
        <td><code>5.101</code> / <code>7.84</code> / <code>3.25</code></td>
        <td>Server state caching, optimistic UI updates, background cache invalidation, and type-safe form validation.</td>
      </tr>
      <tr>
        <td><b>Hardware & Charts</b></td>
        <td><code>html5-qrcode</code>, Basic SSL, Recharts</td>
        <td><code>2.3</code> / <code>2.3</code> / <code>3.10</code></td>
        <td>Direct mobile camera barcode/QR scanner over HTTPS local LAN, and interactive administrative reporting charts.</td>
      </tr>
      <tr>
        <td><b>Backend Core</b></td>
        <td>Node.js, Express.js, TypeScript</td>
        <td><code>22+</code> / <code>5.1</code> / <code>5.8</code></td>
        <td>High-performance REST API gateway utilizing Express 5 with native async error handling and IST time zone enforcement.</td>
      </tr>
      <tr>
        <td><b>Database & ORM</b></td>
        <td>PostgreSQL, Prisma ORM</td>
        <td><code>16</code> / <code>6.9</code></td>
        <td>ACID relational database engine with automated Prisma migrations, type-safe queries, and serializable transactions.</td>
      </tr>
      <tr>
        <td><b>Payments & Email</b></td>
        <td>Razorpay SDK, Resend API, PDFKit</td>
        <td><code>2.9</code> / <code>6.25</code> / <code>0.20</code></td>
        <td>Bank-grade payment gateway, vector PDF receipt generation, and transactional email receipt dispatch.</td>
      </tr>
      <tr>
        <td><b>Security & Ops</b></td>
        <td>Helmet, Bcryptjs, JWT, Node-Cron, Multer</td>
        <td><code>8.3</code> / <code>2.4</code> / <code>9.0</code> / <code>3.0</code></td>
        <td>HTTP header hardening, password hashing, token rotation, background reservation expiration cleaning, and media uploads.</td>
      </tr>
      <tr>
        <td><b>DevOps</b></td>
        <td>Docker, Docker Compose, Nginx, Shell</td>
        <td><code>3.8 Compose</code></td>
        <td>Containerized multi-service deployment with pre-flight checks, automatic DB snapshots, and automated rollback script.</td>
      </tr>
    </tbody>
  </table>
</div>

---

## 📡 REST API Documentation

All API routes are prefixed under `/api/v1` (with public health checks at `/api/v1/health` and `/api/ping`).

### 1. Authentication & Identity (`/api/v1/auth`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public (Rate-limited) | Sign in with email and password; sets access and refresh tokens. |
| `POST` | `/auth/register` | Public | Self-registration for student accounts with validation. |
| `POST` | `/auth/refresh` | Public | Silent access token refresh using valid refresh token cookie/header. |
| `POST` | `/auth/logout` | Authenticated | Revokes current session and invalidates refresh token in database. |
| `POST` | `/auth/reset-password` | Public | Resets user password using validation token. |
| `GET` | `/auth/profile` | Authenticated | Fetches current user profile and role details. |
| `GET` | `/auth/dynamic-qr` | Authenticated (Student) | Generates a 30s cryptographically signed Dynamic QR token (`DQR_...`). |

### 2. Public Student QR Gate Verification (`/api/v1/verify`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/verify/student/:token` | Public (Rate-limited) | Verifies Dynamic or static QR code. Returns non-sensitive student badge, hostel, room, and fee status. Excludes private PII. |

### 3. Hostel & Room Management (`/api/v1`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | All Authenticated | Returns role-specific consolidated dashboard analytics. |
| `GET` | `/hostels` | Authenticated | Lists all active hostels with wardens and blocks. |
| `POST` | `/hostels` | Admin | Creates a new hostel building. |
| `POST` | `/hostels/bulk-import-rooms` | Admin | Bulk imports hostel, block, floor, and room records from a CSV file. |
| `POST` | `/hostels/:hostelId/blocks` | Admin | Adds a block to a hostel. |
| `POST` | `/blocks/:blockId/floors` | Admin | Adds a floor to a block. |
| `POST` | `/floors/:floorId/rooms` | Admin | Adds a room to a floor with capacity, type, and semester fee. |
| `GET` | `/rooms` | Authenticated | Fetches rooms with filters (hostel, block, floor, status). |
| `GET` | `/rooms/available` | Authenticated | Lists vacant rooms ready for student reservation. |
| `POST` | `/rooms/:id/block` | Admin, Warden | Blocks a room for maintenance/emergency with reason logging. |
| `POST` | `/rooms/:id/unblock` | Admin, Warden | Releases emergency lock and returns room to available status. |

### 4. Room Booking & Razorpay Checkout (`/api/v1/booking`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/booking/my-reservation` | Student | Checks currently active 10-minute bed reservation countdown. |
| `POST` | `/booking/reserve` | Student | Places a 10-minute atomic hold lock on a selected bed. |
| `POST` | `/booking/create-order` | Student | Generates a Razorpay order for hostel fee clearance. |
| `POST` | `/booking/verify-payment` | Student | Validates HMAC-SHA256 signature; converts reservation to active room allocation in a Serializable transaction. |
| `POST` | `/booking/cancel-reservation` | Student | Releases reservation hold manually before expiration. |

### 5. Mess Fees & Dining Operations (`/api/v1/mess-fee` & `/api/v1/mess-entry`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/mess-fee/amount` | Authenticated | Retrieves current annual/semester mess fee structure. |
| `PUT` | `/mess-fee/amount` | Admin | Updates mess fee charges per semester. |
| `GET` | `/mess-fee/my-status` | Student | Fetches student's mess fee clearance and meal plan (Veg/Non-Veg). |
| `POST` | `/mess-fee/create-order` | Student | Generates a Razorpay order for mess fee settlement. |
| `POST` | `/mess-fee/verify-payment` | Student | Verifies Razorpay mess fee transaction and marks record PAID. |
| `POST` | `/mess-entry/verify` | Security (Mess Duty) | Scans student QR code at dining entrance; checks fee clearance and increments daily headcount. |
| `GET` | `/mess-entry/stats` | Security (Mess Duty) | Retrieves today's meal admission statistics. |
| `GET` | `/mess-entry/messes` | Admin, Warden, Security | Lists active mess dining halls. |
| `GET` | `/mess-entry/entries` | Admin, Warden, Security | Audit logs of all mess scan entries. |

### 6. Night Attendance Session Engine (`/api/v1/attendance`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/attendance/start` | Security (Hostel Duty) | Starts an active night roll-call session for assigned hostel. |
| `GET` | `/attendance/active` | Security (Hostel Duty) | Checks current in-progress attendance session. |
| `POST` | `/attendance/scan` | Security (Hostel Duty) | Scans student QR; reconciles active leaves and records attendance. |
| `POST` | `/attendance/end` | Security (Hostel Duty) | Concludes active attendance session. |
| `GET` | `/attendance/register` | Admin, Warden, Security | Filterable attendance register table by date, hostel, and status. |
| `GET` | `/attendance/register/export` | Admin, Warden | Exports attendance register to institutional CSV format. |
| `GET` | `/attendance/security-users` | Admin | Lists security personnel and their assigned blocks/messes. |
| `POST` | `/attendance/assign-security` | Admin | Scopes a security guard to a designated hostel block. |
| `POST` | `/attendance/assign-security-mess` | Admin | Scopes a security guard to mess dining duty. |
| `POST` | `/attendance/unassign-security` | Admin | Clears guard assignment. |
| `GET` | `/attendance/my-history` | Student | Fetches student's monthly night attendance calendar history. |

### 7. Campus Operations, Complaints & Leaves (`/api/v1`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/leaves` | Student, Admin, Warden | Lists leave requests (scoped to self for student, block for warden). |
| `POST` | `/leaves` | Student | Submits new leave application with dates and reasons. |
| `PATCH` | `/leaves/:id` | Admin, Warden | Approves or rejects leave with remarks. |
| `GET` | `/complaints` | Student, Admin, Warden | Lists maintenance complaints with priority and status filters. |
| `POST` | `/complaints` | Student | Submits complaint with up to 5 photo/video attachments. |
| `PATCH` | `/complaints/:id` | Admin, Warden | Updates ticket status (In Progress, Resolved) with resolution notes. |
| `GET` | `/visitors` | Student, Admin, Warden, Security | Fetches visitor gate log. |
| `POST` | `/visitors` | Student, Security, Admin, Warden | Registers visitor with mandatory relationship and Photo ID number. |
| `GET` | `/fees` | Student, Admin, Warden, Accountant | Lists student fee records and status. |
| `GET` | `/fees/:id/receipt` | Authenticated (Fee owner / Staff) | Generates and streams PDFKit vector receipt for payment. |
| `POST` | `/fees/:id/approve-offline` | Admin, Accountant | Approves offline challan/transfer payment with screenshot proof. |
| `GET` | `/allocations` | Admin, Warden | Lists active room bed allocations. |
| `POST` | `/allocations` | Admin, Warden | Direct administrative bed allocation override. |
| `POST` | `/allocations/:id/vacate` | Admin, Warden | Vacates student from room and frees bed inventory. |
| `POST` | `/rollover` | Admin | Runs academic batch rollover and occupancy resets. |
| `GET` | `/reports/fee-defaulters` | Admin, Accountant, Warden | Generates comprehensive fee defaulters report. |
| `GET` | `/reports/attendance-shortage`| Admin, Warden | Generates attendance shortage report based on night roll-calls. |
| `GET` | `/reports/mess-headcount` | Admin, Warden, Accountant | Generates dining hall meal headcount consumption report. |

### 8. Announcements & Notifications (`/api/v1`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/announcements/my` | Student | Fetches announcements targeted to student's hostel, year, and dept. |
| `POST` | `/announcements/:id/read` | Student | Records read receipt timestamp for circular. |
| `POST` | `/announcements/read-all` | Student | Marks all unread announcements as read. |
| `GET` | `/announcements` | Admin, Warden | Lists campus announcements with target criteria. |
| `POST` | `/announcements` | Admin, Warden | Publishes a targeted notice with priority level. |
| `GET` | `/notifications` | Authenticated | Fetches user's notification feed. |
| `GET` | `/notifications/unread-count`| Authenticated | Retrieves current unread badge count for header bell icon. |
| `PATCH` | `/notifications/:id/read` | Authenticated | Marks individual notification as read. |
| `PATCH` | `/notifications/read-all` | Authenticated | Marks all notifications as read. |

### 9. User & Student Roster (`/api/v1`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/students/bulk-import` | Admin | Bulk imports student accounts and profiles via CSV. |
| `GET` | `/students` | Admin, Warden | Lists all registered students with USN, year, room, and status. |
| `GET` | `/students/me` | Student | Retrieves authenticated student's profile details. |
| `PATCH` | `/students/me` | Student | Updates personal and emergency contact details. |
| `GET` | `/users` | Admin, Warden | Lists staff and institutional users. |
| `POST` | `/users` | Admin | Creates staff user account (Warden, Accountant, Security). |
| `GET` | `/wardens` | Admin | Lists all warden accounts and assigned hostels. |

---

## 📂 Project Structure

```text
.
├── client/                                   # React 19 + TypeScript Frontend
│   ├── src/
│   │   ├── api/                              # Axios API clients with auto token refresh
│   │   │   ├── announcement.api.ts
│   │   │   ├── attendance.api.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── axios.ts                      # Axios instance with 401 refresh interceptors
│   │   │   ├── booking.api.ts
│   │   │   ├── hostel.api.ts
│   │   │   ├── messEntry.api.ts
│   │   │   ├── messFee.api.ts
│   │   │   ├── notification.api.ts
│   │   │   ├── operations.api.ts
│   │   │   └── user.api.ts
│   │   ├── components/                       # Shared reusable UI elements
│   │   │   ├── notifications/                # NotificationBell component with badge
│   │   │   └── shared/                       # ErrorBoundary, PageLoadingSpinner, etc.
│   │   ├── features/                         # Modular domain feature pages:
│   │   │   ├── announcements/                # Admin notice publisher & Student feed
│   │   │   ├── attendance/                   # Night attendance camera scanner & register
│   │   │   ├── auth/                         # Cinematic video login, register, reset
│   │   │   ├── complaints/                   # Complaint submission & Lightbox viewer
│   │   │   ├── dashboard/                    # Role dashboards (Admin, Warden, Student, etc.)
│   │   │   ├── fees/                         # Fee ledger, Razorpay checkout, receipts
│   │   │   ├── hostel/                       # Hostel & Room inventory explorer
│   │   │   ├── leave/                        # Leave request forms & Warden review
│   │   │   ├── mess/                         # Mess settings & meal plan configuration
│   │   │   ├── mess-entry/                   # Mess QR scanner & daily dining logs
│   │   │   ├── mess-fee/                     # Mess fee payment & rate setting
│   │   │   ├── notifications/                # Full-screen notification center
│   │   │   ├── operations/                   # Operational management hub
│   │   │   ├── profile/                      # Student Profile & Attendance Calendar
│   │   │   ├── room-allocation/              # Administrative bed allocation tables
│   │   │   ├── students/                     # Institutional student roster
│   │   │   ├── verify/                       # Public zero-PII student QR badge
│   │   │   └── visitors/                     # Visitor pass registry & gate stamps
│   │   ├── layouts/                          # DashboardLayout, Sidebar, Navigation
│   │   ├── providers/                        # AuthProvider, ThemeProvider, QueryProvider
│   │   ├── routes/                           # ProtectedRoute, SecurityDutyRoute, router
│   │   ├── types/                            # TypeScript institutional models & enums
│   │   ├── utils/                            # Formatting, badge colors, helpers
│   │   ├── index.css                         # Tailwind CSS v4 design tokens & utilities
│   │   └── main.tsx                          # App entry point
│   ├── Dockerfile                            # Multi-stage production Nginx container
│   ├── package.json
│   └── vite.config.ts                        # Basic SSL, manual chunking & proxy rules
│
├── server/                                   # Express 5 + TypeScript Backend
│   ├── prisma/
│   │   └── schema.prisma                     # PostgreSQL 16 schema with 20 models & relations
│   ├── src/
│   │   ├── config/                           # Environment configuration (Zod) & DB client
│   │   ├── jobs/                             # Background node-cron daemons
│   │   │   └── reservation-cleanup.job.ts    # Cleans expired 10-minute bed locks
│   │   ├── middleware/                       # Auth, RBAC, Upload (Multer), Validation, Error
│   │   │   ├── auth.middleware.ts            # JWT authentication & session verification
│   │   │   ├── error.middleware.ts           # Centralized API error formatter
│   │   │   ├── rate-limit.middleware.ts      # Multi-tier route rate limiters
│   │   │   ├── rbac.middleware.ts            # Institutional role authorization
│   │   │   ├── upload.middleware.ts          # Multer photo/video & CSV file validation
│   │   │   └── validate.middleware.ts        # Zod request payload validator
│   │   ├── modules/                          # 20 feature modules (controller, service, routes):
│   │   │   ├── announcement/                 # Targeted notice circulars & read tracking
│   │   │   ├── attendance/                   # Night roll-call sessions & leave reconciliation
│   │   │   ├── auth/                         # Login, registration, JWT refresh, dynamic QR
│   │   │   ├── booking/                      # Concurrency-safe room booking & locks
│   │   │   ├── hostel/                       # Hostel, block, floor, room CRUD & blocking
│   │   │   ├── mess-entry/                   # Dining hall QR scanning & daily counts
│   │   │   ├── mess-fee/                     # Mess fee billing & verification
│   │   │   ├── notification/                 # Notification delivery & unread tracking
│   │   │   ├── operations/                   # Complaints, leaves, visitors, receipts
│   │   │   ├── receipt/                      # PDFKit vector receipt & Resend email engine
│   │   │   ├── user/                         # Staff management, student roster, CSV import
│   │   │   └── verify/                       # Public zero-PII gate verification endpoint
│   │   ├── utils/                            # ApiError, ApiResponse, dynamicQr, hash, jwt
│   │   ├── app.ts                            # Express application setup, routes & headers
│   │   └── server.ts                         # Server bootstrap, IST timezone & graceful drain
│   ├── Dockerfile                            # Node.js production container
│   └── package.json
│
├── deploy.sh                                 # Zero-downtime automated production rollout script
├── docker-compose.yml                        # 3-tier container stack (PostgreSQL + API + Client)
├── DEMO_SCRIPT.md                            # Hackathon presentation & video demo walkthrough
├── SECURITY.md                               # Institutional security & compliance whitepaper
└── README.md                                 # Master documentation
```

---

## ⚙️ Environment Configuration Reference

### Backend Configuration (`server/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `5001` | Port number on which the Express server listens. |
| `NODE_ENV` | No | `development` | Runtime environment (`development` \| `production`). |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection URI (e.g. `postgresql://user:pass@localhost:5432/hostel_db`). |
| `DIRECT_URL` | No | — | Direct connection string for migrations when using transaction poolers like Neon / Supabase. |
| `JWT_ACCESS_SECRET` | **Yes** | Default dev key | Long cryptographic secret for signing 15-minute access tokens. |
| `JWT_REFRESH_SECRET` | **Yes** | Default dev key | Cryptographic secret for signing 7-day rotating refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Lifetime of JWT access tokens. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Lifetime of refresh tokens. |
| `RESERVATION_TIMEOUT_MINUTES` | No | `10` | Duration (in minutes) for temporary bed hold locks during room booking. |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing (CORS). |
| `UPLOAD_DIR` | No | `uploads` | Directory for storing uploaded media proofs and receipts. |
| `MAX_FILE_SIZE` | No | `5242880` (5MB) | Maximum allowable upload file size in bytes. |
| `RAZORPAY_KEY_ID` | Optional | — | Razorpay test or live Key ID (`rzp_test_...`). |
| `RAZORPAY_KEY_SECRET` | Optional | — | Razorpay test or live Key Secret for HMAC verification. |
| `RESEND_API_KEY` | Optional | — | Resend API key for automated transactional receipt emails (`re_...`). |
| `RESEND_FROM_EMAIL` | Optional | `onboarding@resend.dev` | Sender email address for receipt delivery. |

### Frontend Configuration (`client/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | No | `/api/v1` | Backend API base URL. Leave empty in local dev to utilize Vite's proxy. |
| `VITE_PUBLIC_APP_URL` | No | Current Origin | Base URL encoded into student QR codes (e.g. `https://yourhostel.com` or local LAN IP `http://192.168.1.25:5173`). |
| `VITE_RAZORPAY_KEY_ID` | Optional | — | Razorpay public Key ID for client checkout modal initialization. |

---

## 🚀 Getting Started

You can run the BMSET Hostel Management System via **Local Native Toolchain**, **Docker Compose Stack**, or the **Automated Rollout Script**.

### Prerequisites
- **Node.js:** `v20.0.0` or `v22.0.0+`
- **PostgreSQL:** `v15` or `v16+` (or cloud instance via Neon / Supabase)
- **Package Manager:** `npm` or `pnpm`
- **Docker & Docker Compose:** (Optional, for containerized execution)

---

### Option A: Local Native Setup

#### 1. Clone the Codebase
```bash
git clone https://github.com/Omkarpmath/Hostel-System.git
cd Hostel-System
```

#### 2. Configure & Run Backend API
```bash
cd server
npm install

# Copy environment template
cp .env.example .env
# Edit server/.env with your DATABASE_URL and secrets
```

Push schema to PostgreSQL:
```bash
# Push database models
npx prisma db push
```

Start the API development server:
```bash
npm run dev
# Backend starts at http://localhost:5001
```

#### 3. Configure & Run Frontend Application
Open a new terminal:
```bash
cd client
npm install
npm run dev
# Frontend starts at https://localhost:5173 (or http://localhost:5173)
```

> [!TIP]
> **Mobile QR Scanner over Local Wi-Fi:**
> Vite runs with `@vitejs/plugin-basic-ssl` and `host: true`. To scan student QR codes from a physical smartphone camera, connect your phone to the same Wi-Fi network and open `https://<YOUR_LOCAL_IP>:5173` on your mobile browser. Accept the self-signed developer certificate to grant camera scanner permissions.

---

### Option B: One-Command Docker Compose Stack

The repository includes a production-ready `docker-compose.yml` provisioning PostgreSQL 16, the Express backend, and the Nginx frontend client:

```bash
docker compose up -d --build
```

- **Frontend Client:** `http://localhost` (Port 80)
- **Backend API:** `http://localhost:5001/api/v1`
- **Health Check:** `http://localhost:5001/api/v1/health`
- **PostgreSQL DB:** `localhost:5432` (Persistent volume `pgdata`)

To view live container logs:
```bash
docker compose logs -f
```

---

### Option C: Automated Production Rollout (`deploy.sh`)

For production Linux/macOS hosts, `deploy.sh` executes safe zero-downtime updates with automated database backup snapshots and instant rollback:

```bash
chmod +x deploy.sh
./deploy.sh
```

**What `deploy.sh` automatically performs:**
1. ✅ **Pre-flight Checks:** Verifies Docker and Docker Compose availability.
2. 💾 **Automated Database Snapshot:** Runs `pg_dump` on the running Postgres container, saving timestamped snapshots in `./backups/db_backup_<timestamp>.sql`.
3. 🚀 **Zero-Downtime Rollout:** Builds and spins up updated containers via `docker compose up -d --build`.
4. 🔄 **Schema Sync with Safe Rollback:** Applies `prisma db push`. If migrations fail, it automatically rolls back the database from the snapshot.
5. 🏥 **Health Probing:** Pings `/api/v1/health` for up to 12 consecutive attempts until all services report healthy.

---

## 🔑 Demo Access Profiles

For testing and demonstration across all 5 institutional user tiers, you can register new accounts via `/register` or seed demo credentials:

| Role | Email Address | Default Password | Assigned Scope & Duty |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@bmsce.ac.in` | `Admin@123` | Institutional Scope (Hostels, Rooms, Staff, CSV Sync) |
| **👨‍💼 Warden** | `warden@bmsce.ac.in` | `Warden@123` | Boys Hostel Block 1 (Leaves, Register, Complaints) |
| **🛡️ Security (Hostel)** | `security@bmsce.ac.in` | `Security@123` | Night Roll-Call Scanner & Visitor Gate Desk |
| **🛡️ Security (Mess)** | `security.mess@bmsce.ac.in` | `Security@123` | Mess Dining Hall Admission & Headcount Scanner |
| **💰 Accountant** | `accountant@bmsce.ac.in` | `Account@123` | Financial Ledgers, Receipts, Offline Approvals |
| **🎓 Student** | `student@bmsce.ac.in` | `Student@123` | Self Dashboard, Room Booking, Fees, QR Passport |

---

## 🌐 Production Deployment & Cloud Hosting

### 1. Backend Service (e.g. Render Web Service)
- **Runtime:** Node.js
- **Build Command:** `npm run build && npx prisma db push`
- **Start Command:** `npm run start`
- **Environment Variables:**
  - `NODE_ENV=production`
  - `DATABASE_URL=postgresql://...`
  - `JWT_ACCESS_SECRET=...`
  - `JWT_REFRESH_SECRET=...`
  - `CLIENT_URL=https://<your-frontend-domain>`

### 2. Frontend Web Client (e.g. Render Static Site / Vercel)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL=https://<your-backend-api-domain>`

### 3. Database Hosting (e.g. Supabase / Neon / Render Postgres)
- Uses standard PostgreSQL 15/16 connection strings.
- Compatible with transaction connection poolers via Prisma's `directUrl` configuration.

---

## 📜 Compliance, Whitepapers & Presentation Assets

The repository contains comprehensive documentation for institutional reviews, hackathon submissions, and technical evaluation:

- **[SECURITY.md](file:///Volumes/Omkar/FullStackProjects/HOSTEL%20MANAGEMENT/SECURITY.md):** 17,000-word institutional Security & Compliance Whitepaper detailing cryptographic design, RBAC threat modeling, session token lifetimes, data minimization principles, and audit trails.
- **[SECURITY_REPORT.html](file:///Volumes/Omkar/FullStackProjects/HOSTEL%20MANAGEMENT/SECURITY_REPORT.html):** Printable, publication-ready A4 executive security whitepaper.
- **[DEMO_SCRIPT.md](file:///Volumes/Omkar/FullStackProjects/HOSTEL%20MANAGEMENT/DEMO_SCRIPT.md):** 5-minute video demonstration script covering the full user flow.
- **[SLIDES_PREVIEW.html](file:///Volumes/Omkar/FullStackProjects/HOSTEL%20MANAGEMENT/SLIDES_PREVIEW.html):** Executive presentation deck designed for institutional leadership and College Principals.

---

<div align="center">
  <br/>
  <p><strong>Developed for B.M.S. College of Engineering (BMSCE)</strong></p>
  <p><em>BMS Educational Trust (BMSET), Bull Temple Road, Bengaluru, Karnataka 560019</em></p>
  <p>Built with ❤️ for digital campus excellence, student safety, and institutional efficiency.</p>
</div>
