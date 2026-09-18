import { z } from "zod";
export declare const updateAmountSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        veg: z.ZodOptional<z.ZodNumber>;
        nonVeg: z.ZodOptional<z.ZodNumber>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amount?: number | undefined;
        veg?: number | undefined;
        nonVeg?: number | undefined;
    }, {
        amount?: number | undefined;
        veg?: number | undefined;
        nonVeg?: number | undefined;
    }>, {
        amount?: number | undefined;
        veg?: number | undefined;
        nonVeg?: number | undefined;
    }, {
        amount?: number | undefined;
        veg?: number | undefined;
        nonVeg?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        amount?: number | undefined;
        veg?: number | undefined;
        nonVeg?: number | undefined;
    };
}, {
    body: {
        amount?: number | undefined;
        veg?: number | undefined;
        nonVeg?: number | undefined;
    };
}>;
export declare const createOrderSchema: z.ZodObject<{
    body: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        mealPlan: z.ZodDefault<z.ZodEnum<["VEG", "NON_VEG"]>>;
    }, "strip", z.ZodTypeAny, {
        mealPlan: "VEG" | "NON_VEG";
    }, {
        mealPlan?: "VEG" | "NON_VEG" | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    body: {
        mealPlan: "VEG" | "NON_VEG";
    };
}, {
    body?: {
        mealPlan?: "VEG" | "NON_VEG" | undefined;
    } | undefined;
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        razorpayOrderId: z.ZodString;
        razorpayPaymentId: z.ZodString;
        razorpaySignature: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }, {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    };
}, {
    body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    };
}>;
//# sourceMappingURL=mess-fee.schema.d.ts.map