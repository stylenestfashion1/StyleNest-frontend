import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import * as adminApi from "../../api/admin";
import { formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";

export default function AdminBulkTokens() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading } = useQuery({ queryKey: ["admin", "bulk-tokens"], queryFn: adminApi.getAdminBulkTokens });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "bulk-tokens"] });

  const provision = useMutation({
    mutationFn: adminApi.provisionAdminBulkTokens,
    onSuccess: () => {
      invalidate();
      notify("Permanent access tokens provisioned", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const revoke = useMutation({
    mutationFn: (id) => adminApi.revokeAdminBulkToken(id),
    onSuccess: () => {
      invalidate();
      notify("Access token revoked", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const reactivate = useMutation({
    mutationFn: (id) => adminApi.reactivateAdminBulkToken(id),
    onSuccess: () => {
      invalidate();
      notify("Access token reactivated", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const unassign = useMutation({
    mutationFn: (id) => adminApi.unassignAdminBulkToken(id),
    onSuccess: () => {
      invalidate();
      notify("Access token unassigned -- ready for a new customer", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const reissue = useMutation({
    mutationFn: (id) => adminApi.reissueAdminBulkToken(id),
    onSuccess: () => {
      invalidate();
      notify("Access token reissued with a new code", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  function copyToken(token) {
    navigator.clipboard?.writeText(token);
    notify("Token copied", "success");
  }

  const tokens = data ?? [];

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl">Bulk Access Tokens</h2>
          <p className="label-xs mt-2 text-muted-foreground">
            10 permanent wholesale access codes. No expiry -- share one with a customer when they call, and
            revoke/unassign/reissue as needed.
          </p>
        </div>
        <button onClick={() => provision.mutate()} disabled={provision.isPending} className="btn-outline">
          {provision.isPending ? "Checking..." : "Provision Missing Tokens"}
        </button>
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {tokens.map((t) => (
            <div key={t.id} className="hairline-card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg tracking-wider">{t.token}</span>
                  <button aria-label="Copy token" onClick={() => copyToken(t.token)}>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span className={`label-xs ${t.status === "ACTIVE" ? "text-accent" : "text-destructive"}`}>
                    {t.status}
                  </span>
                </div>
                <p className="label-xs mt-2 text-muted-foreground">Created {formatDate(t.createdAt)}</p>

                {t.assignedCustomerEmail ? (
                  <p className="mt-2 text-sm">
                    Assigned to <span className="text-foreground">{t.assignedCustomerName}</span>
                    <span className="label-xs ml-2 text-muted-foreground">
                      {t.assignedCustomerEmail} · {t.assignedCustomerPhone}
                    </span>
                  </p>
                ) : (
                  <p className="label-xs mt-2 text-muted-foreground">Unassigned</p>
                )}

                {(t.firstUsedAt || t.lastUsedAt) && (
                  <p className="label-xs mt-1 text-muted-foreground">
                    {t.firstUsedAt && `First used ${formatDate(t.firstUsedAt)}`}
                    {t.firstUsedAt && t.lastUsedAt && " · "}
                    {t.lastUsedAt && `Last used ${formatDate(t.lastUsedAt)}`}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {t.status === "ACTIVE" ? (
                  <button className="label-xs link-underline text-destructive" onClick={() => revoke.mutate(t.id)}>
                    Revoke
                  </button>
                ) : (
                  <button className="label-xs link-underline text-accent" onClick={() => reactivate.mutate(t.id)}>
                    Reactivate
                  </button>
                )}
                {t.assignedCustomerEmail && (
                  <button className="label-xs link-underline" onClick={() => unassign.mutate(t.id)}>
                    Unassign
                  </button>
                )}
                <button className="label-xs link-underline" onClick={() => reissue.mutate(t.id)}>
                  Reissue
                </button>
              </div>
            </div>
          ))}
          {tokens.length === 0 && <p className="py-8 text-sm text-muted-foreground">No access tokens found.</p>}
        </div>
      )}
    </div>
  );
}
