import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import heroMen from "../assets/hero-men.jpg";
import heroWomen from "../assets/hero-women.jpg";
import { useGender } from "../context/GenderContext";
import { useFluidCursorEnabled } from "../hooks/useFluidCursorEnabled";
import SplashCursor from "../components/SplashCursor";

/** A neutral warm gold between the Men (cognac) and Women (champagne) accents — this gateway page is gender-agnostic. */
const GATEWAY_CURSOR_COLOR = "#c2a568";

const COPY = {
  men: { label: "Men", head: "WELL TAILORED", tag: "Structure, softened by wear." },
  women: { label: "Women", head: "AT EASE", tag: "Silk that moves before you do." },
};

/**
 * These photos were shot to spec (1152x1536, exactly 3:4) specifically to
 * match this panel's box shape and to match each other in framing: both
 * models are full-length, centered, comparable camera distance, and land at
 * a similar scale — head to shoe with a small even margin, not the
 * mismatched crops of the earlier placeholder photography. Because the
 * source ratio equals the panel's aspect-ratio, `cover` + centered position
 * needs no per-image zoom or offset compensation for the women's shot.
 */
const PANEL_ASPECT = "0.75";
const PANEL_IMAGE = {
  // Even the matched reshoot left his figure reading a touch smaller than
  // hers — a small corrective zoom (tuned by comparing rendered crops, not
  // just the source measurements) equalizes how tall each figure reads.
  men: { src: heroMen, size: "auto 102%", position: "50% 70%" },
  women: { src: heroWomen, size: "cover", position: "50% 50%" },
};

function HeroPanel({ gender, className = "", children, ...props }) {
  const img = PANEL_IMAGE[gender];
  return (
    <button type="button" className={`group relative overflow-hidden ${className}`} style={{ aspectRatio: PANEL_ASPECT }} {...props}>
      <div
        className="absolute inset-0 bg-no-repeat transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${img.src})`, backgroundSize: img.size, backgroundPosition: img.position }}
        role="img"
        aria-label={gender === "men" ? "Menswear lookbook" : "Womenswear lookbook"}
      />
      {children}
    </button>
  );
}

export default function Home() {
  const { setGender } = useGender();
  const [active, setActive] = useState("women");
  const navigate = useNavigate();
  const copy = COPY[active];
  const fluidCursorEnabled = useFluidCursorEnabled();

  // Neutral accent on the gateway itself — gender-specific theming should
  // only kick in once the visitor actually enters that section.
  useEffect(() => setGender(null), [setGender]);

  const choose = (g) => {
    setGender(g);
    navigate(g === "men" ? "/men" : "/women");
  };

  return (
    <>
      {/* This whole page is the entry/dashboard experience — no separate
          scroll-gated section, so the cursor stays active for as long as the
          visitor is on this route (still gated by fine-pointer + motion
          preference via useFluidCursorEnabled, same as the Men/Women entry). */}
      {fluidCursorEnabled && <SplashCursor color={GATEWAY_CURSOR_COLOR} />}

      {/* Mobile: stacked tappable panels, no hover-dependent interaction */}
      <section className="md:hidden">
        {["men", "women"].map((g) => (
          <HeroPanel key={g} gender={g} className="block w-full" onClick={() => choose(g)} aria-label={`Explore ${g}`}>
            <span className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
            <span className="absolute bottom-8 left-6 text-left text-primary-foreground">
              <span className="label-xs text-primary-foreground/80">{COPY[g].label}</span>
              <span className="display mt-2 block text-3xl">{COPY[g].head}</span>
              <span className="label-xs mt-4 inline-flex items-center gap-2">
                Enter {COPY[g].label} <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          </HeroPanel>
        ))}
      </section>

      {/* Desktop: hover-preview split screen */}
      <section className="relative hidden w-full overflow-hidden md:block">
        <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.08]">
          <div
            className="drift-layer h-full w-full"
            style={{
              background:
                "radial-gradient(60% 60% at 30% 30%, var(--color-accent) 0%, transparent 60%), radial-gradient(50% 50% at 75% 65%, var(--color-accent-2) 0%, transparent 65%)",
            }}
          />
        </div>

        <div className="grid grid-cols-2">
          {["men", "women"].map((g) => (
            <HeroPanel key={g} gender={g} onMouseEnter={() => setActive(g)} onClick={() => choose(g)} aria-label={`Explore ${g}`}>
              <span className="absolute inset-0 bg-foreground transition-opacity duration-700" style={{ opacity: active === g ? 0.08 : 0.42 }} />
              <span className="label-xs absolute bottom-10 left-1/2 -translate-x-1/2 text-primary-foreground">{g}</span>
            </HeroPanel>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-5">
          <div className="grain pointer-events-auto w-full max-w-md border border-card/40 bg-card/72 px-8 py-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur-md">
            <p key={`${copy.label}-l`} className="label-xs rise-in text-accent">
              {copy.label}
            </p>
            <h1 key={`${copy.label}-h`} className="rise-in mt-5 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.05] tracking-[0.02em]" style={{ animationDelay: "80ms" }}>
              {copy.head}
            </h1>
            <span className="hairline-grow mx-auto mt-6 block h-px w-16 bg-accent" />
            <p key={`${copy.label}-t`} className="display rise-in mt-4 text-base italic text-muted-foreground" style={{ animationDelay: "160ms" }}>
              {copy.tag}
            </p>
            <button className="btn-solid sheen mt-8" onClick={() => choose(active)}>
              Enter {copy.label}
            </button>
          </div>
        </div>

        <button
          onMouseEnter={() => setActive("men")}
          onClick={() => choose("men")}
          className={`label-xs sheen absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-full border border-l-0 px-5 py-3 backdrop-blur transition-all duration-500 hover:pl-7 ${
            active === "men" ? "bg-foreground text-primary-foreground" : "bg-card/80 text-foreground"
          }`}
        >
          <ChevronLeft className="mr-1 inline h-3 w-3" />
          Men
        </button>
        <button
          onMouseEnter={() => setActive("women")}
          onClick={() => choose("women")}
          className={`label-xs sheen absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-full border border-r-0 px-5 py-3 backdrop-blur transition-all duration-500 hover:pr-7 ${
            active === "women" ? "bg-foreground text-primary-foreground" : "bg-card/80 text-foreground"
          }`}
        >
          Women
          <ChevronRight className="ml-1 inline h-3 w-3" />
        </button>

        <div className="absolute bottom-8 left-6 z-30 flex gap-2 md:left-10">
          {["bg-accent", "bg-accent-2", "bg-accent-3"].map((c, i) => (
            <span key={c} className={`float-soft h-5 w-5 border border-card/50 ${c}`} style={{ animationDelay: `${i * 400}ms` }} />
          ))}
        </div>

        <Link
          to={active === "men" ? "/men" : "/women"}
          onClick={() => setGender(active)}
          className="label-xs sheen absolute bottom-8 right-6 z-30 flex h-24 w-24 items-center justify-center rounded-full bg-foreground text-center text-primary-foreground transition-transform duration-700 hover:scale-110 md:right-10"
        >
          View
          <br />
          All
        </Link>
      </section>
    </>
  );
}
