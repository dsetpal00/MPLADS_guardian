import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, RiskBadge } from "@/components/risk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agencyByName, PROJECTS, STATUS_LABEL } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/agencies/$agencyName")({
  head: () => ({ meta: [{ title: "Agency Detail — MPLADS Risk Intelligence" }] }),
  component: AgencyDetail,
});

function AgencyDetail() {
  const { agencyName } = Route.useParams();
  const agency = agencyByName(agencyName);

  if (!agency) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const agencyProjects = PROJECTS.filter((p) => p.agency === agencyName);
  const flagged = agencyProjects.filter((p) => p.riskScore >= 70).sort((a, b) => b.riskScore - a.riskScore);

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/agencies"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Agency Intelligence</Link>
        </Button>
      </div>

      <PageHeader
        title={agency.name}
        subtitle={`Portfolio analysis across ${agency.projects} MPLADS works. Patterns flagged for officer review.`}
      />
      <AnomalyNotice compact className="mb-4" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: "Total projects", value: agency.projects },
          { label: "Flagged (≥70)", value: agency.flagged },
          { label: "Cost overrun rate", value: `${agency.costOverrunRate}%` },
          { label: "Delay rate", value: `${agency.delayRate}%` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="num mt-1 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Risk trend */}
        <Card>
          <CardHeader><CardTitle>Risk score trend (12 months)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={agency.trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="var(--risk-high)"
                    strokeWidth={2}
                    dot={false}
                    name="Avg. risk score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pattern summary */}
        <Card>
          <CardHeader><CardTitle>Pattern summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Cost overrun rate", value: agency.costOverrunRate, desc: "Projects where sanctioned cost > 130% of peer average" },
              { label: "Delay rate", value: agency.delayRate, desc: "Projects with >120 days behind schedule" },
              { label: "Mismatch rate", value: agency.mismatchRate, desc: "Projects with expenditure/progress mismatch score >40" },
            ].map(({ label, value, desc }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="num text-sm font-semibold">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-risk-high transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Flagged projects */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged projects ({flagged.length})</CardTitle>
          <p className="text-sm text-muted-foreground">High and critical risk works for this agency. Click to open full profile.</p>
        </CardHeader>
        <CardContent className="p-0">
          {flagged.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No high-risk projects for this agency.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Cost (₹L)</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagged.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="num text-xs text-muted-foreground">{p.id}</TableCell>
                    <TableCell>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="text-sm font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.district}, {p.state}</TableCell>
                    <TableCell className="num text-sm">₹{p.sanctionedCost}L</TableCell>
                    <TableCell><RiskBadge score={p.riskScore} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{STATUS_LABEL[p.status]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
