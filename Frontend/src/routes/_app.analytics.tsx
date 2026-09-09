import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OUTCOME_TREND, PROJECTS, RISK_TREND } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics & Reports — MPLADS Risk Intelligence" }] }),
  component: Analytics,
});

// State-level aggregate
const stateData = Object.entries(
  PROJECTS.reduce<Record<string, { total: number; flagged: number; avgRisk: number; sum: number }>>((acc, p) => {
    if (!acc[p.state]) acc[p.state] = { total: 0, flagged: 0, avgRisk: 0, sum: 0 };
    acc[p.state]!.total++;
    acc[p.state]!.sum += p.riskScore;
    if (p.riskScore >= 70) acc[p.state]!.flagged++;
    return acc;
  }, {})
).map(([state, d]) => ({
  state: state.split(" ")[0], // abbreviate for chart
  fullState: state,
  total: d.total,
  flagged: d.flagged,
  avgRisk: Math.round(d.sum / d.total),
})).sort((a, b) => b.avgRisk - a.avgRisk);

function Analytics() {
  const verified = PROJECTS.filter((p) => p.status === "verified").length;
  const fp = PROJECTS.filter((p) => p.status === "false_positive").length;
  const escalated = PROJECTS.filter((p) => p.status === "escalated").length;
  const precision = verified + fp > 0 ? Math.round((verified / (verified + fp)) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Aggregate trends for leadership — risk distribution over time, verification outcomes, and state comparisons."
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export report
          </Button>
        }
      />
      <AnomalyNotice compact className="mb-4" />

      {/* KPI strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Verified anomalies", value: verified, note: "Officer-confirmed" },
          { label: "False positives", value: fp, note: "Cleared by officers" },
          { label: "Escalated cases", value: escalated, note: "Under investigation" },
          { label: "Detection precision", value: `${precision}%`, note: "Verified / (Verified + FP)" },
        ].map(({ label, value, note }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="num mt-1 text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="risk-trend">
        <TabsList className="mb-4">
          <TabsTrigger value="risk-trend">Risk distribution trend</TabsTrigger>
          <TabsTrigger value="outcomes">Verification outcomes</TabsTrigger>
          <TabsTrigger value="states">State comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="risk-trend">
          <Card>
            <CardHeader>
              <CardTitle>Risk score distribution over 12 months</CardTitle>
              <p className="text-sm text-muted-foreground">Count of projects in each risk band per month.</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={RISK_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="critical" stackId="a" fill="var(--risk-critical)" name="Critical" />
                    <Bar dataKey="high" stackId="a" fill="var(--risk-high)" name="High" />
                    <Bar dataKey="medium" stackId="a" fill="var(--risk-medium)" name="Medium" />
                    <Bar dataKey="low" stackId="a" fill="var(--risk-low)" name="Low" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle>Verification outcomes over time</CardTitle>
              <p className="text-sm text-muted-foreground">
                True anomalies confirmed vs false positives cleared — shows the detection engine improving over time.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={OUTCOME_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="confirmed" stroke="var(--risk-high)" strokeWidth={2} dot={false} name="Confirmed anomalies" />
                    <Line type="monotone" dataKey="falsePositive" stroke="var(--risk-low)" strokeWidth={2} dot={false} name="False positives" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Declining false positive trend indicates the detection model is improving with officer feedback.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states">
          <Card>
            <CardHeader>
              <CardTitle>State-level risk comparison</CardTitle>
              <p className="text-sm text-muted-foreground">Average risk score and flagged project count by state.</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                      labelFormatter={(label: string) => stateData.find((s) => s.state === label)?.fullState ?? label}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="avgRisk" fill="var(--risk-high)" name="Avg. risk score" radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="right" dataKey="flagged" fill="var(--primary)" name="Flagged projects" radius={[2, 2, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* State table */}
              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">State</th>
                      <th className="pb-2 font-medium num">Total</th>
                      <th className="pb-2 font-medium num">Flagged</th>
                      <th className="pb-2 font-medium num">Avg. risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stateData.map((s) => (
                      <tr key={s.fullState}>
                        <td className="py-2">{s.fullState}</td>
                        <td className="py-2 num text-muted-foreground">{s.total}</td>
                        <td className="py-2 num">{s.flagged}</td>
                        <td className="py-2 num font-medium">{s.avgRisk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export builder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" /> Report builder
          </CardTitle>
          <p className="text-sm text-muted-foreground">Generate a summary report for a date range and filter set.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Date range:</span>
              <span className="rounded-md border border-border bg-muted px-2 py-1 text-foreground">Apr 2026 – Sep 2026</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Scope:</span>
              <span className="rounded-md border border-border bg-muted px-2 py-1 text-foreground">All states</span>
            </div>
            <Button variant="outline" className="gap-2 ml-auto">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
