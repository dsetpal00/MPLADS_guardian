import { useSyncExternalStore } from "react";
import { PROJECTS, type CaseStatus, type Project } from "@/lib/mock-data";

type Overrides = Record<string, { status: CaseStatus; remark: string; at: string; by: string }>;

let overrides: Overrides = {};
const listeners = new Set<() => void>();

function emit() {
  overrides = { ...overrides };
  listeners.forEach((l) => l());
}

export function setProjectStatus(id: string, status: CaseStatus, remark: string, by: string) {
  overrides[id] = { status, remark, by, at: new Date().toISOString().slice(0, 10) };
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function snapshot() {
  return overrides;
}

/** All projects with any officer decisions applied. */
export function useProjects(): Project[] {
  const ov = useSyncExternalStore(subscribe, snapshot, snapshot);
  return PROJECTS.map((p) => {
    const o = ov[p.id];
    if (!o) return p;
    return {
      ...p,
      status: o.status,
      timeline: [...p.timeline, { at: o.at, actor: o.by, action: `Status set to ${o.status.replace("_", " ")}`, note: o.remark }],
    };
  });
}

export function useProject(id: string): Project | undefined {
  return useProjects().find((p) => p.id === id);
}
