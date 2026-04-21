import { Router } from "express";
import {
  getRequests,
  patchRequestStatus,
  submitRequest,
} from "../controllers/requestController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getRequests);
router.post("/", submitRequest);
router.patch("/:id", requireRole("ADMIN"), patchRequestStatus);

export default router;
