import { formatDate } from "../utils/format";

// Fixed, theme-independent palette -- this is a formal business document and
// must always render the same way regardless of the site's light/dark mode
// or gender accent (using the app's `text-muted-foreground` / `bg-accent`
// tokens here caused near-invisible text in dark mode, since those tokens
// are tuned for the app chrome, not a fixed white printable card).
const INK = "#1f2430";
const INK_SOFT = "#5b6472";
const ACCENT = "#7c6cd6";
const ACCENT_SOFT = "#efecfb";
const BORDER = "#e3e1ef";

function money(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Pure presentational render of an InvoiceResponse -- the "digital invoice"
 * view required by spec (a real business-invoice layout, not raw JSON).
 * Shared across customer, guest, and admin (retail + bulk) invoice pages so
 * the structure stays identical everywhere. Every color here is a fixed
 * hex value, deliberately independent of the app's theme tokens.
 */
export default function InvoiceView({ invoice }) {
  if (!invoice) return null;

  const taxBreakup = invoice.taxBreakup || [];

  return (
    <div
      className="mx-auto max-w-[900px] p-6 md:p-10"
      style={{ background: "#ffffff", color: INK, border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: INK }}>
          {invoice.sellerName}
        </h2>
        <p className="mt-1 text-sm" style={{ color: INK_SOFT }}>
          {invoice.sellerAddress}
        </p>
        <p className="mt-1 text-sm" style={{ color: INK_SOFT }}>
          {invoice.sellerPhone && `Ph: ${invoice.sellerPhone}`}
          {invoice.sellerEmail && ` · ${invoice.sellerEmail}`}
        </p>
        <p className="mt-1 text-sm" style={{ color: INK_SOFT }}>
          {invoice.sellerState && `State: ${invoice.sellerState}`}
          {invoice.sellerGstin && ` · GSTIN: ${invoice.sellerGstin}`}
          {invoice.sellerCin && ` · CIN: ${invoice.sellerCin}`}
        </p>
      </div>

      <div className="mt-6 py-2 text-center text-sm font-semibold uppercase tracking-wide" style={{ background: ACCENT, color: "#ffffff" }}>
        Tax Invoice
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: ACCENT }}>
            Bill To
          </p>
          <p className="mt-2 text-sm font-medium" style={{ color: INK }}>
            {invoice.customerName}
          </p>
          {invoice.billingAddressLine1 && (
            <p className="text-sm" style={{ color: INK_SOFT }}>
              {invoice.billingAddressLine1}
            </p>
          )}
          {invoice.billingAddressLine2 && (
            <p className="text-sm" style={{ color: INK_SOFT }}>
              {invoice.billingAddressLine2}
            </p>
          )}
          {(invoice.billingCity || invoice.billingState || invoice.billingPostalCode) && (
            <p className="text-sm" style={{ color: INK_SOFT }}>
              {[invoice.billingCity, invoice.billingState, invoice.billingPostalCode].filter(Boolean).join(", ")}
            </p>
          )}
          {invoice.customerPhone && (
            <p className="text-sm" style={{ color: INK_SOFT }}>
              {invoice.customerPhone}
            </p>
          )}
          {invoice.customerEmail && (
            <p className="text-sm" style={{ color: INK_SOFT }}>
              {invoice.customerEmail}
            </p>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: ACCENT }}>
            Invoice Details
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <Row label="Invoice No." value={invoice.invoiceNumber} />
            <Row label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
            <Row label="Order No." value={invoice.orderNumber} />
            <Row label="Payment" value={`${invoice.paymentStatus || "-"} (${invoice.paymentMethod || "-"})`} />
          </dl>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr style={{ background: ACCENT_SOFT }}>
              <Th>#</Th>
              <Th>Item</Th>
              <Th>HSN/SAC</Th>
              <Th right>MRP</Th>
              <Th right>Qty</Th>
              <Th>Unit</Th>
              <Th right>Price/Unit</Th>
              <Th right>Discount</Th>
              <Th right>GST</Th>
              <Th right>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <Td>{idx + 1}</Td>
                <Td>
                  {item.productName}
                  {item.variantInfo && <span style={{ color: INK_SOFT }}> ({item.variantInfo})</span>}
                </Td>
                <Td>{item.hsnCode || "-"}</Td>
                <Td right>{money(item.mrpPerUnit)}</Td>
                <Td right>{item.quantity}</Td>
                <Td>{item.unit || "Unit"}</Td>
                <Td right>{money(item.pricePerUnit)}</Td>
                <Td right>
                  {money(item.discountAmount)}
                  {item.discountPercent != null && <span style={{ color: INK_SOFT }}> ({Number(item.discountPercent).toFixed(1)}%)</span>}
                </Td>
                <Td right>
                  {money(item.gstAmount)}
                  {item.gstRate != null && <span style={{ color: INK_SOFT }}> ({Number(item.gstRate).toFixed(1)}%)</span>}
                </Td>
                <Td right>{money(item.lineTotal)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {taxBreakup.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: ACCENT }}>
              Tax Type
            </p>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr style={{ background: ACCENT_SOFT }}>
                  <Th>Tax Type</Th>
                  <Th right>Taxable Amt</Th>
                  <Th right>Rate</Th>
                  <Th right>Tax Amt</Th>
                </tr>
              </thead>
              <tbody>
                {taxBreakup.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <Td>{row.taxType}</Td>
                    <Td right>{money(row.taxableAmount)}</Td>
                    <Td right>{Number(row.rate).toFixed(1)}%</Td>
                    <Td right>{money(row.taxAmount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: ACCENT }}>
            Amount in Words
          </p>
          <p className="mt-2 text-sm" style={{ color: INK }}>
            {invoice.amountInWords}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <dl className="w-full space-y-1.5 text-sm sm:w-1/2">
          <Row label="Taxable Amount" value={money(invoice.taxableAmount)} />
          {Number(invoice.totalDiscount) > 0 && <Row label="Total Discount" value={money(invoice.totalDiscount)} />}
          {invoice.interState ? (
            <Row label="IGST" value={money(invoice.igstAmount)} />
          ) : (
            <>
              <Row label="CGST" value={money(invoice.cgstAmount)} />
              <Row label="SGST" value={money(invoice.sgstAmount)} />
            </>
          )}
          {Number(invoice.shippingCharge) > 0 && <Row label="Shipping" value={money(invoice.shippingCharge)} />}
          {Number(invoice.roundOff) !== 0 && <Row label="Round Off" value={money(invoice.roundOff)} />}
          <div className="mt-2 flex justify-between pt-2 text-base font-semibold" style={{ borderTop: `1px solid ${BORDER}`, color: INK }}>
            <span>Grand Total</span>
            <span>{money(invoice.grandTotal)}</span>
          </div>
          <Row label="Received" value={money(invoice.amountReceived)} />
          <Row label="Balance" value={money(invoice.balanceDue)} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: INK_SOFT }}>{label}</dt>
      <dd style={{ color: INK }}>{value}</dd>
    </div>
  );
}

function Th({ children, right }) {
  return (
    <th className={`px-2 py-2 text-xs font-medium uppercase tracking-wide ${right ? "text-right" : "text-left"}`} style={{ color: INK_SOFT }}>
      {children}
    </th>
  );
}

function Td({ children, right }) {
  return (
    <td className={`px-2 py-2 ${right ? "text-right" : "text-left"}`} style={{ color: INK }}>
      {children}
    </td>
  );
}
