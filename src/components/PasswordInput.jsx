import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ label, value, onChange, name, required, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <label className="block">
      {label && <span className="label-xs text-muted-foreground">{label}</span>}
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="field pr-8"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-accent"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
