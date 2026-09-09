import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Lock, Shield, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { writeSession, type Role } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Secure officer sign-in for the MPLADS Risk Intelligence early-warning platform used to review flagged infrastructure works.",
      },
      { property: "og:title", content: "Sign in — MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "Officer access to the MPLADS anomaly detection and verification workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [role, setRole] = useState<Role>("officer");
  const [id, setId] = useState("ananya.rao@mospi.gov.in");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    writeSession({
      name: role === "admin" ? "D. Krishnan" : "Ananya Rao",
      role,
      dept: role === "admin" ? "Ministry IT — Governance" : "MoSPI — Monitoring Cell",
    });
    navigate({ to: "/command-center" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sidebar-accent-foreground">MPLADS Risk Intelligence</p>
            <p className="text-xs text-sidebar-foreground/70">Ministry of Statistics & Programme Implementation</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-sidebar-accent-foreground">
            Early warning for MPLADS works — reviewed by officers, not decided by machines.
          </h1>
          <p className="mt-4 text-sm text-sidebar-foreground/80">
            The platform surfaces statistical anomalies across sanctioned works — cost deviation, delays,
            duplicate proximity, expenditure–progress mismatch — with the evidence behind every score.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            {[
              "Anomaly ≠ Fraud — every score is a prompt for human verification",
              "Evidence, confidence and data quality shown with every flag",
              "Full audit trail of officer decisions",
            ].map((t) => (
              <p key={t} className="flex items-start gap-2 text-sidebar-foreground/85">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-primary" />
                {t}
              </p>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/55">
          Authorised use only. Activity on this portal is logged for audit.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-14">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded bg-primary text-primary-foreground">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <p className="font-semibold">MPLADS Risk Intelligence</p>
          </div>

          <h2 className="text-xl font-semibold">Officer sign-in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your government email or NIC single sign-on.</p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="officer-id">Government email / Officer ID</Label>
              <Input id="officer-id" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Password</Label>
              <Input id="pwd" type="password" defaultValue="demo-access" autoComplete="current-password" />
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Sign in as</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "officer", label: "Reviewing Officer", icon: Building2, hint: "Review & verify flags" },
                    { key: "admin", label: "Admin", icon: UserCog, hint: "Access & model governance" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRole(opt.key)}
                    aria-pressed={role === opt.key}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      role === opt.key
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <opt.icon className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-sm font-medium">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </fieldset>

            <Button type="submit" className="w-full">
              <Lock className="mr-2 h-4 w-4" /> Secure sign-in
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demonstration environment with sample MPLADS data.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
