import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Catalog", end: false },
  { to: "/admin/orders", label: "Orders", end: false },
  { to: "/admin/categories", label: "Categories", end: false },
  { to: "/admin/trending", label: "Trending", end: false },
  { to: "/admin/scroll-images", label: "ScrollDown Images", end: false },
];

// A visually separate group, not appended to LINKS -- this is a fully
// separate wholesale sub-system (own products/categories/orders tables on
// the backend) and must never read as just another retail nav item.
const BULK_LINKS = [
  { to: "/admin/bulk/orders", label: "Orders", end: false },
  { to: "/admin/bulk/products", label: "Products", end: false },
  { to: "/admin/bulk/categories", label: "Categories", end: false },
  { to: "/admin/bulk/access-tokens", label: "Access Tokens", end: false },
];

// In-store QR discount/rewards system -- fully hidden from normal customer
// navigation (see SpecialOffer.jsx); this is the only place it's reachable
// from inside the app.
const REWARDS_LINKS = [
  { to: "/admin/rewards/offers", label: "Redeemed Offers", end: false },
  { to: "/admin/rewards/discount-config", label: "Custom Discount", end: false },
  { to: "/admin/rewards/qr", label: "Show Discount QR", end: false },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  // Below `lg` the nav used to render as one long wrapping block ABOVE
  // every page's content (every link, both sub-groups, all at once) --
  // an admin had to scroll past all of it just to reach the actual
  // Catalog/Orders/etc. screen on a phone. Collapsed behind a toggle here
  // instead, matching the storefront's own mobile nav drawer pattern.
  const [navOpen, setNavOpen] = useState(false);

  // AdminLayout wraps every admin route via <Outlet> and never remounts
  // between them (same lesson as the product-detail recommendation-click
  // bug fixed earlier) -- without this, the mobile drawer would still be
  // open, covering the new page, after tapping a link that navigates.
  const closeNav = () => setNavOpen(false);
  const navLinkClass = ({ isActive }) => `label-xs link-underline ${isActive ? "text-accent" : ""}`;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b pb-6">
        <div>
          <p className="label-xs text-accent">Console</p>
          <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.2rem)] leading-none">StyleNest Fashion Admin</h1>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/" className="label-xs link-underline">
            View storefront
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen((o) => !o)}
            className="label-xs flex items-center gap-1.5 lg:hidden"
            aria-expanded={navOpen}
            aria-label={navOpen ? "Close menu" : "Open menu"}
          >
            {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Menu
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[180px_1fr]">
        <nav
          className={`${navOpen ? "flex" : "hidden"} flex-col gap-5 border-b pb-5 lg:flex lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6`}
        >
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={closeNav} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}

          <div className="mt-2 border-t pt-5">
            <p className="label-xs mb-3 text-muted-foreground">Bulk Orders</p>
            <div className="flex flex-col gap-4">
              {BULK_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} onClick={closeNav} className={navLinkClass}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="mt-2 border-t pt-5">
            <p className="label-xs mb-3 text-muted-foreground">Rewards</p>
            <div className="flex flex-col gap-4">
              {REWARDS_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} onClick={closeNav} className={navLinkClass}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          <button onClick={logout} className="label-xs link-underline text-left text-muted-foreground">
            Logout
          </button>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
