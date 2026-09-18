import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { razorpayClient } from "../../config/razorpay.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { receiptService } from "../receipt/receipt.service.js";
const CONFIG_KEY_VEG = "mess_fee_veg";
const CONFIG_KEY_NONVEG = "mess_fee_nonveg";
const LEGACY_CONFIG_KEY = "annual_mess_fee";
const DEFAULT_VEG_AMOUNT = 73000;
const DEFAULT_NONVEG_AMOUNT = 80000;
export class MessFeeService {
    // ─── Helpers ───
    async studentId(userId) {
        const student = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!student)
            throw ApiError.badRequest("Complete your student profile first");
        return student.id;
    }
    // ─── Config ───
    async getAmounts() {
        const [vegConfig, nonVegConfig, legacyConfig] = await Promise.all([
            prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY_VEG } }),
            prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY_NONVEG } }),
            prisma.systemConfig.findUnique({ where: { key: LEGACY_CONFIG_KEY } }),
        ]);
        const veg = vegConfig
            ? parseFloat(vegConfig.value)
            : legacyConfig
                ? parseFloat(legacyConfig.value)
                : DEFAULT_VEG_AMOUNT;
        const nonVeg = nonVegConfig
            ? parseFloat(nonVegConfig.value)
            : DEFAULT_NONVEG_AMOUNT;
        return { veg, nonVeg };
    }
    async getAmount(mealPlan = "VEG") {
        const amounts = await this.getAmounts();
        return mealPlan === "NON_VEG" ? amounts.nonVeg : amounts.veg;
    }
    async updateAmounts(veg, nonVeg) {
        if (veg < 1 || nonVeg < 1)
            throw ApiError.badRequest("Mess fee must be at least ₹1");
        const [v, nv] = await Promise.all([
            prisma.systemConfig.upsert({
                where: { key: CONFIG_KEY_VEG },
                update: { value: String(veg) },
                create: { key: CONFIG_KEY_VEG, value: String(veg), description: "Annual Veg mess fee amount in INR" },
            }),
            prisma.systemConfig.upsert({
                where: { key: CONFIG_KEY_NONVEG },
                update: { value: String(nonVeg) },
                create: { key: CONFIG_KEY_NONVEG, value: String(nonVeg), description: "Annual Non-Veg mess fee amount in INR" },
            }),
        ]);
        return { veg: parseFloat(v.value), nonVeg: parseFloat(nv.value) };
    }
    async updateAmount(amount) {
        return this.updateAmounts(amount, amount);
    }
    // ─── Student status ───
    async getMyStatus(userId) {
        const [studentId, amounts] = await Promise.all([
            this.studentId(userId),
            this.getAmounts(),
        ]);
        // Find all MESS_FEE records for this student in a single query
        const fees = await prisma.fee.findMany({
            where: { studentId, type: "MESS_FEE" },
            orderBy: { createdAt: "desc" },
        });
        // Derive paidFee in-memory without extra roundtrips
        const paidFees = fees.filter((f) => f.status === "PAID");
        const paidFee = paidFees.length > 0
            ? paidFees.sort((a, b) => (b.paidAt ? new Date(b.paidAt).getTime() : 0) - (a.paidAt ? new Date(a.paidAt).getTime() : 0))[0]
            : null;
        // If paid, clean up any duplicate orphaned PENDING mess fees non-blocking
        if (paidFee) {
            prisma.fee.deleteMany({
                where: { studentId, type: "MESS_FEE", status: "PENDING" },
            }).catch(() => { });
        }
        // Pending fee if any
        const pendingFee = !paidFee ? fees.find((f) => f.status === "PENDING") : null;
        return {
            annualAmount: amounts.veg,
            amounts,
            isPaid: !!paidFee,
            paidAt: paidFee?.paidAt || null,
            mealPlan: paidFee?.mealPlan || pendingFee?.mealPlan || null,
            transactionId: paidFee?.transactionId || null,
            paymentMethod: paidFee?.paymentMethod || null,
            history: fees,
        };
    }
    // ─── Create Razorpay order ───
    async createOrder(userId, mealPlan = "VEG") {
        if (mealPlan !== "VEG" && mealPlan !== "NON_VEG") {
            throw ApiError.badRequest("Meal plan must be either 'VEG' or 'NON_VEG'");
        }
        const [studentId, amounts] = await Promise.all([
            this.studentId(userId),
            this.getAmounts(),
        ]);
        const amount = mealPlan === "NON_VEG" ? amounts.nonVeg : amounts.veg;
        const amountPaise = Math.round(amount * 100);
        if (amountPaise < 100)
            throw ApiError.badRequest("Mess fee must be at least ₹1.00");
        // Parallelize checking for already paid fee and active pending order
        const [paid, pending] = await Promise.all([
            prisma.fee.findFirst({
                where: { studentId, type: "MESS_FEE", status: "PAID" },
            }),
            prisma.fee.findFirst({
                where: { studentId, type: "MESS_FEE", status: "PENDING" },
                orderBy: { createdAt: "desc" },
            }),
        ]);
        if (paid)
            throw ApiError.conflict("Mess fee has already been paid and cannot be modified");
        // Reuse existing razorpay order ONLY if mealPlan and exact amount match
        if (pending?.razorpayOrderId &&
            pending.mealPlan === mealPlan &&
            Math.round(Number(pending.amount) * 100) === amountPaise) {
            return {
                orderId: pending.razorpayOrderId,
                amount: amountPaise,
                currency: "INR",
                keyId: env.RAZORPAY_KEY_ID,
                reused: true,
                mealPlan,
            };
        }
        // Create new Razorpay order
        const order = await razorpayClient().orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `mess_${mealPlan.toLowerCase()}_${studentId.slice(0, 15)}`,
            notes: { studentId, type: "MESS_FEE", mealPlan },
        });
        // Attach order to existing PENDING fee record if one exists, or create a new one
        if (pending) {
            await prisma.fee.update({
                where: { id: pending.id },
                data: {
                    razorpayOrderId: order.id,
                    amount,
                    mealPlan,
                },
            });
        }
        else {
            await prisma.fee.create({
                data: {
                    studentId,
                    amount,
                    type: "MESS_FEE",
                    mealPlan,
                    status: "PENDING",
                    razorpayOrderId: order.id,
                    dueDate: new Date(new Date().getFullYear(), 11, 31), // end of current year
                },
            });
        }
        return {
            orderId: order.id,
            amount: amountPaise,
            currency: "INR",
            keyId: env.RAZORPAY_KEY_ID,
            mealPlan,
        };
    }
    // ─── Verify payment (same HMAC pattern as booking.service.ts) ───
    async verifyPayment(userId, orderId, paymentId, signature) {
        const studentId = await this.studentId(userId);
        // HMAC-SHA256 verification (identical to booking.service.ts)
        if (!env.RAZORPAY_KEY_SECRET)
            throw ApiError.badRequest("Razorpay test keys are not configured");
        const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");
        const expectedBuffer = Buffer.from(expected);
        const signatureBuffer = Buffer.from(signature);
        if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
            throw ApiError.badRequest("Payment signature verification failed");
        }
        // Parallelize checking for existing idempotent payment, targeted pending order, and alreadyPaid guard
        const [existing, fee, alreadyPaid] = await Promise.all([
            prisma.fee.findFirst({
                where: { transactionId: paymentId, type: "MESS_FEE", status: "PAID" },
            }),
            prisma.fee.findFirst({
                where: { studentId, razorpayOrderId: orderId, type: "MESS_FEE", status: "PENDING" },
            }),
            prisma.fee.findFirst({
                where: { studentId, type: "MESS_FEE", status: "PAID" },
            }),
        ]);
        if (existing) {
            // Clean up any remaining orphaned pending mess fee records non-blocking
            prisma.fee.deleteMany({
                where: { studentId, type: "MESS_FEE", status: "PENDING" },
            }).catch(() => { });
            return existing;
        }
        if (!fee)
            throw ApiError.badRequest("No pending mess fee found for this order");
        if (alreadyPaid) {
            prisma.fee.deleteMany({
                where: { studentId, type: "MESS_FEE", status: "PENDING" },
            }).catch(() => { });
            throw ApiError.conflict("Mess fee has already been paid");
        }
        // Mark as paid - mealPlan was assigned during order creation, fallback to VEG if somehow null
        const finalMealPlan = fee.mealPlan || "VEG";
        const updatedFee = await prisma.fee.update({
            where: { id: fee.id },
            data: {
                status: "PAID",
                mealPlan: finalMealPlan,
                transactionId: paymentId,
                paymentMethod: "RAZORPAY",
                paidAt: new Date(),
            },
        });
        // Clean up any other leftover orphaned PENDING mess fee records non-blocking
        prisma.fee.deleteMany({
            where: {
                studentId,
                type: "MESS_FEE",
                status: "PENDING",
                id: { not: updatedFee.id },
            },
        }).catch(() => { });
        // Trigger PDF generation and Resend email delivery (non-blocking, fail-safe)
        receiptService.processReceiptAndEmail(updatedFee.id, paymentId).catch((err) => {
            console.error("[MessFeeService] Failed to send receipt email:", err);
        });
        return updatedFee;
    }
}
export const messFeeService = new MessFeeService();
//# sourceMappingURL=mess-fee.service.js.map