import { z } from "zod";

export const updateAmountSchema = z.object({
  body: z.object({
    veg: z.number().min(1, "Veg mess fee must be at least ₹1").optional(),
    nonVeg: z.number().min(1, "Non-Veg mess fee must be at least ₹1").optional(),
    amount: z.number().min(1).optional(),
  }).refine((data) => (data.veg !== undefined && data.nonVeg !== undefined) || data.amount !== undefined, {
    message: "Must provide either { veg, nonVeg } or { amount }",
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    mealPlan: z.enum(["VEG", "NON_VEG"]).default("VEG"),
  }).optional().default({ mealPlan: "VEG" }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});
