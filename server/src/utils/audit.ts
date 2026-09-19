import { prisma } from "../config/db.js";
import { Role } from "@prisma/client";

export interface LogAuditOptions {
  actorId: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string;
}

/**
 * Centrally and asynchronously records an immutable institutional audit log entry.
 * Errors are caught and logged so audit logging never crashes the primary transaction.
 */
export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actorId,
        actorRole: options.actorRole,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        details: options.details ? JSON.parse(JSON.stringify(options.details)) : undefined,
        ipAddress: options.ipAddress,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to record audit log:", error);
  }
}
