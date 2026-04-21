import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../api/client";
import Modal from "../components/Modal";
import RequestItemCard from "../components/RequestItemCard";
import SkeletonCard from "../components/SkeletonCard";

function InventoryPage() {
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  async function refreshEquipment() {
    const response = await api.get("/equipment");
    setEquipment(response.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshEquipment();
      } catch {
        toast.error("Could not load inventory");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  async function submitRequest() {
    if (!selectedEquipment) {
      return;
    }

    const promise = api.post("/requests", { equipmentId: selectedEquipment.id });

    toast.promise(promise, {
      loading: "Sending request...",
      success: async () => {
        await refreshEquipment();
        setSelectedEquipment(null);
        return "Request Sent!";
      },
      error: (error) => error.response?.data?.message || "Failed to send request",
    });

    await promise;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Equipment Inventory</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshEquipment}>
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [1, 2, 3, 4].map((item) => <SkeletonCard key={item} />)
          : equipment.map((item) => (
              <RequestItemCard key={item.id} equipment={item} onRequestClick={setSelectedEquipment} />
            ))}
      </div>

      <Modal
        open={Boolean(selectedEquipment)}
        title="Confirm Request"
        onClose={() => setSelectedEquipment(null)}
        onConfirm={submitRequest}
        confirmText="Send Request"
      >
        {selectedEquipment
          ? `Do you want to request ${selectedEquipment.name} from the lab inventory?`
          : ""}
      </Modal>
    </div>
  );
}

export default InventoryPage;
