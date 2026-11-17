/**
 * Microsoft Clarity Integration
 * Session recording & user heatmap tracking.
 * Safe & non-blocking: only initializes if a valid Clarity Project ID is provided.
 */
export const initClarity = (customId) => {
  if (typeof window === "undefined") return;

  const projectId = customId || import.meta.env.VITE_CLARITY_ID || window.CLARITY_ID;
  if (!projectId || projectId === "CLARITY_ID_PLACEHOLDER" || !projectId.trim()) {
    return;
  }

  if (window.clarity) return; // Already initialized

  try {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", projectId.trim());
  } catch (err) {
    console.debug("[Clarity] Initialization error:", err);
  }
};
