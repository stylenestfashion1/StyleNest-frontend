import { Outlet } from "react-router-dom";
import { ShieldCheck, Lock, HelpCircle } from "lucide-react";

/**
 * QuickPayLayout: Completely isolated layout for StyleNest Quick Pay & B2B Settlements.
 * 
 * Guarantees:
 * 1. Zero retail storefront distractions (no Men, Women, Cart, Wishlist, or retail nav).
 * 2. High-trust B2B enterprise header with SSL & PCI-DSS indicators.
 * 3. Dedicated wholesale helpdesk and compliance footer.
 */
export default function QuickPayLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Standalone B2B Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: StyleNest Brand Lockup */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start whitespace-nowrap leading-none select-none">
              <span className="font-serif text-xl sm:text-2xl font-bold italic tracking-[0.01em] text-foreground">
                StyleNest
              </span>
              <span className="text-[10px] font-semibold text-accent tracking-[0.32em] sm:tracking-[0.4em] uppercase mt-0.5">
                FASHION
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border/80">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wide">
                <Lock className="h-3 w-3" />
                <span>B2B Settlement Portal</span>
              </div>
            </div>
          </div>

          {/* Right: Security & Helpdesk */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-foreground">256-Bit SSL</span>
              <span className="text-muted-foreground/60">|</span>
              <span>PCI-DSS Verified</span>
            </div>

            <a
              href="https://wa.me/?text=Hello%20StyleNest%20Fashion,%20I%20have%20an%20inquiry%20regarding%20Quick%20Pay%20invoice%20settlement."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition"
              title="Contact Wholesale Support on WhatsApp"
            >
              <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Desk</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Payment View */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Dedicated Wholesale Compliance Footer */}
      <footer className="border-t border-border/80 bg-card/60 mt-auto py-8 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold text-foreground">
              StyleNest Fashion Pvt. Ltd. &bull; Official Wholesale & Export Settlements
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              RBI PA-CB Compliant Cross-Border Invoicing powered by PayGlocal. Official tax receipts and dispatch manifests issued upon settlement.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Encrypted Checkout</span>
            </div>
            <span>&bull;</span>
            <a href="mailto:stylenestfashion1@gmail.com" className="hover:underline">
              stylenestfashion1@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
