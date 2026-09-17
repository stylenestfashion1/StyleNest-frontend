import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Uses browser history when there's somewhere meaningful to go back to
 * (we arrived via in-app navigation), otherwise falls back to a sensible
 * parent route so the button is never a dead end.
 */
export default function BackButton({ fallback = "/", label = "Back", className = "" }) {
  const navigate = useNavigate();

  function handleClick() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button type="button" onClick={handleClick} className={`label-xs inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground ${className}`}>
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
