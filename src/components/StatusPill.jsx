const TONE = {
  DELIVERED: "bg-accent-soft text-accent",
  PAID: "bg-accent-soft text-accent",
  SUCCESS: "bg-accent-soft text-accent",
  CONFIRMED: "bg-accent-soft text-accent",
  COMPLETED: "bg-accent-soft text-accent",
  SHIPPED: "bg-muted text-foreground",
  IN_TRANSIT: "bg-muted text-foreground",
  OUT_FOR_DELIVERY: "bg-muted text-foreground",
  PROCESSING: "bg-muted text-foreground",
  PACKED: "bg-muted text-foreground",
  PENDING: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  FAILED: "bg-destructive/10 text-destructive",
  RETURNED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
};

export function prettyStatus(status) {
  if (!status) return "";
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusPill({ status, className = "" }) {
  return (
    <span className={`label-xs inline-block border px-3 py-1 ${TONE[status] ?? "bg-muted text-foreground"} ${className}`}>
      {prettyStatus(status)}
    </span>
  );
}

export function Stat({ label, value, delta }) {
  return (
    <div className="hairline-card lift-hover p-6">
      <p className="label-xs text-muted-foreground">{label}</p>
      <p className="display mt-3 text-[clamp(1.5rem,2.6vw,2.1rem)] leading-none">{value}</p>
      {delta && <p className="label-xs mt-3 text-accent">{delta}</p>}
    </div>
  );
}
