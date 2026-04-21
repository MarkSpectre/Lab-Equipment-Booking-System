import { prisma } from "../config/prisma.js";
import { requestModel } from "../models/requestModel.js";
// ─── Create a new borrow request ──────────────────────────────────────────
export async function createBorrowRequest({ userId, equipmentId, dueDate, studentName }) {
  if (!equipmentId) {
    const error = new Error("equipmentId is required.");
    error.statusCode = 400;
    throw error;
  }

  const resolvedDueDate = dueDate
    ? new Date(dueDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const request = await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.findUnique({ where: { id: equipmentId } });

    if (!equipment) {
      const error = new Error("Equipment not found.");
      error.statusCode = 404;
      throw error;
    }

    if (equipment.availableUnits < 1) {
      const error = new Error("This equipment is out of stock.");
      error.statusCode = 409;
      throw error;
    }

    if (equipment.status !== "FUNCTIONAL") {
      const error = new Error("This equipment is not available for borrowing right now.");
      error.statusCode = 409;
      throw error;
    }

    const created = await tx.request.create({
      data: {
        userId,
        equipmentId,
        dueDate: resolvedDueDate,
        status: "PENDING",
      },
      include: {
        equipment: { include: { lab: true } },
      },
    });

    await tx.equipment.update({
      where: { id: equipmentId },
      data: { availableUnits: { decrement: 1 } },
    });

    return created;
  });

  return request;
}

// ─── List requests (admin sees all, student sees own) ─────────────────────
export async function listRequests(user) {
  if (String(user.role).toUpperCase() === "ADMIN") {
    return requestModel.findAll();
  }
  return requestModel.findByUser(user.id);
}

// ─── Update request status ────────────────────────────────────────────────
export async function updateRequestStatus(requestId, status) {
  const nextStatus = String(status || "").toUpperCase();

  if (!["APPROVED", "REJECTED", "RETURNED"].includes(nextStatus)) {
    const error = new Error("status must be APPROVED, REJECTED or RETURNED.");
    error.statusCode = 400;
    throw error;
  }

  // Fetch full request with user (for notificationEmail) and equipment
  const request = await requestModel.findById(requestId);

  if (!request) {
    const error = new Error("Request not found.");
    error.statusCode = 404;
    throw error;
  }

  // ── DB update (always happens first; SNS is a side-effect) ───────────────
  const updated = await requestModel.updateById(requestId, { status: nextStatus });

  // ── Restore stock on REJECTED (only if still PENDING) ────────────────────
  if (nextStatus === "REJECTED" && request.status === "PENDING") {
    await prisma.equipment.update({
      where: { id: request.equipmentId },
      data: { availableUnits: { increment: 1 } },
    });
  }

  // ── Restore stock on RETURNED ─────────────────────────────────────────────
  if (nextStatus === "RETURNED") {
    await prisma.equipment.update({
      where: { id: request.equipmentId },
      data: { availableUnits: { increment: 1 } },
    });
  }

  return updated;
}
