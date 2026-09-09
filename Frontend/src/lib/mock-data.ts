// Deterministic mock dataset for MPLADS Risk Intelligence.
// Realistic Indian states/districts/agencies + MPLADS-style works.

export type RiskBand = "critical" | "high" | "medium" | "low";
export type CaseStatus = "unreviewed" | "under_review" | "escalated" | "verified" | "false_positive";

export interface SignalKey {
  key: "cost" | "delay" | "duplicate" | "mismatch" | "agency" | "compliance";
  label: string;
}

export const SIGNALS: SignalKey[] = [
  { key: "cost", label: "Cost deviation" },
  { key: "delay", label: "Schedule delay" },
  { key: "duplicate", label: "Duplicate similarity" },
  { key: "mismatch", label: "Expenditure / progress mismatch" },
  { key: "agency", label: "Agency pattern" },
  { key: "compliance", label: "Compliance gaps" },
];

export interface Project {
  id: string;
  name: string;
  state: string;
  district: string;
  constituency: string;
  mp: string;
  agency: string;
  workType: string;
  sanctionedCost: number; // lakh
  expenditure: number; // lakh
  physicalProgress: number; // %
  sanctionDate: string;
  targetDate: string;
  lastUpdated: string;
  riskScore: number;
  confidence: number;
  dataQuality: number;
  status: CaseStatus;
  assignee?: string | undefined;
  signals: Record<SignalKey["key"], number>; // 0-100 contribution weight
  peerAvgCost: number;
  delayDays: number;
  lat: number;
  lng: number;
  evidence: string[];
  timeline: { at: string; actor: string; action: string; note?: string }[];
}

const STATES: { state: string; districts: string[]; lat: number; lng: number }[] = [
  { state: "Uttar Pradesh", districts: ["Varanasi", "Lucknow", "Gorakhpur", "Prayagraj"], lat: 26.8, lng: 80.9 },
  { state: "Maharashtra", districts: ["Pune", "Nagpur", "Nashik", "Solapur"], lat: 19.7, lng: 75.7 },
  { state: "Bihar", districts: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"], lat: 25.6, lng: 85.1 },
  { state: "Tamil Nadu", districts: ["Coimbatore", "Madurai", "Salem", "Trichy"], lat: 11.1, lng: 78.6 },
  { state: "Karnataka", districts: ["Belagavi", "Mysuru", "Kalaburagi", "Tumakuru"], lat: 15.3, lng: 75.7 },
  { state: "Rajasthan", districts: ["Jodhpur", "Kota", "Ajmer", "Bikaner"], lat: 26.6, lng: 73.8 },
  { state: "West Bengal", districts: ["Howrah", "Murshidabad", "Bardhaman", "Siliguri"], lat: 23.0, lng: 87.8 },
  { state: "Gujarat", districts: ["Rajkot", "Surat", "Bhavnagar", "Mehsana"], lat: 22.6, lng: 71.6 },
  { state: "Madhya Pradesh", districts: ["Indore", "Jabalpur", "Rewa", "Sagar"], lat: 23.4, lng: 78.4 },
  { state: "Odisha", districts: ["Cuttack", "Sambalpur", "Ganjam", "Balasore"], lat: 20.6, lng: 84.8 },
];

export const AGENCIES = [
  "PWD (State Division)",
  "Rural Engineering Services",
  "Municipal Corporation",
  "Zilla Parishad Works Dept.",
  "Jal Nigam",
  "District Rural Development Agency",
  "State Housing Board",
  "Panchayati Raj Engineering Wing",
];

const WORK_TYPES = [
  "Community Hall",
  "CC Road / Interlocking",
  "Solar Street Lighting",
  "Drinking Water Borewell",
  "School Additional Classroom",
  "PHC Building Upgrade",
  "Public Library",
  "Drainage & Culvert",
  "Anganwadi Centre",
  "Bus Shelter",
  "Crematorium Shed",
  "Sports Ground Development",
];

const MPS = [
  "Sh. R. Deshmukh",
  "Smt. A. Nair",
  "Sh. K. Prasad",
  "Dr. M. Iyer",
  "Sh. S. Chauhan",
  "Smt. P. Bhattacharya",
  "Sh. V. Reddy",
  "Sh. T. Meena",
];

export const OFFICERS = [
  { id: "off-1", name: "Ananya Rao", initials: "AR", role: "Reviewing Officer", dept: "MoSPI — Monitoring Cell" },
  { id: "off-2", name: "Vikram Sethi", initials: "VS", role: "Reviewing Officer", dept: "District Unit — Pune" },
  { id: "off-3", name: "Fatima Q.", initials: "FQ", role: "Senior Analyst", dept: "MoSPI — Analytics" },
  { id: "off-4", name: "D. Krishnan", initials: "DK", role: "Admin", dept: "Ministry IT" },
];

// Simple deterministic PRNG (mulberry32)
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bandOf(score: number): RiskBand {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export const BAND_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  unreviewed: "Unreviewed",
  under_review: "Under Review",
  escalated: "Escalated",
  verified: "Verified",
  false_positive: "False Positive",
};

const EVIDENCE_DOCS = [
  "Sanction letter (MPLADS/2024)",
  "Utilisation certificate",
  "Expenditure statement — Q3",
  "Physical progress report",
  "Geotagged site photograph",
  "Third-party inspection note",
];

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)] as T;
}

function buildProjects(): Project[] {
  const r = rng(20260909);
  const out: Project[] = [];
  const statuses: CaseStatus[] = [
    "unreviewed",
    "unreviewed",
    "unreviewed",
    "under_review",
    "escalated",
    "verified",
    "false_positive",
  ];

  for (let i = 0; i < 148; i++) {
    const s = pick(STATES, r);
    const district = pick(s.districts, r);
    const workType = pick(WORK_TYPES, r);
    const agency = pick(AGENCIES, r);
    const peerAvgCost = Math.round(8 + r() * 40);
    const deviation = r() * 1.9 + 0.55;
    const sanctionedCost = Math.round(peerAvgCost * deviation * 10) / 10;
    const physicalProgress = Math.round(r() * 100);
    const expenditure = Math.round(sanctionedCost * Math.min(1, (physicalProgress / 100) * (0.6 + r() * 1.1)) * 10) / 10;
    const delayDays = Math.round(Math.max(0, r() * 420 - 60));

    const sig = {
      cost: Math.round(Math.max(0, (deviation - 1) * 60 + r() * 12)),
      delay: Math.round(Math.min(100, (delayDays / 400) * 90 + r() * 10)),
      duplicate: Math.round(r() * r() * 100),
      mismatch: Math.round(Math.min(100, Math.abs(expenditure / Math.max(sanctionedCost, 1) * 100 - physicalProgress))),
      agency: Math.round(r() * 70),
      compliance: Math.round(r() * 80),
    };
    const raw =
      sig.cost * 0.26 +
      sig.delay * 0.2 +
      sig.duplicate * 0.14 +
      sig.mismatch * 0.22 +
      sig.agency * 0.1 +
      sig.compliance * 0.08;
    const riskScore = Math.max(6, Math.min(98, Math.round(raw)));
    const month = 1 + Math.floor(r() * 9);
    const status = pick(statuses, r);
    const id = `MP-${String(2024 + (i % 2))}-${String(1000 + i)}`;

    out.push({
      id,
      name: `${workType} at ${district} Block ${1 + Math.floor(r() * 12)}`,
      state: s.state,
      district,
      constituency: `${district} ${r() > 0.5 ? "Sadar" : "Rural"}`,
      mp: pick(MPS, r),
      agency,
      workType,
      sanctionedCost,
      expenditure,
      physicalProgress,
      sanctionDate: `2025-${String(month).padStart(2, "0")}-1${Math.floor(r() * 9)}`,
      targetDate: `2026-${String(1 + Math.floor(r() * 9)).padStart(2, "0")}-2${Math.floor(r() * 8)}`,
      lastUpdated: `2026-0${1 + Math.floor(r() * 8)}-1${Math.floor(r() * 9)}`,
      riskScore,
      confidence: 52 + Math.round(r() * 45),
      dataQuality: 46 + Math.round(r() * 52),
      status,
      assignee: r() > 0.35 ? pick(OFFICERS.slice(0, 3), r).name : undefined,
      signals: sig,
      peerAvgCost,
      delayDays,
      lat: s.lat + (r() - 0.5) * 3.2,
      lng: s.lng + (r() - 0.5) * 3.2,
      evidence: EVIDENCE_DOCS.filter(() => r() > 0.32),
      timeline: [
        { at: "2026-01-12", actor: "Ingestion Service", action: "Ingested from eSAKSHI" },
        { at: "2026-02-03", actor: "Detection Engine v2.4", action: `Risk score computed (${riskScore})` },
        ...(status !== "unreviewed"
          ? [{ at: "2026-04-21", actor: "Ananya Rao", action: `Status set to ${STATUS_LABEL[status]}`, note: "Desk review of expenditure vs progress." }]
          : []),
      ],
    });
  }
  return out;
}

export const PROJECTS: Project[] = buildProjects();

export function projectById(id: string) {
  return PROJECTS.find((p) => p.id === id);
}

export function peersOf(p: Project) {
  return PROJECTS.filter((x) => x.id !== p.id && x.workType === p.workType)
    .sort((a, b) => Math.abs(a.peerAvgCost - p.peerAvgCost) - Math.abs(b.peerAvgCost - p.peerAvgCost))
    .slice(0, 4);
}

export interface AgencyStat {
  name: string;
  projects: number;
  flagged: number;
  avgRisk: number;
  costOverrunRate: number;
  delayRate: number;
  mismatchRate: number;
  trend: { month: string; risk: number }[];
}

const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const AGENCY_STATS: AgencyStat[] = AGENCIES.map((name, idx) => {
  const list = PROJECTS.filter((p) => p.agency === name);
  const avgRisk = Math.round(list.reduce((a, b) => a + b.riskScore, 0) / Math.max(list.length, 1));
  const r = rng(1000 + idx);
  return {
    name,
    projects: list.length,
    flagged: list.filter((p) => p.riskScore >= 70).length,
    avgRisk,
    costOverrunRate: Math.round((list.filter((p) => p.sanctionedCost > p.peerAvgCost * 1.3).length / Math.max(list.length, 1)) * 100),
    delayRate: Math.round((list.filter((p) => p.delayDays > 120).length / Math.max(list.length, 1)) * 100),
    mismatchRate: Math.round((list.filter((p) => p.signals.mismatch > 40).length / Math.max(list.length, 1)) * 100),
    trend: MONTHS.map((m) => ({ month: m, risk: Math.max(10, Math.min(95, avgRisk + Math.round((r() - 0.5) * 26))) })),
  };
}).sort((a, b) => b.avgRisk - a.avgRisk);

export function agencyByName(name: string) {
  return AGENCY_STATS.find((a) => a.name === name);
}

export const ACTIVITY = [
  { at: "12 min ago", text: "12 new projects ingested from eSAKSHI (Bihar, Odisha)", kind: "ingest" as const },
  { at: "38 min ago", text: "MP-2025-1042 escalated to Investigation by Vikram Sethi", kind: "escalate" as const },
  { at: "1 hr ago", text: "Detection engine re-scored 63 projects after PFMS sync", kind: "engine" as const },
  { at: "2 hrs ago", text: "MP-2024-1017 marked False Positive — duplicate GIS pin", kind: "resolve" as const },
  { at: "4 hrs ago", text: "Data quality alert: 9 projects missing utilisation certificates", kind: "alert" as const },
  { at: "Yesterday", text: "MP-2025-1088 verified after site inspection (Pune)", kind: "resolve" as const },
];

export const RISK_TREND = MONTHS.map((month, i) => {
  const r = rng(500 + i);
  return {
    month,
    critical: 6 + Math.round(r() * 9),
    high: 18 + Math.round(r() * 14),
    medium: 34 + Math.round(r() * 18),
    low: 52 + Math.round(r() * 20),
  };
});

export const OUTCOME_TREND = MONTHS.map((month, i) => {
  const r = rng(900 + i);
  const confirmed = 12 + Math.round(r() * 16) + i;
  const fp = 14 - Math.round(i * 0.7) + Math.round(r() * 5);
  return { month, confirmed, falsePositive: Math.max(2, fp) };
});

export const DATA_SOURCES = [
  { name: "eSAKSHI (MPLADS portal)", status: "connected", lastSync: "Today, 08:40 IST", records: "1,42,880" },
  { name: "PFMS expenditure feed", status: "connected", lastSync: "Today, 07:15 IST", records: "98,214" },
  { name: "GeM procurement", status: "degraded", lastSync: "Yesterday, 22:05 IST", records: "31,006" },
  { name: "Geospatial / geotag service", status: "connected", lastSync: "Today, 06:30 IST", records: "76,433" },
];

export const ENGINE_WEIGHTS = [
  { signal: "Cost deviation", weight: 26 },
  { signal: "Expenditure / progress mismatch", weight: 22 },
  { signal: "Schedule delay", weight: 20 },
  { signal: "Duplicate similarity", weight: 14 },
  { signal: "Agency pattern", weight: 10 },
  { signal: "Compliance gaps", weight: 8 },
];

export function kpis() {
  const high = PROJECTS.filter((p) => p.riskScore >= 70).length;
  const pending = PROJECTS.filter((p) => p.status === "unreviewed" || p.status === "under_review").length;
  const dq = Math.round(PROJECTS.reduce((a, b) => a + b.dataQuality, 0) / PROJECTS.length);
  return { total: PROJECTS.length, high, pending, dq };
}

export function distribution() {
  const acc: Record<RiskBand, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  PROJECTS.forEach((p) => acc[bandOf(p.riskScore)]++);
  return acc;
}

export function topReason(p: Project) {
  const entries = Object.entries(p.signals) as [SignalKey["key"], number][];
  entries.sort((a, b) => b[1] - a[1]);
  return SIGNALS.find((s) => s.key === entries[0]![0])!.label;
}
