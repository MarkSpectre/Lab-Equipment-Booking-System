import { prisma } from "../config/prisma.js";
import { requestModel } from "../models/requestModel.js";
import { sendRequestApprovedNotification } from "./notificationService.js";

export async function createBorrowRequest({ userId, equipmentId, dueDate }) {
  if (!equipmentId) {
    const error = new Error("equipmentId is required.");
    error.statusCode = 400;
    throw error;
  }

  const resolvedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
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

    const request = await tx.request.create({
      data: {
        userId,
        equipmentId,
        dueDate: resolvedDueDate,
        status: "PENDING",
      },
      include: {
        equipment: {
          include: {
            lab: true,
          },
        },
      },
    });

    await tx.equipment.update({
      where: { id: equipmentId },
      data: { availableUnits: { decrement: 1 } },
    });

    return request;
  });
}

export async function listRequests(user) {
  if (String(user.role).toUpperCase() === "ADMIN") {
    return requestModel.findAll();
  }

  return requestModel.findByUser(user.id);
}

export async function updateRequestStatus(requestId, status) {
  const nextStatus = String(status || "").toUpperCase();

  if (!["APPROVED", "REJECTED", "RETURNED"].includes(nextStatus)) {
    const error = new Error("status must be APPROVED, REJECTED or RETURNED.");
    error.statusCode = 400;
    throw error;
  }

  const request = await requestModel.findById(requestId);

  if (!request) {
    const error = new Error("Request not found.");
    error.statusCode = 404;
    throw error;
  }

  const updated = await requestModel.updateById(requestId, { status: nextStatus });

  if (nextStatus === "APPROVED") {
    await sendRequestApprovedNotification({
      studentName: request.user.name,
      studentEmail: request.user.email,
      equipmentName: request.equipment.name,
      dueDate: request.dueDate || new Date(),
    });
  }

  if (nextStatus === "REJECTED" && request.status === "PENDING") {
    await prisma.equipment.update({
      where: { id: request.equipmentId },
      data: { availableUnits: { increment: 1 } },
    });
  }

  if (nextStatus === "RETURNED") {
    await prisma.equipment.update({
      where: { id: request.equipmentId },
      data: { availableUnits: { increment: 1 } },
    });
  }

  return updated;
}
