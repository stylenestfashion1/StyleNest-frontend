import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as discountApi from "../api/discount";
import { PageFade } from "../components/Reveal";

// Hidden route -- reachable ONLY via the shop's permanent QR code
// (/special-offer/<secret-token>), never linked from site navigation. The
// token in the URL is validated server-side on mount; a wrong/missing
// token never reveals the claim form, only an error state.
export default function SpecialOffer() {
  const { token } = useParams();

  const [phase, setPhase] = useState("checking"); // checking | invalid | form | submitting | success | error
  const [sessionToken, setSessionToken] = useState(null);
  const [form, setForm] = useState({ customerName: "", mobileNumber: "" });
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await discountApi.verifyQrToken(token);
        if (!cancelled) {
          setSessionToken(session.sessionToken);
          setPhase("form");
        }
      } catch {
        if (!cancelled) setPhase("invalid");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function validate() {
    const name = form.customerName.trim();
    const mobile = form.mobileNumber.replace(/\D/g, "");

    if (name.length < 2) return "Please enter your full name.";
    if (!/^[6-9]\d{9}$/.test(mobile)) return "Enter a valid 10-digit mobile number.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError("");
    setError("");
    setPhase("submitting");
    try {
      const claim = await discountApi.claimDiscount(sessionToken, {
        customerName: form.customerName.trim(),
        mobileNumber: form.mobileNumber.replace(/\D/g, ""),
      });
      setResult(claim);
      setPhase("success");
    } catch (err) {
      setError(err.message);
      setPhase("form");
    }
  }

  return (
    <PageFade>
      <div className="mx-auto flex min-h-[80vh] max-w-[1440px] items-center justify-center px-5 py-16 md:px-10">
        <div className="hairline-card w-full max-w-md p-8 text-center md:p-10">
          <p className="label-xs text-accent">StyleNest Fashion</p>

          {phase === "checking" && (
            <div className="mt-10 flex flex-col items-center gap-4 text-muted-foreground">
              <div className="h-8 w-8 rounded-full border border-accent border-t-transparent animate-spin" />
              <span className="label-xs">Verifying...</span>
            </div>
          )}

          {phase === "invalid" && (
            <>
              <h1 className="mt-6 text-2xl">This offer link isn't valid</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Please scan the QR code displayed at the StyleNest Fashion shop counter to access this offer.
              </p>
            </>
          )}

          {(phase === "form" || phase === "submitting") && (
            <>
              <h1 className="mt-6 text-3xl">Special Shop Offer</h1>
              <p className="mt-3 text-sm text-muted-foreground">Scan. Enter. Discover your discount.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-left">
                <label className="block">
                  <span className="label-xs text-muted-foreground">Customer Name</span>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    className="field mt-2"
                    placeholder="Your full name"
                  />
                </label>
                <label className="block">
                  <span className="label-xs text-muted-foreground">Mobile Number</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobileNumber}
                    onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    className="field mt-2"
                    placeholder="10-digit mobile number"
                  />
                </label>
                {(fieldError || error) && <p className="text-sm text-destructive">{fieldError || error}</p>}
                <button disabled={phase === "submitting"} className="btn-solid w-full">
                  {phase === "submitting" ? "Generating..." : "Get Discount"}
                </button>
              </form>
            </>
          )}

          {phase === "success" && result && (
            <div className="animate-rise-in">
              <p className="mt-6 text-3xl">🎉</p>
              <h1 className="mt-4 text-2xl">Congratulations!</h1>
              <p className="mt-2 text-lg">{result.customerName}</p>
              <p className="mt-6 text-sm text-muted-foreground">You have received</p>
              <p className="display mt-2 text-5xl text-accent">{result.discountPercentage}% OFF</p>
              <p className="mt-4 text-sm text-muted-foreground">from StyleNest Fashion. Kindly redeem this discount on your final bill amount.</p>
              <div className="mt-8 border-t pt-6">
                <p className="label-xs text-accent">Your Discount</p>
                <p className="mt-2 text-4xl">{result.discountPercentage}%</p>
              </div>
              <p className="mt-8 text-xs text-muted-foreground">Please show this screen to the StyleNest Fashion billing counter.</p>
              <Link to="/" className="label-xs link-underline mt-8 inline-block text-accent">
                Return to StyleNest Fashion
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageFade>
  );
}
