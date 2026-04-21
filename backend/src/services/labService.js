import { prisma } from "../config/prisma.js";
import { labModel } from "../models/labModel.js";

const ACTIVE_BORROWING_STATUSES = ["APPROVED"];

export async function listLabs() {
  const labs = await labModel.findAllWithEquipmentCount();

  return labs.map((lab) => ({
    id: lab.id,
    name: lab.name,
    room: lab.room,
    supervisor: lab.supervisor,
    equipmentCount: lab._count.equipment,
  }));
}

export async function getLabEquipment(labId) {
  const lab = await labModel.findById(labId);
  if (!lab) {
    const error = new Error("Lab not found.");
    error.statusCode = 404;
    throw error;
  }

  const equipmentList = await prisma.equipment.findMany({
    where: { labId },
    include: {
      lab: true,
      requests: true,
    },
    orderBy: { name: "asc" },
  });

  return equipmentList.map((item) => {
    const activeBorrowings = item.requests.filter((request) => request.status === "APPROVED").length;
    const missingUnits = Math.max(0, item.totalUnits - item.availableUnits - activeBorrowings);
    const totalTimesBorrowed = item.requests.filter((request) => request.status !== "REJECTED").length;
    const usagePercentage = item.totalUnits > 0 ? Number(((totalTimesBorrowed / item.totalUnits) * 100).toFixed(1)) : 0;

    return {
      id: item.id,
      labId: item.labId,
      name: item.name,
      description: item.description,
      category: item.category,
      totalUnits: item.totalUnits,
      availableUnits: item.availableUnits,
      status: item.status,
      conditionNote: item.conditionNote,
      lab: item.lab,
      activeBorrowings,
      missingUnits,
      usagePercentage,
      totalTimesBorrowed,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });
}

export async function getLabInventory(labId) {
  return getLabEquipment(labId);
}

export async function addLabEquipment(labId, payload) {
  const lab = await labModel.findById(labId);
  if (!lab) {
    const error = new Error("Lab not found.");
    error.statusCode = 404;
    throw error;
  }

  const { name, description, category, totalUnits, availableUnits, status, conditionNote } = payload;

  if (!name || !category || Number(totalUnits) < 1) {
    const error = new Error("name, category and totalUnits are required.");
    error.statusCode = 400;
    throw error;
  }

  const total = Number(totalUnits);
  const available = availableUnits !== undefined && availableUnits !== null ? Number(availableUnits) : total;

  if (available < 0 || available > total) {
    const error = new Error("availableUnits must be between 0 and totalUnits.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.equipment.create({
    data: {
      labId,
      name,
      description,
      category,
      totalUnits: total,
      availableUnits: available,
      status: status || "FUNCTIONAL",
      conditionNote,
    },
  });
}

export async function deleteLabEquipment(labId, equipmentId) {
  const equipment = await prisma.equipment.findFirst({ where: { id: equipmentId, labId } });

  if (!equipment) {
    const error = new Error("Equipment not found in this lab.");
    error.statusCode = 404;
    throw error;
  }

  await prisma.equipment.delete({ where: { id: equipmentId } });
}

export async function getMissingAnalytics() {
  const equipment = await prisma.equipment.findMany({
    include: {
      lab: true,
      requests: {
        where: {
          status: { in: ACTIVE_BORROWING_STATUSES },
        },
      },
    },
    orderBy: [{ lab: { name: "asc" } }, { name: "asc" }],
  });

  return equipment.map((item) => {
    const activeBorrowings = item.requests.length;
    const missingCount = Math.max(0, item.totalUnits - item.availableUnits - activeBorrowings);

    return {
      equipmentId: item.id,
      equipmentName: item.name,
      labId: item.labId,
      labName: item.lab.name,
      status: item.status,
      conditionNote: item.conditionNote,
      totalUnits: item.totalUnits,
      availableUnits: item.availableUnits,
      activeBorrowings,
      missingCount,
    };
  });
}

export async function getAdminSummaryAnalytics() {
  const [equipment, activeBorrowings] = await Promise.all([
    prisma.equipment.findMany(),
    prisma.request.count({
      where: {
        status: "APPROVED",
      },
    }),
  ]);

  const totalInventoryValue = equipment.reduce((sum, item) => sum + item.totalUnits, 0);
  const missingItemsCount = equipment.reduce((sum, item) => sum + Math.max(0, item.totalUnits - item.availableUnits), 0);

  return {
    totalInventoryValue,
    missingItemsCount,
    activeBorrowings,
  };
}

export async function getEquipmentUsageAnalytics(equipmentId) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      lab: true,
      requests: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
      },
    },
  });

  if (!equipment) {
    const error = new Error("Equipment not found.");
    error.statusCode = 404;
    throw error;
  }

  const totalTimesBorrowed = equipment.requests.filter((request) => request.status !== "REJECTED").length;

  const userFrequencyMap = new Map();
  for (const request of equipment.requests) {
    const key = request.user.id;
    if (!userFrequencyMap.has(key)) {
      userFrequencyMap.set(key, {
        userId: request.user.id,
        name: request.user.name,
        email: request.user.email,
        borrowCount: 0,
      });
    }

    userFrequencyMap.get(key).borrowCount += 1;
  }

  const frequentUsers = Array.from(userFrequencyMap.values()).sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 5);

  const durationHours = equipment.requests
    .filter((request) => request.status === "RETURNED")
    .map((request) => {
      const durationMs = new Date(request.updatedAt).getTime() - new Date(request.requestedAt).getTime();
      return Math.max(0, durationMs / (1000 * 60 * 60));
    });

  const averageBorrowingDuration =
    durationHours.length > 0 ? Number((durationHours.reduce((sum, item) => sum + item, 0) / durationHours.length).toFixed(2)) : 0;

  const borrowingHistory = equipment.requests.map((request) => ({
    requestId: request.id,
    status: request.status,
    requestedAt: request.requestedAt,
    dueDate: request.dueDate,
    user: request.user,
  }));

  return {
    equipment: {
      id: equipment.id,
      name: equipment.name,
      labName: equipment.lab.name,
      totalUnits: equipment.totalUnits,
      availableUnits: equipment.availableUnits,
    },
    totalTimesBorrowed,
    mostFrequentUsers: frequentUsers,
    averageBorrowingDuration,
    borrowingHistory,
  };
}
