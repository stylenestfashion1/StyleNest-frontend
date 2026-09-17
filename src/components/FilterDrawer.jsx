import { useEffect } from "react";
import { X } from "lucide-react";
import { getSwatchColor } from "../utils/swatchColor";
import { ALL_SIZES } from "../utils/sizeLabel";

const COLORS = ["BLACK", "WHITE", "BLUE", "RED", "GREEN", "BEIGE", "GREY", "BROWN", "PINK", "YELLOW", "ORANGE", "PURPLE"];

export default function FilterDrawer({ open, onClose, filters, onChange, categories }) {
  useEffect(() => {
    if (open) {
      const onKey = (e) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-background p-8 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl">Filters</h3>
          <button onClick={onClose} aria-label="Close filters">
            <X className="h-5 w-5" />
          </button>
        </div>

        {categories?.length > 0 && (
          <FilterSection title="Category">
            <div className="flex flex-col gap-2">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="categoryId" checked={String(filters.categoryId) === String(c.id)} onChange={() => onChange({ categoryId: c.id })} />
                  {c.name}
                </label>
              ))}
              {filters.categoryId && (
                <button onClick={() => onChange({ categoryId: undefined })} className="label-xs link-underline mt-1 w-fit text-accent">
                  Clear
                </button>
              )}
            </div>
          </FilterSection>
        )}

        <FilterSection title="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ color: filters.color === color ? undefined : color })}
                className={`h-8 w-8 rounded-full ring-1 ring-inset ring-black/10 transition-all hover:scale-110 ${filters.color === color ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
                style={{ backgroundColor: getSwatchColor(color) }}
                aria-label={color}
                title={color}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ size: filters.size === value ? undefined : value })}
                className={`label-xs min-w-10 border px-3 py-2.5 transition-colors ${
                  filters.size === value ? "bg-foreground text-primary-foreground" : "hover:border-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Price">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="field"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="field"
            />
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="mt-8 border-t pt-6 first:mt-6 first:border-t-0 first:pt-0">
      <h4 className="label-xs mb-4 text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}
