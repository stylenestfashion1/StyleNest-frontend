import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageFade } from "../components/Reveal";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rawFrom = location.state?.from?.pathname;
  const from = rawFrom && rawFrom !== "/login" ? rawFrom : "/account";

  // History Guard on mount: If user is already authenticated, redirect to target dashboard with replace: true
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin" : from, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, from]);

  if (isAuthenticated) {
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(form);
      notify(`Welcome back, ${res.fullName?.split(" ")[0] || "there"}`, "success");
      navigate(res.role === "ADMIN" ? "/admin" : from, { replace: true });
    } catch (err) {
      const msg = err?.message || "";
      setError(
        /invalid|credential|bad credential|password|user not found|unauthorized/i.test(msg)
          ? "Invalid email or password. Please verify your credentials."
          : msg || "Unable to sign in at this time. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFade>
      <div className="mx-auto flex min-h-[72vh] max-w-[1440px] items-center justify-center px-5 py-16 md:px-10">
        <div className="hairline-card w-full max-w-md p-8 md:p-10">
          <p className="label-xs text-center text-accent">StyleNest Fashion</p>
          <form onSubmit={handleSubmit} className="mt-6">
            <h1 className="text-center text-3xl">Welcome back</h1>
            <div className="mt-8 space-y-6">
              <label className="block">
                <span className="label-xs text-muted-foreground">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="field mt-2"
                />
              </label>
              <PasswordInput
                label="Password"
                name="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            <Link to="/forgot-password" className="label-xs link-underline mt-4 block w-fit">
              Forgot password?
            </Link>
            <button className="btn-solid mt-8 w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              New here?{" "}
              <Link to="/register" className="label-xs link-underline">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </PageFade>
  );
}
