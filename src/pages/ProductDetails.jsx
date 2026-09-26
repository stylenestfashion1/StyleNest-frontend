import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Minus, Plus } from "lucide-react";
import * as productsApi from "../api/products";
import * as cartApi from "../api/cart";
import * as wishlistApi from "../api/wishlist";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useGender } from "../context/GenderContext";
import { useCurrency } from "../context/CurrencyContext";
import { useGuestCart } from "../context/GuestCartContext";
import { formatPrice, formatDiscountPercent, resolveProductPrice } from "../utils/format";
import { getSwatchColor } from "../utils/swatchColor";
import { getSizeLabel } from "../utils/sizeLabel";
import { PageFade, Reveal } from "../components/Reveal";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

const SECTIONS = ["Details", "Fabric & Care", "Shipping & Returns"];

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();
  const { setGender } = useGender();
  const { currency } = useCurrency();
  const guestCart = useGuestCart();
  const queryClient = useQueryClient();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [open, setOpen] = useState("Details");

  const productQuery = useQuery({ queryKey: ["product", id], queryFn: () => productsApi.getProduct(id) });
  const variantsQuery = useQuery({ queryKey: ["product-variants", id], queryFn: () => productsApi.getProductVariants(id) });

  const product = productQuery.data;
  const variants = useMemo(() => variantsQuery.data ?? [], [variantsQuery.data]);

  // Root cause of the "images don't load after clicking a recommended
  // product" bug: React Router reuses this same component instance across
  // /products/:id -> /products/:otherId navigations (it's the same route),
  // so color/size/image selection state from the PREVIOUS product survived
  // into the next one. activeColor fell back to colors[0] only when
  // selectedColor was null -- once a color had been picked on product A,
  // that leftover value (e.g. "BLUE") was still truthy on product B, so the
  // gallery looked up images for a color that doesn't exist there and found
  // nothing. A manual reload "fixed" it only because a fresh mount
  // re-initializes useState to null. Resetting on id change is the real
  // fix -- not a reload/timeout hack.
  useEffect(() => {
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setActiveImage(0);
    setOpen("Details");
  }, [id]);

  useEffect(() => {
    if (product?.gender) setGender(product.gender.toLowerCase());
  }, [product, setGender]);

  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants]);
  const activeColor = selectedColor ?? colors[0];
  // A colorHex is set per-variant (admin picks the exact shade from the
  // product photo), but the swatch row is keyed by color *name* -- reuse
  // whichever variant of that color happens to carry one.
  const colorHexByName = useMemo(() => {
    const map = {};
    for (const v of variants) {
      if (v.colorHex && !map[v.color]) map[v.color] = v.colorHex;
    }
    return map;
  }, [variants]);
  const sizesForColor = useMemo(
    () => variants.filter((v) => v.color === activeColor).map((v) => ({ size: v.size, stock: v.stock, id: v.id })),
    [variants, activeColor]
  );
  const activeVariant = useMemo(
    () => variants.find((v) => v.color === activeColor && v.size === (selectedSize ?? sizesForColor[0]?.size)),
    [variants, activeColor, selectedSize, sizesForColor]
  );

  // Images belong to the whole color (every size shares one photo set), so
  // any variant of activeColor carries the same images -- no per-size
  // lookup or cross-color fallback needed.
  const gallery = useMemo(() => {
    const images = variants.find((v) => v.color === activeColor)?.images ?? [];
    const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
    return sorted.length ? sorted : product?.thumbnailUrl ? [{ id: "fallback", imageUrl: product.thumbnailUrl }] : [];
  }, [variants, activeColor, product]);

  const { data: related } = useQuery({
    queryKey: ["products", "related", product?.gender],
    queryFn: () => productsApi.filterProducts({ gender: product.gender, sizePerPage: 6, active: true }),
    enabled: Boolean(product),
  });

  const { data: wishlist } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistApi.getWishlist, enabled: isAuthenticated });
  const saved = wishlist?.items?.some((i) => i.productId === Number(id)) ?? false;

  const activePrice = product ? resolveProductPrice(product, currency) : null;

  const addToCart = useMutation({
    mutationFn: () => cartApi.addToCart({ productVariantId: activeVariant.id, quantity, currency }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.dispatchEvent(new Event("stylenest:cart-bump"));
    },
    onError: (err) => notify(err.message, "error"),
  });

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (saved) {
        const item = wishlist.items.find((i) => i.productId === Number(id));
        await wishlistApi.removeWishlistItem(item.wishlistItemId);
      } else {
        await wishlistApi.addToWishlist({ productId: Number(id), productVariantId: activeVariant?.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    onError: (err) => notify(err.message, "error"),
  });

  function handleAddToBag(buyNow) {
    if (!activeVariant) {
      notify("Please select a color and size", "error");
      return;
    }
    if (!activePrice) {
      notify(`This product is not available in ${currency} yet`, "error");
      return;
    }
    if (!isAuthenticated) {
      guestCart.addItem(
        {
          productVariantId: activeVariant.id,
          productId: product.id,
          productName: product.name,
          color: activeVariant.color,
          size: activeVariant.size,
          price: activePrice.discountPrice ?? activePrice.regularPrice,
          stock: activeVariant.stock,
          imageUrl: gallery[0]?.imageUrl ?? product.thumbnailUrl,
        },
        quantity
      );
      window.dispatchEvent(new Event("stylenest:cart-bump"));
      notify("Added to bag", "success");
      if (buyNow) navigate("/checkout");
      return;
    }
    addToCart.mutate(undefined, { onSuccess: () => buyNow && navigate("/checkout") });
  }

  if (productQuery.isLoading) return <LoadingState label="Loading product" />;
  if (productQuery.isError || !product) return <ErrorState message="Product not found." />;

  const hasDiscount = activePrice?.discountPrice != null && activePrice.discountPrice < activePrice.regularPrice;
  const outOfStock = activeVariant && activeVariant.stock <= 0;
  const unavailableInCurrency = !activePrice;

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <BackButton fallback={`/products?gender=${product.gender}`} className="mb-6" />
        <p className="label-xs text-muted-foreground">
          <Link to={`/products?gender=${product.gender}`} className="link-underline">
            {product.gender?.toLowerCase()}
          </Link>{" "}
          {product.categoryName && (
            <>
              / <span>{product.categoryName}</span>
            </>
          )}
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex gap-4">
            {gallery.length > 1 && (
              <div className="flex flex-col gap-3">
                {gallery.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-16 overflow-hidden border ${activeImage === i ? "border-accent" : ""}`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="zoom-media flex-1 border bg-muted">
              {gallery[activeImage] ? (
                <img src={gallery[activeImage].imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center">
                  <span className="label-xs text-muted-foreground">No Image Available</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Reveal>
              <h1 className="text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight">{product.name}</h1>
              {activePrice ? (
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span className={`text-lg ${hasDiscount ? "text-accent" : ""}`}>
                    {formatPrice(hasDiscount ? activePrice.discountPrice : activePrice.regularPrice, currency)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(activePrice.regularPrice, currency)}</span>
                      <span className="label-xs bg-accent px-2 py-1 text-accent-foreground">Sale</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="label-xs mt-3 text-muted-foreground">Not available in {currency} yet</p>
              )}
              {hasDiscount && <p className="label-xs mt-1.5 text-accent">{formatDiscountPercent(activePrice.regularPrice, activePrice.discountPrice)}</p>}
              {product.shortDescription && <p className="mt-4 text-sm text-muted-foreground">{product.shortDescription}</p>}
            </Reveal>

            {colors.length > 0 && (
              <div className="mt-10">
                <p className="label-xs">Colour — {activeColor}</p>
                <div className="mt-4 flex gap-4">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize(null);
                        setActiveImage(0);
                      }}
                      aria-label={color}
                      title={color}
                      className={`h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 ${
                        activeColor === color
                          ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                          : "ring-1 ring-inset ring-black/10"
                      }`}
                      style={{ backgroundColor: getSwatchColor(color, colorHexByName[color]) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {sizesForColor.length > 0 && (
              <div className="mt-8">
                <p className="label-xs">Size</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sizesForColor.map((s) => (
                    <button
                      key={s.size}
                      disabled={s.stock <= 0}
                      onClick={() => setSelectedSize(s.size)}
                      className={`label-xs min-w-12 border px-4 py-3 transition-colors ${
                        (selectedSize ?? sizesForColor[0]?.size) === s.size ? "bg-foreground text-primary-foreground" : ""
                      } ${s.stock <= 0 ? "cursor-not-allowed text-muted-foreground opacity-40 line-through" : "hover:border-accent"}`}
                    >
                      {getSizeLabel(s.size)}
                    </button>
                  ))}
                </div>
                {activeVariant && (
                  <p className="mt-3 text-xs text-muted-foreground">{outOfStock ? "Out of stock" : `${activeVariant.stock} in stock`}</p>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <span className="label-xs">Qty</span>
              <div className="flex items-center border">
                <button className="px-3 py-2" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus className="h-3 w-3" />
                </button>
                <span className="label-xs w-8 text-center">{quantity}</span>
                <button
                  className="px-3 py-2"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => (activeVariant ? Math.min(activeVariant.stock, q + 1) : q + 1))}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button className="btn-solid flex-1" disabled={outOfStock || unavailableInCurrency || addToCart.isPending} onClick={() => handleAddToBag(false)}>
                {addToCart.isPending ? "Adding..." : addToCart.isSuccess ? "Added to bag" : "Add to bag"}
              </button>
              <button className="btn-outline flex-1" disabled={outOfStock || unavailableInCurrency} onClick={() => handleAddToBag(true)}>
                Buy now
              </button>
              <button
                className="btn-outline"
                onClick={() => (isAuthenticated ? toggleWishlist.mutate() : navigate("/login"))}
                aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-12 border-t">
              {SECTIONS.map((s) => {
                const careLines = (product.careInstructions || "")
                  .split("\n")
                  .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
                  .filter(Boolean);
                const maxHeight = open === s ? (s === "Fabric & Care" ? 420 : 240) : 0;

                return (
                  <div key={s} className="border-b">
                    <button className="label-xs flex w-full items-center justify-between py-5" onClick={() => setOpen(open === s ? null : s)}>
                      {s}
                      {open === s ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                    <div className="overflow-hidden transition-all duration-500" style={{ maxHeight, opacity: open === s ? 1 : 0 }}>
                      {s === "Fabric & Care" ? (
                        product.fabric || careLines.length > 0 ? (
                          <div className="space-y-3 pb-5 text-sm leading-relaxed text-muted-foreground">
                            {product.fabric && (
                              <p>
                                <span className="text-foreground">Fabric: </span>
                                {product.fabric}
                              </p>
                            )}
                            {careLines.length > 0 && (
                              <ul className="space-y-1.5">
                                {careLines.map((line, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span aria-hidden="true">•</span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <p className="pb-5 text-sm leading-relaxed text-muted-foreground">Fabric details unavailable.</p>
                        )
                      ) : (
                        <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                          {s === "Details"
                            ? product.description || "Cut in limited runs with considered proportions and hand-finished seams."
                            : "Delivered in 4–7 business days. Returns accepted within 14 days, unworn with tags."}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {related?.content?.length > 0 && (
          <div className="mt-24">
            <Reveal>
              <h2 className="text-2xl md:text-3xl">You may also like</h2>
            </Reveal>
            <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
              {related.content
                .filter((p) => p.id !== product.id)
                .slice(0, 6)
                .map((p, i) => (
                  <Reveal key={p.id} delay={i * 80} className="min-w-[240px] max-w-[240px] snap-start">
                    <ProductCard product={p} />
                  </Reveal>
                ))}
            </div>
          </div>
        )}
      </div>
    </PageFade>
  );
}
