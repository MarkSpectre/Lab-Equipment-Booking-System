import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";

function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshLabs() {
    const response = await api.get("/labs");
    setLabs(response.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshLabs();
      } catch {
        toast.error("Could not load labs");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Labs</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshLabs}>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : labs.length === 0 ? (
        <EmptyState message="No labs configured yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <Link
              key={lab.id}
              to={`/labs/${lab.id}`}
              className="rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <p className="text-lg font-semibold">{lab.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{lab.room}</p>
              <p className="mt-1 text-sm text-muted-foreground">Supervisor: {lab.supervisor}</p>
              <p className="mt-4 text-sm">
                <span className="font-semibold">{lab.equipmentCount}</span> items tracked
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default LabsPage;
