import { prisma } from "../config/prisma.js";

export const userModel = {
  create(data) {
    return prisma.user.create({ data });
  },
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },
};
