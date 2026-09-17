import { PageFade } from "../components/Reveal";

export default function Editorial() {
  return (
    <PageFade>
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
        <p className="label-xs text-accent">Coming Soon</p>
        <h1 className="mt-5 text-[clamp(2.2rem,4vw,3rem)]">The StyleNest Fashion Journal</h1>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">Stories on craft, style, and the people behind the pieces — arriving soon.</p>
      </div>
    </PageFade>
  );
}
