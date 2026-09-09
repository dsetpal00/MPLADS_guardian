import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  Database,
  Flame,
  MapPin,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, RiskBadge } from "@/components/risk";
import { Sparkline } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY, BAND_LABEL, bandOf, distribution, kpis, topReason, type RiskBand } from "@/lib/mock-data";
import { useProjects } from "@/lib/store";

export const Route = createFileRoute("/_app/command-center")({
  head: () => ({
    meta: [
      { title: "Command Center — MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Daily triage view of high-risk MPLADS works: priority queue, risk distribution, hotspots and system activity.",
      },
      { property: "og:title", content: "Command Center — MPLADS Risk Intelligence" },
      { property: "og:description", content: "What needs an officer's attention right now, at a glance." },
    ],
  }),
  component: CommandCenter,
});

const TRENDS: Record<string, number[]> = {
  total: [120, 124, 129, 131, 138, 141, 145, 148],
  high: [34, 31, 36, 40, 38, 44, 46, 43],
  pending: [61, 58, 63, 66, 62, 59, 57, 54],
  dq: [68, 70, 69, 72, 74, 73, 76, 78],
};

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  trend,
  color,
  note,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: typeof Boxes;
  trend: number[];
  color: string;
  note: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="num mt-1.5 text-3xl font-semibold">
              {value}
              {suffix}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted" style={{ color }}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-3">
          <Sparkline data={trend} color={color} width={160} height={30} />
        </div>
      </CardContent>
    </Card>
  );
}

const BAND_ORDER: RiskBand[] = ["critical", "high", "medium", "low"];

function CommandCenter() {
  const projects = useProjects();
  const k = kpis();
  const dist = distribution();
  const pieData = BAND_ORDER.map((b) => ({ name: BAND_LABEL[b], value: dist[b], fill: `var(--risk-${b})` }));

  const queue = projects
    .filter((p) => p.status === "unreviewed")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 7);

  const hotspots = projects
    .filter((p) => p.riskScore >= 70)
    .reduce<Record<string, number>>((acc, p) => {
      const key = `${p.district}, ${p.state}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  const topHotspots = Object.entries(hotspots).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Command Center"
        subtitle="Wednesday, 9 September 2026 — your triage view of MPLADS works flagged for verification."
        actions={
          <Button asChild variant="outline">
            <Link to="/cases">
              Open my case queue <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <AnomalyNotice className="mb-6" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects monitored" value={k.total} icon={Boxes} trend={TRENDS.total!} color="var(--primary)" note="Across 10 states" />
        <StatCard label="High & critical risk" value={k.high} icon={Flame} trend={TRENDS.high!} color="var(--risk-high)" note="Score ≥ 70, awaiting review" />
        <StatCard label="Pending verification" value={k.pending} icon={ClipboardCheck} trend={TRENDS.pending!} color="var(--risk-medium)" note="Unreviewed + under review" />
        <StatCard label="Avg. data quality" value={k.dq} suffix="%" icon={Database} trend={TRENDS.dq!} color="var(--risk-low)" note="Completeness of source records" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today's priority queue</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Highest-scoring unreviewed works. Each requires officer verification.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border border-t border-border p-0">
            {queue.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="num text-xs text-muted-foreground">{p.id}</span>
                    <RiskBadge score={p.riskScore} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Top signal: {topReason(p)} · {p.agency} · {p.district}, {p.state}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                    Open case
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={46} outerRadius={70} paddingAngle={2} stroke="none">
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {BAND_ORDER.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `var(--risk-${b})` }} />
                    <span className="text-muted-foreground">{BAND_LABEL[b]}</span>
                    <span className="num ml-auto font-medium">{dist[b]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Risk hotspots
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/map">Full map</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {topHotspots.map(([place, count]) => (
                <div key={place} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm">{place}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-risk-high"
                      style={{ width: `${(count / (topHotspots[0]?.[1] ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="num w-6 text-right text-sm font-medium">{count}</span>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">High/critical works per district.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent system activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ACTIVITY.map((a) => (
            <div key={a.text} className="flex items-start gap-3 text-sm">
              <Badge variant="outline" className="num shrink-0 text-[11px]">
                {a.at}
              </Badge>
              <p className="text-muted-foreground">{a.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export { bandOf };
