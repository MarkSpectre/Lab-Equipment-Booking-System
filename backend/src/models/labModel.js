import { prisma } from "../config/prisma.js";

export const labModel = {
  findAllWithEquipmentCount() {
    return prisma.lab.findMany({
      include: {
        _count: {
          select: {
            equipment: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },
  findById(labId) {
    return prisma.lab.findUnique({ where: { id: labId } });
  },
  findInventoryByLabId(labId) {
    return prisma.equipment.findMany({
      where: { labId },
      include: {
        lab: true,
      },
      orderBy: { name: "asc" },
    });
  },
};
