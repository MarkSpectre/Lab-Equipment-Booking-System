import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/client";
import AddEquipmentModal from "../components/AddEquipmentModal";
import SkeletonCard from "../components/SkeletonCard";

function AdminLabInventoryPage() {
  const { labId } = useParams();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageData, setUsageData] = useState(null);

  async function refreshInventory() {
    const response = await api.get(`/labs/${labId}/equipment`);
    setInventory(response.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshInventory();
      } catch {
        toast.error("Could not load lab inventory");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [labId]);

  async function deleteItem(equipmentId) {
    const promise = api.delete(`/labs/${labId}/equipment/${equipmentId}`);

    toast.promise(promise, {
      loading: "Deleting item...",
      success: () => {
        setInventory((prev) => prev.filter((item) => item.id !== equipmentId));
        return "Item deleted";
      },
      error: (error) => error.response?.data?.message || "Failed to delete item",
    });

    await promise;
  }

  async function openUsageModal(equipmentId) {
    try {
      const response = await api.get(`/admin/equipment/${equipmentId}/usage`);
      setUsageData(response.data);
      setUsageOpen(true);
    } catch {
      toast.error("Could not load equipment usage analytics");
    }
  }

  const tableRows = useMemo(
    () =>
      inventory.map((item) => ({
        ...item,
        missingUnits: item.missingUnits || 0,
        usagePercentage: item.usagePercentage || 0,
      })),
    [inventory]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lab Equipment Analytics</h2>
        <div className="flex gap-2">
          <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshInventory}>
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
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/70 p-4 backdrop-blur">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-2">Equipment</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Condition</th>
                <th className="pb-2">Available</th>
                <th className="pb-2">Usage %</th>
                <th className="pb-2">Missing Units</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((item) => (
                <tr key={item.id} className={item.missingUnits > 0 ? "bg-rose-500/10" : ""}>
                  <td className="py-2">
                    <button className="font-medium text-left underline-offset-2 hover:underline" onClick={() => openUsageModal(item.id)}>
                      {item.name}
                    </button>
                  </td>
                  <td className="py-2">{item.category}</td>
                  <td className="py-2">{item.status}</td>
                  <td className="py-2 text-muted-foreground">{item.conditionNote || "-"}</td>
                  <td className="py-2">{item.availableUnits} / {item.totalUnits}</td>
                  <td className="py-2">{item.usagePercentage}%</td>
                  <td className={`py-2 font-semibold ${item.missingUnits > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {item.missingUnits}
                  </td>
                  <td className="py-2">
                    <button className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted" onClick={() => deleteItem(item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddEquipmentModal open={isOpen} labId={labId} onClose={() => setIsOpen(false)} onAdded={refreshInventory} />

      <UsageModal open={usageOpen} onClose={() => setUsageOpen(false)} usageData={usageData} />
    </section>
  );
}

function UsageModal({ open, onClose, usageData }) {
  if (!open || !usageData) {
    return null;
  }

  const trendPoints = usageData.borrowingHistory.slice(0, 8).map((item) => {
    const daysToDue = Math.max(1, Math.ceil((new Date(item.dueDate).getTime() - new Date(item.requestedAt).getTime()) / (1000 * 60 * 60 * 24)));
    return Math.min(100, daysToDue * 12);
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border/80 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Usage Trend - {usageData.equipment.name}</h3>
          <button className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted" onClick={onClose}>Close</button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Tile label="Total Borrows" value={usageData.totalTimesBorrowed} />
          <Tile label="Average Duration (hrs)" value={usageData.averageBorrowingDuration} />
          <Tile label="Top Users" value={usageData.mostFrequentUsers.length} />
        </div>

        <div className="mb-5 rounded-xl border border-border/70 bg-background/50 p-4">
          <p className="mb-2 text-sm font-medium">Usage Trend</p>
          <div className="flex items-end gap-2">
            {trendPoints.map((value, index) => (
              <div key={index} className="h-28 w-7 rounded-md bg-primary/20 p-1">
                <div className="w-full rounded-sm bg-primary" style={{ height: `${value}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/70 bg-background/50 p-4">
          <p className="mb-2 text-sm font-medium">Borrowing History</p>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-2">User</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Requested</th>
                <th className="pb-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {usageData.borrowingHistory.map((item) => (
                <tr key={item.requestId}>
                  <td className="py-2">{item.user.name}</td>
                  <td className="py-2">{item.status}</td>
                  <td className="py-2">{new Date(item.requestedAt).toLocaleDateString()}</td>
                  <td className="py-2">{new Date(item.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default AdminLabInventoryPage;
