import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import * as authApi from "../api/auth";
import { useToast } from "../context/ToastContext";
import { PageFade } from "../components/Reveal";
import PasswordInput from "../components/PasswordInput";

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3 };

export default function ForgotPassword() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      notify("If that email exists, an OTP has been sent.", "success");
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.verifyOtp({ email, otp });
      setStep(STEPS.RESET);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.resetPassword({ email, newPassword });
      notify("Password reset. Please sign in.", "success");
      navigate("/login", { replace: true });
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
          <button className="label-xs flex items-center gap-2" onClick={() => (step === STEPS.EMAIL ? navigate("/login") : setStep(step - 1))}>
            <ArrowLeft className="h-3 w-3" /> Back
          </button>

          <div className="mt-6 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <span key={s} className="h-[2px] flex-1 transition-colors duration-500" style={{ background: s <= step ? "var(--color-accent)" : "var(--color-border)" }} />
            ))}
          </div>

          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOtp} className="mt-8">
              <h1 className="text-3xl">Reset password</h1>
              <p className="mt-3 text-sm text-muted-foreground">Step 1 of 3 — we'll email a one-time code.</p>
              <label className="mt-8 block">
                <span className="label-xs text-muted-foreground">Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-2" />
              </label>
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              <button className="btn-solid mt-8 w-full" disabled={submitting || !email}>
                {submitting ? "Sending..." : "Send code"}
              </button>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="mt-8">
              <h1 className="text-3xl">Enter the code</h1>
              <p className="mt-3 text-sm text-muted-foreground">Step 2 of 3 — sent to {email}.</p>
              <label className="mt-8 block">
                <span className="label-xs text-muted-foreground">One-time code</span>
                <input required value={otp} onChange={(e) => setOtp(e.target.value)} className="field mt-2 tracking-widest" />
              </label>
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              <button className="btn-solid mt-8 w-full" disabled={submitting || !otp}>
                {submitting ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}

          {step === STEPS.RESET && (
            <form onSubmit={handleReset} className="mt-8">
              <h1 className="text-3xl">New password</h1>
              <p className="mt-3 text-sm text-muted-foreground">Step 3 of 3 — choose something memorable.</p>
              <div className="mt-8">
                <PasswordInput label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              <button className="btn-solid mt-8 w-full" disabled={submitting || newPassword.length < 6}>
                {submitting ? "Saving..." : "Save password"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="label-xs link-underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PageFade>
  );
}
