import { Router } from "express";
import { getMe, setNotificationEmail } from "../controllers/userController.js";

const router = Router();

// GET  /api/users/me                  → current user profile (includes notificationEmail)
router.get("/me", getMe);

// PATCH /api/users/me/notification-email → save + subscribe notification email
router.patch("/me/notification-email", setNotificationEmail);

// PATCH /api/users/profile → profile update alias used by frontend settings page
router.patch("/profile", setNotificationEmail);

export default router;