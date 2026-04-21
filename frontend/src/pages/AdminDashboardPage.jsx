import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";
import { Badge } from "../components/ui/badge";

function AdminDashboardPage() {
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
        toast.error("Could not load admin requests");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  async function updateStatus(id, status) {
    const promise = api.patch(`/requests/${id}`, { status });

    toast.promise(promise, {
      loading: `Marking as ${status}...`,
      success: () => {
        setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
        return "Request updated";
      },
      error: (error) => error.response?.data?.message || "Failed to update status",
    });

    await promise;
  }

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
    };
  }, [requests]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshRequests}>
          Refresh
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Total" value={stats.total} />
        <Metric title="Pending" value={stats.pending} />
        <Metric title="Approved" value={stats.approved} />
        <Metric title="Rejected" value={stats.rejected} />
      </section>

      {isLoading ? (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState message="No requests found." />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-border/80 bg-card/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{request.equipment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.user.name} ({request.user.email})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requested: {new Date(request.requestDate).toDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>
                    {request.status}
                  </Badge>
                  <button
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={() => updateStatus(request.id, "approved")}
                    disabled={request.status !== "pending"}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={() => updateStatus(request.id, "rejected")}
                    disabled={request.status !== "pending"}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/80 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default AdminDashboardPage;
