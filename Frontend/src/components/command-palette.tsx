import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AGENCY_STATS, PROJECTS } from "@/lib/mock-data";
import { RiskBadge } from "@/components/risk";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const districts = Array.from(new Set(PROJECTS.map((p) => `${p.district}, ${p.state}`))).sort();

  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a project, agency or district…" />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>
        <CommandGroup heading="Projects">
          {PROJECTS.slice(0, 40).map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.id} ${p.name} ${p.district}`}
              onSelect={() => go(() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } }))}
            >
              <span className="num text-xs text-muted-foreground">{p.id}</span>
              <span className="truncate">{p.name}</span>
              <RiskBadge score={p.riskScore} className="ml-auto" showScore={false} />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Agencies">
          {AGENCY_STATS.map((a) => (
            <CommandItem
              key={a.name}
              value={a.name}
              onSelect={() => go(() => navigate({ to: "/agencies/$agencyName", params: { agencyName: a.name } }))}
            >
              {a.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Districts">
          {districts.map((d) => (
            <CommandItem
              key={d}
              value={d}
              onSelect={() =>
                go(() => navigate({ to: "/projects", search: { q: d.split(",")[0] ?? "" } }))
              }
            >
              {d}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
