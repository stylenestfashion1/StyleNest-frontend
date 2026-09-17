import { useParams } from "react-router-dom";
import { PageFade } from "../components/Reveal";
import BackButton from "../components/BackButton";
import NotFound from "./NotFound";
import { COMPANY_INFO, getPolicyBySlug } from "../data/legalPolicies";

export default function LegalPolicy() {
  const { slug } = useParams();
  const policy = getPolicyBySlug(slug);

  if (!policy) return <NotFound />;

  return (
    <PageFade>
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <BackButton fallback="/legal" className="mb-6" />
        <p className="label-xs text-accent">Legal</p>
        <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.6rem)]">{policy.title}</h1>

        <div className="mt-6 text-xs leading-relaxed text-muted-foreground">
          <p className="text-foreground">{COMPANY_INFO.name}</p>
          {COMPANY_INFO.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>GSTIN: {COMPANY_INFO.gstin}</p>
          <p>Phone: {COMPANY_INFO.phone}</p>
          <p>
            Email:{" "}
            <a href={`mailto:${COMPANY_INFO.email}`} className="link-underline text-accent">
              {COMPANY_INFO.email}
            </a>
          </p>
          <p>Website: {COMPANY_INFO.website}</p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg text-foreground">{section.heading}</h2>
              <p className="mt-3">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </PageFade>
  );
}
