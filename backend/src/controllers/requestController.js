import * as requestService from "../services/requestService.js";
import {
  adminAttributes,
  publishNotification,
  sendApprovalNotification,
} from "../services/snsService.js";

export async function submitRequest(req, res, next) {
  try {
    const request = await requestService.createBorrowRequest({
      userId: req.user.id,
      studentName: req.user.name, 
      equipmentId: req.body.equipmentId,
      dueDate: req.body.dueDate,
    });

    try {
      const snsResult = await publishNotification(
        `Student ${req.user.name || "A student"} has requested "${request.equipment.name}". Please review in the Admin Dashboard.`,
        `New Lab Request: ${request.equipment.name}`,
        adminAttributes()
      );

      if (snsResult && !snsResult.success) {
        return res
          .status(201)
          .json({ ...request, warning: "Request saved, but email notification failed" });
      }
    } catch (snsError) {
      console.error("[requestController.submitRequest] SNS publish failed:", snsError?.message || snsError);
      return res
        .status(201)
        .json({ ...request, warning: "Request saved, but email notification failed" });
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

    if (nextStatus === "APPROVED") {
      const approvedRequest = await requestService.getRequestWithRelations(requestId);

      if (!approvedRequest?.user || !approvedRequest?.equipment) {
        console.warn(
          `[requestController.patchRequestStatus] Request ${requestId} missing user/equipment relation after approval update.`
        );
        return res.json({ ...updated, warning: "Status updated, but email notification data is incomplete" });
      }

      const studentEmail =
        approvedRequest.user.notificationEmail?.trim() ||
        approvedRequest.user.email?.trim();

      if (!studentEmail) {
        console.warn(
          `[requestController.patchRequestStatus] Approved request ${approvedRequest.id} has no notificationEmail or login email; skipping SNS publish.`
        );
        return res.json({
          ...updated,
          warning:
            "Status updated, but no student email is configured for notifications",
        });
      }

      try {
        const snsResult = await sendApprovalNotification(
          approvedRequest.user,
          approvedRequest.equipment.name
        );

        if (snsResult && !snsResult.success) {
          return res.json({ ...updated, warning: "Status updated, but email notification failed" });
        }
      } catch (snsError) {
        console.error(
          `[requestController.patchRequestStatus] SNS publish failed for request ${approvedRequest.id}:`,
          snsError?.message || snsError
        );
        return res.json({ ...updated, warning: "Status updated, but email notification failed" });
      }
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Backward-compatible naming alias
export const updateStatus = patchRequestStatus;
