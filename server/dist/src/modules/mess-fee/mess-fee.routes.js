import { Router } from "express";
import { messFeeController } from "./mess-fee.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateAmountSchema, verifyPaymentSchema } from "./mess-fee.schema.js";
const router = Router();
router.use(authenticate);
// Anyone authenticated can view the mess fee amount
router.get("/amount", messFeeController.getAmount);
// Admin can update the amount
router.put("/amount", authorize("ADMIN"), validate(updateAmountSchema), messFeeController.updateAmount);
// Student endpoints
router.get("/my-status", authorize("STUDENT"), messFeeController.getMyStatus);
router.post("/create-order", authorize("STUDENT"), messFeeController.createOrder);
router.post("/verify-payment", authorize("STUDENT"), validate(verifyPaymentSchema), messFeeController.verifyPayment);
export default router;
//# sourceMappingURL=mess-fee.routes.js.map