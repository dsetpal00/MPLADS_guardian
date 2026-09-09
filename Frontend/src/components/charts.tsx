export function Sparkline({
  data,
  color = "var(--primary)",
  width = 96,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function RiskGauge({ score, confidence }: { score: number; confidence: number }) {
  const r = 54;
  const c = Math.PI * r; // half circle
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const band = score >= 85 ? "critical" : score >= 70 ? "high" : score >= 45 ? "medium" : "low";
  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="86" viewBox="0 0 150 86" role="img" aria-label={`Risk score ${score} out of 100`}>
        <path d={`M 21 76 A ${r} ${r} 0 0 1 129 76`} fill="none" stroke="var(--muted)" strokeWidth="12" strokeLinecap="round" />
        <path
          d={`M 21 76 A ${r} ${r} 0 0 1 129 76`}
          fill="none"
          stroke={`var(--risk-${band})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct).toFixed(1)} ${c.toFixed(1)}`}
        />
        <text x="75" y="68" textAnchor="middle" className="num" fontSize="30" fontWeight="700" fill="var(--foreground)">
          {score}
        </text>
      </svg>
      <p className="-mt-1 text-xs text-muted-foreground">Risk score / 100 · {confidence}% confidence</p>
    </div>
  );
}
