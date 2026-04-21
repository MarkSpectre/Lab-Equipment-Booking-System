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
  /** Persist the student's personal notification email */
  updateNotificationEmail(id, notificationEmail) {
    return prisma.user.update({
      where: { id },
      data: { notificationEmail },
      select: { id: true, name: true, email: true, notificationEmail: true, role: true },
    });
  },
};
