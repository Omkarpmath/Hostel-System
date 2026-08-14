import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodDefault<z.ZodEnum<["STUDENT", "ADMIN", "WARDEN", "ACCOUNTANT", "SECURITY"]>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        role: "STUDENT" | "ADMIN" | "WARDEN" | "ACCOUNTANT" | "SECURITY";
        firstName: string;
        lastName: string;
        password: string;
        phone?: string | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        role?: "STUDENT" | "ADMIN" | "WARDEN" | "ACCOUNTANT" | "SECURITY" | undefined;
        phone?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        role: "STUDENT" | "ADMIN" | "WARDEN" | "ACCOUNTANT" | "SECURITY";
        firstName: string;
        lastName: string;
        password: string;
        phone?: string | undefined;
    };
}, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        role?: "STUDENT" | "ADMIN" | "WARDEN" | "ACCOUNTANT" | "SECURITY" | undefined;
        phone?: string | undefined;
    };
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        newPassword: string;
    }, {
        email: string;
        newPassword: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        newPassword: string;
    };
}, {
    body: {
        email: string;
        newPassword: string;
    };
}>;
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
//# sourceMappingURL=auth.schema.d.ts.map