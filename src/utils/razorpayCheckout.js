import { verifyRazorpayPayment } from "../api/payments";

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise = null;

function loadRazorpayCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => (window.Razorpay ? resolve() : reject(new Error("Razorpay Checkout failed to load.")));
    script.onerror = () => reject(new Error("Razorpay Checkout failed to load."));
    document.body.appendChild(script);
  });

  return loadPromise;
}

/**
 * Opens Razorpay Checkout for an already-created order (the response from
 * POST /payments/razorpay/initiate or /guest/initiate) and resolves once
 * the customer's interaction with the modal actually concludes -- either a
 * verified success or the modal being dismissed.
 *
 * A payment.failed event for one sub-attempt deliberately does NOT resolve
 * this promise: Razorpay's own modal lets the customer retry a different
 * method in the same session, and the backend is built to allow exactly
 * that (see PaymentServiceImpl -- a failed attempt never cancels the
 * order). onPaymentFailed is purely informational; only closing the modal
 * (ondismiss) ends the flow from here.
 *
 * Never trusts the client-side handler callback alone: the resolved
 * "success" outcome only happens after verifyRazorpayPayment has confirmed
 * the payment server-side against Razorpay's own records.
 */
export async function payWithRazorpay(initiation, { prefill, onPaymentFailed } = {}) {
  await loadRazorpayCheckoutScript();

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      key: initiation.razorpayKeyId,
      amount: initiation.amountMinor,
      currency: initiation.currency,
      order_id: initiation.razorpayOrderId,
      name: "StyleNest Fashion",
      description: `Order ${initiation.orderNumber}`,
      prefill,
      theme: { color: "#111111" },
      handler: async (response) => {
        try {
          const verified = await verifyRazorpayPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve({ outcome: "success", verified });
        } catch (err) {
          resolve({ outcome: "error", error: err });
        }
      },
      modal: {
        ondismiss: () => resolve({ outcome: "dismissed" }),
      },
    });

    razorpay.on("payment.failed", (response) => {
      onPaymentFailed?.(response);
    });

    razorpay.open();
  });
}
