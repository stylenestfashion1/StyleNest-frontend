import { useLayoutEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { BulkAccessGuard } from "./components/BulkAccessGuard";
import Home from "./pages/Home";
import Men from "./pages/Men";
import Women from "./pages/Women";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ProductListing from "./pages/ProductListing";
import CategoryListing from "./pages/CategoryListing";
import ProductDetails from "./pages/ProductDetails";
import Sale from "./pages/Sale";
import Trending from "./pages/Trending";
import Editorial from "./pages/Editorial";
import Support from "./pages/Support";
import TrackOrder from "./pages/TrackOrder";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import OrderInvoice from "./pages/OrderInvoice";
import Account from "./pages/Account";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminOrderInvoice from "./pages/admin/AdminOrderInvoice";
import AdminScrollImages from "./pages/admin/AdminScrollImages";
import AdminTrending from "./pages/admin/AdminTrending";
import NotFound from "./pages/NotFound";
import LegalHub from "./pages/LegalHub";
import LegalPolicy from "./pages/LegalPolicy";
import BulkAccessGate from "./pages/bulk/BulkAccessGate";
import BulkCatalog from "./pages/bulk/BulkCatalog";
import BulkProductDetail from "./pages/bulk/BulkProductDetail";
import BulkCart from "./pages/bulk/BulkCart";
import BulkCheckout from "./pages/bulk/BulkCheckout";
import AdminBulkTokens from "./pages/admin/AdminBulkTokens";
import AdminBulkCategories from "./pages/admin/AdminBulkCategories";
import AdminBulkProducts from "./pages/admin/AdminBulkProducts";
import AdminBulkProductForm from "./pages/admin/AdminBulkProductForm";
import AdminBulkOrders from "./pages/admin/AdminBulkOrders";
import AdminBulkOrderDetail from "./pages/admin/AdminBulkOrderDetail";
import AdminBulkOrderInvoice from "./pages/admin/AdminBulkOrderInvoice";
import SpecialOffer from "./pages/SpecialOffer";
import AdminRewardsOffers from "./pages/admin/AdminRewardsOffers";
import AdminRewardsDiscountConfig from "./pages/admin/AdminRewardsDiscountConfig";
import AdminRewardsQr from "./pages/admin/AdminRewardsQr";
import RentalLanding from "./pages/RentalLanding";
import RentalCatalog from "./pages/RentalCatalog";
import RentalItemDetail from "./pages/RentalItemDetail";
import RentalBookingFlow from "./pages/RentalBookingFlow";
import AdminRentalCatalogs from "./pages/admin/AdminRentalCatalogs";
import AdminRentalCatalogDetail from "./pages/admin/AdminRentalCatalogDetail";
import AdminRentalBookings from "./pages/admin/AdminRentalBookings";
import AdminRentalBookingDetail from "./pages/admin/AdminRentalBookingDetail";
import AdminRentalSettings from "./pages/admin/AdminRentalSettings";

/**
 * React Router never resets scroll position on client-side navigation (that
 * behavior is a plain-HTML-navigation default, not something SPA routing
 * gets for free). Without this, navigating away while scrolled down lands
 * the new route already scrolled past its own top — e.g. the Men/Women
 * entry section's SplashCursor, gated on IntersectionObserver visibility,
 * would correctly see itself as "not in view" and correctly never mount,
 * even though the actual bug is the scroll position, not the effect.
 *
 * useLayoutEffect (not useEffect) so this runs synchronously after the new
 * route's DOM commits but before the browser paints — the scroll reset lands
 * in the very first frame the user sees, with no flash of the old page's
 * scroll offset. This matters most on browser Back/Forward: native scroll
 * restoration is disabled app-wide (see main.jsx), so this effect is the only
 * thing that ever moves scroll on navigation, and it needs to win before paint
 * every time, not just on push navigations where the timing was more forgiving.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="men" element={<Men />} />
          <Route path="women" element={<Women />} />
          {/* Clean category browse -- /women/kurti, /men/cordset -- see
              CategoryListing. The only public entry point into this used
              to be /products?gender=&categoryId= (see CategoryScrollStack);
              that generic route stays fully working below, unremoved. */}
          <Route path="men/:categorySlug" element={<CategoryListing gender="MEN" />} />
          <Route path="women/:categorySlug" element={<CategoryListing gender="WOMEN" />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="products" element={<ProductListing />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="search" element={<ProductListing />} />
          <Route path="sale" element={<Sale />} />
          <Route path="trending" element={<Trending />} />
          <Route path="editorial" element={<Editorial />} />
          <Route path="support" element={<Support />} />
          <Route path="legal" element={<LegalHub />} />
          <Route path="legal/:slug" element={<LegalPolicy />} />
          {/* Old single-page URL kept working as a redirect -- any bookmark
              or external link to /privacy-policy still lands on the right
              content now that it lives under /legal/:slug. */}
          <Route path="privacy-policy" element={<Navigate to="/legal/privacy-policy" replace />} />
          <Route path="track-order" element={<TrackOrder />} />

          {/* Hidden in-store QR discount flow -- reachable ONLY via the
              shop's printed permanent QR (Admin -> Rewards -> Show Discount
              QR). Never linked from header/footer/homepage; the token in
              the URL is what the backend actually validates. */}
          <Route path="special-offer/:token" element={<SpecialOffer />} />

          {/* BULK ORDERS (wholesale) -- the gate itself is public; every
              page past it is client-side-guarded by BulkAccessGuard (see
              that component for why this is a convenience redirect only,
              not the real security boundary). */}
          <Route path="bulk-orders" element={<BulkAccessGate />} />
          <Route
            path="bulk-orders/catalog"
            element={
              <BulkAccessGuard>
                <BulkCatalog />
              </BulkAccessGuard>
            }
          />
          <Route
            path="bulk-orders/products/:id"
            element={
              <BulkAccessGuard>
                <BulkProductDetail />
              </BulkAccessGuard>
            }
          />
          <Route
            path="bulk-orders/cart"
            element={
              <BulkAccessGuard>
                <BulkCart />
              </BulkAccessGuard>
            }
          />
          <Route
            path="bulk-orders/checkout"
            element={
              <BulkAccessGuard>
                <BulkCheckout />
              </BulkAccessGuard>
            }
          />
          {/* Cart and Checkout are intentionally NOT behind ProtectedRoute —
              guest checkout (no account) must be able to reach both; each
              page branches internally on isAuthenticated to pick the
              guest (localStorage cart, /api/guest/orders) vs. registered
              (server cart, /api/orders) flow. */}
          <Route path="cart" element={<Cart />} />
          <Route
            path="wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route path="checkout" element={<Checkout />} />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id/invoice"
            element={
              <ProtectedRoute>
                <OrderInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route path="account/addresses" element={<Navigate to="/account?tab=addresses" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* NAVRATRI RENTAL CATALOG -- standalone module, outside <Layout>
            on purpose (a sibling <Route>, not nested inside it) -- no
            header, nav, currency toggle, search/theme/account/wishlist/
            cart icons, or footer, just the catalog itself. Fully isolated
            from the normal products/cart/checkout/order flow -- see
            backend RentalCatalog* classes and SecurityConfig's rental
            permitAll rules.

            Two entry points now share this same set of routes: an
            admin-generated /rental/<token> link (unchanged, still works
            exactly as before), and the main-site "Rentals" nav link (see
            Header.jsx), which has no token of its own -- "rental" (bare)
            resolves whichever catalog is currently ACTIVE and hands off
            into /rental/<token> below, so there's still only one rental
            catalog/booking implementation either way. */}
        <Route path="rental" element={<RentalLanding />} />
        <Route path="rental/:shareToken" element={<RentalCatalog />} />
        <Route path="rental/:shareToken/:itemId" element={<RentalItemDetail />} />
        <Route path="rental/:shareToken/:itemId/book" element={<RentalBookingFlow />} />

        <Route path="admin/login" element={<AdminLogin />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          {/* Legacy bare-ID URL (and "new") -- kept working for any
              existing bookmark; AdminProductForm client-redirects an
              existing product to the canonical .../edit slug route below
              once it resolves. */}
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="trending" element={<AdminTrending />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="orders/:id/invoice" element={<AdminOrderInvoice />} />
          <Route path="scroll-images" element={<AdminScrollImages />} />

          {/* BULK ORDERS (wholesale) -- fully separate from the routes
              above; nothing here touches retail products/categories/orders. */}
          <Route path="bulk/access-tokens" element={<AdminBulkTokens />} />
          <Route path="bulk/categories" element={<AdminBulkCategories />} />
          <Route path="bulk/products" element={<AdminBulkProducts />} />
          <Route path="bulk/products/:id" element={<AdminBulkProductForm />} />
          <Route path="bulk/orders" element={<AdminBulkOrders />} />
          <Route path="bulk/orders/:id" element={<AdminBulkOrderDetail />} />
          <Route path="bulk/orders/:id/invoice" element={<AdminBulkOrderInvoice />} />

          {/* REWARDS -- in-store QR discount/rewards system, kept fully
              separate from retail/bulk; see AdminLayout's REWARDS_LINKS. */}
          <Route path="rewards/offers" element={<AdminRewardsOffers />} />
          <Route path="rewards/discount-config" element={<AdminRewardsDiscountConfig />} />
          <Route path="rewards/qr" element={<AdminRewardsQr />} />

          {/* NAVRATRI RENTAL CATALOG (TEMPORARY) -- see the public route
              above for the full rationale; admin side only. */}
          <Route path="rental" element={<AdminRentalCatalogs />} />
          <Route path="rental/:id" element={<AdminRentalCatalogDetail />} />
          <Route path="rental/bookings" element={<AdminRentalBookings />} />
          <Route path="rental/bookings/:reference" element={<AdminRentalBookingDetail />} />
          <Route path="rental/settings" element={<AdminRentalSettings />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
