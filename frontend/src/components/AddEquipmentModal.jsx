import { useState } from "react";
import { toast } from "sonner";
import api from "../api/client";
import Modal from "./Modal";

const INITIAL_FORM = {
  name: "",
  category: "",
  description: "",
  availableUnits: 0,
  totalUnits: 1,
  status: "FUNCTIONAL",
  conditionNote: "",
};

function AddEquipmentModal({ open, labId, onClose, onAdded }) {
  const [form, setForm] = useState(INITIAL_FORM);

  function handleClose() {
    setForm(INITIAL_FORM);
    onClose();
  }

  function handleTextChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAvailableUnitsChange(value) {
    if (value === "") {
      setForm((prev) => ({ ...prev, availableUnits: "" }));
      return;
    }

    setForm((prev) => ({ ...prev, availableUnits: Number(value) }));
  }

  function handleTotalUnitsChange(value) {
    if (value === "") {
      setForm((prev) => ({ ...prev, totalUnits: "" }));
      return;
    }

    const nextTotal = Number(value);
    setForm((prev) => ({
      ...prev,
      totalUnits: nextTotal,
      availableUnits:
        prev.availableUnits === "" || Number(prev.availableUnits) === 0
          ? nextTotal
          : prev.availableUnits,
    }));
  }

  async function handleSubmit() {
    const availableUnits = Number.parseInt(form.availableUnits, 10);
    const totalUnits = Number.parseInt(form.totalUnits, 10);

    if (Number.isNaN(availableUnits) || Number.isNaN(totalUnits)) {
      toast.error("Available units and total units are required");
      return;
    }

    if (availableUnits > totalUnits) {
      toast.error("Available units cannot exceed total units");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      conditionNote: form.conditionNote.trim(),
      status: form.status,
      availableUnits,
      totalUnits,
    };

    const promise = api.post(`/labs/${labId}/equipment`, payload);

    toast.promise(promise, {
      loading: "Adding item...",
      success: async () => {
        await onAdded();
        setForm(INITIAL_FORM);
        onClose();
        return "Item added";
      },
      error: (error) => error.response?.data?.message || "Failed to add item",
    });

    await promise;
  }

  return (
    <Modal open={open} title="Add Equipment" onClose={handleClose} onConfirm={handleSubmit} confirmText="Save Item">
      <div className="space-y-3 text-left">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => handleTextChange("name", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Category"
            value={form.category}
            onChange={(e) => handleTextChange("category", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Description</label>
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleTextChange("description", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Available Units</label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            type="number"
            min="0"
            value={form.availableUnits}
            onChange={(e) => handleAvailableUnitsChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Total Units</label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            type="number"
            min="1"
            value={form.totalUnits}
            onChange={(e) => handleTotalUnitsChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</label>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.status}
            onChange={(e) => handleTextChange("status", e.target.value)}
          >
            <option value="FUNCTIONAL">Functional</option>
            <option value="MISSING">Missing</option>
            <option value="REPAIR">Repair</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Condition Note</label>
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Condition note"
            value={form.conditionNote}
            onChange={(e) => handleTextChange("conditionNote", e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default AddEquipmentModal;
