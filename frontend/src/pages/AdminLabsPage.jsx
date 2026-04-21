import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/client";
import SkeletonCard from "../components/SkeletonCard";
import { Badge } from "../components/ui/badge";

function AdminLabsPage() {
  const [labs, setLabs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshAll() {
    const [labsRes, requestRes, summaryRes] = await Promise.all([
      api.get("/labs"),
      api.get("/requests"),
      api.get("/admin/analytics/summary"),
    ]);

    setLabs(labsRes.data);
    setRequests(requestRes.data);
    setSummary(summaryRes.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshAll();
      } catch {
        toast.error("Could not load admin lab analytics");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  async function approveRequest(requestId) {
    const promise = api.patch(`/requests/${requestId}`, { status: "APPROVED" });

    toast.promise(promise, {
      loading: "Approving request...",
      success: async () => {
        setRequests((prev) => prev.map((item) => (item.id === requestId ? { ...item, status: "APPROVED" } : item)));
        await refreshAll();
        return "Request approved and student notified";
      },
      error: (error) => error.response?.data?.message || "Could not approve request",
    });

    await promise;
  }

  const pendingRequests = useMemo(() => requests.filter((item) => item.status === "PENDING"), [requests]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lab-Wise Management</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshAll}>
          Refresh
        </button>
      </div>

      {summary ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric title="Total Inventory Value" value={summary.totalInventoryValue} />
          <Metric title="Missing Items" value={summary.missingItemsCount} />
          <Metric title="Active Borrowings" value={summary.activeBorrowings} />
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [1, 2, 3].map((item) => <SkeletonCard key={item} />)
          : labs.map((lab) => (
              <Link
                key={lab.id}
                to={`/admin/labs/${lab.id}`}
                className="rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="flex items-start justify-between">
                  <p className="text-lg font-semibold">{lab.name}</p>
                  <Badge>Manage</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{lab.room}</p>
                <p className="mt-1 text-sm text-muted-foreground">Supervisor: {lab.supervisor}</p>
                <p className="mt-4 text-sm">
                  <span className="font-semibold">{lab.equipmentCount}</span> items tracked
                </p>
              </Link>
            ))}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/80 p-5">
        <h3 className="mb-3 text-lg font-semibold">Pending Requests</h3>
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <article key={request.id} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{request.equipment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {request.user.name} • {request.equipment.lab?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">PENDING</Badge>
                <button
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  onClick={() => approveRequest(request.id)}
                >
                  Approve
                </button>
              </div>
            </article>
          ))}
          {pendingRequests.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p> : null}
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default AdminLabsPage;
