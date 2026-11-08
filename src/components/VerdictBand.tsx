// Full-bleed verdict band: the one loud element on the page. Solid color,
// display headline, risk ruler, explanation quote, and the sign action.
import type { Analysis } from "@/lib/types";
import RiskGauge from "./RiskGauge";
import SendButton from "./SendButton";

const HEADLINE: Record<Analysis["verdict"], string> = {
  BLOCK: "Don't sign this.",
  CAUTION: "Check before you sign.",
  SAFE: "Looks safe to sign.",
};

export default function VerdictBand({
  analysis,
  txBase64,
}: {
  analysis: Analysis;
  txBase64: string;
}) {
  const band =
    analysis.verdict === "BLOCK"
      ? "bg-signal text-paper"
      : analysis.verdict === "CAUTION"
        ? "bg-amber text-ink"
        : "bg-lagoon text-paper";
  const tone = analysis.verdict === "CAUTION" ? "dark" : "light";
  const label =
    analysis.aiUsed && analysis.aiModel
      ? `AI read (${analysis.aiModel})`
      : "Plain rules read";
  return (
    <section role="status" className={`verdict-band band-wipe ${band}`}>
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 md:py-18">
        <h2 className="font-display text-[clamp(56px,9vw,120px)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          {HEADLINE[analysis.verdict]}
        </h2>
        <div className="mt-8 max-w-[720px]">
          <RiskGauge score={analysis.riskScore} verdict={analysis.verdict} />
        </div>
        <blockquote className="mt-8 max-w-[62ch]">
          <p className="text-sm font-semibold opacity-80">{label}</p>
          <p className="mt-2 text-[17px] leading-[1.55]">{analysis.summary}</p>
          <p className="mt-4 text-[15px] leading-[1.55] opacity-90">
            <span className="font-semibold">What could go wrong: </span>
            {analysis.whatCouldGoWrong}
          </p>
          <p className="mt-2 text-[15px] leading-[1.55] opacity-90">
            <span className="font-semibold">Recommendation: </span>
            {analysis.recommendation}
          </p>
        </blockquote>
        <div className="mt-8">
          <SendButton analysis={analysis} txBase64={txBase64} tone={tone} />
        </div>
      </div>
    </section>
  );
}
