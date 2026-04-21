import { Router } from "express";
import {
  createLabInventoryItem,
  deleteLabInventoryItem,
  getLabInventory,
  getLabs,
  getMissingInventoryAnalytics,
} from "../controllers/labController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getLabs);
router.get("/:id/equipment", getLabInventory);
router.get("/:id/inventory", getLabInventory);
router.post("/:id/equipment", requireRole("ADMIN"), createLabInventoryItem);
router.post("/:id/inventory", requireRole("ADMIN"), createLabInventoryItem);
router.delete("/:id/equipment/:equipmentId", requireRole("ADMIN"), deleteLabInventoryItem);
router.delete("/:id/inventory/:equipmentId", requireRole("ADMIN"), deleteLabInventoryItem);
router.get("/analytics/missing", requireRole("ADMIN"), getMissingInventoryAnalytics);

export default router;
