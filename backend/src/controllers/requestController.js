import * as requestService from "../services/requestService.js";

export async function submitRequest(req, res, next) {
  try {
    const request = await requestService.createBorrowRequest({
      userId: req.user.id,
      equipmentId: req.body.equipmentId,
      dueDate: req.body.dueDate,
    });
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
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
