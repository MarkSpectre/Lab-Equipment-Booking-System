import { Router } from "express";
import { addEquipment, deleteEquipment, getEquipment } from "../controllers/equipmentController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getEquipment);
router.post("/", requireRole("ADMIN"), addEquipment);
router.delete("/:id", requireRole("ADMIN"), deleteEquipment);

export default router;
