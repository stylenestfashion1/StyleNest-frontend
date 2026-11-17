/**
 * Google Tag Manager (GTM) Integration
 * Container loader allowing marketing tags to be added without code modifications.
 * Safe & non-blocking: only initializes if a valid GTM Container ID (GTM-XXXXXXX) is provided.
 */
export const initGtm = (customId) => {
  if (typeof window === "undefined") return;

  const gtmId = customId || import.meta.env.VITE_GTM_ID || window.GTM_ID;
  if (!gtmId || gtmId === "GTM_ID_PLACEHOLDER" || !gtmId.trim()) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (document.getElementById("gtm-script")) return;

  try {
    const cleanId = gtmId.trim();
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.id = "gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${cleanId}`;
    document.head.appendChild(script);
  } catch (err) {
    console.debug("[GTM] Initialization error:", err);
  }
};
