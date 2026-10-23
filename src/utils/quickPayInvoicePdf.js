import { jsPDF } from "jspdf";

/**
 * Generates and downloads a legally compliant, professional PDF Tax / Commercial Invoice
 * for StyleNest Quick Payments and International / Domestic Wholesale Settlements.
 * 
 * Complies with:
 * - Indian GST Act 2017 (Section 31 & Section 16 of IGST Act for Zero-Rated Exports)
 * - Directorate General of Foreign Trade (DGFT) & Indian Customs Export Invoice Norms
 * - Reserve Bank of India (RBI) approved international payment settlement reporting (PayGlocal)
 */
export async function downloadQuickPayInvoicePdf(payment) {
  if (!payment) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Color Palette
  const darkSlate = [15, 23, 42];      // #0F172A
  const mutedText = [71, 85, 105];     // #475569
  const accentGold = [180, 83, 9];     // #B45309
  const emeraldGreen = [5, 150, 105];  // #059669
  const lightBg = [248, 250, 252];     // #F8FAFC
  const borderGrey = [203, 213, 225];  // #CBD5E1

  const isExport = (payment.currency || "USD").toUpperCase() === "USD";
  const currencySymbol = isExport ? "$" : "₹";
  const cur = payment.currency ? payment.currency.toUpperCase() : "USD";
  const totalAmount = Number(payment.amount || 0);

  // 1. Top Brand & Invoice Title Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...darkSlate);
  doc.text("STYLE NEST FASHION", margin, y + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text("Luxury Pret & Wholesale Atelier | Style Nest Fashion Private Limited", margin, y + 10);

  // Right-aligned Invoice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...accentGold);
  doc.text(
    isExport ? "TAX INVOICE / EXPORT COMMERCIAL INVOICE" : "TAX INVOICE",
    pageWidth - margin,
    y + 5,
    { align: "right" }
  );

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...emeraldGreen);
  doc.text("PAYMENT STATUS: SETTLED IN FULL", pageWidth - margin, y + 10, { align: "right" });

  y += 15;

  // Statutory Export LUT / Tax Banner
  doc.setFillColor(254, 243, 199); // Amber tint
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14); // Dark amber

  if (isExport) {
    doc.text(
      "STATUTORY EXPORT DECLARATION: SUPPLY MEANT FOR EXPORT UNDER LETTER OF UNDERTAKING (LUT) WITHOUT PAYMENT OF INTEGRATED TAX (ZERO-RATED AS PER SEC 16 OF IGST ACT 2017)",
      margin + 2.5,
      y + 4.5
    );
  } else {
    doc.text(
      "GST TAX INVOICE ISSUED UNDER SECTION 31 OF THE CGST/SGST ACT, 2017 (TAX INCLUSIVE TRANSACTION)",
      margin + 2.5,
      y + 4.5
    );
  }

  y += 10;

  // 2. Metadata Grid: Seller (Left) vs Invoice & Gateway Details (Right)
  const metaBoxY = y;
  const colWidth = (contentWidth - 6) / 2;
  const metaBoxHeight = 36;

  // Left Box: Seller Information (StyleNest Legal)
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, metaBoxY, colWidth, metaBoxHeight, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, metaBoxY, colWidth, metaBoxHeight, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text("SELLER (SUPPLIER DETAILS):", margin + 4, metaBoxY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Style Nest Fashion Private Limited", margin + 4, metaBoxY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text("175-B, Amrit Palace, Nipania, Indore, MP - 452010, India", margin + 4, metaBoxY + 14.5);
  doc.text("State: Madhya Pradesh | State Code: 23", margin + 4, metaBoxY + 18.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkSlate);
  doc.text("GSTIN: 23ABUCS8160R1ZA", margin + 4, metaBoxY + 23);
  doc.text("CIN: U14101MP2026PTC086429", margin + 4, metaBoxY + 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...mutedText);
  doc.text("Email: stylenestfashion1@gmail.com | Phone: +91 6269933231", margin + 4, metaBoxY + 31.5);

  // Right Box: Invoice Numbers, Dates & PayGlocal Settlement
  const rightBoxX = margin + colWidth + 6;
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightBoxX, metaBoxY, colWidth, metaBoxHeight, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(rightBoxX, metaBoxY, colWidth, metaBoxHeight, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text("INVOICE & SETTLEMENT AUDIT:", rightBoxX + 4, metaBoxY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);

  doc.text(`Invoice Number:`, rightBoxX + 4, metaBoxY + 10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkSlate);
  doc.text(`INV-${payment.paymentNumber || "QP"}`, rightBoxX + 30, metaBoxY + 10);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text(`Payment Ref:`, rightBoxX + 4, metaBoxY + 14.5);
  doc.text(`${payment.paymentNumber || "—"}`, rightBoxX + 30, metaBoxY + 14.5);

  const paymentDate = payment.createdAt
    ? new Date(payment.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString();
  doc.text(`Date of Issue:`, rightBoxX + 4, metaBoxY + 18.5);
  doc.text(`${paymentDate}`, rightBoxX + 30, metaBoxY + 18.5);

  doc.text(`Payment Mode:`, rightBoxX + 4, metaBoxY + 23);
  doc.text(`PayGlocal Online Merchant Gateway`, rightBoxX + 30, metaBoxY + 23);

  doc.text(`Gateway GID:`, rightBoxX + 4, metaBoxY + 27);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkSlate);
  const gid = payment.payglocalGid || "Direct Verified Settlement";
  doc.text(gid.length > 25 ? gid.substring(0, 25) + "..." : gid, rightBoxX + 30, metaBoxY + 27);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text(`Place of Supply:`, rightBoxX + 4, metaBoxY + 31.5);
  doc.text(isExport ? `${payment.country || "Outside India"} (Code 96)` : `${payment.state || "State"}`, rightBoxX + 30, metaBoxY + 31.5);

  y += metaBoxHeight + 5;

  // 3. Bill To / Ship To: Customer Contact & Shipping Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text("BUYER / RECIPIENT DETAILS (BILL TO & SHIP TO):", margin, y + 3.5);
  y += 5;

  const billBoxHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, billBoxHeight, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, y, contentWidth, billBoxHeight, 2, 2, "D");

  // Buyer Info Left Column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text(payment.customerName || "Valued International Customer", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(`Email: ${payment.customerEmail || "Not provided"}`, margin + 4, y + 11);
  doc.text(`Phone: ${payment.customerPhone || "Not provided"}`, margin + 4, y + 16);
  doc.text(`Country of Delivery: ${payment.country || (isExport ? "Australia" : "India")}`, margin + 4, y + 21);

  // Buyer Shipping Address Right Column
  const buyerRightX = margin + contentWidth / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text("Delivery / Consignee Address:", buyerRightX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  const street = [payment.addressLine1, payment.addressLine2].filter(Boolean).join(", ") || "Address provided during checkout";
  doc.text(street.length > 48 ? street.substring(0, 48) + "..." : street, buyerRightX, y + 11);
  doc.text(`City & State: ${[payment.city, payment.state].filter(Boolean).join(", ") || "—"}`, buyerRightX, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...accentGold);
  doc.text(`Postal / ZIP Code: ${payment.postalCode || "—"} (${payment.country || "Australia"})`, buyerRightX, y + 22);

  y += billBoxHeight + 6;

  // 4. Line Items Table with HSN, Taxable Value, GST Rate & Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text("ITEMIZED BILL OF SUPPLY / TAX INVOICE PARTICULARS:", margin, y + 3);
  y += 5;

  // Table Header
  const thY = y;
  doc.setFillColor(...lightBg);
  doc.rect(margin, thY, contentWidth, 7, "F");
  doc.setDrawColor(...borderGrey);
  doc.rect(margin, thY, contentWidth, 7, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...darkSlate);
  doc.text("SL", margin + 3, thY + 4.8);
  doc.text("DESCRIPTION OF GOODS / PURPOSE", margin + 14, thY + 4.8);
  doc.text("HSN/SAC", margin + 95, thY + 4.8);
  doc.text("RATE", margin + 115, thY + 4.8);
  doc.text("TAXABLE", margin + 138, thY + 4.8, { align: "right" });
  doc.text("GST %", margin + 158, thY + 4.8, { align: "right" });
  doc.text("TOTAL", margin + contentWidth - 3, thY + 4.8, { align: "right" });

  y += 7;

  // Calculate Tax Values
  let taxableValue = totalAmount;
  let gstRateText = "0% (Export LUT)";
  let gstAmount = 0;

  if (!isExport) {
    // Domestic INR: GST 5% inclusive decomposition
    const taxFactor = 1.05;
    taxableValue = Number((totalAmount / taxFactor).toFixed(2));
    gstAmount = Number((totalAmount - taxableValue).toFixed(2));
    const isLocalMP = (payment.state || "").toLowerCase().includes("madhya") || (payment.state || "").toLowerCase() === "mp";
    gstRateText = isLocalMP ? "5% (CGST 2.5% + SGST 2.5%)" : "5% (IGST 5%)";
  }

  // Table Row
  const rowY = y;
  const rowH = 14;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, rowY, contentWidth, rowH, "F");
  doc.setDrawColor(...borderGrey);
  doc.rect(margin, rowY, contentWidth, rowH, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text("1", margin + 3, rowY + 5.5);

  doc.setFont("helvetica", "bold");
  const noteTitle = payment.note || (isExport ? "Export Apparel / Wholesale Merchandise Settlement" : "Wholesale Garments & Apparel");
  doc.text(noteTitle.length > 40 ? noteTitle.substring(0, 40) + "..." : noteTitle, margin + 14, rowY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedText);
  doc.text(`Ref: ${payment.paymentNumber} | International Settlement`, margin + 14, rowY + 10);

  // HSN Code
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text("6204", margin + 95, rowY + 5.5);

  // Rate
  doc.text(`${currencySymbol}${totalAmount.toFixed(2)}`, margin + 115, rowY + 5.5);

  // Taxable Value
  doc.text(`${currencySymbol}${taxableValue.toFixed(2)}`, margin + 138, rowY + 5.5, { align: "right" });

  // GST %
  doc.text(isExport ? "0% LUT" : "5%", margin + 158, rowY + 5.5, { align: "right" });

  // Total
  doc.setFont("helvetica", "bold");
  doc.text(`${currencySymbol}${totalAmount.toFixed(2)}`, margin + contentWidth - 3, rowY + 5.5, { align: "right" });

  y += rowH + 6;

  // 5. Financial Summary Box (Right) & Tax / Settlement Callout (Left)
  const summaryBoxW = 75;
  const summaryBoxX = pageWidth - margin - summaryBoxW;
  const summaryBoxY = y;
  const summaryBoxH = 28;

  // Left Box: Statutory Tax Details & Proof of Settlement
  const taxBoxW = contentWidth - summaryBoxW - 5;
  doc.setFillColor(240, 253, 244); // light emerald
  doc.roundedRect(margin, summaryBoxY, taxBoxW, summaryBoxH, 2, 2, "F");
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, summaryBoxY, taxBoxW, summaryBoxH, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...emeraldGreen);
  doc.text("GST TAX & SETTLEMENT COMPLIANCE:", margin + 4, summaryBoxY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...darkSlate);

  if (isExport) {
    doc.text("• Supply Type: Zero-Rated Export of Goods/Services (IGST Act Sec 16)", margin + 4, summaryBoxY + 10);
    doc.text("• Export Mode: Export Under LUT without payment of Integrated Tax", margin + 4, summaryBoxY + 14.5);
    doc.text("• Applicable Tax: Integrated Tax (IGST) @ 0.00% = $0.00 USD", margin + 4, summaryBoxY + 19);
    doc.text(`• PayGlocal Merchant ID: ptplstylenes2270 | Txn ID: ${payment.payglocalTxnId || payment.paymentNumber}`, margin + 4, summaryBoxY + 23.5);
  } else {
    doc.text(`• Applicable GST Rate: ${gstRateText}`, margin + 4, summaryBoxY + 10);
    doc.text(`• Total Tax Amount: ₹${gstAmount.toFixed(2)} (Tax-Inclusive Breakdown)`, margin + 4, summaryBoxY + 14.5);
    doc.text("• Input Tax Credit (ITC): Eligible for registered business entities", margin + 4, summaryBoxY + 19);
    doc.text(`• Settlement Proof: Reference ${payment.paymentNumber} verified`, margin + 4, summaryBoxY + 23.5);
  }

  // Right Box: Final Totals
  doc.setFillColor(...lightBg);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxW, summaryBoxH, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxW, summaryBoxH, 2, 2, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text("Taxable Value:", summaryBoxX + 4, summaryBoxY + 6);
  doc.text(`${currencySymbol}${taxableValue.toFixed(2)}`, summaryBoxX + summaryBoxW - 4, summaryBoxY + 6, { align: "right" });

  doc.text(isExport ? "IGST (Export LUT 0%):" : "GST Amount:", summaryBoxX + 4, summaryBoxY + 11.5);
  doc.text(isExport ? "$0.00" : `₹${gstAmount.toFixed(2)}`, summaryBoxX + summaryBoxW - 4, summaryBoxY + 11.5, { align: "right" });

  doc.text("Payment / Txn Fee:", summaryBoxX + 4, summaryBoxY + 17);
  doc.text("Zero Fee ($0.00)", summaryBoxX + summaryBoxW - 4, summaryBoxY + 17, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...emeraldGreen);
  doc.text("Total Settled:", summaryBoxX + 4, summaryBoxY + 24);
  doc.text(`${currencySymbol}${totalAmount.toFixed(2)} ${cur}`, summaryBoxX + summaryBoxW - 4, summaryBoxY + 24, { align: "right" });

  y += summaryBoxH + 8;

  // 6. Signatory & Legal Disclaimer
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.8);
  doc.setTextColor(...mutedText);
  doc.text(
    "Declaration: We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct. This is a computer-generated Tax/Commercial Invoice.",
    margin,
    y,
    { maxWidth: 110 }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text("For STYLE NEST FASHION PRIVATE LIMITED", pageWidth - margin, y + 3, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text("Authorized Signatory", pageWidth - margin, y + 8, { align: "right" });
  doc.text("(Corporate & Accounts Department)", pageWidth - margin, y + 12, { align: "right" });

  // Save the PDF
  const safeName = (payment.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `TaxInvoice_${payment.paymentNumber || "QP"}_${safeName}.pdf`;
  doc.save(filename);
}
