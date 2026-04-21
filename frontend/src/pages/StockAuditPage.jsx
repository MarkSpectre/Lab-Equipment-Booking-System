import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "../api/client";

function StockAuditPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);

  async function refreshAudit() {
    const [summaryRes, missingRes] = await Promise.all([
      api.get("/admin/analytics/summary"),
      api.get("/admin/analytics/missing"),
    ]);

    setSummary(summaryRes.data);
    setRows(missingRes.data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshAudit();
      } catch {
        toast.error("Could not load stock audit");
      }
    }

    load();
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Stock Audit</h2>
        <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted" onClick={refreshAudit}>
          Refresh
        </button>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Inventory Value" value={summary.totalInventoryValue} />
          <Metric label="Missing Items" value={summary.missingItemsCount} />
          <Metric label="Active Borrowings" value={summary.activeBorrowings} />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/70 p-4 backdrop-blur">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-2">Lab</th>
              <th className="pb-2">Equipment</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Condition Note</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Available</th>
              <th className="pb-2">Active</th>
              <th className="pb-2">Missing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.equipmentId} className={row.missingCount > 0 ? "bg-rose-500/10" : ""}>
                <td className="py-2">{row.labName}</td>
                <td className="py-2">{row.equipmentName}</td>
                <td className="py-2">{row.status}</td>
                <td className="py-2 text-muted-foreground">{row.conditionNote || "-"}</td>
                <td className="py-2">{row.totalUnits}</td>
                <td className="py-2">{row.availableUnits}</td>
                <td className="py-2">{row.activeBorrowings}</td>
                <td className={`py-2 font-semibold ${row.missingCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {row.missingCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {row.missingCount}
                    </span>
                  ) : (
                    row.missingCount
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default StockAuditPage;
