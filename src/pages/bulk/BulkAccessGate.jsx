import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageFade, Reveal } from "../../components/Reveal";
import { validateBulkAccess } from "../../api/bulk";
import { setBulkToken } from "../../api/bulkClient";

/**
 * The private entry point to the wholesale catalog -- a customer only
 * reaches the catalog/cart/checkout pages after a valid, active (not
 * revoked) permanent access code (one of the 10 the shop hands out over
 * phone/WhatsApp) is accepted here. This is a UX gate only; the real
 * enforcement is
 * server-side on every /api/bulk/customer/** call (see
 * BulkAccessInterceptor on the backend) -- so even if someone skipped this
 * screen entirely, the APIs would still reject them.
 */
export default function BulkAccessGate() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!code.trim()) {
      setError("Please enter your access code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await validateBulkAccess(code.trim().toUpperCase());
      setBulkToken(code.trim().toUpperCase());
      navigate("/bulk-orders/catalog");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFade>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
        <Reveal>
          <p className="label-xs text-accent">Wholesale</p>
          <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.6rem)]">Bulk Orders</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            This catalog is private to wholesale customers. Enter the access code the shop shared with you to
            continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="label-xs text-muted-foreground">Bulk Order Access Code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="STNEST-XXXXXXX"
                className={`field mt-2 uppercase tracking-wider ${error ? "border-destructive" : ""}`}
                autoFocus
                aria-invalid={Boolean(error)}
              />
              {error && <span className="mt-2 block text-xs text-destructive">{error}</span>}
            </label>

            <button type="submit" disabled={submitting} className="btn-solid w-full disabled:opacity-60">
              {submitting ? "Checking..." : "Continue"}
            </button>
          </form>

          <p className="mt-8 text-xs text-muted-foreground">
            Don't have a code? Contact the shop directly to request wholesale access.
          </p>
        </Reveal>
      </div>
    </PageFade>
  );
}
