export default function LoadingState({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
      <div className="h-8 w-8 rounded-full border border-accent border-t-transparent animate-spin" />
      <span className="label-xs">{label}</span>
    </div>
  );
}
