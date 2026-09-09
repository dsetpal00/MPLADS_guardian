import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, User } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, RiskBadge } from "@/components/risk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STATUS_LABEL, type CaseStatus } from "@/lib/mock-data";
import { useProjects } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/cases")({
  head: () => ({ meta: [{ title: "Case Queue — MPLADS Risk Intelligence" }] }),
  component: CaseQueue,
});

const COLUMNS: { status: CaseStatus; label: string; color: string; headerCls: string }[] = [
  { status: "unreviewed", label: "Unreviewed", color: "bg-muted", headerCls: "border-t-slate-400" },
  { status: "under_review", label: "Under Review", color: "bg-blue-50 dark:bg-blue-950/30", headerCls: "border-t-blue-500" },
  { status: "escalated", label: "Escalated", color: "bg-risk-critical-soft", headerCls: "border-t-risk-critical" },
  { status: "verified", label: "Verified", color: "bg-risk-low-soft", headerCls: "border-t-risk-low" },
  { status: "false_positive", label: "False Positive", color: "bg-muted", headerCls: "border-t-slate-400" },
];

function slaDays(lastUpdated: string): number {
  const d = new Date(lastUpdated);
  const now = new Date("2026-09-09");
  return Math.round((now.getTime() - d.getTime()) / 86400000);
}

function CaseQueue() {
  const projects = useProjects();

  const byStatus = (status: CaseStatus) =>
    projects
      .filter((p) => p.status === status)
      .sort((a, b) => b.riskScore - a.riskScore);

  const total = projects.length;

  return (
    <>
      <PageHeader
        title="Investigation Case Queue"
        subtitle="Operational workload view — track cases through the human verification pipeline."
      />
      <AnomalyNotice compact className="mb-4" />

      {/* Summary strip */}
      <div className="mb-6 flex flex-wrap gap-3">
        {COLUMNS.map((col) => {
          const count = byStatus(col.status).length;
          return (
            <div key={col.status} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
              <span className="text-sm text-muted-foreground">{col.label}</span>
              <span className="num font-semibold">{count}</span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="num font-semibold">{total}</span>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid gap-4 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))` }}>
        {COLUMNS.map((col) => {
          const cards = byStatus(col.status);
          return (
            <div key={col.status} className={cn("rounded-lg border-t-4 border border-border bg-card", col.headerCls)}>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-sm font-semibold">{col.label}</span>
                <Badge variant="secondary" className="num">{cards.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-320px)] min-h-64">
                <div className="space-y-2 p-2">
                  {cards.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No cases</p>
                  )}
                  {cards.map((p) => {
                    const age = slaDays(p.lastUpdated);
                    const slaWarn = col.status === "under_review" && age > 7;
                    const slaAlert = col.status === "under_review" && age > 14;
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "rounded-md border border-border bg-background p-3 space-y-2 hover:border-primary/40 transition-colors",
                          slaAlert && "border-risk-high/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="num text-[11px] text-muted-foreground">{p.id}</span>
                          <RiskBadge score={p.riskScore} size="sm" showScore={false} />
                        </div>
                        <p className="text-xs font-medium leading-snug line-clamp-2">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.district}, {p.state}</p>

                        <div className="flex items-center justify-between gap-2">
                          {p.assignee ? (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="h-3 w-3" /> {p.assignee.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Unassigned</span>
                          )}
                          <span className={cn(
                            "flex items-center gap-1 text-[11px]",
                            slaAlert ? "text-risk-high font-semibold" : slaWarn ? "text-risk-medium" : "text-muted-foreground",
                          )}>
                            <Clock className="h-3 w-3" /> {age}d
                          </span>
                        </div>

                        <Button asChild variant="ghost" size="sm" className="w-full h-7 text-xs">
                          <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                            Open case
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Age indicator shows days since last update. Under Review cases older than 14 days are highlighted.
        To change a case status, open the project profile and use the Officer Action panel.
      </p>
    </>
  );
}
