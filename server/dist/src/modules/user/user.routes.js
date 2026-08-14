import { Router } from "express";
import { userController } from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
const router = Router();
router.use(authenticate);
router.get("/users", authorize("ADMIN", "WARDEN"), userController.getUsers);
router.get("/users/:id", userController.getUserById);
router.post("/users", authorize("ADMIN"), userController.createUser);
router.patch("/users/:id", userController.updateUser);
router.get("/students", authorize("ADMIN", "WARDEN"), userController.getStudents);
router.get("/students/me", authorize("STUDENT"), userController.getCurrentStudent);
router.post("/students/me/profile", authorize("STUDENT"), userController.createCurrentStudentProfile);
router.post("/students", authorize("ADMIN"), userController.createStudent);
router.post("/students/:userId/profile", authorize("ADMIN"), userController.createStudentProfile);
router.get("/wardens", authorize("ADMIN"), userController.getWardens);
export default router;
//# sourceMappingURL=user.routes.js.map