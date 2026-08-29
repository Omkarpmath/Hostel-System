<div align="center">
  <h1>🏢 BMSCE Hostel Management System</h1>
  <p><strong>A comprehensive full-stack hostel administration, room allocation, night attendance, fee collection, and student facility management platform built for BMS College of Engineering.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" alt="Razorpay" />
  </p>
  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-role-based-access-control-rbac">Roles</a> •
    <a href="#-technology-stack">Tech Stack</a> •
    <a href="#-project-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a>
  </p>
</div>

<br/>

## ✨ Key Features

### 🌙 1. Digital QR Night Attendance System
- **Hostel-Scoped Security Assignment:** Administrators allot security personnel to specific hostel blocks. Permissions are strictly enforced at the database and API level.
- **Session Management:** Security guards can start, pause, and resume attendance sessions on demand with no restrictive countdowns or rigid schedules.
- **High-Speed QR Scanning:** Integrated camera-based QR scanner (`html5-qrcode`) with a photo/file capture fallback for all devices and iOS Safari.
- **Automated Leave Cross-Checking:** When a student's QR code is scanned, the system automatically checks if they have an active approved leave for today—flagging them as **ON LEAVE** without mistakenly marking them present.
- **Real-Time Attendance Register & CSV Export:** Live registers with status filters (Present, On Leave, Absent), search by USN/Name, and instant CSV export for Wardens and Administrators.

### 👤 2. Student Profile & Attendance History
- **Personalized Profile Hub:** Modern user interface displaying room allocation details, guardian contacts, academic info, and student USN.
- **Inline Profile Editing:** Students can edit contact information directly with real-time profile syncing.
- **Monthly Attendance Calendar:** Visual, color-coded calendar breakdown tracking student night attendance day-by-day (Present ✅, Leave ✈️, Absent ❌) alongside monthly attendance rate percentages.

### 📸 3. Multimedia Complaint Tracking System
- **Photo & Video Proof Uploads:** Students can attach up to 5 photo or video proofs (JPEG, PNG, WebP, MP4, MOV, WebM) per complaint.
- **Interactive Lightbox & Player:** Wardens and Admins can preview high-resolution images or stream attached videos directly in the browser via an aesthetic lightbox.
- **Permanent Cloud Storage:** Attachments are stored as Base64 Data URIs in PostgreSQL, ensuring permanent persistence across ephemeral cloud restarts (Render/Docker/Heroku).
- **Lifecycle Management:** Complete issue progression tracking (`OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED`), category classification, and priority tagging.

### 🛏️ 4. Room Booking & Allocation Engine
- **Live Inventory Tracking:** Visual block, floor, and room hierarchy with dynamic capacity and occupancy indicators.
- **Atomic Booking Locks:** Automatic 4-minute temporary reservation timeouts to prevent double-booking during concurrent student selections.
- **Warden & Admin Overrides:** Direct administrative allocation and bed management capabilities.

### 💳 5. Financial & Fee Management
- **Razorpay Integration:** Automated payment gateway integration with HMAC-SHA256 signature verification for annual hostel and mess fee dues.
- **Receipts & Ledger:** Automated receipt generation, instant payment status reflection, and accountant ledger views.

### 📱 6. Smart Student QR Passport & Verification
- **Cryptographic QR Tokens:** Unique UUID-based student tokens accessible from the student dashboard.
- **Public Gate Verification:** Security guards can verify student credentials, active allocations, and fee clearance via quick QR scan without logging into an administrative account.

---

## 👥 Role-Based Access Control (RBAC)

The platform is designed with a strict security-first RBAC system tailored for the hostel hierarchy.

| Role | Permissions & Capabilities |
| :--- | :--- |
| **🎓 Student** | Room booking, Razorpay fee payments, digital QR passport, leave requests, multimedia complaint filing, monthly attendance calendar, profile editing. |
| **🛡️ Security** | QR identity verification, gate pass validation, night attendance scanner for assigned hostel block, scoped attendance logs, visitor registration. |
| **👨‍💼 Warden** | Room allocation overrides, leave approvals/rejections, complaint lifecycle management with photo/video inspection, attendance registers & CSV exports for managed hostels. |
| **👑 Admin** | Global system configuration, security-to-hostel assignment, student & staff profile management, hostel/room inventory creation, complete attendance logs. |
| **💰 Accountant** | Fee schedule creation, hostel/mess payment verification, receipt generation, financial reports. |

---

## 🛠️ Technology Stack

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Frontend</b></td>
      <td align="center"><b>Backend</b></td>
      <td align="center"><b>DevOps & DB</b></td>
    </tr>
    <tr>
      <td>
        • React 18 (TypeScript)<br>
        • Vite + Tailwind CSS<br>
        • React Router v6<br>
        • TanStack Query (v5)<br>
        • Framer Motion & Lucide<br>
        • html5-qrcode
      </td>
      <td>
        • Node.js (ES Modules)<br>
        • Express.js 5<br>
        • TypeScript<br>
        • JWT (Cookies)<br>
        • Multer<br>
        • Razorpay SDK
      </td>
      <td>
        • PostgreSQL<br>
        • Prisma ORM<br>
        • Prettier & ESLint<br>
        • Render / Vercel<br>
      </td>
    </tr>
  </table>
</div>

---

## 📂 Project Architecture

```text
.
├── client/                     # React + TypeScript frontend
│   ├── src/
│   │   ├── api/                # Axios API clients (auth, hostel, attendance, operations)
│   │   ├── components/         # Shared UI (PageHeader, StatusBadge, EmptyState, etc.)
│   │   ├── features/           # Domain feature modules:
│   │   │   ├── attendance/     # Night Attendance scanner & register
│   │   │   ├── complaints/     # Complaints list, modal & media viewer
│   │   │   ├── dashboard/      # Role-specific dashboards (Admin, Student, etc.)
│   │   │   ├── fees/           # Hostel & Mess fee payments
│   │   │   ├── hostel/         # Room booking & inventory
│   │   │   ├── leave/          # Leave application & approvals
│   │   │   ├── profile/        # Student Profile & Attendance Calendar
│   │   │   └── verify/         # Public QR verification
│   │   ├── layouts/            # Sidebar, Header, and responsive navigation
│   │   └── providers/          # Auth, Theme, and Query providers
│   └── package.json
│
└── server/                     # Express + TypeScript backend
    ├── prisma/                 # Prisma schema, migrations & seed scripts
    ├── src/
    │   ├── config/             # Environment, Database & Razorpay setup
    │   ├── middleware/         # Auth, RBAC, Upload (Multer), Validation, Error handling
    │   ├── modules/            # Feature controllers, services & routes:
    │   │   ├── attendance/     # Night attendance session & scan logic
    │   │   ├── auth/           # Login, registration, profile & tokens
    │   │   ├── booking/        # Room reservation engine & timers
    │   │   ├── hostel/         # Hostel, block, floor & room management
    │   │   ├── mess-fee/       # Mess fee billing
    │   │   ├── operations/     # Complaints, leaves, visitors, allocations
    │   │   └── user/           # User & student profile management
    │   └── utils/              # ApiError, ApiResponse & helpers
    └── package.json
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js:** v18.0.0 or higher
- **PostgreSQL:** Local instance or cloud database (Supabase / Render / Neon)
- **Razorpay Account:** Test API keys for fee payment testing

### 🛠️ Installation

**1. Clone the Repository:**
```bash
git clone https://github.com/Omkarpmath/Hostel-System.git
cd Hostel-System
```

**2. Configure Backend Environment:**
```bash
cd server
npm install
cp .env.example .env   # Or create server/.env
```
*Fill in your `server/.env` with DB credentials, JWT secrets, and Razorpay keys.*

**3. Initialize Database:**
```bash
npx prisma db push
npm run db:seed        # Optional: Seed sample data
```

**4. Configure Frontend Environment:**
```bash
cd ../client
npm install
```
*(Optional)* For testing on mobile devices over local Wi-Fi, create `client/.env.local`:
```env
VITE_PUBLIC_APP_URL=https://<YOUR_LAN_IP>:5173
```

---

## 💻 Running the Application

Open two terminal windows to run both servers simultaneously:

<details open>
<summary><b>Terminal 1 (Backend API)</b></summary>

```bash
cd server
npm run dev
```
</details>

<details open>
<summary><b>Terminal 2 (Frontend Client)</b></summary>

```bash
cd client
npm run dev
```
</details>

<br/>

- **Frontend Application:** `http://localhost:5173`
- **Backend API:** `http://localhost:5001`
- **Health Check Endpoint:** `http://localhost:5001/api/v1/health`

---

## 🌐 Production Deployment (Render)

The application is fully configured for ephemeral deployment platforms like **Render**, ensuring attachments (like photos & videos) remain persistent by storing them in the PostgreSQL database instead of the local filesystem.

**Backend (Web Service)**
- **Build Command:** `npm run build && npx prisma db push`
- **Start Command:** `npm run start`

**Frontend (Static Site)**
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** `VITE_API_URL=https://<YOUR_BACKEND_URL>.onrender.com`

---

<div align="center">
  <p><b>Developed for BMS College of Engineering. All rights reserved.</b></p>
</div>
