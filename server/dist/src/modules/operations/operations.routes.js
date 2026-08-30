import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import { operationsController as c } from "./operations.controller.js";
import { allocationSchema, complaintStatusSchema, leaveSchema, leaveStatusSchema, visitorSchema } from "./operations.schema.js";
const router = Router();
router.use(authenticate);
// Controller methods use instance helpers, so bind them before Express invokes them.
router.get("/me/overview", authorize("STUDENT"), c.mine.bind(c));
router.get("/allocations", authorize("ADMIN", "WARDEN"), c.allocations.bind(c));
router.post("/allocations", authorize("ADMIN", "WARDEN"), validate(allocationSchema), c.allocate.bind(c));
router.get("/leaves", authorize("STUDENT", "ADMIN", "WARDEN"), c.leaves.bind(c));
router.post("/leaves", authorize("STUDENT"), validate(leaveSchema), c.createLeave.bind(c));
router.patch("/leaves/:id", authorize("WARDEN"), validate(leaveStatusSchema), c.decideLeave.bind(c));
router.get("/complaints", authorize("STUDENT", "ADMIN", "WARDEN"), c.complaints.bind(c));
router.post("/complaints", authorize("STUDENT"), upload.array("attachments", 5), c.createComplaint.bind(c));
router.patch("/complaints/:id", authorize("WARDEN"), validate(complaintStatusSchema), c.updateComplaint.bind(c));
router.get("/visitors", authorize("STUDENT", "ADMIN", "WARDEN", "SECURITY"), c.visitors.bind(c));
router.post("/visitors", authorize("STUDENT"), validate(visitorSchema), c.createVisitor.bind(c));
router.get("/fees", authorize("STUDENT", "ADMIN", "WARDEN", "ACCOUNTANT"), c.fees.bind(c));
export default router;
//# sourceMappingURL=operations.routes.js.map