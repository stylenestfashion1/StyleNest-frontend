import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Heart, LayoutGrid, LogOut, MapPin, Menu, Moon, PackageSearch, Receipt, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useGender } from "../context/GenderContext";
import { useGuestCart } from "../context/GuestCartContext";
import * as cartApi from "../api/cart";
import * as wishlistApi from "../api/wishlist";
import * as productsApi from "../api/products";
import CurrencyToggle from "./CurrencyToggle";

const NAV = [
  { label: "Men", to: "/men", gender: "men" },
  { label: "Women", to: "/women", gender: "women" },
  { label: "Trending", to: "/trending" },
];

// Kept separate from NAV (rather than appended to it) so it's easy to spot
// and remove/relocate on its own -- it links to a private, access-code-gated
// catalog, not a normal storefront section.
const BULK_ORDERS_LINK = { label: "Bulk Orders", to: "/bulk-orders" };

// Unlike BULK_ORDERS_LINK, this is meant to feel like a normal first-class
// section -- to: "/rental" (bare, no token) resolves the currently ACTIVE
// rental catalog via RentalLanding.jsx. NavLink's default prefix matching
// keeps this highlighted for the whole /rental/* section (catalog, item
// detail, booking flow), not just this landing page.
const RENTALS_LINK = { label: "Rentals", to: "/rental" };

/**
 * Hide the header on scroll-down, reveal it on scroll-up, and always show it
 * near the very top — direction-based (not a raw position threshold) with a
 * dead zone so small trackpad/wheel jitter doesn't flip it back and forth.
 */
function useHeaderVisibility() {
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const lastYRef = useRef(0);

  useEffect(() => {
    lastYRef.current = window.scrollY;
    const DEAD_ZONE = 10;
    const REVEAL_ZONE = 80;
    let ticking = false;

    function evaluate() {
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      if (y <= REVEAL_ZONE) {
        setHidden(false);
      } else if (delta > DEAD_ZONE) {
        setHidden(true);
      } else if (delta < -DEAD_ZONE) {
        setHidden(false);
      }
      lastYRef.current = y;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A fresh route always starts scrolled to top (see App.jsx's ScrollToTop),
  // so the header should always start visible there too.
  useEffect(() => setHidden(false), [location.pathname]);

  return hidden;
}

export function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setGender } = useGender();
  const guestCart = useGuestCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [bounce, setBounce] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [q, setQ] = useState("");
  const profileRef = useRef(null);
  const headerRef = useRef(null);
  const hidden = useHeaderVisibility();

  // Publishes the header's real rendered height as a CSS variable so
  // Layout's <main> can reserve exactly that much space — measured live
  // (ResizeObserver) rather than a guessed constant, so it stays correct
  // across breakpoints, font loading, and content changes.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    set();
    const observer = new ResizeObserver(set);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onBump = () => {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 600);
      return () => clearTimeout(t);
    };
    window.addEventListener("stylenest:cart-bump", onBump);
    return () => window.removeEventListener("stylenest:cart-bump", onBump);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setProfileOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  useEffect(() => setProfileOpen(false), [location.pathname]);

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: cartApi.getCart, enabled: isAuthenticated });
  const { data: wishlist } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistApi.getWishlist, enabled: isAuthenticated });
  const { data: searchResults } = useQuery({
    queryKey: ["header-search", q],
    queryFn: () => productsApi.filterProducts({ search: q.trim(), sizePerPage: 6 }),
    enabled: q.trim().length > 1,
  });

  const cartCount = isAuthenticated ? (cart?.totalItems ?? 0) : guestCart.totalItems;
  const wishlistCount = wishlist?.totalItems ?? 0;

  return (
    <>
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b bg-background/90 backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 xl:grid-cols-[1fr_auto_1fr] xl:px-10">
        <button className="xl:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <nav className="hidden min-w-0 items-center gap-5 xl:gap-7 xl:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => item.gender && setGender(item.gender)}
              className={({ isActive }) => `label-xs link-underline whitespace-nowrap ${isActive ? "text-accent" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/sale" className={({ isActive }) => `label-xs link-underline whitespace-nowrap ${isActive ? "text-accent" : ""}`}>
            Sale
          </NavLink>
          <NavLink to="/track-order" className={({ isActive }) => `label-xs link-underline whitespace-nowrap ${isActive ? "text-accent" : ""}`}>
            Track Order
          </NavLink>
          {/* Support is intentionally not repeated here -- it's already
              reachable from the footer on every page, and the header nav
              was already at capacity before Bulk Orders was added (see
              BULK_ORDERS_LINK below); keeping both would overflow this
              column and visually overlap the centered logo again. */}
          <NavLink
            to={BULK_ORDERS_LINK.to}
            className={({ isActive }) => `label-xs link-underline whitespace-nowrap ${isActive ? "text-accent" : ""}`}
          >
            {BULK_ORDERS_LINK.label}
          </NavLink>
        </nav>

        {/* A proper two-part lockup rather than one flat uppercase line --
            "StyleNest" as an italic serif mark (Playfair Display, already
            loaded via .display -- same font used for "AT EASE" etc. on the
            hero) reads as a wordmark, with "FASHION" as a small tracked
            line underneath in the accent color for contrast. Two lines
            instead of one is fine here: the header publishes its real
            rendered height via ResizeObserver into --header-height (see
            the effect above), so Layout's <main> spacing adjusts
            automatically rather than assuming a fixed single-line height. */}
        <Link to="/" className="col-start-2 flex flex-col items-center whitespace-nowrap leading-none">
          <span className="display text-[1.05rem] italic tracking-[0.01em] sm:text-2xl xl:text-xl 2xl:text-[2rem]">
            StyleNest
          </span>
          <span className="label-xs mt-1 text-accent tracking-[0.32em] sm:tracking-[0.4em]">FASHION</span>
        </Link>

        <div className="col-start-3 flex min-w-0 items-center justify-end gap-3 xl:gap-4">
          <NavLink
            to={RENTALS_LINK.to}
            className={({ isActive }) =>
              `label-xs link-underline hidden whitespace-nowrap xl:inline ${isActive ? "text-accent" : ""}`
            }
          >
            {RENTALS_LINK.label}
          </NavLink>
          <CurrencyToggle />
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((s) => !s)}
            className="inline-flex h-[18px] w-[18px] items-center justify-center transition-transform duration-300 hover:scale-110"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            className="hidden h-[18px] w-[18px] items-center justify-center transition-transform duration-500 hover:rotate-90 hover:scale-110 sm:inline-flex"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          {isAuthenticated ? (
            <div className="relative flex items-center" ref={profileRef}>
              <button
                aria-label="Account menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((o) => !o)}
                className="inline-flex h-[18px] w-[18px] items-center justify-center transition-transform duration-300 hover:scale-110"
              >
                <User className="h-[18px] w-[18px]" />
              </button>
              {profileOpen && (
                <div className="rise-in hairline-card absolute right-0 top-[calc(100%+14px)] w-56 overflow-hidden py-2 shadow-[0_20px_50px_rgba(0,0,0,0.14)]">
                  <p className="label-xs truncate px-4 pb-2 pt-1 text-muted-foreground">{user?.fullName || user?.email}</p>
                  <ProfileMenuLink to="/account" icon={User}>
                    View Profile
                  </ProfileMenuLink>
                  <ProfileMenuLink to="/account?tab=orders" icon={Receipt}>
                    Orders
                  </ProfileMenuLink>
                  <ProfileMenuLink to="/track-order" icon={PackageSearch}>
                    Track Order
                  </ProfileMenuLink>
                  <ProfileMenuLink to="/account?tab=addresses" icon={MapPin}>
                    Addresses
                  </ProfileMenuLink>
                  <ProfileMenuLink to="/wishlist" icon={Heart}>
                    Wishlist
                  </ProfileMenuLink>
                  {isAdmin && (
                    <ProfileMenuLink to="/admin" icon={LayoutGrid}>
                      Admin Panel
                    </ProfileMenuLink>
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="label-xs flex w-full items-center gap-3 px-4 py-2.5 text-left text-destructive transition-colors hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" aria-label="Account" className="transition-transform duration-300 hover:scale-110">
              <User className="h-[18px] w-[18px]" />
            </Link>
          )}
          <Link to="/wishlist" aria-label="Wishlist" className="relative">
            <Heart className="h-[18px] w-[18px]" />
            {wishlistCount > 0 && <span className="absolute -right-2 -top-2 text-[10px] text-accent">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" aria-label="Shopping bag" className="relative">
            <ShoppingBag className={`h-[18px] w-[18px] ${bounce ? "cart-bounce" : ""}`} />
            {cartCount > 0 && <span className="absolute -right-2 -top-2 text-[10px] text-accent">{cartCount}</span>}
          </Link>
        </div>
      </div>


      {searchOpen && (
        <div className="border-t bg-card">
          <div className="mx-auto max-w-[1440px] px-5 py-6 xl:px-10">
            <div className="flex items-center gap-3">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && q.trim()) {
                    setSearchOpen(false);
                    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
                  }
                }}
                placeholder="SEARCH THE ATELIER"
                className="field label-xs"
              />
              <button aria-label="Close search" onClick={() => setSearchOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {searchResults?.content?.length > 0 && (
              <ul className="mt-4 space-y-2">
                {searchResults.content.map((p) => (
                  <li key={p.id}>
                    <button
                      className="label-xs text-muted-foreground transition-colors hover:text-accent"
                      onClick={() => {
                        setSearchOpen(false);
                        setQ("");
                        navigate(`/products/${p.slug ?? p.id}`);
                      }}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </header>

    {/* Rendered as a sibling of <header>, not inside it -- header has an
        always-on CSS transform (translate-y-0/-translate-y-full for the
        hide-on-scroll behavior below), and per spec an ancestor with an
        active transform becomes the containing block for `position: fixed`
        descendants. Nested inside header, this panel's "fixed inset-0" was
        resolving against header's own ~64px box instead of the real
        viewport -- the overlay and drawer background only covered the top
        nav strip, with everything below (including this StyleNest wordmark
        and the nav links) rendering over the raw page behind it instead of
        a solid panel. Moving it out here (same fix already applied to the
        scroll-to-top button below) makes it size against the real
        viewport. */}
    {drawerOpen && (
      <div className="fixed inset-0 z-50 xl:hidden">
        <div className="absolute inset-0 bg-foreground/40" onClick={() => setDrawerOpen(false)} />
        <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-8 bg-background p-8">
          <div className="flex items-center justify-between">
            <span className="flex flex-col leading-none">
              <span className="display text-xl italic">StyleNest</span>
              <span className="label-xs mt-1 text-accent tracking-[0.3em]">FASHION</span>
            </span>
            <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {[...NAV, { label: "Sale", to: "/sale" }, { label: "Track Order", to: "/track-order" }, BULK_ORDERS_LINK, RENTALS_LINK].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (item.gender) setGender(item.gender);
                  setDrawerOpen(false);
                }}
                className={({ isActive }) => `label-xs ${isActive ? "text-accent" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-between">
            <CurrencyToggle />
            <button onClick={toggleTheme} className="label-xs flex items-center gap-2 text-muted-foreground">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Mobile-only: while the header is scrolled out of view, this stays
        reachable to get back to the nav/menu without the header having to
        stay permanently sticky. Rendered as a sibling of <header>, not
        inside it — an ancestor with an active CSS transform becomes the
        containing block for `position: fixed` descendants, so nesting this
        inside the header would drag it off-screen along with the header
        instead of keeping it fixed to the real viewport. */}
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // Pages with a window-scrolling ScrollStack section (e.g. the
        // Trending/Categories flow) hand scroll control to Lenis, which
        // fights a plain window.scrollTo() call — this event lets that
        // instance redirect itself. window.scrollTo also runs unconditionally
        // as the correct (and only) path on pages with no such section.
        window.dispatchEvent(new CustomEvent("stylenest:scroll-to-top", { detail: { immediate: reduceMotion } }));
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }}
      className={`fixed right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border bg-card/95 text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur transition-[opacity,transform] duration-300 md:hidden ${
        hidden ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <ArrowUp className="h-[18px] w-[18px]" />
    </button>
    </>
  );
}

function ProfileMenuLink({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="label-xs flex items-center gap-3 px-4 py-2.5 text-foreground transition-colors hover:bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </Link>
  );
}

// Minimal, dependency-free brand glyphs -- lucide-react (already used for
// every other icon on this site) dropped brand/social icons entirely a few
// major versions back, so there is no "Instagram"/"Facebook" import to pull
// in; these are the standard outline/wordmark shapes, sized and colored
// (currentColor, no brand blue/gradient) to match the rest of the icon set
// instead of clashing with the quiet-luxury palette.
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M15.5 8.5h-2a.5.5 0 0 0-.5.5v2h2.5l-.4 2.5H13V21h-3v-7.5H8v-2.5h2V9a3.5 3.5 0 0 1 3.5-3.5h2z" />
    </svg>
  );
}

// Same aria-label + external-link pattern for both -- new tab, no referrer
// leak, exact URLs the client provided (never a placeholder).
function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="link-underline inline-flex text-muted-foreground transition-transform duration-300 hover:scale-110 hover:text-foreground"
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <span className="display text-lg tracking-[0.18em]">STYLENEST FASHION</span>
        <p className="label-xs text-muted-foreground">Considered clothing, made in limited runs.</p>
        <div className="flex flex-wrap items-center gap-6">
          <Link to="/support" className="label-xs link-underline">
            Support
          </Link>
          <Link to="/track-order" className="label-xs link-underline">
            Track Order
          </Link>
          <Link to="/legal" className="label-xs link-underline">
            Legal
          </Link>
          <div className="flex items-center gap-4 border-l pl-6">
            <SocialLink href="https://www.instagram.com/stylenestf/" label="Instagram">
              <InstagramIcon className="h-4 w-4" />
            </SocialLink>
            <SocialLink href="https://www.facebook.com/profile.php?id=61593072612081" label="Facebook">
              <FacebookIcon className="h-4 w-4" />
            </SocialLink>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-10">
          <p>&copy; 2026 StyleNest Fashion. All rights reserved.</p>
          <a href="mailto:stylenestfashion1@gmail.com" className="link-underline break-all sm:break-normal">
            stylenestfashion1@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Header;
