import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, RiskBadge } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bandOf, BAND_LABEL, type RiskBand, type Project } from "@/lib/mock-data";
import { useProjects } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/map")({
  head: () => ({ meta: [{ title: "Geospatial Risk Map — MPLADS Risk Intelligence" }] }),
  component: GeoMap,
});

// Approximate bounding box for India: lat 8–37, lng 68–97
const MAP_W = 700;
const MAP_H = 560;
const LAT_MIN = 7.5, LAT_MAX = 37.5;
const LNG_MIN = 67.5, LNG_MAX = 97.5;

function toXY(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return { x, y };
}

const BAND_COLOR: Record<RiskBand, string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
};

const BAND_FILL_OPACITY: Record<RiskBand, number> = {
  critical: 0.9,
  high: 0.8,
  medium: 0.7,
  low: 0.6,
};

type Layer = "all" | "heatmap" | "duplicates";

function GeoMap() {
  const projects = useProjects();
  const [selected, setSelected] = useState<Project | null>(null);
  const [layer, setLayer] = useState<Layer>("all");
  const [filterBand, setFilterBand] = useState<RiskBand | "all">("all");

  const visible = projects.filter((p) => {
    if (filterBand !== "all" && bandOf(p.riskScore) !== filterBand) return false;
    if (layer === "duplicates" && p.signals.duplicate < 40) return false;
    return true;
  });

  const dist = { critical: 0, high: 0, medium: 0, low: 0 } as Record<RiskBand, number>;
  projects.forEach((p) => dist[bandOf(p.riskScore)]++);

  const BANDS: RiskBand[] = ["critical", "high", "medium", "low"];

  return (
    <>
      <PageHeader
        title="Geospatial Risk Map"
        subtitle="Spatial distribution of flagged MPLADS works. Click a pin to preview — open the full profile for details."
      />
      <AnomalyNotice compact className="mb-4" />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium text-muted-foreground">Layer:</span>
        {(["all", "heatmap", "duplicates"] as Layer[]).map((l) => (
          <Button
            key={l}
            size="sm"
            variant={layer === l ? "default" : "outline"}
            onClick={() => setLayer(l)}
            className="capitalize"
          >
            {l === "all" ? "All projects" : l === "heatmap" ? "Risk heatmap" : "Duplicate clusters"}
          </Button>
        ))}
        <span className="ml-4 text-sm font-medium text-muted-foreground">Band:</span>
        {(["all", ...BANDS] as (RiskBand | "all")[]).map((b) => (
          <Button
            key={b}
            size="sm"
            variant={filterBand === b ? "default" : "outline"}
            onClick={() => setFilterBand(b)}
            className="capitalize"
          >
            {b === "all" ? "All" : BAND_LABEL[b]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              <div className="relative overflow-auto bg-slate-50 dark:bg-slate-900/50" style={{ minHeight: 480 }}>
                <svg
                  viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                  className="w-full"
                  style={{ minHeight: 400 }}
                  aria-label="India map with MPLADS project risk pins"
                >
                  {/* India outline approximation — simplified polygon */}
                  <rect width={MAP_W} height={MAP_H} fill="var(--muted)" rx="4" />
                  <text x={MAP_W / 2} y={MAP_H / 2} textAnchor="middle" fill="var(--muted-foreground)" fontSize="14" opacity="0.4">
                    India — project pins plotted by lat/lng
                  </text>

                  {/* State label hints */}
                  {[
                    { label: "UP", lat: 26.8, lng: 80.9 },
                    { label: "MH", lat: 19.7, lng: 75.7 },
                    { label: "BR", lat: 25.6, lng: 85.1 },
                    { label: "TN", lat: 11.1, lng: 78.6 },
                    { label: "KA", lat: 15.3, lng: 75.7 },
                    { label: "RJ", lat: 26.6, lng: 73.8 },
                    { label: "WB", lat: 23.0, lng: 87.8 },
                    { label: "GJ", lat: 22.6, lng: 71.6 },
                    { label: "MP", lat: 23.4, lng: 78.4 },
                    { label: "OD", lat: 20.6, lng: 84.8 },
                  ].map(({ label, lat, lng }) => {
                    const { x, y } = toXY(lat, lng);
                    return (
                      <text key={label} x={x} y={y} textAnchor="middle" fill="var(--muted-foreground)" fontSize="11" opacity="0.5" fontWeight="600">
                        {label}
                      </text>
                    );
                  })}

                  {/* Heatmap circles */}
                  {layer === "heatmap" &&
                    visible.map((p) => {
                      const { x, y } = toXY(p.lat, p.lng);
                      const band = bandOf(p.riskScore);
                      return (
                        <circle
                          key={`heat-${p.id}`}
                          cx={x} cy={y} r={18}
                          fill={BAND_COLOR[band]}
                          opacity={0.12}
                        />
                      );
                    })}

                  {/* Project pins */}
                  {visible.map((p) => {
                    const { x, y } = toXY(p.lat, p.lng);
                    const band = bandOf(p.riskScore);
                    const isSelected = selected?.id === p.id;
                    return (
                      <g
                        key={p.id}
                        transform={`translate(${x},${y})`}
                        className="cursor-pointer"
                        onClick={() => setSelected(isSelected ? null : p)}
                        role="button"
                        aria-label={`${p.name} — ${BAND_LABEL[band]} risk`}
                      >
                        <circle
                          r={isSelected ? 8 : 5}
                          fill={BAND_COLOR[band]}
                          opacity={BAND_FILL_OPACITY[band]}
                          stroke={isSelected ? "white" : "none"}
                          strokeWidth={isSelected ? 2 : 0}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Pin popover */}
                {selected && (() => {
                  const { x, y } = toXY(selected.lat, selected.lng);
                  const pctX = (x / MAP_W) * 100;
                  const pctY = (y / MAP_H) * 100;
                  return (
                    <div
                      className="absolute z-10 w-64 rounded-lg border border-border bg-card shadow-lg p-3"
                      style={{
                        left: `${Math.min(pctX, 70)}%`,
                        top: `${Math.min(pctY, 70)}%`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="num text-xs text-muted-foreground">{selected.id}</span>
                            <RiskBadge score={selected.riskScore} size="sm" />
                          </div>
                          <p className="text-sm font-medium leading-snug">{selected.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{selected.district}, {selected.state}</p>
                          <p className="text-xs text-muted-foreground">{selected.agency}</p>
                        </div>
                        <button onClick={() => setSelected(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Button asChild size="sm" className="mt-2 w-full" variant="secondary">
                        <Link to="/projects/$projectId" params={{ projectId: selected.id }}>
                          Open full profile
                        </Link>
                      </Button>
                    </div>
                  );
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                {BANDS.map((b) => (
                  <span key={b} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOR[b] }} />
                    {BAND_LABEL[b]}
                  </span>
                ))}
                <span className="ml-auto">{visible.length} pins shown</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Risk distribution</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {BANDS.map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: BAND_COLOR[b] }} />
                  <span className="flex-1 text-sm">{BAND_LABEL[b]}</span>
                  <span className="num text-sm font-medium">{dist[b]}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Top hotspot districts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(
                projects
                  .filter((p) => p.riskScore >= 70)
                  .reduce<Record<string, number>>((acc, p) => {
                    const k = `${p.district}, ${p.state}`;
                    acc[k] = (acc[k] ?? 0) + 1;
                    return acc;
                  }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([place, count]) => (
                  <div key={place} className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-risk-high" />
                    <span className="flex-1 truncate">{place}</span>
                    <span className="num font-medium">{count}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-sm">Selected project</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <RiskBadge score={selected.riskScore} />
                <p className="font-medium">{selected.name}</p>
                <p className="text-muted-foreground">{selected.district}, {selected.state}</p>
                <Button asChild size="sm" className="w-full mt-1">
                  <Link to="/projects/$projectId" params={{ projectId: selected.id }}>Open full profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
