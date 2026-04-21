import { Router } from "express";
import { getAdminSummary, getEquipmentUsage, getMissingInventoryAnalytics } from "../controllers/labController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/analytics/summary", requireRole("ADMIN"), getAdminSummary);
router.get("/analytics/missing", requireRole("ADMIN"), getMissingInventoryAnalytics);
router.get("/equipment/:id/usage", requireRole("ADMIN"), getEquipmentUsage);

export default router;
