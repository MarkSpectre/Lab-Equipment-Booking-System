import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/client";
import { saveAuth } from "../lib/auth";

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const promise = api.post("/auth/signup", form);

    toast.promise(promise, {
      loading: "Creating your account...",
      success: (response) => {
        saveAuth(response.data);
        const role = String(response.data.user.role || "").toLowerCase();

        if (role === "admin") {
          navigate("/admin/labs");
        } else {
          navigate("/labs");
        }
        
        if (response.data.warning) {
          return "Account created (Email alert pending)";
        }
        return "Account ready";
      },
      error: (error) => error.response?.data?.message || "Signup failed",
    });

    await promise;
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-card/80 p-6 backdrop-blur-sm">
      <h1 className="text-2xl font-semibold">Create Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Register as student or admin.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          required
        />
        <select
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={form.role}
          onChange={(e) => updateField("role", e.target.value)}
        >
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full rounded-xl bg-primary px-3 py-2 text-primary-foreground" type="submit">
          Sign Up
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Have an account? <Link className="text-primary" to="/login">Login</Link>
      </p>
    </div>
  );
}

export default SignupPage;
