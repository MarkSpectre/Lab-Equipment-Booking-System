import { prisma } from "../config/prisma.js";

export const requestModel = {
  create(data) {
    return prisma.request.create({ data });
  },
  findAll() {
    return prisma.request.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        equipment: {
          include: {
            lab: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });
  },
  findByUser(userId) {
    return prisma.request.findMany({
      where: { userId },
      include: {
        equipment: {
          include: {
            lab: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });
  },
  findById(id) {
    return prisma.request.findUnique({
      where: { id },
      include: {
        user: true,
        equipment: {
          include: {
            lab: true,
          },
        },
      },
    });
  },
  updateById(id, data) {
    return prisma.request.update({ where: { id }, data });
  },
};
