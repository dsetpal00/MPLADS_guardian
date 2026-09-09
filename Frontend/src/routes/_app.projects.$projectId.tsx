import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Image,
  MapPin,
  Send,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, MetricChip, RiskBadge } from "@/components/risk";
import { RiskGauge } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { peersOf, SIGNALS, STATUS_LABEL, type CaseStatus } from "@/lib/mock-data";
import { setProjectStatus, useProject } from "@/lib/store";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project Risk Profile — MPLADS Risk Intelligence" }] }),
  component: ProjectProfile,
});

const SIGNAL_COLORS: Record<string, string> = {
  cost: "var(--risk-critical)",
  delay: "var(--risk-high)",
  duplicate: "var(--risk-medium)",
  mismatch: "var(--risk-high)",
  agency: "var(--chart-5)",
  compliance: "var(--risk-medium)",
};

const STATUS_ACTIONS: { status: CaseStatus; label: string; icon: typeof CheckCircle2; variant: "default" | "destructive" | "outline" | "secondary" }[] = [
  { status: "verified", label: "Verify — Anomaly Confirmed", icon: CheckCircle2, variant: "default" },
  { status: "escalated", label: "Escalate to Investigation", icon: Send, variant: "destructive" },
  { status: "false_positive", label: "Mark False Positive", icon: XCircle, variant: "outline" },
];

const STATUS_BADGE: Record<CaseStatus, string> = {
  unreviewed: "bg-muted text-muted-foreground",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  escalated: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
  verified: "bg-risk-low-soft text-risk-low border-risk-low/30",
  false_positive: "bg-muted text-muted-foreground",
};

function ProjectProfile() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const { session } = useSession();
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<CaseStatus | null>(null);
  const [remark, setRemark] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const peers = peersOf(project);
  const totalSignal = Object.values(project.signals).reduce((a, b) => a + b, 0) || 1;

  const handleAction = () => {
    if (!actionStatus || !remark.trim()) return;
    setProjectStatus(projectId, actionStatus, remark.trim(), session?.name ?? "Officer");
    setSubmitted(true);
    setActionStatus(null);
    setRemark("");
  };

  const SIGNAL_EVIDENCE: Record<string, string> = {
    cost: `Sanctioned cost ₹${project.sanctionedCost}L vs peer average ₹${project.peerAvgCost}L (${Math.round((project.sanctionedCost / project.peerAvgCost - 1) * 100)}% deviation).`,
    delay: `${project.delayDays} days behind schedule as of last update.`,
    duplicate: `Similarity score ${project.signals.duplicate}/100 — potential duplicate work detected within 5 km radius.`,
    mismatch: `Expenditure ${Math.round((project.expenditure / project.sanctionedCost) * 100)}% of sanctioned vs physical progress ${project.physicalProgress}%.`,
    agency: `Agency flagged in ${project.signals.agency}% of portfolio reviews for repeated patterns.`,
    compliance: `Compliance gap score ${project.signals.compliance}/100 — missing or delayed documentation.`,
  };

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/projects"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Project Explorer</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-sm text-muted-foreground">{project.id}</span>
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_BADGE[project.status])}>
              {STATUS_LABEL[project.status]}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.district}, {project.state}</span>
            <span>{project.agency}</span>
            <span>MP: {project.mp}</span>
            <span>Sanctioned: {project.sanctionDate}</span>
            <span>Target: {project.targetDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MetricChip label="Confidence" value={project.confidence} />
          <MetricChip label="Data quality" value={project.dataQuality} tone="quality" />
        </div>
      </div>

      <AnomalyNotice className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Risk score + signals */}
          <Card>
            <CardHeader><CardTitle>Risk score breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-8">
                <RiskGauge score={project.riskScore} confidence={project.confidence} />
                <div className="flex-1 min-w-64 space-y-3">
                  {SIGNALS.map((sig) => {
                    const val = project.signals[sig.key];
                    const pct = Math.round((val / totalSignal) * 100);
                    const expanded = expandedSignal === sig.key;
                    return (
                      <div key={sig.key}>
                        <button
                          className="flex w-full items-center gap-2 text-left"
                          onClick={() => setExpandedSignal(expanded ? null : sig.key)}
                        >
                          <span className="w-44 shrink-0 text-sm">{sig.label}</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{ width: `${pct}%`, background: SIGNAL_COLORS[sig.key] }}
                            />
                          </div>
                          <span className="num w-8 text-right text-xs text-muted-foreground">{val}</span>
                          {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        </button>
                        {expanded && (
                          <p className="mt-1.5 ml-0 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                            {SIGNAL_EVIDENCE[sig.key]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peer comparison */}
          <Card>
            <CardHeader><CardTitle>Peer comparison</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Cost (₹L)</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Delay (days)</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-primary/5 font-medium">
                    <TableCell>
                      <span className="text-sm">{project.name}</span>
                      <Badge variant="secondary" className="ml-2 text-[10px]">This project</Badge>
                    </TableCell>
                    <TableCell className="num">₹{project.sanctionedCost}L</TableCell>
                    <TableCell className="num">{project.physicalProgress}%</TableCell>
                    <TableCell className="num">{project.delayDays}d</TableCell>
                    <TableCell><RiskBadge score={project.riskScore} /></TableCell>
                  </TableRow>
                  {peers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link to="/projects/$projectId" params={{ projectId: p.id }} className="text-sm hover:underline">{p.name}</Link>
                        <p className="text-xs text-muted-foreground">{p.district}</p>
                      </TableCell>
                      <TableCell className="num">₹{p.sanctionedCost}L</TableCell>
                      <TableCell className="num">{p.physicalProgress}%</TableCell>
                      <TableCell className="num">{p.delayDays}d</TableCell>
                      <TableCell><RiskBadge score={p.riskScore} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Evidence & documents */}
          <Card>
            <CardHeader><CardTitle>Evidence &amp; documents</CardTitle></CardHeader>
            <CardContent>
              {project.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded for this project.</p>
              ) : (
                <ul className="space-y-2">
                  {project.evidence.map((doc) => {
                    const isPhoto = doc.toLowerCase().includes("photo") || doc.toLowerCase().includes("geo");
                    return (
                      <li key={doc} className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
                        {isPhoto ? <Image className="h-4 w-4 shrink-0 text-muted-foreground" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className="flex-1 text-sm">{doc}</span>
                        <Button variant="ghost" size="sm" className="text-xs">View</Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Button variant="outline" size="sm" className="mt-3">Upload document</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Officer action panel */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Officer action</CardTitle>
              <p className="text-xs text-muted-foreground">Your decision is logged to the audit trail. This is a human verification step — not an automated verdict.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {submitted && (
                <div className="rounded-md bg-risk-low-soft px-3 py-2 text-sm text-risk-low">
                  Decision recorded. Audit trail updated.
                </div>
              )}
              {STATUS_ACTIONS.map((a) => (
                <Button
                  key={a.status}
                  variant={a.variant}
                  className="w-full justify-start gap-2"
                  onClick={() => setActionStatus(a.status)}
                  disabled={project.status === a.status}
                >
                  <a.icon className="h-4 w-4" />
                  {a.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Project financials */}
          <Card>
            <CardHeader><CardTitle>Financials &amp; progress</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Sanctioned cost", value: `₹${project.sanctionedCost}L` },
                { label: "Expenditure", value: `₹${project.expenditure}L (${Math.round((project.expenditure / project.sanctionedCost) * 100)}%)` },
                { label: "Physical progress", value: `${project.physicalProgress}%` },
                { label: "Peer avg. cost", value: `₹${project.peerAvgCost}L` },
                { label: "Delay", value: `${project.delayDays} days` },
                { label: "Constituency", value: project.constituency },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="num font-medium text-right">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Audit timeline */}
          <Card>
            <CardHeader><CardTitle>Audit trail</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {project.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      {i < project.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3 min-w-0">
                      <p className="text-sm font-medium">{t.action}</p>
                      <p className="text-xs text-muted-foreground">{t.actor} · {t.at}</p>
                      {t.note && <p className="mt-1 text-xs text-muted-foreground italic">{t.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action confirmation dialog */}
      <Dialog open={!!actionStatus} onOpenChange={(o) => !o && setActionStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm: {actionStatus ? STATUS_LABEL[actionStatus] : ""}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action will be permanently recorded in the audit trail for project <strong>{project.id}</strong>. A remark is required.
          </p>
          <Textarea
            placeholder="Enter your remark (required)…"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionStatus(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={!remark.trim()}>Confirm &amp; record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
