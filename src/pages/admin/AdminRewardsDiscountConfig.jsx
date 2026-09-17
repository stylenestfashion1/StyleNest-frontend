import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

const MIN_SLOTS = 2;
const MAX_SLOTS = 10;

// Absolute, non-negotiable safety bounds on any single discount slot --
// matches DiscountConfigServiceImpl.ABSOLUTE_FLOOR/ABSOLUTE_CEILING /
// DiscountSlotRequest's bean validation. No admin typo can ever push a
// real discount outside 1-100%.
const ABSOLUTE_FLOOR = 1;
const ABSOLUTE_CEILING = 100;

let keySeq = 0;
function nextKey() {
  keySeq += 1;
  return `slot-${keySeq}`;
}

// This page controls ONLY the REAL discount configuration that drives
// weighted-random selection for customers. The QR poster's display text
// is a completely separate, independently managed setting that lives at
// Admin -> Rewards -> Show Discount QR -- it is deliberately NOT shown or
// editable here, and nothing on this page reads or writes it.
export default function AdminRewardsDiscountConfig() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [slots, setSlots] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "discount", "config"],
    queryFn: () => adminApi.getAdminDiscountConfig(),
  });

  useEffect(() => {
    if (data) {
      setSlots(data.slots.map((s) => ({ key: nextKey(), discountPercentage: s.discountPercentage, probabilityPercentage: s.probabilityPercentage })));
    }
  }, [data]);

  const saveSlots = useMutation({
    mutationFn: () =>
      adminApi.updateAdminDiscountConfig({
        slots: slots.map(({ discountPercentage, probabilityPercentage }) => ({ discountPercentage, probabilityPercentage })),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "discount", "config"], updated);
      notify("Discount configuration updated successfully", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (isLoading || !slots) return <LoadingState label="Loading discount configuration" />;
  if (isError) return <ErrorState message="Could not load discount configuration." onRetry={refetch} />;

  const totalProbability = slots.reduce((sum, s) => sum + Number(s.probabilityPercentage || 0), 0);
  const discountValues = slots.map((s) => Number(s.discountPercentage)).filter((v) => !Number.isNaN(v));
  const hasDuplicates = new Set(discountValues).size !== discountValues.length;
  const hasOutOfRange = slots.some(
    (s) => s.discountPercentage === "" || Number(s.discountPercentage) < ABSOLUTE_FLOOR || Number(s.discountPercentage) > ABSOLUTE_CEILING
  );
  const hasInvalidProbability = slots.some((s) => s.probabilityPercentage === "" || Number(s.probabilityPercentage) < 0 || Number(s.probabilityPercentage) > 100);
  const slotCountValid = slots.length >= MIN_SLOTS && slots.length <= MAX_SLOTS;
  const isValid = slotCountValid && !hasDuplicates && !hasOutOfRange && !hasInvalidProbability && totalProbability === 100;

  function updateSlot(key, field, value) {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value === "" ? "" : Number(value) } : s)));
  }

  function addSlot() {
    if (slots.length >= MAX_SLOTS) return;
    setSlots((prev) => [...prev, { key: nextKey(), discountPercentage: ABSOLUTE_FLOOR, probabilityPercentage: 0 }]);
  }

  function removeSlot(key) {
    if (slots.length <= MIN_SLOTS) return;
    setSlots((prev) => prev.filter((s) => s.key !== key));
  }

  let validationMessage = "";
  if (!slotCountValid) validationMessage = `You must configure between ${MIN_SLOTS} and ${MAX_SLOTS} discount slots.`;
  else if (hasOutOfRange) validationMessage = `Discount values must be between ${ABSOLUTE_FLOOR}% and ${ABSOLUTE_CEILING}%.`;
  else if (hasDuplicates) validationMessage = "Discount values must be unique.";
  else if (hasInvalidProbability) validationMessage = "Probability must be between 0% and 100%.";
  else if (totalProbability !== 100) validationMessage = "Total probability must equal 100%.";

  return (
    <div>
      <h2 className="text-xl">Custom Discount</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure the REAL discount customers can actually receive through the in-store QR offer — any value from {ABSOLUTE_FLOOR}% to{" "}
        {ABSOLUTE_CEILING}%. Probabilities must add up to exactly 100%. This is separate from the QR poster's display text, which is
        managed under Rewards → Show Discount QR.
      </p>

      <div className="hairline-card mt-8 divide-y">
        {slots.map((slot) => (
          <div key={slot.key} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="label-xs text-muted-foreground">Discount %</span>
              <input
                type="number"
                min={ABSOLUTE_FLOOR}
                max={ABSOLUTE_CEILING}
                value={slot.discountPercentage}
                onChange={(e) => updateSlot(slot.key, "discountPercentage", e.target.value)}
                className="field mt-2"
              />
            </label>
            <label className="block">
              <span className="label-xs text-muted-foreground">Probability %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={slot.probabilityPercentage}
                onChange={(e) => updateSlot(slot.key, "probabilityPercentage", e.target.value)}
                className="field mt-2"
              />
            </label>
            <button
              type="button"
              disabled={slots.length <= MIN_SLOTS}
              onClick={() => removeSlot(slot.key)}
              className="btn-outline inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remove slot"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        ))}

        <div className="p-6">
          <button type="button" onClick={addSlot} disabled={slots.length >= MAX_SLOTS} className="btn-outline disabled:cursor-not-allowed disabled:opacity-40">
            + Add Discount
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className={`label-xs ${isValid ? "text-accent" : "text-destructive"}`}>
            Total Probability: {totalProbability}% {isValid ? "— Configuration Valid" : `— ${validationMessage}`}
          </p>
          <button disabled={!isValid || saveSlots.isPending} className="btn-solid" onClick={() => saveSlots.mutate()}>
            {saveSlots.isPending ? "Saving..." : "Apply Changes"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Changing this configuration only affects future QR discount claims — customers who already generated a discount keep the percentage
        they received, even if you change these values afterward.
      </p>
    </div>
  );
}
