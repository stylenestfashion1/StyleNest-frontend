import { jsPDF } from "jspdf";

/**
 * Standard 4 x 6 inches in millimeters (101.6 mm x 152.4 mm)
 * Industry standard dispatch parcel label size.
 */
const LABEL_WIDTH_MM = 101.6;
const LABEL_HEIGHT_MM = 152.4;

const BROWN_COLOR = [154, 77, 22];     // #9A4D16
const SUBTITLE_COLOR = [102, 102, 102]; // #666666
const HEADER_GRAY = [85, 85, 85];       // #555555
const BORDER_COLOR = [137, 147, 162];   // #8993A2
const DIVIDER_COLOR = [200, 205, 212];  // #C8CDD4
const TOP_BG_COLOR = [245, 247, 250];   // #F5F7FA

const AU_STATE_MAP = {
  nsw: "New South Wales",
  vic: "Victoria",
  qld: "Queensland",
  wa: "Western Australia",
  sa: "South Australia",
  tas: "Tasmania",
  act: "Australian Capital Territory",
  nt: "Northern Territory",
};

/**
 * Sanitizes and formats recipient address for international shipping and customs.
 * Highly defensive: will NEVER throw runtime errors even if fields are null/undefined.
 */
export function sanitizeRecipientAddress(payment) {
  const p = payment || {};
  let name = String(p.customer_name || p.customerName || "Valued Customer").trim();
  let line1 = String(p.address_line1 || p.addressLine1 || "").trim();
  let line2 = String(p.address_line2 || p.addressLine2 || "").trim();
  let city = String(p.city || "").trim();
  let state = String(p.state || "").trim();
  let postalCode = String(p.postal_code || p.postalCode || "").trim();
  // No country on file is left blank (never guessed) -- printing a wrong
  // destination country on a customs label is worse than an admin noticing
  // a blank line and checking the order before shipping.
  let country = String(p.country || "").trim().toUpperCase();
  let phone = String(p.customer_phone || p.customerPhone || "").trim();

  // 1. Australia City-State mismatch check (e.g. city='nsw' and line1 has town like 'tumut')
  const cityLower = city.toLowerCase();
  if (country === "AUSTRALIA" || country === "AU") {
    if (AU_STATE_MAP[cityLower]) {
      // City is actually a state abbreviation
      if (!state || state.toLowerCase() === cityLower) {
        state = AU_STATE_MAP[cityLower];
      }
      // Check if line1 contains the town name at the end (e.g. '13 king place tumut')
      const line1Tokens = line1.split(/\s+/);
      if (line1Tokens.length > 2) {
        const lastToken = line1Tokens[line1Tokens.length - 1];
        if (lastToken.length > 2) {
          city = lastToken.charAt(0).toUpperCase() + lastToken.slice(1).toLowerCase();
          line1 = line1Tokens.slice(0, -1).join(" ");
        }
      }
    }
  }

  // 2. Format Canadian postal codes (e.g. M4W2T4 -> M4W 2T4)
  if ((country === "CANADA" || country === "CA") && postalCode.length === 6 && !postalCode.includes(" ")) {
    postalCode = `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`;
  }

  if (!line1) {
    line1 = "Delivery Address On File";
  }

  // 3. Format city, state, zip line
  let cityStateZip = "";
  if (city && state && postalCode) {
    cityStateZip = `${city}, ${state} ${postalCode}`;
  } else if (city && postalCode) {
    cityStateZip = `${city} ${postalCode}`;
  } else if (state && postalCode) {
    cityStateZip = `${state} ${postalCode}`;
  } else {
    cityStateZip = postalCode || city || state || "";
  }

  return {
    name,
    line1,
    line2,
    city,
    state,
    postalCode,
    cityStateZip,
    country,
    phone,
  };
}

/**
 * Draws a single shipping label page onto a jsPDF document instance.
 */
function renderLabelPage(doc, payment) {
  const data = sanitizeRecipientAddress(payment);

  // 1. Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BROWN_COLOR);
  doc.text("STYLE NEST FASHION", LABEL_WIDTH_MM / 2, 12.5, { align: "center" });

  // 2. Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...SUBTITLE_COLOR);
  doc.text("SHIPPING ADDRESS LABEL", LABEL_WIDTH_MM / 2, 17, { align: "center" });

  // 3. Outer Box Dimensions (in mm)
  const boxX = 6.6;
  const boxY = 24.0;
  const boxW = 88.4;
  const boxH = 73.0;
  const halfH = boxH / 2.0;

  // Draw Top Background (Light gray/lavender)
  doc.setFillColor(...TOP_BG_COLOR);
  doc.rect(boxX, boxY, boxW, halfH, "F");

  // Draw Bottom Background (White)
  doc.setFillColor(255, 255, 255);
  doc.rect(boxX, boxY + halfH, boxW, halfH, "F");

  // Draw Outer Border
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.35);
  doc.rect(boxX, boxY, boxW, boxH, "D");

  // Draw Middle Divider
  doc.setDrawColor(...DIVIDER_COLOR);
  doc.setLineWidth(0.25);
  doc.line(boxX, boxY + halfH, boxX + boxW, boxY + halfH);

  // 4. Content - TO / DELIVER TO (Top Section)
  const padX = boxX + 4.0;
  let curY = boxY + 6.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...HEADER_GRAY);
  doc.text("TO / DELIVER TO", padX, curY);

  curY += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.name, padX, curY);

  curY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(data.line1, padX, curY);

  if (data.line2) {
    curY += 4.5;
    doc.text(data.line2, padX, curY);
  }

  curY += 4.5;
  doc.text(data.cityStateZip, padX, curY);

  curY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(data.country, padX, curY);

  curY += 5.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Phone: ${data.phone}`, padX, curY);

  // 5. Content - FROM / SENDER (Bottom Section)
  curY = boxY + halfH + 6.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...HEADER_GRAY);
  doc.text("FROM / SENDER", padX, curY);

  curY += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Style Nest Fashion", padX, curY);

  curY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Amrit Palace, Nipania", padX, curY);

  curY += 4.5;
  doc.text("Indore, Madhya Pradesh 452010", padX, curY);

  curY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("INDIA", padX, curY);

  curY += 5.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Phone: 6269933231", padX, curY);
}

/**
 * Downloads a single shipping label PDF.
 */
export function downloadShippingLabelPdf(payment) {
  if (!payment) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM],
  });

  renderLabelPage(doc, payment);

  const cleanNum = String(payment.payment_number || payment.paymentNumber || payment.id || "label").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`StyleNest_Label_${cleanNum}.pdf`);
}
