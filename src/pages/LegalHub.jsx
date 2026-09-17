import { Link } from "react-router-dom";
import { PageFade, Reveal } from "../components/Reveal";
import { LEGAL_POLICIES } from "../data/legalPolicies";

export default function LegalHub() {
  return (
    <PageFade>
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <p className="label-xs text-accent">Legal</p>
        <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.6rem)]">Policies</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Everything about how StyleNest Fashion handles your data, orders, shipping, returns and more.
        </p>

        <ul className="mt-10 flex flex-col divide-y border-y">
          {LEGAL_POLICIES.map((policy, i) => (
            <Reveal as="li" key={policy.slug} delay={i * 40}>
              <Link to={`/legal/${policy.slug}`} className="link-underline flex items-center justify-between py-4 text-sm">
                <span>{policy.title}</span>
                <span className="text-muted-foreground">→</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </PageFade>
  );
}
