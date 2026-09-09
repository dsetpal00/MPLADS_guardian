import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileBarChart,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Search,
  Shield,
  Table2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { clearSession, type Session } from "@/lib/session";
import { cn } from "@/lib/utils";
import { PROJECTS, bandOf } from "@/lib/mock-data";
import { RiskBadge } from "@/components/risk";
import { CommandPalette } from "@/components/command-palette";

const NAV = [
  { to: "/command-center", label: "Command Center", icon: LayoutDashboard },
  { to: "/projects", label: "Project Explorer", icon: Table2 },
  { to: "/map", label: "Geospatial Risk Map", icon: MapIcon },
  { to: "/agencies", label: "Agency Intelligence", icon: Building2 },
  { to: "/cases", label: "Case Queue", icon: KanbanSquare },
  { to: "/analytics", label: "Analytics & Reports", icon: FileBarChart },
] as const;

export function AppShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const alerts = useMemo(
    () => PROJECTS.filter((p) => p.status === "escalated" && p.riskScore >= 80).slice(0, 5),
    [],
  );

  const items = [...NAV, ...(session.role === "admin" ? [{ to: "/admin", label: "Access & Governance", icon: Shield } as const] : [])];

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 sm:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
            <Shield className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">MPLADS</p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">Risk Intelligence</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {items.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-ring"
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Search projects, agencies, districts…</span>
            <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4.5 w-4.5" />
                  {alerts.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-risk-high ring-2 ring-surface" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-88 p-0">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="text-sm font-semibold">Newly escalated high-risk projects</p>
                  <p className="text-xs text-muted-foreground">Requires human verification</p>
                </div>
                <ul className="max-h-80 divide-y divide-border overflow-auto">
                  {alerts.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="block px-3 py-2.5 hover:bg-muted"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="num text-xs text-muted-foreground">{p.id}</span>
                          <RiskBadge score={p.riskScore} />
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.district}, {p.state}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-left hover:bg-muted">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {session.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <span className="hidden leading-tight md:block">
                    <span className="block text-xs font-medium">{session.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{session.dept}</span>
                  </span>
                  <Badge variant="secondary" className="hidden lg:inline-flex">
                    {session.role === "admin" ? "Admin" : "Reviewing Officer"}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm">{session.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{session.dept}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    clearSession();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 sm:hidden">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}

export function bandTone(score: number) {
  return bandOf(score);
}
