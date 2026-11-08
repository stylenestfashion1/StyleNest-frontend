import { trackPageView } from "./utils/metaPixel";
import { lazy, Suspense, useLayoutEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { BulkAccessGuard } from "./components/BulkAccessGuard";

// Eagerly loaded core customer landing & browse routes for instant FCP/LCP
import Home from "./pages/Home";
import Men from "./pages/Men";
import Women from "./pages/Women";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ProductListing from "./pages/ProductListing";
import CategoryListing from "./pages/CategoryListing";
import ProductDetails from "./pages/ProductDetails";

// Lazy-loaded secondary shopper routes
const Sale = lazy(() => import("./pages/Sale"));
const Trending = lazy(() => import("./pages/Trending"));
const Editorial = lazy(() => import("./pages/Editorial"));
const Support = lazy(() => import("./pages/Support"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const OrderInvoice = lazy(() => import("./pages/OrderInvoice"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LegalHub = lazy(() => import("./pages/LegalHub"));
const LegalPolicy = lazy(() => import("./pages/LegalPolicy"));
const SpecialOffer = lazy(() => import("./pages/SpecialOffer"));

// Lazy-loaded Bulk / Wholesale pages
const BulkAccessGate = lazy(() => import("./pages/bulk/BulkAccessGate"));
const BulkCatalog = lazy(() => import("./pages/bulk/BulkCatalog"));
const BulkProductDetail = lazy(() => import("./pages/bulk/BulkProductDetail"));
const BulkCart = lazy(() => import("./pages/bulk/BulkCart"));
const BulkCheckout = lazy(() => import("./pages/bulk/BulkCheckout"));
const BulkOrderConfirmation = lazy(() => import("./pages/bulk/BulkOrderConfirmation"));

// Lazy-loaded Rental pages
const RentalLanding = lazy(() => import("./pages/RentalLanding"));
const RentalCatalog = lazy(() => import("./pages/RentalCatalog"));
const RentalItemDetail = lazy(() => import("./pages/RentalItemDetail"));
const RentalBookingFlow = lazy(() => import("./pages/RentalBookingFlow"));

// Lazy-loaded Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminOrderInvoice = lazy(() => import("./pages/admin/AdminOrderInvoice"));
const AdminScrollImages = lazy(() => import("./pages/admin/AdminScrollImages"));
const AdminTrending = lazy(() => import("./pages/admin/AdminTrending"));
const AdminBulkTokens = lazy(() => import("./pages/admin/AdminBulkTokens"));
const AdminBulkCategories = lazy(() => import("./pages/admin/AdminBulkCategories"));
const AdminBulkProducts = lazy(() => import("./pages/admin/AdminBulkProducts"));
const AdminBulkProductForm = lazy(() => import("./pages/admin/AdminBulkProductForm"));
const AdminBulkOrders = lazy(() => import("./pages/admin/AdminBulkOrders"));
const AdminQuickPayments = lazy(() => import("./pages/admin/AdminQuickPayments"));
const AdminBulkInvoiceGenerator = lazy(() => import("./pages/admin/AdminBulkInvoiceGenerator"));
const AdminBulkOrderDetail = lazy(() => import("./pages/admin/AdminBulkOrderDetail"));
const AdminBulkOrderInvoice = lazy(() => import("./pages/admin/AdminBulkOrderInvoice"));
const AdminRewardsOffers = lazy(() => import("./pages/admin/AdminRewardsOffers"));
const AdminRewardsDiscountConfig = lazy(() => import("./pages/admin/AdminRewardsDiscountConfig"));
const AdminRewardsQr = lazy(() => import("./pages/admin/AdminRewardsQr"));
const AdminRentalCatalogs = lazy(() => import("./pages/admin/AdminRentalCatalogs"));
const AdminRentalCatalogDetail = lazy(() => import("./pages/admin/AdminRentalCatalogDetail"));
const AdminRentalBookings = lazy(() => import("./pages/admin/AdminRentalBookings"));
const AdminRentalBookingDetail = lazy(() => import("./pages/admin/AdminRentalBookingDetail"));
const AdminRentalSettings = lazy(() => import("./pages/admin/AdminRentalSettings"));

// QuickPay routes
const QuickPayLayout = lazy(() => import("./components/QuickPayLayout"));
const QuickPay = lazy(() => import("./pages/QuickPay"));
const QuickPayReceipt = lazy(() => import("./pages/QuickPayReceipt"));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    trackPageView();
  }, [pathname]);
  return null;
}

function App() {
  const isPaySubdomain = typeof window !== "undefined" && window.location.hostname.startsWith("pay.");
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* QUICK PAY & B2B SETTLEMENT PORTAL -- 100% isolated layout */}
          <Route element={<QuickPayLayout />}>
            <Route path="pay" element={<QuickPay />} />
            <Route path="pay/receipt" element={<QuickPayReceipt />} />
            <Route path="receipt" element={<QuickPayReceipt />} />
            {isPaySubdomain && <Route index element={<QuickPay />} />}
          </Route>

          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="men" element={<Men />} />
            <Route path="women" element={<Women />} />
            <Route path="men/:categorySlug" element={<CategoryListing gender="MEN" />} />
            <Route path="women/:categorySlug" element={<CategoryListing gender="WOMEN" />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="products" element={<Navigate to="/trending" replace />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="search" element={<ProductListing />} />
            <Route path="sale" element={<Sale />} />
            <Route path="trending" element={<Trending />} />
            <Route path="editorial" element={<Editorial />} />
            <Route path="support" element={<Support />} />
            <Route path="legal" element={<LegalHub />} />
            <Route path="legal/:slug" element={<LegalPolicy />} />
            <Route path="privacy-policy" element={<Navigate to="/legal/privacy-policy" replace />} />
            <Route path="pay" element={<QuickPay />} />
            <Route path="pay/receipt" element={<QuickPayReceipt />} />
            <Route path="track-order" element={<TrackOrder />} />

            <Route path="special-offer/:token" element={<SpecialOffer />} />

            {/* BULK ORDERS (wholesale) */}
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
            <Route
              path="bulk-orders/order-confirmation"
              element={<BulkOrderConfirmation />}
            />

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

          {/* RENTAL CATALOG */}
          <Route path="rental" element={<RentalLanding />} />
          <Route path="rental/:shareToken" element={<RentalCatalog />} />
          <Route path="rental/:shareToken/:itemId" element={<RentalItemDetail />} />
          <Route path="rental/:shareToken/:itemId/book" element={<RentalBookingFlow />} />

          {/* ADMIN */}
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
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="trending" element={<AdminTrending />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="orders/:id/invoice" element={<AdminOrderInvoice />} />
            <Route path="scroll-images" element={<AdminScrollImages />} />

            <Route path="bulk/access-tokens" element={<AdminBulkTokens />} />
            <Route path="bulk/categories" element={<AdminBulkCategories />} />
            <Route path="bulk/products" element={<AdminBulkProducts />} />
            <Route path="bulk/products/:id" element={<AdminBulkProductForm />} />
            <Route path="bulk/orders" element={<AdminBulkOrders />} />
            <Route path="bulk/quick-payments" element={<AdminQuickPayments />} />
            <Route path="bulk/invoice-generator" element={<AdminBulkInvoiceGenerator />} />
            <Route path="bulk/orders/:id" element={<AdminBulkOrderDetail />} />
            <Route path="bulk/orders/:id/invoice" element={<AdminBulkOrderInvoice />} />

            <Route path="rewards/offers" element={<AdminRewardsOffers />} />
            <Route path="rewards/discount-config" element={<AdminRewardsDiscountConfig />} />
            <Route path="rewards/qr" element={<AdminRewardsQr />} />

            <Route path="rental" element={<AdminRentalCatalogs />} />
            <Route path="rental/:id" element={<AdminRentalCatalogDetail />} />
            <Route path="rental/bookings" element={<AdminRentalBookings />} />
            <Route path="rental/bookings/:reference" element={<AdminRentalBookingDetail />} />
            <Route path="rental/settings" element={<AdminRentalSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
