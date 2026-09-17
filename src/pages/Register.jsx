import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageFade } from "../components/Reveal";
import PasswordInput from "../components/PasswordInput";

const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase, a number and a symbol.";

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      notify("Account created — welcome to StyleNest Fashion", "success");
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message);
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
            <h1 className="text-center text-3xl">Create account</h1>
            <div className="mt-8 space-y-6">
              <Field label="Full name" required value={form.fullName} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} autoComplete="name" />
              <Field label="Email" type="email" required value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} autoComplete="email" />
              <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} autoComplete="tel" />
              <div>
                <PasswordInput
                  label="Password"
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <p className="mt-1.5 text-xs text-muted-foreground">{PASSWORD_HINT}</p>
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            <button className="btn-solid mt-8 w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Register"}
            </button>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already a member?{" "}
              <Link to="/login" className="label-xs link-underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </PageFade>
  );
}

function Field({ label, value, onChange, type = "text", required, autoComplete }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-2"
      />
    </label>
  );
}
