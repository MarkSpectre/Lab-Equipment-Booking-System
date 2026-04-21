import { prisma } from "../config/prisma.js";

export const equipmentModel = {
  findAll() {
    return prisma.equipment.findMany({
      include: {
        lab: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  create(data) {
    return prisma.equipment.create({ data });
  },
  deleteById(id) {
    return prisma.equipment.delete({ where: { id } });
  },
  findById(id) {
    return prisma.equipment.findUnique({ where: { id } });
  },
};
