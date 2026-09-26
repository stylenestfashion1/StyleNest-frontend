import { createContext, useCallback, useContext, useEffect, useState } from "react";

const CurrencyContext = createContext(null);
const STORAGE_KEY = "stylenest_currency";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "USD" ? "USD" : "INR";
  } catch {
    return "INR";
  }
}

/**
 * Which currency the customer is currently browsing/checking out in --
 * INR or USD. Always defaults to INR for a new visitor (no IP/geo
 * detection, per spec); a manual switch is the only way to change it, and
 * it's remembered in localStorage. This context only tracks the selection
 * -- it does NOT decide what happens to an in-progress cart when it
 * changes (see CurrencyToggle, which clears the cart on switch). The
 * backend is the sole source of truth for prices and never trusts this
 * value for anything beyond "which price/cart the customer wants to see" --
 * every order is priced and validated server-side against the cart's own
 * stored currency (see OrderServiceImpl).
 */
export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // storage unavailable -- selection just won't persist across reloads
    }
  }, [currency]);

  const setCurrency = useCallback((next) => setCurrencyState(next === "USD" ? "USD" : "INR"), []);

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
