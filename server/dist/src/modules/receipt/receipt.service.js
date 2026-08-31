import PDFDocument from "pdfkit";
import { Resend } from "resend";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { razorpayClient } from "../../config/razorpay.js";
export class ReceiptService {
    /**
     * Generate sequential receipt number in format: REC-YYYY-XXXXXX
     */
    async generateReceiptNumber() {
        const year = new Date().getFullYear();
        const count = await prisma.fee.count({
            where: {
                receiptNumber: {
                    startsWith: `REC-${year}-`,
                },
            },
        });
        const seq = String(count + 1).padStart(6, "0");
        return `REC-${year}-${seq}`;
    }
    /**
     * Generate an official, branded vector PDF receipt buffer using pure-JS pdfkit.
     */
    async generateReceiptPdf(data) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: "A4",
                    margin: 40,
                    info: {
                        Title: `Hostel Fee Receipt - ${data.receiptNumber}`,
                        Author: "B.M.S. College of Engineering Hostel Administration",
                        Subject: `${data.feeType} Receipt`,
                    },
                });
                const buffers = [];
                doc.on("data", (chunk) => buffers.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(buffers)));
                doc.on("error", (err) => reject(err));
                const pageWidth = doc.page.width;
                const margin = 40;
                const contentWidth = pageWidth - margin * 2;
                // ─── Top Header Bar ───
                doc.rect(margin, margin, contentWidth, 80).fill("#1e3a8a");
                doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18)
                    .text("B.M.S. COLLEGE OF ENGINEERING", margin + 15, margin + 15, { width: contentWidth - 30, align: "left" });
                doc.fillColor("#93c5fd").font("Helvetica").fontSize(9)
                    .text("Hostel Administration & Housing System • Bull Temple Road, Bengaluru - 560019", margin + 15, margin + 40);
                doc.fillColor("#bfdbfe").font("Helvetica-Bold").fontSize(10)
                    .text("OFFICIAL PAYMENT RECEIPT", margin + 15, margin + 56);
                // ─── Receipt Metadata Box ───
                const metaTop = margin + 95;
                doc.rect(margin, metaTop, contentWidth, 48).fillAndStroke("#f8fafc", "#e2e8f0");
                // Receipt Number
                doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8)
                    .text("RECEIPT NUMBER", margin + 12, metaTop + 10);
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11)
                    .text(data.receiptNumber, margin + 12, metaTop + 24);
                // Payment Date
                const dateStr = data.paidAt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
                const timeStr = data.paidAt.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8)
                    .text("DATE & TIME", margin + 180, metaTop + 10);
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(`${dateStr}, ${timeStr}`, margin + 180, metaTop + 24);
                // Status Badge
                doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(8)
                    .text("PAYMENT STATUS", margin + 370, metaTop + 10);
                doc.rect(margin + 370, metaTop + 22, 60, 16).fill("#dcfce7");
                doc.fillColor("#15803d").font("Helvetica-Bold").fontSize(9)
                    .text("PAID", margin + 386, metaTop + 26);
                // ─── Section 1: Student Information ───
                const sec1Top = metaTop + 60;
                doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(11)
                    .text("STUDENT DETAILS", margin, sec1Top);
                doc.rect(margin, sec1Top + 16, contentWidth, 68).fillAndStroke("#ffffff", "#e2e8f0");
                // Col 1: Name & USN
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Student Name:", margin + 12, sec1Top + 26);
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(data.studentName, margin + 85, sec1Top + 25);
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("USN / ID:", margin + 12, sec1Top + 44);
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(data.usn || "N/A", margin + 85, sec1Top + 43);
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Department:", margin + 12, sec1Top + 62);
                doc.fillColor("#0f172a").font("Helvetica").fontSize(9)
                    .text(data.department || "Engineering", margin + 85, sec1Top + 62);
                // Col 2: Email Details
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Student Email:", margin + 260, sec1Top + 26);
                doc.fillColor("#0f172a").font("Helvetica").fontSize(9)
                    .text(data.studentEmail || "—", margin + 340, sec1Top + 26);
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Receipt Sent To:", margin + 260, sec1Top + 44);
                doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(9)
                    .text(data.receiptEmail, margin + 340, sec1Top + 44);
                // ─── Section 2: Accommodation / Facility Details ───
                const sec2Top = sec1Top + 96;
                doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(11)
                    .text("ACCOMMODATION & SERVICE DETAILS", margin, sec2Top);
                doc.rect(margin, sec2Top + 16, contentWidth, 54).fillAndStroke("#ffffff", "#e2e8f0");
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Hostel / Facility:", margin + 12, sec2Top + 26);
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(data.hostelName || "Campus Facility", margin + 95, sec2Top + 25);
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Fee Category:", margin + 12, sec2Top + 44);
                doc.fillColor("#0f172a").font("Helvetica").fontSize(9)
                    .text(data.feeType, margin + 95, sec2Top + 44);
                if (data.roomNumber) {
                    doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                        .text("Allocated Room:", margin + 260, sec2Top + 26);
                    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                        .text(`Room ${data.roomNumber}${data.bedNumber ? ` (Bed #${data.bedNumber})` : ""}`, margin + 340, sec2Top + 25);
                }
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text("Academic Year:", margin + 260, sec2Top + 44);
                doc.fillColor("#0f172a").font("Helvetica").fontSize(9)
                    .text(`${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, margin + 340, sec2Top + 44);
                // ─── Section 3: Payment Breakdown Table ───
                const tableTop = sec2Top + 82;
                doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(11)
                    .text("PAYMENT TRANSACTION DETAILS", margin, tableTop);
                // Table Header
                doc.rect(margin, tableTop + 16, contentWidth, 24).fill("#f1f5f9");
                doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9)
                    .text("PARTICULARS / DESCRIPTION", margin + 12, tableTop + 23);
                doc.text("AMOUNT (INR)", margin + contentWidth - 100, tableTop + 23, { width: 90, align: "right" });
                // Table Row
                doc.rect(margin, tableTop + 40, contentWidth, 36).fillAndStroke("#ffffff", "#e2e8f0");
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5)
                    .text(data.feeType, margin + 12, tableTop + 47);
                doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                    .text(`Semester Fee Settlement • Razorpay Online Gateway`, margin + 12, tableTop + 60);
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
                    .text(`₹ ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, margin + contentWidth - 110, tableTop + 50, { width: 100, align: "right" });
                // Table Total Row
                doc.rect(margin, tableTop + 76, contentWidth, 30).fill("#f8fafc");
                doc.rect(margin, tableTop + 76, contentWidth, 30).stroke("#cbd5e1");
                doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(10)
                    .text("TOTAL AMOUNT PAID:", margin + 12, tableTop + 86);
                doc.fillColor("#15803d").font("Helvetica-Bold").fontSize(12)
                    .text(`₹ ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, margin + contentWidth - 140, tableTop + 85, { width: 130, align: "right" });
                // ─── Section 4: Gateway Verification Metadata ───
                const gwTop = tableTop + 118;
                doc.rect(margin, gwTop, contentWidth, 48).fillAndStroke("#f0fdf4", "#bbf7d0");
                doc.fillColor("#166534").font("Helvetica-Bold").fontSize(8)
                    .text("RAZORPAY VERIFICATION DETAILS", margin + 12, gwTop + 8);
                doc.fillColor("#334155").font("Helvetica").fontSize(8)
                    .text(`Razorpay Order ID:  ${data.razorpayOrderId || "—"}`, margin + 12, gwTop + 22)
                    .text(`Razorpay Payment ID:  ${data.razorpayPaymentId || "—"}`, margin + 12, gwTop + 34);
                doc.fillColor("#334155").font("Helvetica").fontSize(8)
                    .text(`Payment Mode: Online (UPI / NetBanking / Cards)`, margin + 260, gwTop + 22)
                    .text(`Transaction Status: SUCCESS / CAPTURED`, margin + 260, gwTop + 34);
                // ─── Footer & Seal ───
                const footerTop = 750;
                doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(margin, footerTop).lineTo(margin + contentWidth, footerTop).stroke();
                doc.fillColor("#64748b").font("Helvetica").fontSize(7.5)
                    .text("This is an electronically generated official receipt issued by the BMSCE Hostel Management System.", margin, footerTop + 8, { width: contentWidth - 140 })
                    .text("No physical signature is required. For inquiries, contact hostel.office@bmsce.ac.in", margin, footerTop + 20, { width: contentWidth - 140 });
                doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(8)
                    .text("Authorized Signatory", margin + contentWidth - 120, footerTop + 8, { width: 120, align: "center" });
                doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(8.5)
                    .text("BMSCE HOSTELS", margin + contentWidth - 120, footerTop + 20, { width: 120, align: "center" });
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    /**
     * Process receipt generation, extract Razorpay checkout email, and dispatch via Resend.
     * Fully idempotent and non-blocking for payment success.
     */
    async processReceiptAndEmail(feeId, razorpayPaymentId, options) {
        try {
            // 1. Fetch fee record with deep relations
            const fee = await prisma.fee.findUnique({
                where: { id: feeId },
                include: {
                    student: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                    allocation: {
                        include: {
                            room: {
                                include: {
                                    floor: {
                                        include: {
                                            block: {
                                                include: {
                                                    hostel: { select: { id: true, name: true } },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!fee) {
                console.error(`[ReceiptService] Fee not found: ${feeId}`);
                return { success: false, error: "Fee not found" };
            }
            // 2. Idempotency Check: Don't send duplicate emails if already sent
            if (fee.emailSent && !options?.force) {
                console.log(`[ReceiptService] Email already sent for fee ${feeId} to ${fee.receiptEmail}`);
                return { success: true, email: fee.receiptEmail, skipped: true };
            }
            // 3. Extract customer email from verified Razorpay payment
            let customerEmail = "";
            try {
                if (razorpayPaymentId) {
                    const payment = await razorpayClient().payments.fetch(razorpayPaymentId);
                    if (payment?.email && payment.email.trim()) {
                        customerEmail = payment.email.trim();
                    }
                }
            }
            catch (rErr) {
                console.warn(`[ReceiptService] Could not fetch payment email from Razorpay:`, rErr);
            }
            // Fallback to student registered email only if Razorpay has no email
            if (!customerEmail) {
                customerEmail = fee.student.user.email;
            }
            // 4. Generate or reuse Receipt Number
            let receiptNumber = fee.receiptNumber;
            if (!receiptNumber) {
                receiptNumber = await this.generateReceiptNumber();
                await prisma.fee.update({
                    where: { id: fee.id },
                    data: { receiptNumber },
                });
            }
            // 5. Build Receipt Data
            const studentName = `${fee.student.user.firstName} ${fee.student.user.lastName}`.trim();
            const feeTypeLabel = fee.type === "MESS_FEE" ? "Annual Mess Fee" : "Hostel Accommodation Fee";
            const hostelName = fee.allocation?.room?.floor?.block?.hostel?.name || "BMSCE Campus Hostel";
            const blockName = fee.allocation?.room?.floor?.block?.name;
            const roomNumber = fee.allocation?.room?.roomNumber;
            const bedNumber = fee.allocation?.bedNumber;
            const receiptData = {
                receiptNumber,
                studentName,
                usn: fee.student.usn,
                department: fee.student.department,
                studentEmail: fee.student.user.email,
                receiptEmail: customerEmail,
                feeType: feeTypeLabel,
                amount: Number(fee.amount),
                paidAt: fee.paidAt || new Date(),
                razorpayOrderId: fee.razorpayOrderId || "—",
                razorpayPaymentId: razorpayPaymentId || fee.transactionId || "—",
                hostelName,
                blockName,
                roomNumber,
                bedNumber,
            };
            // 6. Generate PDF Buffer
            const pdfBuffer = await this.generateReceiptPdf(receiptData);
            // 7. Dispatch Email via Resend
            if (!env.RESEND_API_KEY) {
                console.warn("[ReceiptService] RESEND_API_KEY is not configured in environment. Storing receipt metadata without email dispatch.");
                await prisma.fee.update({
                    where: { id: fee.id },
                    data: {
                        receiptNumber,
                        receiptEmail: customerEmail,
                        emailSent: false,
                        emailError: "RESEND_API_KEY is not configured in backend environment",
                    },
                });
                return { success: false, receiptNumber, email: customerEmail, error: "RESEND_API_KEY not configured" };
            }
            const resend = new Resend(env.RESEND_API_KEY);
            const emailSubject = `Hostel Fee Payment Receipt - ${receiptNumber}`;
            const emailBody = `Dear ${studentName},

Your payment of ₹${Number(fee.amount).toLocaleString("en-IN")} for ${feeTypeLabel} has been successfully received and verified.

Receipt Number: ${receiptNumber}
Payment Date: ${receiptData.paidAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
Razorpay Payment ID: ${receiptData.razorpayPaymentId}
Razorpay Order ID: ${receiptData.razorpayOrderId}

Please find your official payment receipt attached as a PDF to this email.

Regards,
B.M.S. College of Engineering Hostel Administration
Bull Temple Road, Bengaluru - 560019`;
            const response = await resend.emails.send({
                from: env.RESEND_FROM_EMAIL || "BMSCE Hostel <onboarding@resend.dev>",
                to: customerEmail,
                subject: emailSubject,
                text: emailBody,
                attachments: [
                    {
                        filename: `Hostel_Fee_Receipt_${receiptNumber}.pdf`,
                        content: pdfBuffer,
                    },
                ],
            });
            console.log(`[ReceiptService] Email sent successfully via Resend to ${customerEmail}. Response:`, response);
            // 8. Update Fee record with successful tracking
            await prisma.fee.update({
                where: { id: fee.id },
                data: {
                    receiptNumber,
                    receiptEmail: customerEmail,
                    emailSent: true,
                    emailSentAt: new Date(),
                    emailError: null,
                },
            });
            return { success: true, receiptNumber, email: customerEmail };
        }
        catch (err) {
            console.error("[ReceiptService] Error delivering receipt email:", err);
            // Isolated error handling: Log error and update fee without throwing
            try {
                await prisma.fee.update({
                    where: { id: feeId },
                    data: {
                        emailSent: false,
                        emailError: err?.message || "Failed to deliver email",
                    },
                });
            }
            catch (_) { }
            return { success: false, error: err?.message || "Failed to deliver receipt email" };
        }
    }
    /**
     * Get PDF buffer for direct download / viewing by fee ID.
     */
    async getReceiptPdfByFeeId(feeId, requesterUserId, requesterRole) {
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: {
                student: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
                allocation: {
                    include: {
                        room: {
                            include: {
                                floor: {
                                    include: {
                                        block: {
                                            include: {
                                                hostel: { select: { id: true, name: true } },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!fee) {
            throw new Error("Fee record not found");
        }
        // Role check: If STUDENT, verify they own this fee
        if (requesterRole === "STUDENT" && fee.student.userId !== requesterUserId) {
            throw new Error("Unauthorized to access this receipt");
        }
        let receiptNumber = fee.receiptNumber;
        if (!receiptNumber) {
            receiptNumber = await this.generateReceiptNumber();
            await prisma.fee.update({
                where: { id: fee.id },
                data: { receiptNumber },
            });
        }
        const studentName = `${fee.student.user.firstName} ${fee.student.user.lastName}`.trim();
        const feeTypeLabel = fee.type === "MESS_FEE" ? "Annual Mess Fee" : "Hostel Accommodation Fee";
        const hostelName = fee.allocation?.room?.floor?.block?.hostel?.name || "BMSCE Campus Hostel";
        const blockName = fee.allocation?.room?.floor?.block?.name;
        const roomNumber = fee.allocation?.room?.roomNumber;
        const bedNumber = fee.allocation?.bedNumber;
        const receiptData = {
            receiptNumber,
            studentName,
            usn: fee.student.usn,
            department: fee.student.department,
            studentEmail: fee.student.user.email,
            receiptEmail: fee.receiptEmail || fee.student.user.email,
            feeType: feeTypeLabel,
            amount: Number(fee.amount),
            paidAt: fee.paidAt || fee.createdAt || new Date(),
            razorpayOrderId: fee.razorpayOrderId || "—",
            razorpayPaymentId: fee.transactionId || "—",
            hostelName,
            blockName,
            roomNumber,
            bedNumber,
        };
        const buffer = await this.generateReceiptPdf(receiptData);
        return { buffer, filename: `Hostel_Fee_Receipt_${receiptNumber}.pdf` };
    }
}
export const receiptService = new ReceiptService();
//# sourceMappingURL=receipt.service.js.map