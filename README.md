# 🏢 BMSCE Hostel Management System

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)

A comprehensive, full-stack digital platform designed to automate hostel administration, room allocations, fee collections, and student facility management for BMS College of Engineering.

## ✨ Key Features

- **🔐 Role-Based Workspaces:** Distinct, secure dashboards tailored for Students, Admins, Wardens, Accountants, and Security personnel with granular access controls.
- **🛏️ Automated Allocation & Booking Engine:** Real-time room availability tracking, bed capacity management, and conflict-free student room selection using temporary transaction locks.
- **💳 Integrated Financial System:** Seamless processing of annual mess and hostel fees using Razorpay API, complete with HMAC-SHA256 signature verification and automated receipt generation.
- **📱 Smart QR Verification:** Auto-generated, unique cryptographic QR passports for students, enabling instant mobile verification of identity, room allocation, and fee status by security staff without requiring specialized apps.
- **📊 Digitised Operations:** End-to-end digital workflows for tracking student leave requests, facility complaints, and visitor logs, complete with real-time status updates and administrative analytics.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** CSS Modules / Custom Properties
- **State Management & Data Fetching:** React Query, Zustand
- **Animations & Icons:** Framer Motion, Lucide React
- **Data Visualization:** Recharts

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Payment Gateway:** Razorpay

## 📂 Project Structure

```text
.
├── client/                 # React frontend application
│   ├── src/
│   │   ├── api/            # API client configurations
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Domain-specific feature modules
│   │   ├── layouts/        # Application layout wrappers
│   │   ├── lib/            # Utility functions
│   │   └── providers/      # React context providers
│   └── package.json
│
└── server/                 # Express backend application
    ├── prisma/             # Database schema and migrations
    ├── src/
    │   ├── config/         # Environment and database configurations
    │   ├── middlewares/    # Express middlewares (auth, error handling)
    │   ├── modules/        # Domain-driven modules (auth, booking, hostel, etc.)
    │   └── utils/          # Helper classes (ApiError, ApiResponse)
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Razorpay Account (for payment gateway integration)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Omkarpmath/Hostel-System.git
   cd Hostel-System
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory and configure the required environment variables (see Environment Variables section).
   
   Initialize the database:
   ```bash
   npx prisma db push
   # Or run migrations if applicable
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

Open two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The application should now be running. The frontend typically runs on `http://localhost:5173` and the backend on `http://localhost:5001`.

## ⚙️ Environment Variables

### Backend (`server/.env`)

```env
NODE_ENV=development
PORT=5001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hostel_db"

# JWT Auth
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Business Logic
RESERVATION_TIMEOUT_MINUTES=4

# CORS
CLIENT_URL=http://localhost:5173

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Razorpay Integration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## 📈 Impact

This platform eliminates manual record-keeping and administrative bottlenecks, enforces strict fee compliance prior to room allocation, enhances campus security via instant digital verification, and provides students with a transparent, self-service portal.

---
*Built with ❤️ for better campus living.*
