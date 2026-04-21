import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/client";
import Modal from "../components/Modal";
import SkeletonCard from "../components/SkeletonCard";

function LabInventoryPage() {
  const { labId } = useParams();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

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

  async function submitRequest() {
    if (!selectedEquipment) {
      return;
    }

    const promise = api.post("/requests", { equipmentId: selectedEquipment.id });

    toast.promise(promise, {
      loading: "Sending request...",
      success: async () => {
        await refreshInventory();
        setSelectedEquipment(null);
        return "Request Sent!";
      },
      error: (error) => error.response?.data?.message || "Failed to send request",
    });

    await promise;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lab Inventory</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshInventory}>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
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
                <th className="pb-2">Available</th>
                <th className="pb-2">Active</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 font-medium">{item.name}</td>
                  <td className="py-2">{item.category}</td>
                  <td className="py-2">{item.status}</td>
                  <td className="py-2">
                    {item.availableUnits} / {item.totalUnits}
                  </td>
                  <td className="py-2">{item.activeBorrowings}</td>
                  <td className="py-2">
                    <button
                      className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setSelectedEquipment(item)}
                      disabled={item.availableUnits < 1 || item.status !== "FUNCTIONAL"}
                    >
                      Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(selectedEquipment)}
        title="Confirm Request"
        onClose={() => setSelectedEquipment(null)}
        onConfirm={submitRequest}
        confirmText="Send Request"
      >
        {selectedEquipment ? `Request ${selectedEquipment.name} from this lab?` : ""}
      </Modal>
    </section>
  );
}

export default LabInventoryPage;
