import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  TrendingUp,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

const DEFAULT_FORM = {
  metaPixelId: "1104430832556005",
  metaCapiToken: "",
  googleAnalyticsId: "G-CTCTRH79QC",
  clarityProjectId: "",
  googleTagManagerId: "",
  googleAdsId: "",
  catalogFeedUrl: "https://api.stylenestfashion.com/api/feeds/meta-catalog.xml",
};

export default function AdminMarketingPixels() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showCapiToken, setShowCapiToken] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  const { data: config, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "marketing-pixels"],
    queryFn: () => adminApi.getMarketingPixels(),
  });

  useEffect(() => {
    if (config) {
      setForm({
        metaPixelId: config.metaPixelId || "1104430832556005",
        metaCapiToken: config.metaCapiToken || "",
        googleAnalyticsId: config.googleAnalyticsId || "G-CTCTRH79QC",
        clarityProjectId: config.clarityProjectId || "",
        googleTagManagerId: config.googleTagManagerId || "",
        googleAdsId: config.googleAdsId || "",
        catalogFeedUrl: config.catalogFeedUrl || "https://api.stylenestfashion.com/api/feeds/meta-catalog.xml",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (payload) => adminApi.updateMarketingPixels(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "marketing-pixels"], updated);
      notify("Marketing & tracking settings saved successfully!", "success");
    },
    onError: (err) => {
      notify(err.message || "Failed to save marketing settings", "error");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      metaPixelId: form.metaPixelId,
      metaCapiToken: form.metaCapiToken,
      googleAnalyticsId: form.googleAnalyticsId,
      clarityProjectId: form.clarityProjectId,
      googleTagManagerId: form.googleTagManagerId,
      googleAdsId: form.googleAdsId,
    });
  };

  const copyFeedUrl = () => {
    if (!form.catalogFeedUrl) return;
    navigator.clipboard.writeText(form.catalogFeedUrl).then(() => {
      setCopiedFeed(true);
      notify("Catalog Feed URL copied to clipboard!", "success");
      setTimeout(() => setCopiedFeed(false), 2500);
    });
  };

  if (isLoading) return <LoadingState message="Loading marketing configuration..." />;
  if (isError) return <ErrorState message="Failed to load marketing settings" onRetry={refetch} />;

  const isCapiConnected = !!(config?.metaCapiConfigured || (form.metaCapiToken && form.metaCapiToken.trim().length > 10));
  const isClarityActive = !!(config?.clarityConfigured || (form.clarityProjectId && form.clarityProjectId.trim().length > 3));
  const isGtmActive = !!(config?.gtmConfigured || (form.googleTagManagerId && form.googleTagManagerId.trim().length > 3));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <p className="label-xs text-accent">Marketing Automation & Conversion Tracking</p>
        <h1 className="mt-2 text-2xl font-serif tracking-tight md:text-3xl">Marketing & Pixels</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your Meta Catalog Feed for Instagram/Facebook ads, server-side Meta Conversions API (CAPI),
          free Microsoft Clarity heatmaps, and Google Analytics & Tag Manager.
        </p>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-border/80 bg-background/50 p-3.5 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Meta Catalog Feed</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <p className="mt-2 text-xs font-mono font-medium truncate">/api/feeds/meta-catalog.xml</p>
        </div>

        <div className="border border-border/80 bg-background/50 p-3.5 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Meta CAPI</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isCapiConnected ? "text-emerald-600" : "text-amber-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isCapiConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isCapiConnected ? "Connected" : "Token Needed"}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono font-medium">Pixel: {form.metaPixelId || "1104430832556005"}</p>
        </div>

        <div className="border border-border/80 bg-background/50 p-3.5 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Microsoft Clarity</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isClarityActive ? "text-emerald-600" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isClarityActive ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
              {isClarityActive ? "Recording" : "Not Set"}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono font-medium truncate">{form.clarityProjectId || "Free Heatmaps"}</p>
        </div>

        <div className="border border-border/80 bg-background/50 p-3.5 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Google Analytics 4</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <p className="mt-2 text-xs font-mono font-medium">{form.googleAnalyticsId || "G-CTCTRH79QC"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card 1: Meta Dynamic Catalog Feed */}
        <div className="border border-border bg-card p-5 md:p-6 rounded-sm shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-accent/10 rounded text-accent">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold tracking-tight">1. Meta / Instagram Dynamic Product Catalog Feed</h2>
                <span className="label-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Automated Carousel Ads
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Connect this live feed to your <strong>Meta Commerce Manager</strong> to run automated Instagram/Facebook
                carousel ads and retarget visitors who viewed specific items. It automatically syncs real prices, images, stock, and descriptions.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  readOnly
                  value={form.catalogFeedUrl}
                  className="flex-1 bg-muted/60 border border-border px-3 py-2 text-xs font-mono select-all rounded-sm text-foreground focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyFeedUrl}
                    className="inline-flex items-center gap-1.5 bg-foreground text-background px-3.5 py-2 text-xs font-medium hover:bg-foreground/90 transition-colors rounded-sm"
                  >
                    {copiedFeed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedFeed ? "Copied" : "Copy Feed URL"}
                  </button>
                  <a
                    href={form.catalogFeedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs hover:bg-muted transition-colors rounded-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview XML
                  </a>
                </div>
              </div>

              {/* Instructions Pill */}
              <div className="mt-4 bg-muted/40 border border-border/60 p-3 rounded-sm text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How to link with Meta Commerce Manager:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Go to <strong>Meta Commerce Manager</strong> &gt; Select your Catalog.</li>
                  <li>Click <strong>Data Sources</strong> &gt; <strong>Data feed</strong> &gt; Select <strong>Scheduled feed</strong>.</li>
                  <li>Paste the XML URL above, choose <strong>Hourly</strong> or <strong>Daily</strong> refresh, and click Save.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Meta Pixel & Conversions API (CAPI) */}
        <div className="border border-border bg-card p-5 md:p-6 rounded-sm shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold tracking-tight">2. Meta Pixel & Server-Side Conversions API (CAPI)</h2>
                {isCapiConnected ? (
                  <span className="label-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    CAPI Purchase Events Ready
                  </span>
                ) : (
                  <span className="label-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                    CAPI Token Missing
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Browser ad blockers block 30–40% of frontend pixels. Server-side CAPI sends 100% of verified customer purchases
                directly from the StyleNest backend to Meta, maximizing your ROAS and attribution accuracy.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Meta Pixel ID (Client-side)
                  </label>
                  <input
                    type="text"
                    value={form.metaPixelId}
                    onChange={(e) => setForm({ ...form, metaPixelId: e.target.value })}
                    placeholder="1104430832556005"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-sm focus:border-accent focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Live in customer browser.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-foreground">
                      Meta CAPI Access Token (Server-side)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCapiToken(!showCapiToken)}
                      className="text-[11px] text-accent hover:underline flex items-center gap-1"
                    >
                      {showCapiToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showCapiToken ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCapiToken ? "text" : "password"}
                      value={form.metaCapiToken}
                      onChange={(e) => setForm({ ...form, metaCapiToken: e.target.value })}
                      placeholder="Paste EAAB... token from Meta Events Manager"
                      className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-sm focus:border-accent focus:outline-none pr-8"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Kept 100% secret on server. Used exclusively for verified backend purchase dispatch.
                  </p>
                </div>
              </div>

              {/* Instructions Pill */}
              <div className="mt-4 bg-muted/40 border border-border/60 p-3 rounded-sm text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Where to generate your Meta CAPI token:</p>
                <p className="mt-0.5">
                  Go to <strong>Meta Events Manager</strong> &gt; Click your Pixel (<code>{form.metaPixelId}</code>) &gt;{" "}
                  <strong>Settings</strong> tab &gt; Scroll down to <strong>Conversions API</strong> &gt;{" "}
                  Click <strong>Generate access token</strong> under &ldquo;Set up directly&rdquo;. Copy and paste it here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Microsoft Clarity */}
        <div className="border border-border bg-card p-5 md:p-6 rounded-sm shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold tracking-tight">3. Microsoft Clarity (100% Free Heatmaps & Session Replays)</h2>
                <span className="label-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  ₹0 Forever / Unlimited
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Watch video replays of customer sessions, see where shoppers click, rage-click, or abandon the cart.
                Microsoft Clarity is 100% free with no monthly quotas or paid tiers.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Clarity Project ID
                  </label>
                  <input
                    type="text"
                    value={form.clarityProjectId}
                    onChange={(e) => setForm({ ...form, clarityProjectId: e.target.value })}
                    placeholder="e.g. p4abc123"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="sm:self-end">
                  <a
                    href="https://clarity.microsoft.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-border px-3.5 py-2 text-xs font-medium hover:bg-muted transition-colors rounded-sm text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Clarity Dashboard
                  </a>
                </div>
              </div>

              <div className="mt-3 bg-muted/40 border border-border/60 p-3 rounded-sm text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Where to get your Project ID:</p>
                <p className="mt-0.5">
                  Sign in at <strong>clarity.microsoft.com</strong> &gt; Add New Project (name: <em>StyleNest Fashion</em>, URL: <em>https://stylenestfashion.com</em>) &gt; Go to <strong>Settings</strong> &gt; <strong>Overview</strong> &gt; Copy <strong>Project ID</strong> (a short 7-10 character code) and paste here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Google Analytics 4 & Tag Manager */}
        <div className="border border-border bg-card p-5 md:p-6 rounded-sm shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded text-emerald-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold tracking-tight">4. Google Analytics 4 & Tag Manager (GTM)</h2>
                {isGtmActive && (
                  <span className="label-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    GTM Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Google Analytics 4 tracks customer traffic and revenue metrics. Google Tag Manager lets you inject additional
                marketing pixels without updating the code.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    GA4 Measurement ID
                  </label>
                  <input
                    type="text"
                    value={form.googleAnalyticsId}
                    onChange={(e) => setForm({ ...form, googleAnalyticsId: e.target.value })}
                    placeholder="G-CTCTRH79QC"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-sm focus:border-accent focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Active on storefront.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Google Tag Manager ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.googleTagManagerId}
                    onChange={(e) => setForm({ ...form, googleTagManagerId: e.target.value })}
                    placeholder="GTM-XXXXXXX"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-sm focus:border-accent focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">For custom tag deployment.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Google Ads ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.googleAdsId}
                    onChange={(e) => setForm({ ...form, googleAdsId: e.target.value })}
                    placeholder="AW-XXXXXXXXX"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-sm focus:border-accent focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">For Google Ads conversions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Save Bar */}
        <div className="flex items-center justify-between border-t pt-5">
          <p className="text-xs text-muted-foreground">
            Changes take effect immediately across all storefront visits and backend checkout webhooks.
          </p>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-wider hover:bg-accent/90 disabled:opacity-50 transition-colors rounded-sm shadow-sm"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Marketing Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
