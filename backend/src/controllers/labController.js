import * as labService from "../services/labService.js";

export async function getLabs(req, res, next) {
  try {
    const labs = await labService.listLabs();
    res.json(labs);
  } catch (error) {
    next(error);
  }
}

export async function getLabInventory(req, res, next) {
  try {
    const inventory = await labService.getLabEquipment(req.params.id);
    res.json(inventory);
  } catch (error) {
    next(error);
  }
}

export async function createLabInventoryItem(req, res, next) {
  try {
    const item = await labService.addLabEquipment(req.params.id, req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function deleteLabInventoryItem(req, res, next) {
  try {
    await labService.deleteLabEquipment(req.params.id, req.params.equipmentId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getMissingInventoryAnalytics(req, res, next) {
  try {
    const result = await labService.getMissingAnalytics();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminSummary(req, res, next) {
  try {
    const summary = await labService.getAdminSummaryAnalytics();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function getEquipmentUsage(req, res, next) {
  try {
    const usage = await labService.getEquipmentUsageAnalytics(req.params.id);
    res.json(usage);
  } catch (error) {
    next(error);
  }
}
