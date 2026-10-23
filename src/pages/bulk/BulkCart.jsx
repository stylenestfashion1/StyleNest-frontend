import { Link } from "react-router-dom";
import { Minus, Plus, X, PackageCheck, ShieldCheck } from "lucide-react";
import BackButton from "../../components/BackButton";
import { useBulkCart } from "../../context/BulkCartContext";
import { formatPrice } from "../../utils/format";

export default function BulkCart() {
  const bulkCart = useBulkCart();

  if (bulkCart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold md:text-3xl">Your bulk cart is empty</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Browse our wholesale catalog and choose wholesale quantities to proceed.
        </p>
        <Link to="/bulk-orders/catalog" className="btn-solid mt-8 inline-block">
          Browse wholesale catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <BackButton fallback="/bulk-orders/catalog" className="mb-6" />
      <p className="label-xs text-accent uppercase font-bold tracking-wider">Wholesale Order</p>
      <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground">Bulk Cart</h1>
      <p className="text-xs text-muted-foreground mt-1">
        Custom wholesale quantities meeting individual minimum order requirements.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <ul className="divide-y border-y">
          {bulkCart.items.map((item) => {
            const itemKey = item.itemKey || String(item.bulkProductId);
            const minQty = item.minOrderQuantity ?? 10;
            const itemTotal = item.price * item.quantity;
            const availableStock = item.availableStock;

            return (
              <li key={itemKey} className="py-6 flex flex-col sm:flex-row gap-5">
                <div className="h-32 w-28 shrink-0 rounded-lg border bg-[#faf9f6] overflow-hidden flex items-center justify-center p-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {item.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {item.selectedColor && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            Color: {item.selectedColor}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          <PackageCheck className="h-3 w-3" />
                          Min Order: {minQty} pcs
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatPrice(item.price)} / piece
                        </span>
                        {availableStock != null && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {availableStock} in stock
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      aria-label="Remove item"
                      onClick={() => bulkCart.removeItem(itemKey)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                    {/* Pieces Quantity Stepper & Input */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg overflow-hidden bg-card shadow-2xs">
                        <button
                          className="px-3 py-1.5 hover:bg-muted text-muted-foreground disabled:opacity-40 cursor-pointer"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= minQty}
                          onClick={() =>
                            bulkCart.updateQuantity(
                              itemKey,
                              Math.max(minQty, item.quantity - 1)
                            )
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        
                        <input
                          type="number"
                          min={minQty}
                          max={availableStock ?? undefined}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              bulkCart.updateQuantity(itemKey, val);
                            }
                          }}
                          onBlur={() => {
                            if (item.quantity < minQty) {
                              bulkCart.updateQuantity(itemKey, minQty);
                            } else if (availableStock != null && item.quantity > availableStock) {
                              bulkCart.updateQuantity(itemKey, availableStock);
                            }
                          }}
                          className="w-16 text-center font-bold text-sm text-foreground bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label="Edit pieces quantity"
                        />

                        <button
                          className="px-3 py-1.5 hover:bg-muted text-muted-foreground disabled:opacity-40 cursor-pointer"
                          aria-label="Increase quantity"
                          disabled={availableStock != null && item.quantity >= availableStock}
                          onClick={() => {
                            const next = item.quantity + 1;
                            if (availableStock == null || next <= availableStock) {
                              bulkCart.updateQuantity(itemKey, next);
                            }
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-xs text-muted-foreground font-medium">
                        pieces (editable)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-foreground">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Order Summary */}
        <div>
          <div className="rounded-xl border bg-card p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-baseline justify-between text-muted-foreground">
                <dt>Wholesale Items</dt>
                <dd className="font-semibold text-foreground">
                  {bulkCart.items.length} line item{bulkCart.items.length === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between text-muted-foreground">
                <dt>Total Pieces</dt>
                <dd className="font-semibold text-foreground">
                  {bulkCart.totalItems} pcs
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t pt-3">
                <dt className="text-base font-bold text-foreground">Grand Total</dt>
                <dd className="text-2xl font-black text-primary">
                  {formatPrice(bulkCart.totalPrice)}
                </dd>
              </div>
            </dl>

            <Link
              to="/bulk-orders/checkout"
              className="btn-solid mt-6 w-full py-3 text-center block text-sm font-semibold rounded-md shadow-sm"
            >
              Proceed to Wholesale Checkout
            </Link>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Wholesale invoice with GST/HSN will be generated.</span>
            </div>

            <Link
              to="/bulk-orders/catalog"
              className="mt-4 block text-center text-xs text-muted-foreground hover:underline"
            >
              ← Add more wholesale items
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
