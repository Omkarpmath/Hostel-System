# 🎬 5-Minute Demo Video Script: BMSCE Hostel Management System
### *Razorpay Buildathon Submission*

---

## ⏱️ Timeline Summary
* **0:00 – 0:45**: Introduction & Problem Statement
* **0:45 – 1:50**: Room Booking Engine & Razorpay Fee Integration *(Key Hackathon Focus)*
* **1:50 – 2:40**: Student Profile, Attendance Calendar & Digital QR Passport
* **2:40 – 3:30**: Multimedia Complaints System *(Photos & Videos Proofs)*
* **3:30 – 4:30**: Security Night Attendance & Automated Leave Cross-Check
* **4:30 – 5:00**: Admin / Warden Oversight & Wrap-Up

---

## 🕒 [0:00 – 0:45] Introduction & The Problem

**🖥️ On-Screen Action:**
- Show the clean Landing / Login Page (`http://localhost:5173`).
- Have the camera or voice introduce the project with a high-level view.

**🎙️ What to Say:**
> *"Hello everyone! Welcome to the demonstration of the **BMSCE Hostel Management System** — a full-stack platform built to digitize and automate residential campus operations.*
>
> *Managing thousands of hostel students across multiple blocks is historically chaotic — filled with paper attendance registers, long queues for annual fee payments, lost complaint slips, and double-booking during room allotment.*
>
> *We solved this with a centralized, role-based application supporting Students, Wardens, Security Guards, and Accountants. Let’s dive into how it works."*

---

## 🕒 [0:45 – 1:50] Room Booking & Razorpay Payment Integration

**🖥️ On-Screen Action:**
1. Log in as a **Student**.
2. Navigate to **Room Booking** in the sidebar.
3. Click on a hostel block, floor, and select an available bed (show the live inventory indicator).
4. Click **"Book Room"** or proceed to **"Pay Hostel Fee"** to trigger the Razorpay modal.
5. In the Razorpay modal, select *Netbanking / UPI (Test Mode)* and complete the transaction.
6. Show the instant payment success screen, receipt generation, and updated ledger.

**🎙️ What to Say:**
> *"First, let’s look at our smart room booking and payment flow.*
>
> *When admission season starts, hundreds of students try to book rooms simultaneously. To prevent race conditions, our booking engine places an **atomic 4-minute reservation lock** on a selected bed so nobody else can take it.*
>
> *To confirm the booking, the student must clear their annual hostel and mess dues. Here, we have seamlessly integrated **Razorpay**.*
>
> *(Trigger Razorpay modal)*
> *With one click, Razorpay’s checkout opens up. Students can pay via UPI, cards, or net banking. Upon completion, our backend uses **HMAC-SHA256 signature verification** to validate the payment cryptographically.*
>
> *Notice how immediately the student’s payment status updates to ‘Paid’, generating a digital receipt and freeing up administrative staff from manual bank reconciliations."*

---

## 🕒 [1:50 – 2:40] Student Profile, Attendance Calendar & Digital Passport

**🖥️ On-Screen Action:**
1. Navigate to the **"My Profile"** page.
2. Show the Student details (Room No, Block, Contact Info, editable profile fields).
3. Scroll down to the **Monthly Attendance Calendar** (hover over Present ✅, Absent ❌, Leave ✈️ days).
4. Click on the **"Digital QR Passport"** tab or modal.

**🎙️ What to Say:**
> *"Next is the student's personal hub. Here, students can view their room allocation details, emergency contacts, and edit their personal information with real-time profile syncing.*
>
> *We also built an interactive **Monthly Attendance Calendar**. Students can see their night attendance day-by-day with color-coded statuses and monthly attendance percentages, ensuring complete transparency.*
>
> *Additionally, every student gets a **Cryptographic Digital QR Passport**. This unique token allows security guards at the campus gates to verify student identity, active hostel enrollment, and fee clearance instantly."*

---

## 🕒 [2:40 – 3:30] Multimedia Complaint Tracking System

**🖥️ On-Screen Action:**
1. Navigate to **Complaints**.
2. Click **"New Complaint"**. Fill in a Title (*e.g., "Plumbing leak in Room 304"*), select Category (*Maintenance*) & Priority (*High*).
3. Attach sample photo/video proofs using the file uploader. Click **Submit**.
4. Click on the newly submitted complaint to open the **Lightbox Viewer** and show the high-res image and video player.

**🎙️ What to Say:**
> *"Hostel maintenance issues usually get lost in verbal communication. Our **Multimedia Complaint Tracking System** lets students report issues with hard evidence.*
>
> *Students can attach up to 5 photos or video proofs directly from their phone or laptop.*
>
> *Under the hood, to ensure attachments never get lost when deployed on ephemeral cloud servers like Render, we process the media into Base64 Data URIs stored directly in PostgreSQL.*
>
> *Wardens can open this interactive lightbox viewer, inspect the video or high-res images, and update the status from Open to In-Progress or Resolved."*

---

## 🕒 [3:30 – 4:30] Digital QR Night Attendance & Automated Leave Check

**🖥️ On-Screen Action:**
1. Log out of the Student account and log in as **Security Guard**.
2. Open **Night Attendance**.
3. Click **"Start Attendance Session"**.
4. Open the camera scanner (`html5-qrcode`) or upload a sample QR code image.
5. Show the instant scan confirmation.
6. *(Highlight)* Show a student flagged as **"ON LEAVE"** automatically because of an approved leave.
7. Show the real-time attendance register and click **"Export CSV"**.

**🎙️ What to Say:**
> *"One of our flagship innovations is the **Digital QR Night Attendance System**.*
>
> *Security guards are scoped strictly to their assigned hostel block. When night curfew begins, the guard starts a session and uses our high-speed QR camera scanner.*
>
> *As students scan their QR passes, the system performs an automated real-time cross-check against active approved leave requests in the database. If a student is on an approved leave, the system flags them as ‘ON LEAVE’ instead of marking them absent or mistakenly present.*
>
> *At the end of the session, guards and wardens get a live register with instant search and one-click CSV export for official college records."*

---

## 🕒 [4:30 – 5:00] Admin / Warden Oversight & Conclusion

**🖥️ On-Screen Action:**
1. Switch to the **Admin / Warden Dashboard**.
2. Briefly scroll through the analytics overview (occupancy rates, fee collection totals, pending complaints).
3. Switch back to the landing page or a final summary slide.

**🎙️ What to Say:**
> *"Finally, Administrators and Wardens have total bird's-eye visibility over campus residential operations — from block-wise occupancy and leave approvals to overall fee collections powered by Razorpay.*
>
> *In summary, this project brings transparency, cryptographic security, and automated payments to hostel administration. Thank you for watching, and thank you Razorpay for this opportunity!"*

---

### 💡 Quick Tips for a Flawless Recording:
1. **Pre-populate Data**: Have a couple of pre-registered students, a security account, and an admin account ready in separate browser tabs (or use Incognito mode).
2. **Browser Zoom**: Set your browser zoom to **100% or 110%** for maximum legibility on screen.
3. **Razorpay Test Cards**: Keep the Razorpay test card/UPI credentials handy so there is no delay during the payment demo.
