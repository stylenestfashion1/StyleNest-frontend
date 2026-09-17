import { Link } from "react-router-dom";
import { PageFade } from "../components/Reveal";

export default function Support() {
  return (
    <PageFade>
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <p className="label-xs text-accent">We're here to help</p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,2.8rem)]">Support</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Reach us at{" "}
          <a href="mailto:stylenestfashion1@gmail.com" className="link-underline text-accent">
            stylenestfashion1@gmail.com
          </a>
        </p>

        <Link to="/track-order" className="label-xs link-underline mt-10 inline-block text-accent">
          Track a guest order →
        </Link>
      </div>
    </PageFade>
  );
}
