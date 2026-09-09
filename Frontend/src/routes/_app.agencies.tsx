import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, RiskBadge } from "@/components/risk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AGENCY_STATS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agencies")({
  head: () => ({ meta: [{ title: "Agency Intelligence — MPLADS Risk Intelligence" }] }),
  component: AgencyList,
});

function AgencyList() {
  return (
    <>
      <PageHeader
        title="Agency Risk Intelligence"
        subtitle="Pattern-of-behaviour view across implementing agencies' full portfolios — not individual projects."
      />
      <AnomalyNotice compact className="mb-4" />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {[
          { label: "Agencies monitored", value: AGENCY_STATS.length },
          { label: "High avg-risk agencies", value: AGENCY_STATS.filter((a) => a.avgRisk >= 60).length },
          { label: "Total flagged projects", value: AGENCY_STATS.reduce((s, a) => s + a.flagged, 0) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="num mt-1 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agency leaderboard — ranked by average risk score</CardTitle>
          <p className="text-sm text-muted-foreground">Click an agency to view its full portfolio analysis.</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Flagged</TableHead>
                <TableHead>Avg. risk</TableHead>
                <TableHead>Cost overrun rate</TableHead>
                <TableHead>Delay rate</TableHead>
                <TableHead>Mismatch rate</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {AGENCY_STATS.map((a, i) => (
                <TableRow key={a.name} className="hover:bg-muted/50">
                  <TableCell className="num text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{a.name}</p>
                  </TableCell>
                  <TableCell className="num text-sm">{a.projects}</TableCell>
                  <TableCell className="num text-sm">
                    <span className={cn(a.flagged > 3 ? "text-risk-high font-semibold" : "")}>{a.flagged}</span>
                  </TableCell>
                  <TableCell><RiskBadge score={a.avgRisk} /></TableCell>
                  <TableCell className="num text-sm">{a.costOverrunRate}%</TableCell>
                  <TableCell className="num text-sm">{a.delayRate}%</TableCell>
                  <TableCell className="num text-sm">{a.mismatchRate}%</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/agencies/$agencyName" params={{ agencyName: a.name }}>
                        View <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
