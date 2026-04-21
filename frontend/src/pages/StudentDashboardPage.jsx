import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";
import { Badge } from "../components/ui/badge";

function StudentDashboardPage() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshRequests() {
    const response = await api.get("/requests");
    setRequests(response.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshRequests();
      } catch {
        toast.error("Could not load requests");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Student Dashboard</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshRequests}>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState message="No active requests yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-border/80 bg-card/80 p-4">
              <p className="font-medium">{request.equipment.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">Requested: {new Date(request.requestedAt).toDateString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Due: {request.dueDate ? new Date(request.dueDate).toDateString() : "Not set"}
              </p>
              <Badge className="mt-3" variant={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "danger" : "warning"}>
                {request.status}
              </Badge>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentDashboardPage;
