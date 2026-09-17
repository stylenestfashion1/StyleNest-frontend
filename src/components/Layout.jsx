import { Outlet } from "react-router-dom";
import { Header, Footer } from "./Header";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* Header is `fixed` (not `sticky`) so it can fully vacate the
          viewport when scroll-hidden, letting content below reclaim that
          space rather than leaving a blank reserved gap. --header-height is
          measured live by Header itself (see its ResizeObserver) so this
          stays correct across breakpoints/font-loading without a hardcoded
          guess; the fallback covers the first paint before that measurement
          lands. */}
      <main className="flex-1" style={{ paddingTop: "var(--header-height, 70px)" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
