import { z } from "zod";

export const updateAmountSchema = z.object({
  body: z.object({
    amount: z.number().min(1, "Mess fee must be at least ₹1"),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});
