import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ShieldQuestion } from "lucide-react";
import { bandOf, BAND_LABEL, type RiskBand } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const BAND_STYLES: Record<RiskBand, string> = {
  critical: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
  high: "bg-risk-high-soft text-risk-high border-risk-high/30",
  medium: "bg-risk-medium-soft text-risk-medium border-risk-medium/35",
  low: "bg-risk-low-soft text-risk-low border-risk-low/30",
};

const BAND_ICON: Record<RiskBand, typeof AlertOctagon> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: Info,
  low: CheckCircle2,
};

/** The single risk badge used everywhere in the app. Never restyle per page. */
export function RiskBadge({
  score,
  size = "sm",
  showScore = true,
  className,
}: {
  score: number;
  size?: "sm" | "md";
  showScore?: boolean;
  className?: string;
}) {
  const band = bandOf(score);
  const Icon = BAND_ICON[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-semibold num whitespace-nowrap",
        BAND_STYLES[band],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
      aria-label={`${BAND_LABEL[band]} risk, score ${score} of 100`}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      {BAND_LABEL[band]}
      {showScore && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

export function riskColorVar(score: number) {
  return `var(--risk-${bandOf(score)})`;
}

/** Mandatory disclaimer shown wherever risk scores appear. */
export function AnomalyNotice({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-muted/60 text-muted-foreground",
        compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
        className,
      )}
    >
      <ShieldQuestion className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold text-foreground">Anomaly ≠ Fraud.</span>{" "}
        {compact
          ? "Scores flag patterns for human verification only."
          : "Scores highlight statistical patterns that require human verification. They are not findings of wrongdoing."}
      </p>
    </div>
  );
}

export function MetricChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "quality";
}) {
  const weak = value < 60;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "num text-lg font-semibold",
          tone === "quality" && weak ? "text-risk-medium" : "text-foreground",
        )}
      >
        {value}%{tone === "quality" && weak ? <span className="ml-1 text-xs font-medium">low</span> : null}
      </p>
    </div>
  );
}
