import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    role: z.enum(["STUDENT", "ADMIN", "WARDEN", "ACCOUNTANT", "SECURITY"]).optional(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email address"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
