import { jsPDF } from "jspdf";

/**
 * Universal PDF Tax / Commercial Invoice Generator for StyleNest Admin
 * Supports:
 * 1. Domestic B2B Wholesale (India - INR, CGST/SGST/IGST breakdown)
 * 2. International Export (USD / Foreign Currencies, 0% Zero-Rated LUT export)
 * 
 * Styled exactly in StyleNest's signature Brand Purple (#7C6CD6) layout.
 */
export function generateCustomInvoicePdf(data) {
  if (!data) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const brandPurple = [124, 108, 214]; // #7C6CD6
  const darkSlate = [30, 41, 59];      // #1E293B
  const textMuted = [100, 116, 139];   // #64748B
  const lightGrey = [245, 245, 247];   // #F5F5F7
  const borderGrey = [218, 222, 229];  // #DADEE5

  const isExport = data.isExport;
  const curSymbol = data.currencySymbol || (isExport ? "$" : "Rs. ");
  const cur = data.currency || (isExport ? "USD" : "INR");

  // 1. Centered Seller Header (StyleNest Verified Legal Data)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...darkSlate);
  doc.text("Style Nest Fashion Private Limited", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text(
    "175-B, Amrit Palace, Nipania, Indore, MP - 452010 | Ph. no.: 6269933231 | Email: stylenestfashion1@gmail.com",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 4.5;

  doc.text("State: Madhya Pradesh (State Code: 23)", pageWidth / 2, y, { align: "center" });
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkSlate);
  doc.text("GSTIN: 23ABUCS8160R1ZA       CIN No.: U14101MP2026PTC086429", pageWidth / 2, y, { align: "center" });
  y += 6;

  // Brand Purple Divider Line
  doc.setDrawColor(...brandPurple);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. Title Banner
  doc.setFillColor(...brandPurple);
  doc.rect(margin, y, contentWidth, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  const titleText = data.titleText || (isExport ? "TAX INVOICE / EXPORT COMMERCIAL INVOICE" : "TAX INVOICE (DOMESTIC B2B WHOLESALE)");
  doc.text(titleText, pageWidth / 2, y + 5, { align: "center" });
  y += 10;

  // 3. Bill To & Invoice Details Section
  const infoStartY = y;
  const colWidth = (contentWidth - 6) / 2;

  // Left: Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkSlate);
  doc.text("Bill To (Customer Details):", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.customer?.name || "Customer", margin, y);
  y += 4;

  if (data.customer?.company) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(data.customer.company, margin, y);
    y += 3.8;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);

  const address = data.customer?.address || "";
  if (address) {
    const wrappedAddr = doc.splitTextToSize(address, colWidth - 2);
    doc.text(wrappedAddr, margin, y);
    y += wrappedAddr.length * 3.8;
  }

  const cityStateZip = [data.customer?.city, data.customer?.state, data.customer?.postalCode].filter(Boolean).join(", ");
  if (cityStateZip) {
    doc.text(cityStateZip, margin, y);
    y += 3.8;
  }

  if (data.customer?.country) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkSlate);
    doc.text(`Country: ${data.customer.country}`, margin, y);
    y += 3.8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
  }

  if (data.customer?.phone) {
    doc.text(`Contact No.: ${data.customer.phone}`, margin, y);
    y += 3.8;
  }
  if (data.customer?.email) {
    doc.text(`Email: ${data.customer.email}`, margin, y);
    y += 3.8;
  }
  if (data.customer?.gstin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkSlate);
    doc.text(`Buyer GSTIN: ${data.customer.gstin}`, margin, y);
    y += 3.8;
  }

  const leftBottomY = y;

  // Right: Invoice Details
  let rightY = infoStartY;
  const rightX = margin + colWidth + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkSlate);
  doc.text("Invoice & Order Details:", rightX, rightY);
  rightY += 4.5;

  const dateTimeFormatted = data.invoiceDateTime || (
    data.invoiceTime ? `${data.invoiceDate || ""} ${data.invoiceTime}` : (data.invoiceDate || new Date().toLocaleDateString("en-IN"))
  );

  const invDetails = [
    ["Invoice No.:", data.invoiceNo || "INV-BO"],
    ["Date & Time:", dateTimeFormatted],
    ["Order / Ref No.:", data.orderNo || "SN-BO"],
    ["Payment Mode:", data.paymentMode || "Online (PayGlocal / Bank)"],
  ];

  if (data.transactionId) {
    invDetails.push(["Txn / UTR Ref:", data.transactionId]);
  }

  invDetails.push(["Place of Supply:", data.placeOfSupply || (isExport ? "Outside India (Code 96)" : "State")]);

  doc.setFontSize(8);
  invDetails.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
    doc.text(label, rightX, rightY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkSlate);
    const valStr = String(val || "");
    const maxValW = (pageWidth - margin) - (rightX + 24);
    const splitVal = doc.splitTextToSize(valStr, maxValW);
    doc.text(splitVal, rightX + 24, rightY);
    rightY += Math.max(4, splitVal.length * 3.4);
  });

  y = Math.max(leftBottomY, rightY) + 5;

  // 4. Line Items Table (Purple Header)
  const thY = y;
  doc.setFillColor(...brandPurple);
  doc.rect(margin, thY, contentWidth, 6.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text("#", margin + 3, thY + 4.5);
  doc.text("Item Name & Description", margin + 12, thY + 4.5);
  doc.text("HSN/SAC", margin + 82, thY + 4.5);
  doc.text("Qty", margin + 102, thY + 4.5);
  doc.text("Price/Unit", margin + 128, thY + 4.5, { align: "right" });
  doc.text(isExport ? "Tax Rate" : "GST %", margin + 152, thY + 4.5, { align: "right" });
  doc.text("Total Amount", margin + contentWidth - 3, thY + 4.5, { align: "right" });

  y += 6.5;

  // Rows
  const items = data.items && data.items.length > 0 ? data.items : [
    { name: "Bulk Order", desc: "Wholesale Apparel", hsn: "6204", qty: 1, price: 0, gstRate: "0%", lineTotal: 0 }
  ];

  items.forEach((item, index) => {
    const rowY = y;
    const hasDesc = !!item.desc;
    const rowH = hasDesc ? 12 : 9;

    doc.setDrawColor(...borderGrey);
    doc.rect(margin, rowY, contentWidth, rowH, "D");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    doc.text(String(index + 1), margin + 3, rowY + 5);

    doc.setFont("helvetica", "bold");
    const nameStr = String(item.name || "Item");
    doc.text(nameStr.length > 36 ? nameStr.substring(0, 36) + "..." : nameStr, margin + 12, rowY + 5);

    if (hasDesc) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...textMuted);
      const descStr = String(item.desc);
      doc.text(descStr.length > 46 ? descStr.substring(0, 46) + "..." : descStr, margin + 12, rowY + 9);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    doc.text(String(item.hsn || "6204"), margin + 82, rowY + 5);
    doc.text(`${item.qty} pcs`, margin + 102, rowY + 5);

    const priceNum = Number(item.price || 0);
    const lineTotalNum = Number(item.lineTotal || (item.qty * priceNum));
    doc.text(`${curSymbol}${priceNum.toFixed(2)}`, margin + 128, rowY + 5, { align: "right" });
    doc.text(String(item.gstRate || (isExport ? "0% (LUT)" : "5%")), margin + 152, rowY + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(`${curSymbol}${lineTotalNum.toFixed(2)}`, margin + contentWidth - 3, rowY + 5, { align: "right" });

    y += rowH;
  });

  y += 6;

  // 5. Summary & Tax Compliance Section
  const summaryBoxW = 88;
  const summaryBoxX = pageWidth - margin - summaryBoxW;
  const summaryBoxY = y;
  const summaryLines = data.summaryLines || [];
  const summaryBoxH = Math.max(36, summaryLines.length * 4.6 + 6);

  // Left Side: Amount in Words (Clean, no statutory compliance box)
  const leftBoxW = contentWidth - summaryBoxW - 6;
  if (data.amountInWords) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text("Amount in Words:", margin, summaryBoxY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textMuted);
    const wrappedWords = doc.splitTextToSize(String(data.amountInWords), leftBoxW);
    doc.text(wrappedWords, margin, summaryBoxY + 9.5);
  }

  // Right Box: Amounts Breakdown
  doc.setFillColor(...lightGrey);
  doc.setDrawColor(...borderGrey);
  doc.rect(summaryBoxX, summaryBoxY, summaryBoxW, summaryBoxH, "FD");
  let amtY = summaryBoxY + 4.5;
  summaryLines.forEach(([lbl, val, bold]) => {
    if (lbl === "LINE") {
      doc.setDrawColor(...borderGrey);
      doc.line(summaryBoxX + 4, amtY - 1, summaryBoxX + summaryBoxW - 4, amtY - 1);
      amtY += 2;
      return;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 8.5 : 7.8);
    doc.setTextColor(...(bold ? darkSlate : textMuted));
    doc.text(lbl, summaryBoxX + 4, amtY);
    doc.text(String(val), summaryBoxX + summaryBoxW - 4, amtY, { align: "right" });
    amtY += 4.5;
  });

  y = summaryBoxY + summaryBoxH + 6;

  // Amount in Words already placed on left side of summary

  // 6. Footer & Signatory
  doc.setDrawColor(...borderGrey);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.8);
  doc.setTextColor(...textMuted);
  doc.text(
    "This is a computer-generated Tax/Commercial Invoice. Certified that all particulars are true and correct.",
    margin,
    y,
    { maxWidth: 110 }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text("For STYLE NEST FASHION PRIVATE LIMITED", pageWidth - margin, y + 2, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text("Authorized Signatory", pageWidth - margin, y + 7, { align: "right" });

  // Download directly
  const safeCustomer = (data.customer?.name || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${data.invoiceNo || "Invoice"}_${safeCustomer}.pdf`;
  doc.save(filename);
}
