import { Router } from "express";
import { messEntryController } from "./mess-entry.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";

const router = Router();

router.use(authenticate);

// Security guard scanner endpoints
router.post("/verify", authorize("SECURITY"), messEntryController.verify);
router.get("/stats", authorize("SECURITY"), messEntryController.getStats);

// Mess list for assignment/selection dropdown
router.get("/messes", authorize("ADMIN", "WARDEN", "SECURITY"), messEntryController.listMesses);

// Admin / warden / security history endpoint
router.get("/entries", authorize("ADMIN", "WARDEN", "SECURITY"), messEntryController.getEntries);

export default router;
