import { Router } from "express";
import { getMe, setNotificationEmail } from "../controllers/userController.js";

const router = Router();

// GET  /api/users/me                  → current user profile (includes notificationEmail)
router.get("/me", getMe);

// PATCH /api/users/me/notification-email → save + subscribe notification email
router.patch("/me/notification-email", setNotificationEmail);

export default router;
