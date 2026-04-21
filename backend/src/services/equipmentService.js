import { equipmentModel } from "../models/equipmentModel.js";

export async function listEquipment() {
  return equipmentModel.findAll();
}

export async function createEquipment(payload) {
  const {
    name,
    description,
    category,
    total_units,
    available_units,
    totalUnits,
    availableUnits,
    labId,
    status,
    conditionNote,
  } = payload;

  const resolvedTotalUnits = totalUnits ?? total_units;
  const resolvedAvailableUnits = availableUnits ?? available_units;

  if (!name || !category || Number(resolvedTotalUnits) < 1) {
    const error = new Error("name, category and total_units are required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedTotalUnits = Number(resolvedTotalUnits);
  const normalizedAvailableUnits =
    resolvedAvailableUnits !== undefined && resolvedAvailableUnits !== null ? Number(resolvedAvailableUnits) : normalizedTotalUnits;

  return equipmentModel.create({
    labId,
    name,
    description,
    category,
    totalUnits: normalizedTotalUnits,
    availableUnits: normalizedAvailableUnits,
    status: status || "FUNCTIONAL",
    conditionNote,
  });
}

export async function removeEquipment(id) {
  return equipmentModel.deleteById(id);
}
