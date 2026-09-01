import { z } from "zod";
export declare const createAnnouncementSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        title: z.ZodString;
        message: z.ZodString;
        priority: z.ZodDefault<z.ZodEnum<["NORMAL", "IMPORTANT", "URGENT"]>>;
        targetAudience: z.ZodDefault<z.ZodEnum<["ALL_HOSTELS", "SPECIFIC_HOSTEL", "SPECIFIC_YEAR", "SPECIFIC_DEPARTMENT", "CUSTOM_GROUP"]>>;
        targetHostelId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        targetYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        targetDepartment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "SCHEDULED", "EXPIRED", "ARCHIVED"]>>;
        publishAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        expiresAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    }, "strip", z.ZodTypeAny, {
        status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";
        title: string;
        priority: "URGENT" | "NORMAL" | "IMPORTANT";
        message: string;
        targetAudience: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP";
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    }, {
        title: string;
        message: string;
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    }>, {
        status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";
        title: string;
        priority: "URGENT" | "NORMAL" | "IMPORTANT";
        message: string;
        targetAudience: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP";
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    }, {
        title: string;
        message: string;
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";
        title: string;
        priority: "URGENT" | "NORMAL" | "IMPORTANT";
        message: string;
        targetAudience: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP";
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    };
}, {
    body: {
        title: string;
        message: string;
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    };
}>;
export declare const updateAnnouncementSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<["NORMAL", "IMPORTANT", "URGENT"]>>;
        targetAudience: z.ZodOptional<z.ZodEnum<["ALL_HOSTELS", "SPECIFIC_HOSTEL", "SPECIFIC_YEAR", "SPECIFIC_DEPARTMENT", "CUSTOM_GROUP"]>>;
        targetHostelId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        targetYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        targetDepartment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "SCHEDULED", "EXPIRED", "ARCHIVED"]>>;
        publishAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        expiresAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    }, "strip", z.ZodTypeAny, {
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        title?: string | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        message?: string | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    }, {
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        title?: string | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        message?: string | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        title?: string | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        message?: string | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    };
}, {
    body: {
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED" | undefined;
        title?: string | undefined;
        priority?: "URGENT" | "NORMAL" | "IMPORTANT" | undefined;
        message?: string | undefined;
        targetAudience?: "ALL_HOSTELS" | "SPECIFIC_HOSTEL" | "SPECIFIC_YEAR" | "SPECIFIC_DEPARTMENT" | "CUSTOM_GROUP" | undefined;
        targetHostelId?: string | null | undefined;
        targetYear?: number | null | undefined;
        targetDepartment?: string | null | undefined;
        publishAt?: Date | null | undefined;
        expiresAt?: Date | null | undefined;
    };
}>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>["body"];
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>["body"];
//# sourceMappingURL=announcement.schema.d.ts.map