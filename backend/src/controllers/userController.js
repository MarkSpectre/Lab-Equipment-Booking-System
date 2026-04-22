import { userModel } from "../models/userModel.js";
import { subscribeUser } from "../services/snsService.js";

/**
 * GET /api/users/me
 * Returns the current user's profile including notificationEmail.
 */
export async function getMe(req, res, next) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            notificationEmail: user.notificationEmail ?? null,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/users/me/notification-email
 * Body: { notificationEmail: "student@gmail.com" }
 *
 * Saves the notification email to the DB, then calls SNS SubscribeCommand
 * so AWS sends a confirmation email to that address.
 */
export async function setNotificationEmail(req, res, next) {
    try {
        const { notificationEmail } = req.body;

        if (!notificationEmail || typeof notificationEmail !== "string") {
            return res.status(400).json({ message: "notificationEmail is required." });
        }

        const trimmed = notificationEmail.trim().toLowerCase();

        // 1. Persist to DB
        const updated = await userModel.updateNotificationEmail(req.user.id, trimmed);

        // 2. Subscribe to SNS topic with student filter policy (non-fatal)
        try {
            await subscribeUser(trimmed, req.user.role);
        } catch (snsErr) {
            console.error("[SNS] Subscription failed:", snsErr?.message ?? snsErr);
            // Do not block — return success with a warning flag
            return res.json({ ...updated, snsWarning: "Subscription request failed; check AWS config." });
        }

        res.json(updated);
    } catch (error) {
        next(error);
    }
}