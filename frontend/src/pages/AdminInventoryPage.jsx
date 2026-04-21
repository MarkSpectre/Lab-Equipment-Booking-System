import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../api/client";
import Modal from "../components/Modal";
import SkeletonCard from "../components/SkeletonCard";

function AdminInventoryPage() {
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "", total_units: 1, available_units: 1 });

  async function refreshEquipment() {
    const response = await api.get("/equipment");
    setEquipment(response.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshEquipment();
      } catch {
        toast.error("Could not load admin inventory");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  async function addItem() {
    const promise = api.post("/equipment", form);
    toast.promise(promise, {
      loading: "Adding equipment...",
      success: async () => {
        await refreshEquipment();
        setIsOpen(false);
        setForm({ name: "", category: "", description: "", total_units: 1, available_units: 1 });
        return "Item added";
      },
      error: (error) => error.response?.data?.message || "Could not add item",
    });

    await promise;
  }

  async function removeItem(id) {
    const promise = api.delete(`/equipment/${id}`);

    toast.promise(promise, {
      loading: "Removing item...",
      success: () => {
        setEquipment((prev) => prev.filter((item) => item.id !== id));
        return "Item removed";
      },
      error: (error) => error.response?.data?.message || "Could not remove item",
    });

    await promise;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Inventory</h2>
        <div className="flex gap-2">
          <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshEquipment}>
            Refresh
          </button>
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => setIsOpen(true)}>
            Add Item
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {equipment.map((item) => (
            <article key={item.id} className="rounded-xl border border-border/80 bg-card/80 p-4">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.category}</p>
              <p className="mt-2 text-sm">
                {item.availableUnits} / {item.totalUnits} units
              </p>
              <button
                className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={isOpen}
        title="Add New Equipment"
        onClose={() => setIsOpen(false)}
        onConfirm={addItem}
        confirmText="Save"
      >
        <div className="space-y-2 text-left">
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          />
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              placeholder="Total units"
              type="number"
              min="1"
              value={form.total_units}
              onChange={(e) => setForm((prev) => ({ ...prev, total_units: Number(e.target.value) }))}
            />
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              placeholder="Available units"
              type="number"
              min="0"
              value={form.available_units}
              onChange={(e) => setForm((prev) => ({ ...prev, available_units: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminInventoryPage;
