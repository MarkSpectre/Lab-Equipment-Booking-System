import { useState } from "react";
import { AlertCircle, Beaker } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { saveAuth } from "../lib/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    try {
      setIsSubmitting(true);
      const response = await axios.post("/api/auth/login", { email, password });

      saveAuth(response.data);
      toast.success("Welcome back");

      const role = String(response?.data?.user?.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/admin/labs", { replace: true });
      } else {
        navigate("/labs", { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";

      setFormError(message);

      if (!error.response) {
        toast.error("Could not reach server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-hidden rounded-3xl bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 right-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-200">
            <Beaker size={26} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to your lab account</p>
        </div>

        {formError ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            <AlertCircle size={16} className="mt-0.5" />
            <span>{formError}</span>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              id="email"
              className="peer h-12 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 pb-2 pt-5 text-sm text-white outline-none transition placeholder:text-transparent focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/60"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-3 top-1 text-xs text-slate-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-300"
            >
              Email Address
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              className="peer h-12 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 pb-2 pt-5 text-sm text-white outline-none transition placeholder:text-transparent focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/60"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-3 top-1 text-xs text-slate-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-300"
            >
              Password
            </label>
          </div>

          <button
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-3 font-medium text-white transition duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-300">
          New here? {" "}
          <Link className="font-medium text-blue-300 hover:text-blue-200" to="/signup">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
