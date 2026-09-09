import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, RefreshCw, Shield, Users } from "lucide-react";
import { useEffect } from "react";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DATA_SOURCES, ENGINE_WEIGHTS, OFFICERS, PROJECTS } from "@/lib/mock-data";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — MPLADS Risk Intelligence" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { session, ready } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && session?.role !== "admin") navigate({ to: "/command-center", replace: true });
  }, [ready, session, navigate]);

  if (!ready || session?.role !== "admin") return null;

  const verifiedThisMonth = PROJECTS.filter((p) => p.status === "verified").length;
  const fpThisMonth = PROJECTS.filter((p) => p.status === "false_positive").length;

  return (
    <>
      <PageHeader
        title="Access & Model Governance"
        subtitle="Admin-only view: user management, detection engine configuration, and data source health."
      />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users & Access</TabsTrigger>
          <TabsTrigger value="model" className="gap-2"><Shield className="h-4 w-4" /> Model & Feedback</TabsTrigger>
          <TabsTrigger value="sources" className="gap-2"><RefreshCw className="h-4 w-4" /> Data Sources</TabsTrigger>
        </TabsList>

        {/* Users tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Officers & permissions</CardTitle>
              <p className="text-sm text-muted-foreground">All registered users on this portal.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OFFICERS.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {o.initials}
                          </span>
                          <span className="text-sm font-medium">{o.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.role === "Admin" ? "default" : "secondary"}>{o.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.dept}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs text-risk-low">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model tab */}
        <TabsContent value="model">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feedback loop — this month</CardTitle>
                <p className="text-sm text-muted-foreground">Officer decisions fed back to improve detection accuracy.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Verified anomalies fed back", value: verifiedThisMonth, color: "var(--risk-low)" },
                  { label: "False positives fed back", value: fpThisMonth, color: "var(--risk-medium)" },
                  { label: "Model version", value: "Detection Engine v2.4", color: "var(--primary)" },
                  { label: "Last retrain", value: "2026-08-15", color: "var(--muted-foreground)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="num text-sm font-semibold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signal weights (read-only)</CardTitle>
                <p className="text-sm text-muted-foreground">Current contribution weights used by the detection engine.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {ENGINE_WEIGHTS.map((w) => (
                  <div key={w.signal}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{w.signal}</span>
                      <span className="num text-sm font-semibold">{w.weight}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${w.weight * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-xs text-muted-foreground">Weights are set by the MoSPI analytics team. Contact admin to request changes.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data sources tab */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Data source connections</CardTitle>
              <p className="text-sm text-muted-foreground">Live status of upstream data feeds powering the detection engine.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last sync</TableHead>
                    <TableHead>Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DATA_SOURCES.map((ds) => (
                    <TableRow key={ds.name}>
                      <TableCell className="font-medium text-sm">{ds.name}</TableCell>
                      <TableCell>
                        {ds.status === "connected" ? (
                          <span className="flex items-center gap-1.5 text-xs text-risk-low">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-risk-medium">
                            <AlertTriangle className="h-3.5 w-3.5" /> Degraded
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ds.lastSync}</TableCell>
                      <TableCell className="num text-sm">{ds.records}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
