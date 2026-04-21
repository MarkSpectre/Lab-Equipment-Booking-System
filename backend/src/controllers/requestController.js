import * as requestService from "../services/requestService.js";
import { adminAttributes, notify, studentAttributes } from "../services/snsService.js";

export async function submitRequest(req, res, next) {
  try {
    const request = await requestService.createBorrowRequest({
      userId: req.user.id,
      studentName: req.user.name, 
      equipmentId: req.body.equipmentId,
      dueDate: req.body.dueDate,
    });

    const snsResult = await notify(
      `Student ${req.user.name || "A student"} has requested "${request.equipment.name}". Please review in the Admin Dashboard.`,
      `New Lab Request: ${request.equipment.name}`,
      adminAttributes()
    );

    if (snsResult && !snsResult.success) {
      return res.status(201).json({ ...request, warning: "Request saved, but email notification failed" });
    }

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    const requests = await requestService.listRequests(req.user);
    res.json(requests);
  } catch (error) {
    next(error);
  }
}

export async function patchRequestStatus(req, res, next) {
  try {
    const requestId = req.params.id;
    const { status } = req.body;
    const updated = await requestService.updateRequestStatus(requestId, status);

    const nextStatus = String(status || "").toUpperCase();

    if (nextStatus === "APPROVED" && updated?.user && updated?.equipment) {
      const notificationEmail = updated.user.notificationEmail?.trim();

      if (!notificationEmail) {
        console.warn(
          `[requestController.patchRequestStatus] Approved request ${updated.id} has no notificationEmail; skipping SNS publish.`
        );
        return res.json({
          ...updated,
          warning:
            "Status updated, but no notification email is configured for this student",
        });
      }

      const snsResult = await notify(
        `Your request for "${updated.equipment.name}" is approved. Pick it up from the lab.`,
        "Equipment Approved!",
        studentAttributes(notificationEmail)
      );

      if (snsResult && !snsResult.success) {
        return res.json({ ...updated, warning: "Status updated, but email notification failed" });
      }
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}
