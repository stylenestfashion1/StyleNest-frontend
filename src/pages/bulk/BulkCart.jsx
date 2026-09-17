import { Link } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import { PageFade, Reveal } from "../../components/Reveal";
import BackButton from "../../components/BackButton";
import { useBulkCart } from "../../context/BulkCartContext";
import { formatPrice } from "../../utils/format";

export default function BulkCart() {
  const bulkCart = useBulkCart();

  if (bulkCart.items.length === 0) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-[clamp(1.9rem,3.6vw,2.6rem)]">Your bulk cart is empty</h1>
          <p className="mt-4 text-sm text-muted-foreground">Add wholesale products from the bulk catalog first.</p>
          <Link to="/bulk-orders/catalog" className="btn-solid mt-8 inline-block">
            Browse bulk catalog
          </Link>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
        <BackButton fallback="/bulk-orders/catalog" className="mb-6" />
        <p className="label-xs text-accent">Wholesale</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)]">Bulk Cart</h1>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <ul className="border-t">
            {bulkCart.items.map((item, i) => (
              <Reveal as="li" key={item.bulkProductId} delay={i * 70}>
                <div className="flex gap-5 border-b py-6">
                  <div className="h-32 w-24 shrink-0 border bg-muted">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="display text-lg">{item.name}</p>
                        <p className="label-xs mt-2 text-muted-foreground">Min {item.minOrderQuantity} pcs</p>
                      </div>
                      <button aria-label="Remove" onClick={() => bulkCart.removeItem(item.bulkProductId)}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center border">
                        <button
                          className="px-3 py-2"
                          aria-label="Decrease quantity"
                          onClick={() => bulkCart.updateQuantity(item.bulkProductId, item.quantity - item.minOrderQuantity)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="label-xs w-12 text-center">{item.quantity}</span>
                        <button
                          className="px-3 py-2"
                          aria-label="Increase quantity"
                          onClick={() => bulkCart.updateQuantity(item.bulkProductId, item.quantity + item.minOrderQuantity)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <div className="hairline-card p-6">
              <h2 className="text-xl">Order Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <dt className="label-xs text-muted-foreground">Total pieces</dt>
                  <dd>{bulkCart.totalItems}</dd>
                </div>
              </dl>
              <div className="mt-6 flex items-baseline justify-between border-t pt-5">
                <span className="label-xs">Total</span>
                <span className="display text-xl">{formatPrice(bulkCart.totalPrice)}</span>
              </div>
              <Link to="/bulk-orders/checkout" className="btn-solid mt-8 w-full">
                Checkout
              </Link>
              <Link to="/bulk-orders/catalog" className="label-xs link-underline mt-4 block text-center text-muted-foreground">
                Continue shopping
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </PageFade>
  );
}
