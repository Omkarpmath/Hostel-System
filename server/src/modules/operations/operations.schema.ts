import { z } from "zod";

export const allocationSchema = z.object({ body: z.object({ studentId: z.string().uuid(), roomId: z.string().uuid(), bedNumber: z.number().int().positive().optional() }) });
export const leaveSchema = z.object({ body: z.object({ type: z.enum(["HOME_LEAVE", "MEDICAL", "EMERGENCY", "OTHER"]).optional(), reason: z.string().min(3), fromDate: z.coerce.date(), toDate: z.coerce.date() }).refine((d) => d.toDate >= d.fromDate, { message: "End date must be on or after start date", path: ["toDate"] }) });
export const leaveStatusSchema = z.object({ body: z.object({ status: z.enum(["APPROVED", "REJECTED"]), rejectionReason: z.string().min(3).optional() }).superRefine((d, ctx) => { if (d.status === "REJECTED" && !d.rejectionReason) ctx.addIssue({ code: "custom", message: "A rejection reason is required", path: ["rejectionReason"] }); }) });
export const complaintSchema = z.object({ body: z.object({ title: z.string().min(3), description: z.string().min(5), category: z.enum(["ELECTRICAL", "PLUMBING", "FURNITURE", "CLEANING", "NETWORK", "OTHER"]).optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional() }) });
export const complaintStatusSchema = z.object({ body: z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]), resolution: z.string().min(3).optional() }) });
export const visitorSchema = z.object({ body: z.object({ visitorName: z.string().min(2), visitorPhone: z.string().min(6), relationship: z.string().min(2), purpose: z.string().min(3), idProofType: z.string().optional(), idProofNumber: z.string().optional() }) });
