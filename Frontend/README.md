# MPLADS Guardian

Build a production-grade, multi-page web application called "MPLADS Risk Intelligence" — an AI-powered risk detection and early-warning dashboard for government officials who monitor MPLADS (Members of Parliament Local Area Development Scheme) infrastructure projects.

Who uses this and why it matters

The end users are government officers at MoSPI / district / ministry level — not developers, not the general public. They are moderately tech-comfortable, time-pressed, and need to quickly answer: "Which projects need my attention today, and why?" Every screen should feel like a decision-support tool, not a generic analytics dashboard. Design for trust and clarity over decoration.

Non-negotiable product framing: this system flags anomalous risk patterns for human verification — it never claims to detect fraud. That distinction ("Anomaly ≠ Fraud") must show up visibly wherever a risk score is displayed, and every AI-generated score must be paired with visible evidence, a confidence level, and a data-quality indicator. Never design a screen that presents a risk score as a final verdict.

Visual & design language

Institutional, credible, "govt intelligence dashboard" aesthetic — think palette of deep navy/indigo as the primary brand color, with a clean off-white/light-gray canvas. Reserve color as semantic signal, not decoration:

Red/rose = High risk / Critical

Amber/orange = Medium risk / Needs review

Green = Low risk / Verified / Human-confirmed

Neutral slate/gray = informational, data-source, structural elements

Dense, data-forward layouts (cards, tables, badges, sparklines) but generously spaced — this is not a marketing site.

Use a real component library (shadcn/ui) for consistency: tables, tabs, badges, dialogs, command palette (⌘K search), toasts, skeleton loaders.

Typography: one clean sans-serif (e.g. Inter), strong hierarchy — this is a hackathon-winner-caliber build, so it should look like a real deployed GovTech product, not a template demo.

Persistent left sidebar navigation (collapsible) + top bar with global search, notifications bell, and officer profile/role badge. Sidebar and top bar are the ONLY globally-repeated chrome — do not repeat full feature blocks across pages.

Information architecture — build these as distinct routed pages/sections, each with a clearly different job. Do not duplicate the same component/feature across two sections; if something is already shown in one section, link to it instead of rebuilding it elsewhere.

1. Login / Role Selector

Simple, secure-feeling auth screen (govt portal style) with role selection: Reviewing Officer vs Admin. This sets what the rest of the app shows (Admin gets a "User & Access Management" nav item, officers don't).

2. Command Center (Home Dashboard)

The daily-use landing page. Purpose: "What needs my attention right now, at a glance."

Top KPI strip: Total projects monitored, High-risk count, Pending verification count, Avg. data quality score — each as a stat card with a small trend sparkline.

"Today's Priority Queue" — a compact ranked list of the top 5–8 highest-risk unreviewed projects (project name, risk score badge, top reason, one-click "Open case").

Risk distribution chart (donut or bar: High/Medium/Low/Critical counts).

A small live map preview (not the full map — just a teaser widget) showing risk hotspots, linking to the full Geospatial Risk Map section.

Recent system activity feed (e.g. "Project X moved to Under Review", "12 new projects ingested from eSAKSHI"). Do NOT put the full project table or full map here — those live in their own sections.

3. Project Explorer (list/table view)

Purpose: browse and filter the full project universe.

Powerful filter bar: state, district, constituency/MP, implementing agency, work type, risk band (Critical/High/Medium/Low), status (Unreviewed/Under Review/Verified/False Positive), date range.

Data-dense sortable table: Project ID, name, agency, sanctioned cost, risk score (colored badge), top risk signal, last updated.

Saved filter presets and a search bar.

Row click opens the Project Risk Profile (section 4) — do not inline the full profile here.

4. Project Risk Profile (deep-dive detail page)

Purpose: the evidence room for one specific project. This is the most important screen — it must embody "explainable AI," not a black box.

Header: project identity (ID, name, location, agency, sanctioned amount, dates), status badge, and a prominent Risk Score gauge (0–100) with Confidence % and Data Quality % shown alongside it — never the score alone.

"Why flagged" panel: a breakdown of contributing signals as a horizontal stacked/weighted bar (Cost deviation, Delay, Duplicate similarity, Expenditure/progress mismatch, Agency pattern, Compliance) — each expandable to show the underlying evidence (e.g. actual vs. peer-average cost, expenditure % vs physical progress %).

Peer comparison mini-table: this project vs. 3–5 similar projects (same work type/region/scale).

Evidence & documents panel: sanction letter, expenditure records, progress reports, site photos/geotags (thumbnails), utilisation certificates — with upload/view affordances.

Officer action panel: Verify / Escalate to Investigation / Mark False Positive, with a mandatory short remark field — this is the human-in-the-loop moment, make it feel deliberate and important, not a casual toggle.

Timeline/audit trail of status changes for this project.

5. Geospatial Risk Map

Purpose: spatial pattern discovery — nearby/duplicate works, regional hotspots.

Full interactive map (state → district → constituency drill-down) with project pins colored by risk band, clustering at zoom-out.

Toggle layers: risk heatmap, duplicate-work proximity clusters, agency footprint.

Clicking a pin shows a compact popover (name, risk badge, "Open full profile" link into section 4) — never the whole risk profile inline on the map.

6. Agency Risk Intelligence

Purpose: pattern-of-behaviour view across an implementing agency's whole portfolio, not one project.

Ranked list/leaderboard of agencies by aggregate risk pattern (repeated cost overruns, repeated delays, repeated progress mismatches).

Agency detail view: portfolio summary stats, trend of that agency's risk over time, list of its flagged projects (link into section 4 for each, don't re-render project cards here beyond a compact row).

7. Investigation Workflow / Case Queue

Purpose: operational tracking for cases moving through the human verification pipeline — distinct from the "browse everything" Project Explorer.

Kanban-style or status-grouped board: Unreviewed → Under Review → Escalated → Verified/Resolved → False Positive.

Drag or status-change actions, assignee avatars, SLA/age-of-case indicators.

This is where officers manage their workload, not where they discover new risks.

8. Analytics & Reports

Purpose: aggregate trends for leadership, not per-project detail.

Time-series trend charts: risk score distribution over months, verification outcomes over time (true anomaly vs false positive rate — this is how the system shows it's improving).

State/district comparison heatmap or ranked bars.

Exportable report builder (date range + filters → generate PDF/CSV summary).

Do not repeat the individual project table here — this section is aggregate-only.

9. Admin — Access & Model Governance (Admin role only)

User & role management table (officers, permissions, department).

Model/feedback panel: shows the feedback loop concept from the PPT — "X verified cases fed back this month," detection engine weight configuration (read-only display is fine), data source connection status (eSAKSHI, GeM, PFMS, geospatial feeds) with last-sync timestamps.

Cross-cutting requirements

Global search (⌘K) that can jump to a project, agency, or district instantly.

Notifications for newly-escalated high-risk projects.

Every risk-score element anywhere in the app uses the same badge component (Critical/High/Medium/Low with consistent colors) — build it once, reuse it, never restyle it differently per page.

Responsive down to tablet width (officers may use this on tablets in the field); desktop-first is fine for now.

Use realistic mock/sample data (Indian states, districts, MPLADS-style project names, agency names) so the demo reads as authentic, not placeholder Lorem Ipsum.

Empty/loading/error states for every data view (skeleton loaders, not blank screens).

Accessibility: sufficient color contrast, don't rely on color alone for risk level — always pair with a text label/icon.

What NOT to do

Do not build this as a single scrolling landing page — it must be a real multi-route application with persistent navigation.

Do not duplicate the same table, chart, or profile card verbatim across sections "to fill space" — link to the canonical section instead.

Do not present any AI score as a final/certain verdict — always pair with evidence, confidence, and a human-review action.

Avoid generic stock-dashboard clichés (fake crypto-style neon charts, irrelevant stock photography) — this must read as a credible Indian GovTech product.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe1a22c7-ead2-48a2-b447-65d9f4f43138).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
