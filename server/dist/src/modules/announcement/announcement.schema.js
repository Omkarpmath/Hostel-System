import { z } from "zod";
export const createAnnouncementSchema = z.object({
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title cannot exceed 200 characters"),
        message: z.string().min(5, "Message must be at least 5 characters"),
        priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
        targetAudience: z.enum([
            "ALL_HOSTELS",
            "SPECIFIC_HOSTEL",
            "SPECIFIC_YEAR",
            "SPECIFIC_DEPARTMENT",
            "CUSTOM_GROUP",
        ]).default("ALL_HOSTELS"),
        targetHostelId: z.string().uuid("Invalid hostel ID").optional().nullable(),
        targetYear: z.number().int().min(1).max(4).optional().nullable(),
        targetDepartment: z.string().optional().nullable(),
        status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "EXPIRED", "ARCHIVED"]).default("PUBLISHED"),
        publishAt: z.coerce.date().optional().nullable(),
        expiresAt: z.coerce.date().optional().nullable(),
    }).refine((data) => {
        if (data.publishAt && data.expiresAt) {
            return data.expiresAt > data.publishAt;
        }
        return true;
    }, {
        message: "Expiration date must be after publish date",
        path: ["expiresAt"],
    }),
});
export const updateAnnouncementSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        message: z.string().min(5).optional(),
        priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional(),
        targetAudience: z.enum([
            "ALL_HOSTELS",
            "SPECIFIC_HOSTEL",
            "SPECIFIC_YEAR",
            "SPECIFIC_DEPARTMENT",
            "CUSTOM_GROUP",
        ]).optional(),
        targetHostelId: z.string().uuid().optional().nullable(),
        targetYear: z.number().int().min(1).max(4).optional().nullable(),
        targetDepartment: z.string().optional().nullable(),
        status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "EXPIRED", "ARCHIVED"]).optional(),
        publishAt: z.coerce.date().optional().nullable(),
        expiresAt: z.coerce.date().optional().nullable(),
    }),
});
//# sourceMappingURL=announcement.schema.js.map