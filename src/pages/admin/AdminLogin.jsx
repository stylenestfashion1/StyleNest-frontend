import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageFade } from "../../components/Reveal";
import PasswordInput from "../../components/PasswordInput";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(form);
      if (res.role !== "ADMIN") {
        setError("This account does not have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFade>
      <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5 py-16 md:px-10">
        <div className="hairline-card w-full max-w-sm p-8 md:p-10">
          <p className="label-xs text-center text-accent">Console</p>
          <h1 className="mt-4 text-center text-3xl">StyleNest Fashion Admin</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Sign in to manage the store.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <label className="block">
              <span className="label-xs text-muted-foreground">Email</span>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="field mt-2" />
            </label>
            <PasswordInput label="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={submitting} className="btn-solid w-full">
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </PageFade>
  );
}
