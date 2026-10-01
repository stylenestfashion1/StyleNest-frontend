import { verifyPayment } from "../api/payments";

const SDK_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

let loadPromise = null;
let cashfreeInstance = null;

function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.onload = () => (window.Cashfree ? resolve() : reject(new Error("Cashfree Checkout failed to load.")));
    script.onerror = () => reject(new Error("Cashfree Checkout failed to load."));
    document.body.appendChild(script);
  });

  return loadPromise;
}

function getCashfreeInstance() {
  if (!cashfreeInstance) {
    cashfreeInstance = window.Cashfree({ mode: "production" });
  }
  return cashfreeInstance;
}

/**
 * Opens Cashfree Checkout (v3 SDK, modal mode) for an already-created order
 * (the response from POST /payments/initiate or /payments/guest/initiate),
 * then independently confirms the real outcome via our own backend.
 *
 * Never trusts the client-side checkout() resolution alone: Cashfree's own
 * docs note result.paymentDetails fires "whenever the payment is completed
 * irrespective of transaction status", and result.error fires both for a
 * genuine payment error AND for the customer simply closing the modal --
 * neither is distinguishable from the client side. The only reliable
 * signal is always the server-to-server /payments/verify call below,
 * which is why every branch (except the rare in-app-browser redirect,
 * where this page context may not survive to run more code anyway) calls
 * it before deciding the outcome.
 */
export async function payWithCashfree(initiation) {
  await loadCashfreeSdk();
  const cashfree = getCashfreeInstance();

  const result = await cashfree.checkout({
    paymentSessionId: initiation.paymentSessionId,
    redirectTarget: "_modal",
  });

  if (result.redirect) {
    // In-app-browser fallback only -- payment continues outside this page
    // context, nothing left here to verify yet.
    return { outcome: "redirected" };
  }

  try {
    const verified = await verifyPayment({ providerOrderId: initiation.providerOrderId });
    if (verified.paymentStatus === "PAID") {
      return { outcome: "success", verified };
    }
    return { outcome: "pending", verified };
  } catch (err) {
    return { outcome: "error", error: err };
  }
}
