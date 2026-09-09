import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronDown,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell";
import { AnomalyNotice, RiskBadge } from "@/components/risk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AGENCIES,
  bandOf,
  BAND_LABEL,
  STATUS_LABEL,
  type CaseStatus,
  type RiskBand,
} from "@/lib/mock-data";
import { useProjects } from "@/lib/store";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  state: z.string().optional(),
  band: z.string().optional(),
  status: z.string().optional(),
  agency: z.string().optional(),
});

export const Route = createFileRoute("/_app/projects")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Project Explorer — MPLADS Risk Intelligence" }],
  }),
  component: ProjectExplorer,
});

type SortKey = "riskScore" | "sanctionedCost" | "lastUpdated" | "name";

const STATUS_OPTIONS: { value: CaseStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "under_review", label: "Under Review" },
  { value: "escalated", label: "Escalated" },
  { value: "verified", label: "Verified" },
  { value: "false_positive", label: "False Positive" },
];

const BAND_OPTIONS: { value: RiskBand | "all"; label: string }[] = [
  { value: "all", label: "All risk bands" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_BADGE: Record<CaseStatus, string> = {
  unreviewed: "bg-muted text-muted-foreground",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  escalated: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
  verified: "bg-risk-low-soft text-risk-low border-risk-low/30",
  false_positive: "bg-muted text-muted-foreground",
};

function ProjectExplorer() {
  const projects = useProjects();
  const navigate = useNavigate({ from: "/projects" });
  const { q = "", state = "all", band = "all", status = "all", agency = "all" } = Route.useSearch();

  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const states = useMemo(() => Array.from(new Set(projects.map((p) => p.state))).sort(), [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(lq) ||
          p.id.toLowerCase().includes(lq) ||
          p.district.toLowerCase().includes(lq) ||
          p.agency.toLowerCase().includes(lq),
      );
    }
    if (state !== "all") list = list.filter((p) => p.state === state);
    if (band !== "all") list = list.filter((p) => bandOf(p.riskScore) === band);
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (agency !== "all") list = list.filter((p) => p.agency === agency);
    return [...list].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return mul * a.name.localeCompare(b.name);
      if (sortKey === "lastUpdated") return mul * a.lastUpdated.localeCompare(b.lastUpdated);
      return mul * ((a[sortKey] as number) - (b[sortKey] as number));
    });
  }, [projects, q, state, band, status, agency, sortKey, sortDir]);

  const setSearch = (patch: Record<string, string>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const clearFilters = () =>
    navigate({ search: {} });

  const hasFilters = q || state !== "all" || band !== "all" || status !== "all" || agency !== "all";

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortHead = ({ col, label }: { col: SortKey; label: string }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3.5 w-3.5", sortKey === col ? "text-foreground" : "text-muted-foreground/50")} />
      </span>
    </TableHead>
  );

  return (
    <>
      <PageHeader
        title="Project Explorer"
        subtitle={`${filtered.length} of ${projects.length} projects — filter, sort and open any project's risk profile.`}
      />
      <AnomalyNotice compact className="mb-4" />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, ID, district…"
            value={q}
            onChange={(e) => setSearch({ q: e.target.value })}
          />
        </div>

        <Select value={state} onValueChange={(v) => setSearch({ state: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={band} onValueChange={(v) => setSearch({ band: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Risk band" />
          </SelectTrigger>
          <SelectContent>
            {BAND_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setSearch({ status: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={agency} onValueChange={(v) => setSearch({ agency: v })}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Agency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agencies</SelectItem>
            {AGENCIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Project ID</TableHead>
              <SortHead col="name" label="Name" />
              <TableHead>Agency</TableHead>
              <SortHead col="sanctionedCost" label="Cost (₹L)" />
              <TableHead>Risk</TableHead>
              <TableHead>Top signal</TableHead>
              <TableHead>Status</TableHead>
              <SortHead col="lastUpdated" label="Updated" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const topSig = Object.entries(p.signals).sort((a, b) => b[1] - a[1])[0];
              const sigLabel: Record<string, string> = {
                cost: "Cost deviation",
                delay: "Schedule delay",
                duplicate: "Duplicate similarity",
                mismatch: "Exp./progress mismatch",
                agency: "Agency pattern",
                compliance: "Compliance gaps",
              };
              return (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
                >
                  <TableCell className="num text-xs text-muted-foreground">{p.id}</TableCell>
                  <TableCell className="max-w-56">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.district}, {p.state}</p>
                  </TableCell>
                  <TableCell className="max-w-40">
                    <p className="truncate text-sm">{p.agency}</p>
                  </TableCell>
                  <TableCell className="num text-sm">₹{p.sanctionedCost}L</TableCell>
                  <TableCell><RiskBadge score={p.riskScore} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{sigLabel[topSig?.[0] ?? "cost"]}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_BADGE[p.status])}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </TableCell>
                  <TableCell className="num text-xs text-muted-foreground">{p.lastUpdated}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Click any row to open the full risk profile.</p>
    </>
  );
}
