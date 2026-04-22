import * as requestService from "../services/requestService.js";
import { notifyStudent, notifyAdmin } from "../services/snsService.js";

export async function createRequest(req, res, next) {
  try {
    const request = await requestService.createBorrowRequest({
      userId: req.user.id,
      studentName: req.user.name, 
      equipmentId: req.body.equipmentId,
      dueDate: req.body.dueDate,
    });

    try {
      const snsResult = await notifyAdmin(req.user.name || "A student", req.user.email, request.equipment.name);

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

export async function updateStatus(req, res, next) {
  try {
    const requestId = req.params.id;
    const { status } = req.body;
    const updated = await requestService.updateRequestStatus(requestId, status);

    const nextStatus = String(status || "").toUpperCase();

    if (nextStatus === "APPROVED" || nextStatus === "REJECTED") {
      const fullRequest = await requestService.getRequestWithRelations(requestId);

      if (!fullRequest?.user || !fullRequest?.equipment) {
        console.warn(
          `[requestController.updateStatus] Request ${requestId} missing user/equipment relation after status update.`
        );
        return res.json({ ...updated, warning: "Status updated, but email notification data is incomplete" });
      }

      const studentEmail =
        fullRequest.user.notificationEmail?.trim() ||
        fullRequest.user.email?.trim();

      if (!studentEmail) {
        console.warn(
          `[requestController.updateStatus] Request ${fullRequest.id} has no notificationEmail or login email; skipping SNS publish.`
        );
        return res.json({
          ...updated,
          warning:
            "Status updated, but no student email is configured for notifications",
        });
      }

      const friendlyStatus = nextStatus === "APPROVED" ? "Approved" : "Rejected";

      try {
        const snsResult = await notifyStudent(
          studentEmail,
          fullRequest.user?.name || "Student",
          fullRequest.equipment.name,
          friendlyStatus
        );

        if (snsResult && !snsResult.success) {
          return res.json({ ...updated, warning: "Status updated, but email notification failed" });
        }
      } catch (snsError) {
        console.error(
          `[requestController.updateStatus] SNS publish failed for request ${fullRequest.id}:`,
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

// Backward-compatible naming aliases
export const submitRequest = createRequest;
export const patchRequestStatus = updateStatus;
