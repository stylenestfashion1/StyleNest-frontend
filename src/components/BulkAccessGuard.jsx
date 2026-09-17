import { Navigate } from "react-router-dom";
import { getBulkToken } from "../api/bulkClient";

/**
 * Frontend-only convenience redirect for the wholesale catalog/cart/
 * checkout pages -- if there's no bulk token in this tab's sessionStorage,
 * send the customer back to the access-code gate instead of showing an
 * empty/broken page. This is NOT the security boundary: every
 * /api/bulk/customer/** call is independently re-validated server-side
 * (see BulkAccessInterceptor), so a missing/expired/revoked token still
 * fails safely even if this check were bypassed entirely.
 */
export function BulkAccessGuard({ children }) {
  if (!getBulkToken()) {
    return <Navigate to="/bulk-orders" replace />;
  }
  return children;
}
