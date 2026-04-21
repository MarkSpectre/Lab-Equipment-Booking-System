import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import api from "../api/axios";
import { getUser } from "../lib/auth";

/**
 * NotificationSettingsPage
 *
 * Lets a student set a personal/Gmail address to receive SNS email alerts.
 * On save, the backend:
 *   1. Writes `notificationEmail` to the DB
 *   2. Calls AWS SNS SubscribeCommand → AWS sends a confirmation email
 *
 * Route: /settings/notifications  (add to App.jsx student routes)
 */
function NotificationSettingsPage() {
  const sessionUser = getUser();
  const [notificationEmail, setNotificationEmail] = useState("");
  const [savedEmail, setSavedEmail]               = useState(null);
  const [isSaving, setIsSaving]                   = useState(false);
  const [isLoading, setIsLoading]                 = useState(true);

  // Load current profile
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/users/me");
        setSavedEmail(data.notificationEmail ?? null);
        setNotificationEmail(data.notificationEmail ?? "");
      } catch {
        toast.error("Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = notificationEmail.trim();

    if (!trimmed) {
      toast.error("Please enter an email address.");
      return;
    }

    try {
      setIsSaving(true);
      const { data } = await api.patch("/users/me/notification-email", {
        notificationEmail: trimmed,
      });

      setSavedEmail(data.notificationEmail);

      if (data.snsWarning) {
        toast.warning("Email saved, but SNS subscription failed. Check AWS config.");
      } else {
        toast.success("Saved! Check your inbox for a confirmation email from AWS.");
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to save. Please try again.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-400" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-rise">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Add a personal email (Gmail, etc.) to receive lab equipment alerts.
          Your login email (<span className="text-blue-300">{sessionUser?.email}</span>) stays unchanged.
        </p>
      </div>

      {/* ── Status badge ───────────────────────────────────── */}
      {savedEmail ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Notifications active</p>
            <p className="text-xs text-slate-400">
              Alerts will be sent to <span className="text-white">{savedEmail}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
          <BellOff size={18} className="flex-shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">No notification email set — you won't receive approval alerts.</p>
        </div>
      )}

      {/* ── Form ───────────────────────────────────────────── */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md space-y-5"
      >
        <div className="relative">
          <label
            htmlFor="notif-email"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Notification Email (Google / Personal)
          </label>

          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="notif-email"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="h-11 w-full rounded-xl border border-white/15 bg-slate-900/70 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/40"
              required
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            AWS will send a <strong className="text-slate-400">confirmation email</strong> — you must
            click the link inside it to activate notifications.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving…</>
          ) : (
            <><Bell size={15} /> Save & Subscribe</>
          )}
        </button>
      </form>

      {/* ── Info callout ────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-400/15 bg-blue-500/10 px-4 py-3 text-xs text-blue-300 space-y-1">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
          <li>When you submit a borrow request, the admin is notified instantly.</li>
          <li>When the admin approves your request, <em>you</em> receive an email alert.</li>
          <li>Alerts are routed using AWS SNS Subscription Filter Policies — only your email receives your alerts.</li>
        </ul>
      </div>
    </div>
  );
}

export default NotificationSettingsPage;
