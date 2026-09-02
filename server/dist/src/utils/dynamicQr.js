import crypto from "crypto";
import { env } from "../config/env.js";
// Strict 30 seconds rotation with zero grace period so screenshots expire immediately upon rotation
export const QR_ROTATION_INTERVAL_SECONDS = 30;
export const QR_GRACE_PERIOD_SECONDS = 0;
/**
 * Generate a cryptographically signed, short-lived Dynamic QR token.
 * Output format: DQR_<base64url(payload)>.<base64url(signature)>
 */
export function generateDynamicQrToken(student) {
    const now = Date.now();
    const exp = now + QR_ROTATION_INTERVAL_SECONDS * 1000;
    const nonce = crypto.randomBytes(6).toString("hex");
    const payload = {
        sid: student.id,
        usn: student.usn,
        uid: student.userId,
        iat: now,
        exp,
        n: nonce,
    };
    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString("base64url");
    const signature = crypto
        .createHmac("sha256", env.JWT_ACCESS_SECRET)
        .update(payloadBase64)
        .digest("base64url");
    const token = `DQR_${payloadBase64}.${signature}`;
    return {
        token,
        expiresInSeconds: QR_ROTATION_INTERVAL_SECONDS,
        expiresAt: new Date(exp),
    };
}
/**
 * Verify a token string (verifies signature, expiration, and ensures dynamic token integrity).
 */
export function verifyQrToken(rawToken) {
    if (!rawToken || typeof rawToken !== "string") {
        return { valid: false, isDynamic: false, error: "INVALID", message: "Missing QR code token" };
    }
    const token = rawToken.trim();
    // 1. Dynamic QR Token validation
    if (token.startsWith("DQR_")) {
        const withoutPrefix = token.slice(4);
        const parts = withoutPrefix.split(".");
        if (parts.length !== 2) {
            return { valid: false, isDynamic: true, error: "INVALID", message: "Malformed dynamic QR token" };
        }
        const [payloadBase64, providedSignature] = parts;
        // Verify HMAC-SHA256 signature
        const expectedSignature = crypto
            .createHmac("sha256", env.JWT_ACCESS_SECRET)
            .update(payloadBase64)
            .digest("base64url");
        const expectedBuffer = Buffer.from(expectedSignature);
        const providedBuffer = Buffer.from(providedSignature);
        if (expectedBuffer.length !== providedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
            return { valid: false, isDynamic: true, error: "TAMPERED", message: "QR token signature verification failed" };
        }
        // Decode payload
        try {
            const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
            const payload = JSON.parse(payloadJson);
            const now = Date.now();
            const issuedAt = new Date(payload.iat);
            const expiresAt = new Date(payload.exp);
            if (now > payload.exp) {
                return {
                    valid: false,
                    isDynamic: true,
                    error: "EXPIRED",
                    message: "QR code has expired. Please scan the live QR code on the student's screen.",
                    issuedAt,
                    expiresAt,
                };
            }
            return {
                valid: true,
                isDynamic: true,
                studentProfileId: payload.sid,
                usn: payload.usn,
                userId: payload.uid,
                issuedAt,
                expiresAt,
            };
        }
        catch {
            return { valid: false, isDynamic: true, error: "INVALID", message: "Invalid payload in dynamic QR token" };
        }
    }
    // 2. Reject legacy static tokens to enforce dynamic rotating protection
    return {
        valid: false,
        isDynamic: false,
        error: "EXPIRED",
        message: "This QR code is static or expired. Please display the live dynamic QR on the student dashboard.",
    };
}
//# sourceMappingURL=dynamicQr.js.map