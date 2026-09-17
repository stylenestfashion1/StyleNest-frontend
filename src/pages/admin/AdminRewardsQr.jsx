import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import BackButton from "../../components/BackButton";
import stylenestLogo from "../../assets/stylenest-logo.jpeg";

// Fixed, theme-independent premium poster palette -- this is a physical
// shop poster (and a live preview of one), so it must always render the
// same dark, branded look regardless of the admin panel's light/dark
// theme. NOT the same palette as the invoice's printed-document look --
// this is a marketing poster, meant to stand out, not read like paperwork.
const POSTER_FROM = "#20263a"; // dark navy top
const POSTER_TO = "#12141f"; // near-black bottom
const ACCENT = "#a597f0"; // brighter, print-legible lilac
const ACCENT_SOFT = "#8b93b8";
const GOLD = "#e7c98f"; // small premium accent line
const QR_INK = "#1a1d29";

// Absolute, non-negotiable safety bounds on the display text itself --
// matches DiscountConfigServiceImpl.ABSOLUTE_FLOOR/ABSOLUTE_CEILING /
// DiscountRangeUpdateRequest's bean validation.
const ABSOLUTE_FLOOR = 1;
const ABSOLUTE_CEILING = 100;

// The SAME permanent QR every time this page opens -- getAdminDiscountQr()
// always returns the one configured secret-token URL (app.discount.qr-secret-token
// on the backend), never a freshly generated one per visit/customer. This
// page never touches that token -- it only renders whatever URL the
// backend returns.
//
// The "QR Display Range" below is a PURELY COSMETIC setting that lives
// and is edited ONLY on this page. It controls nothing except the text
// printed on the poster -- it has zero effect on the REAL discount
// configuration (Rewards -> Custom Discount), which alone drives what a
// customer can actually receive. Neither setting reads or writes the other.
export default function AdminRewardsQr() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const canvasRef = useRef(null);
  const posterRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [range, setRange] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "discount", "qr"],
    queryFn: () => adminApi.getAdminDiscountQr(),
  });

  useEffect(() => {
    if (data) {
      setRange({ min: data.minDiscountPercentage, max: data.maxDiscountPercentage });
    }
  }, [data]);

  // Depends on `data` (so it re-draws after a display-range update) AND on
  // whether the canvas has actually mounted yet. The page's loading gate
  // below only checks `isLoading`, not `range`, specifically so the canvas
  // mounts on the SAME render where `data` first arrives -- otherwise this
  // effect's `canvasRef.current` check fails on that first render (the
  // canvas isn't in the DOM yet) and, since `data` never changes again,
  // the QR would silently never draw.
  useEffect(() => {
    if (!data?.url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data.url, { width: 296, margin: 0, color: { dark: QR_INK, light: "#ffffff" } }, (err) => {
      if (err) notify("Could not render the QR code.", "error");
      else setRendered(true);
    });
  }, [data, notify]);

  const saveRange = useMutation({
    mutationFn: () => adminApi.updateAdminDiscountRange({ minDiscountPercentage: range.min, maxDiscountPercentage: range.max }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "discount", "qr"], (prev) => ({ ...prev, ...updated }));
      notify("QR display range updated", "success");
      refetch();
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (isLoading) return <LoadingState label="Loading QR configuration" />;
  if (isError || !data) return <ErrorState message="Could not load the shop QR." onRetry={refetch} />;

  const min = data.minDiscountPercentage;
  const max = data.maxDiscountPercentage;
  const rangeText = min === max ? `UPTO ${max}% OFF` : `${min}% – ${max}% OFF`;

  const rangeValid =
    !!range &&
    range.min !== "" &&
    range.max !== "" &&
    Number(range.min) >= ABSOLUTE_FLOOR &&
    Number(range.max) <= ABSOLUTE_CEILING &&
    Number(range.min) < Number(range.max);

  // Renders the poster DOM straight to a canvas (html2canvas) then embeds
  // that image into a PDF sized to EXACTLY the poster's own dimensions --
  // no browser print dialog, no "turn on background graphics" step, no
  // surrounding white page. Free, client-side, no external PDF/QR API.
  // jsPDF/html2canvas are dynamically imported so their ~450KB never ships
  // to storefront visitors -- only loaded when an admin actually clicks this.
  async function handleDownloadPdf() {
    if (!posterRef.current || downloadingPdf) return;

    setDownloadingPdf(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);

      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("stylenest-discount-qr-poster.pdf");
    } catch {
      notify("Could not generate the PDF. Please try again.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div>
      <style>{`
        #discount-qr-poster, #discount-qr-poster * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        @media print {
          @page { margin: 0; size: auto; }
          body * { visibility: hidden; }
          #discount-qr-poster, #discount-qr-poster * { visibility: visible; }
          #discount-qr-poster {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            max-width: none;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <BackButton fallback="/admin" className="mb-3" />
      <h2 className="text-xl">Show Discount QR</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        One permanent QR for the shop counter. It never changes between visits, customers, or configuration updates — print it once and
        display it.
      </p>

      <div
        id="discount-qr-poster"
        ref={posterRef}
        className="mx-auto mt-8 flex max-w-sm flex-col items-center rounded-[28px] px-10 py-14 text-center shadow-2xl"
        style={{ background: `linear-gradient(160deg, ${POSTER_FROM}, ${POSTER_TO})` }}
      >
        <img src={stylenestLogo} alt="" className="h-16 w-auto rounded-[22px] bg-white p-2 shadow-[0_4px_14px_rgba(0,0,0,0.3)]" />

        <p className="mt-6 text-[22px] font-extrabold uppercase leading-tight tracking-[0.12em]" style={{ color: GOLD }}>
          Stylenest Fashion
          <br />
          Pvt Ltd
        </p>

        <div className="mt-8 h-px w-14" style={{ background: ACCENT_SOFT, opacity: 0.5 }} />

        <p className="mt-8 text-[28px] font-semibold uppercase leading-tight tracking-[0.06em] text-white">
          Scan &amp; Get
          <br />
          Discount
        </p>

        <div className="mt-10 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <canvas ref={canvasRef} className={rendered ? "block" : "hidden"} />
        </div>

        <p className="mt-10 text-4xl font-bold tracking-tight" style={{ color: ACCENT }}>
          {rangeText}
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: ACCENT_SOFT }}>
          Valid In-Store Only
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button className="btn-solid" onClick={() => window.print()}>
          Print QR
        </button>
        <button className="btn-outline disabled:cursor-not-allowed disabled:opacity-60" onClick={handleDownloadPdf} disabled={downloadingPdf}>
          {downloadingPdf ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        "Download PDF" saves the poster exactly as shown above, no extra steps. For "Print QR" (sending it to an actual printer), make sure
        "Background graphics" is turned on in the print dialog's "More settings" so the dark design prints correctly, and turn off "Headers
        and footers" — that browser-added date/URL/page-number line is outside this page's control, since it's added by the browser itself.
      </p>

      {range && (
        <div className="hairline-card mx-auto mt-10 max-w-sm p-6">
          <h3 className="label-xs text-accent">QR Display Range</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Only the text shown on the poster above (e.g. "{min}% – {max}% OFF"). This does not change the real discount a customer can
            receive — that's configured separately under Rewards → Custom Discount.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label-xs text-muted-foreground">Minimum %</span>
              <input
                type="number"
                min={ABSOLUTE_FLOOR}
                max={ABSOLUTE_CEILING}
                value={range.min}
                onChange={(e) => setRange((r) => ({ ...r, min: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label-xs text-muted-foreground">Maximum %</span>
              <input
                type="number"
                min={ABSOLUTE_FLOOR}
                max={ABSOLUTE_CEILING}
                value={range.max}
                onChange={(e) => setRange((r) => ({ ...r, max: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="field mt-2"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button disabled={!rangeValid || saveRange.isPending} className="btn-solid" onClick={() => saveRange.mutate()}>
              {saveRange.isPending ? "Updating..." : "Update QR"}
            </button>
            {!rangeValid && <p className="label-xs text-destructive">Minimum must be lower than maximum, both between 1% and 100%.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
