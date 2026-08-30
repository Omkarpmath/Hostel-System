import { Router } from "express";
import { attendanceController } from "./attendance.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
const router = Router();
router.use(authenticate);
// ─── Security endpoints ─────────────────────────────────────
router.post("/start", authorize("SECURITY"), attendanceController.startSession);
router.get("/active", authorize("SECURITY"), attendanceController.getActiveSession);
router.post("/scan", authorize("SECURITY"), attendanceController.scanStudent);
router.post("/end", authorize("SECURITY"), attendanceController.endSession);
// ─── Register viewing (Security, Warden, Admin) ─────────────
router.get("/register", authorize("ADMIN", "WARDEN", "SECURITY"), attendanceController.getRegister);
router.get("/register/export", authorize("ADMIN", "WARDEN"), attendanceController.exportRegisterCSV);
// ─── Admin endpoints ────────────────────────────────────────
router.get("/security-users", authorize("ADMIN"), attendanceController.listSecurityUsers);
router.post("/assign-security", authorize("ADMIN"), attendanceController.assignSecurity);
router.post("/unassign-security", authorize("ADMIN"), attendanceController.unassignSecurity);
router.get("/sessions", authorize("ADMIN", "WARDEN"), attendanceController.listSessions);
// ─── Student endpoints ──────────────────────────────────────
router.get("/my-history", authorize("STUDENT"), attendanceController.getMyHistory);
export default router;
//# sourceMappingURL=attendance.routes.js.map