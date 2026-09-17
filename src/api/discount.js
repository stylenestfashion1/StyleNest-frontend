import client from "./client";

// In-store QR discount flow -- public endpoints, but never guessable/usable
// without the real flow: /verify requires the exact permanent QR secret
// token from the URL, and /claim requires the short-lived session token
// /verify returns (sent via the X-Discount-Session header, mirroring the
// X-Bulk-Token convention used for the wholesale catalog gate).
export const verifyQrToken = (qrToken) => client.post("/discount/verify", { qrToken });

export const claimDiscount = (sessionToken, data) =>
  client.post("/discount/claim", data, { headers: { "X-Discount-Session": sessionToken } });
