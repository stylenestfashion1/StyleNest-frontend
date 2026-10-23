import { jsPDF } from "jspdf";

/**
 * Generates and downloads a clean, professional PDF Tax / Commercial Invoice
 * for StyleNest Quick Payments and Wholesale Settlements.
 */
export async function downloadQuickPayInvoicePdf(payment) {
  if (!payment) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const darkSlate = [15, 23, 42];     // #0F172A
  const mutedText = [100, 116, 139];  // #64748B
  const accentGold = [180, 83, 9];    // #B45309
  const emeraldGreen = [5, 150, 105]; // #059669
  const lightBg = [248, 250, 252];    // #F8FAFC
  const borderGrey = [226, 232, 240]; // #E2E8F0

  // 1. Top Brand Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...darkSlate);
  doc.text("STYLE NEST FASHION", margin, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text("Luxury Pret & International Wholesale Atelier", margin, y + 11);

  // Invoice Title on Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...accentGold);
  doc.text("COMMERCIAL INVOICE", pageWidth - margin, y + 6, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...emeraldGreen);
  doc.text("OFFICIAL PAYMENT SETTLED", pageWidth - margin, y + 11, { align: "right" });

  y += 18;

  // Horizontal Divider Line
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // 2. Metadata Grid (Seller Info on Left, Invoice Details on Right)
  const metaBoxY = y;
  const colWidth = (contentWidth - 8) / 2;

  // Left Box: Seller Details
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, metaBoxY, colWidth, 32, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, metaBoxY, colWidth, 32, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text("ISSUED BY:", margin + 4, metaBoxY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text("StyleNest Fashion Private Limited", margin + 4, metaBoxY + 11);
  doc.text("Atelier: Indore, Madhya Pradesh, India (PIN 452010)", margin + 4, metaBoxY + 16);
  doc.text("Email: support@stylenestfashion.com | www.stylenestfashion.com", margin + 4, metaBoxY + 21);
  doc.text("GSTIN / Tax ID: Registered | IEC: 0316987654 (Export/Import)", margin + 4, metaBoxY + 26);

  // Right Box: Invoice Meta
  const rightBoxX = margin + colWidth + 8;
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightBoxX, metaBoxY, colWidth, 32, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(rightBoxX, metaBoxY, colWidth, 32, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text("INVOICE DETAILS:", rightBoxX + 4, metaBoxY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(`Invoice No: INV-${payment.paymentNumber || "QP"}`, rightBoxX + 4, metaBoxY + 11);
  
  const paymentDate = payment.createdAt
    ? new Date(payment.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString();
  doc.text(`Date of Issue: ${paymentDate}`, rightBoxX + 4, metaBoxY + 16);
  doc.text(`Payment Gateway: PayGlocal International (Verified)`, rightBoxX + 4, metaBoxY + 21);
  doc.text(`Gateway GID: ${payment.payglocalGid || "Direct Settlement"}`, rightBoxX + 4, metaBoxY + 26);

  y += 38;

  // 3. Customer / Bill To & Ship To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkSlate);
  doc.text("BILL TO / SHIP TO (CUSTOMER DETAILS)", margin, y);
  y += 4;

  const billBoxHeight = 32;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, billBoxHeight, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, y, contentWidth, billBoxHeight, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...darkSlate);
  doc.text(payment.customerName || "Valued International Client", margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedText);

  // Left Column of Bill To: Contacts
  doc.text(`Email: ${payment.customerEmail || "—"}`, margin + 6, y + 13);
  doc.text(`Phone: ${payment.customerPhone || "—"}`, margin + 6, y + 19);

  // Right Column of Bill To: Full Shipping Address & ZIP
  const addrX = margin + contentWidth / 2;
  const addressLine = [payment.addressLine1, payment.addressLine2].filter(Boolean).join(", ") || "Address on file";
  doc.text(`Shipping Address: ${addressLine}`, addrX, y + 7);
  doc.text(`City & State: ${[payment.city, payment.state].filter(Boolean).join(", ") || "—"}`, addrX, y + 13);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...accentGold);
  doc.text(`Postal / ZIP Code: ${payment.postalCode || "—"}, ${payment.country || "Australia"}`, addrX, y + 19);

  y += billBoxHeight + 8;

  // 4. Line Items Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkSlate);
  doc.text("ORDER & PAYMENT LINE ITEMS", margin, y);
  y += 4;

  // Table Header
  const tableHeaderY = y;
  doc.setFillColor(...lightBg);
  doc.rect(margin, tableHeaderY, contentWidth, 8, "F");
  doc.setDrawColor(...borderGrey);
  doc.rect(margin, tableHeaderY, contentWidth, 8, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text("SL", margin + 4, tableHeaderY + 5.5);
  doc.text("ITEM DESCRIPTION & PURPOSE", margin + 18, tableHeaderY + 5.5);
  doc.text("CURRENCY", margin + contentWidth - 55, tableHeaderY + 5.5, { align: "right" });
  doc.text("AMOUNT SETTLED", margin + contentWidth - 4, tableHeaderY + 5.5, { align: "right" });

  y += 8;

  // Table Row
  const itemRowY = y;
  const rowHeight = 16;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, itemRowY, contentWidth, rowHeight, "F");
  doc.setDrawColor(...borderGrey);
  doc.rect(margin, itemRowY, contentWidth, rowHeight, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text("1", margin + 4, itemRowY + 7);

  doc.setFont("helvetica", "bold");
  const noteTitle = payment.note || "Wholesale Merchandise & Export Settlement";
  doc.text(noteTitle, margin + 18, itemRowY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(`Payment Reference: ${payment.paymentNumber} | International Settlement`, margin + 18, itemRowY + 11);

  const cur = payment.currency || "USD";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  doc.text(cur, margin + contentWidth - 55, itemRowY + 7, { align: "right" });

  const formattedAmount = Number(payment.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  doc.text(`${cur === "USD" ? "$" : "₹"}${formattedAmount}`, margin + contentWidth - 4, itemRowY + 7, { align: "right" });

  y += rowHeight + 8;

  // 5. Total & Summary Box (Bottom Right)
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;
  const summaryBoxY = y;

  doc.setFillColor(...lightBg);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, 24, 2, 2, "F");
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, 24, 2, 2, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text("Subtotal:", summaryBoxX + 4, summaryBoxY + 6);
  doc.text(`${cur === "USD" ? "$" : "₹"}${formattedAmount}`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 6, { align: "right" });

  doc.text("Processing / Tax:", summaryBoxX + 4, summaryBoxY + 12);
  doc.text("Zero Fee ($0.00)", summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...emeraldGreen);
  doc.text("Total Paid:", summaryBoxX + 4, summaryBoxY + 19);
  doc.text(`${cur === "USD" ? "$" : "₹"}${formattedAmount}`, summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 19, { align: "right" });

  // Payment Status Callout (Bottom Left)
  const statusCalloutWidth = contentWidth - summaryBoxWidth - 8;
  doc.setFillColor(240, 253, 244); // light green bg
  doc.roundedRect(margin, summaryBoxY, statusCalloutWidth, 24, 2, 2, "F");
  doc.setDrawColor(187, 247, 208); // green border
  doc.roundedRect(margin, summaryBoxY, statusCalloutWidth, 24, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...emeraldGreen);
  doc.text("PAYMENT CONFIRMATION: SETTLED IN FULL", margin + 6, summaryBoxY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(`Transaction Reference: ${payment.payglocalTxnId || payment.paymentNumber}`, margin + 6, summaryBoxY + 13);
  doc.text(`Authorized by: PayGlocal Merchant Gateway (ptplstylenes2270)`, margin + 6, summaryBoxY + 18);

  y += 34;

  // 6. Signatory & Declaration
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(
    "Declaration: This is a computer-generated commercial invoice and payment receipt. Goods and export services are fulfilled as per agreed wholesale terms.",
    margin,
    y
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text("For STYLE NEST FASHION PVT. LTD.", pageWidth - margin, y + 8, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text("Authorized Signatory & Accounts Department", pageWidth - margin, y + 13, { align: "right" });

  // Save the PDF
  const filename = `Invoice_${payment.paymentNumber || "QP"}_${(payment.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
}
