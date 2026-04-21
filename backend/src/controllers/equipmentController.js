import * as equipmentService from "../services/equipmentService.js";

export async function getEquipment(req, res, next) {
  try {
    const items = await equipmentService.listEquipment();
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function addEquipment(req, res, next) {
  try {
    const item = await equipmentService.createEquipment(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function deleteEquipment(req, res, next) {
  try {
    const id = req.params.id;
    await equipmentService.removeEquipment(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
