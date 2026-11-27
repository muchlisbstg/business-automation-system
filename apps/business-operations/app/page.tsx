"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, MetricCard, Panel, SectionHeading, StatusPill } from "@/components/ui";

type View = "overview" | "operations" | "approvals" | "inventory";
const activities = [
  { id: "ACT-0248", title: "Purchase request submitted", detail: "North America sourcing · PR-2026-0248", time: "09:42 AM", tone: "info" as const },
  { id: "ACT-0247", title: "Supplier verification completed", detail: "Pacific Auto Components · SUP-0081", time: "09:18 AM", tone: "success" as const },
  { id: "ACT-0246", title: "QC inspection requires review", detail: "Inbound batch · WH-2026-0112", time: "08:56 AM", tone: "warning" as const },
  { id: "ACT-0245", title: "Export document checklist updated", detail: "Shipment EX-2026-0034 · Draft", time: "08:31 AM", tone: "neutral" as const }
];
const workItems = [
  { id: "PR-2026-0248", name: "Brake assembly sourcing", owner: "Procurement", date: "Nov 29, 2026", status: "Awaiting review", tone: "warning" as const, priority: "High" },
  { id: "PO-2026-0182", name: "Suspension components", owner: "Operations", date: "Nov 30, 2026", status: "In progress", tone: "info" as const, priority: "Medium" },
  { id: "QC-2026-0112", name: "Inbound quality inspection", owner: "Quality Control", date: "Dec 01, 2026", status: "Action required", tone: "danger" as const, priority: "High" },
  { id: "EX-2026-0034", name: "Export document preparation", owner: "Export Desk", date: "Dec 03, 2026", status: "Draft", tone: "neutral" as const, priority: "Medium" },
  { id: "SUP-2026-0081", name: "Supplier onboarding review", owner: "Procurement", date: "Dec 04, 2026", status: "Verified", tone: "success" as const, priority: "Low" }
];
const inventorySignals = [
  { id: "sku", label: "Tracked SKUs", value: "1,248", status: "Illustrative", tone: "success" as const },
  { id: "low-stock", label: "Low stock alerts", value: "07", status: "Attention", tone: "warning" as const },
  { id: "qc-hold", label: "QC hold items", value: "12", status: "Review", tone: "danger" as const }
];
const navGroups = [
  { label: "WORKSPACE", items: [{ id: "overview" as View, icon: "▦", label: "Executive overview" }, { id: "operations" as View, icon: "⇄", label: "Operations workspace" }, { id: "approvals" as View, icon: "✓", label: "Approval center", count: "08" }] },
  { label: "OPERATIONS", items: [{ id: "inventory" as View, icon: "▤", label: "Inventory overview" }] }
];

export default function BusinessOperationsPage() {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileNav, setMobileNav] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileNav) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileNav(false); menuButtonRef.current?.focus(); }
      if (event.key === "Tab") {
        const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])");
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [mobileNav]);
  const visibleItems = useMemo(() => workItems.filter(item => (view !== "approvals" || item.status !== "Verified") && [item.id, item.name, item.owner, item.status].join(" ").toLowerCase().includes(query.toLowerCase())), [query, view]);
  const visibleInventory = useMemo(() => inventorySignals.filter(item => [item.id, item.label, item.value, item.status].join(" ").toLowerCase().includes(query.toLowerCase())), [query]);
  const title = view === "overview" ? "Executive overview" : view === "operations" ? "Operations workspace" : view === "approvals" ? "Approval center" : "Inventory overview";
  const description = view === "overview" ? "A consolidated view of business activity, operational health and decisions." : view === "operations" ? "Track cross-functional work items and operational exceptions." : view === "approvals" ? "Review pending decisions and maintain a clear approval trail." : "Monitor stock visibility and inventory control signals.";

  return <div className="app-shell" data-theme={theme}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside ref={sidebarRef} className={`sidebar ${mobileNav ? "open" : ""}`} role={mobileNav ? "dialog" : undefined} aria-modal={mobileNav ? true : undefined} aria-label={mobileNav ? "Mobile navigation" : undefined}>
      <div className="brand"><div className="brand-mark">A</div><div><strong>AUTRAVA</strong><small>BUSINESS OPERATIONS</small></div><button ref={closeButtonRef} className="mobile-close" onClick={() => { setMobileNav(false); menuButtonRef.current?.focus(); }} aria-label="Close navigation">×</button></div>
      <div className="workspace-label">ENTERPRISE WORKSPACE</div>
      <nav id="primary-navigation" aria-label="Primary navigation">
      {navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} aria-current={view === item.id ? "page" : undefined} onClick={() => { setView(item.id); setMobileNav(false); }}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</button>)}</div>)}
      <div className="nav-group"><div className="nav-label">BUSINESS DATA</div><button className="nav-item" onClick={() => setView("operations")}><span className="nav-icon">◇</span><span>Master data</span></button><button className="nav-item" onClick={() => setView("operations")}><span className="nav-icon">♧</span><span>Supplier management</span></button></div>
      <div className="nav-group"><div className="nav-label">GOVERNANCE</div><button className="nav-item" onClick={() => setView("approvals")}><span className="nav-icon">⌘</span><span>Compliance & review</span></button><button className="nav-item" onClick={() => setView("approvals")}><span className="nav-icon">◎</span><span>Sharia governance</span></button></div>
      </nav>
      <div className="sidebar-bottom"><div className="environment"><span className="live-dot"/><span>Preview environment</span><StatusPill tone="warning">DEMO</StatusPill></div><div className="profile"><div className="profile-avatar">MB</div><div><strong>Workspace Admin</strong><small>Demo profile · no live access</small></div><span className="profile-menu">•••</span></div></div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => { setMobileNav(false); menuButtonRef.current?.focus(); }} aria-label="Close navigation overlay"/>}
    <main className="main" id="main-content" tabIndex={-1}>
      <header className="topbar"><button ref={menuButtonRef} className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded={mobileNav}>☰</button><div className="breadcrumbs">Workspace <span>/</span> {title}</div><div className="topbar-actions"><label className="search-box"><span>⌕</span><input aria-label="Search records" placeholder="Search records..." value={query} onChange={e => setQuery(e.target.value)}/><kbd>⌘ K</kbd></label><button className="icon-button" aria-label="Notifications">♧<i/></button><button className="theme-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "◐ Dark" : "☼ Light"}</button></div></header>
      <div className="page-content">
        <SectionHeading eyebrow="BUSINESS INTELLIGENCE / OPERATIONS" title={title} description={description} action={<><span className="snapshot-label">DEMO SNAPSHOT</span><button className="button-primary" onClick={() => setView("operations")}>View request register</button></>}/>
        <div className="demo-notice"><span>DEMO DATA</span> All figures and records shown are illustrative. No live business systems or financial accounts are connected.</div>
        {view === "overview" && <>
          <div className="metric-grid"><MetricCard label="Open purchase requests" value="24" change="↑ 8% vs previous period" icon="⇄" tone="orange"/><MetricCard label="Active suppliers" value="186" change="12 pending verification" icon="♧" tone="blue"/><MetricCard label="Inventory alerts" value="07" change="3 require attention" icon="▤" tone="violet"/><MetricCard label="Pending approvals" value="08" change="2 high-priority decisions" icon="✓" tone="green"/></div>
          <div className="dashboard-grid">
            <Panel title="Operational pipeline" subtitle="Illustrative work distribution" action={<span className="subtle-label">BY STATUS</span>}><div className="pipeline"><div className="pipeline-row"><div><span className="pipeline-dot orange-dot"/>Awaiting review</div><strong>08</strong><div className="bar"><i style={{width:"32%"}}/></div></div><div className="pipeline-row"><div><span className="pipeline-dot blue-dot"/>In progress</div><strong>14</strong><div className="bar"><i className="blue-bar" style={{width:"56%"}}/></div></div><div className="pipeline-row"><div><span className="pipeline-dot green-dot"/>Completed</div><strong>21</strong><div className="bar"><i className="green-bar" style={{width:"84%"}}/></div></div><div className="pipeline-row"><div><span className="pipeline-dot red-dot"/>Exceptions</div><strong>03</strong><div className="bar"><i className="red-bar" style={{width:"12%"}}/></div></div></div></Panel>
            <Panel title="Approval queue" subtitle="Items requiring human decision" action={<button className="text-action" onClick={() => setView("approvals")}>View all →</button>}><div className="approval-list"><div className="approval-item"><span className="approval-icon orange">PR</span><div><strong>Purchase request · PR-0248</strong><small>Procurement · High priority</small></div><StatusPill tone="warning">Pending</StatusPill></div><div className="approval-item"><span className="approval-icon blue">QC</span><div><strong>QC disposition · QC-0112</strong><small>Warehouse · Review needed</small></div><StatusPill tone="danger">Action</StatusPill></div><div className="approval-item"><span className="approval-icon violet">EX</span><div><strong>Export checklist · EX-0034</strong><small>Export desk · Document review</small></div><StatusPill tone="info">Review</StatusPill></div></div></Panel>
            <Panel title="Recent activity" subtitle="Illustrative audit timeline" action={<span className="subtle-label">TODAY</span>} className="activity-panel"><div className="activity-list">{activities.map(item => <div className="activity-item" key={item.id}><span className={`activity-marker ${item.tone}`}/><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{item.time}</time></div>)}</div></Panel>
            <Panel title="Control signals" subtitle="Governance and operational checkpoints"><div className="control-list"><div><span>Supplier verification</span><StatusPill tone="success">Operational</StatusPill></div><div><span>Export evidence completeness</span><StatusPill tone="warning">Needs review</StatusPill></div><div><span>Sharia review decisions</span><StatusPill tone="info">Human-led</StatusPill></div><div><span>Backend authorization</span><StatusPill tone="neutral">Not connected</StatusPill></div></div></Panel>
          </div>
        </>}
        {view !== "overview" && <div className="workspace-grid">
          <Panel title={view === "operations" ? "Operational work items" : view === "approvals" ? "Pending approval register" : "Inventory control overview"} subtitle={view === "inventory" ? "Illustrative stock categories and exception queue" : "Sample records for interaction and layout validation"} action={<span className="subtle-label">{view === "inventory" ? visibleInventory.length : visibleItems.length} RECORDS</span>}>
            {view === "inventory" ? <>{visibleInventory.length > 0 ? <div className="inventory-cards">{visibleInventory.map(item => <div key={item.id}><small>{item.label}</small><strong>{item.value}</strong><StatusPill tone={item.tone}>{item.status}</StatusPill></div>)}</div> : <EmptyState title="No matching inventory signals" detail="Try a stock category or status keyword."/>}</> : <div className="table-wrap"><table><caption className="sr-only">{view === "approvals" ? "Illustrative pending approval register" : "Illustrative operational work items"}</caption><thead><tr><th scope="col">REFERENCE</th><th scope="col">WORK ITEM</th><th scope="col">OWNER</th><th scope="col">DUE DATE</th><th scope="col">PRIORITY</th><th scope="col">STATUS</th></tr></thead><tbody>{visibleItems.map(item => <tr key={item.id}><td className="ref-cell">{item.id}</td><td className="work-name">{item.name}</td><td>{item.owner}</td><td>{item.date}</td><td>{item.priority}</td><td><StatusPill tone={item.tone}>{item.status}</StatusPill></td></tr>)}</tbody></table>{visibleItems.length === 0 && <EmptyState title="No matching records" detail="Try another reference, owner or status."/>}</div>}
          </Panel>
          <Panel title="Workspace controls" subtitle="Preview-only actions"><div className="control-list"><div><span>Record creation</span><StatusPill tone="neutral">Demo only</StatusPill></div><div><span>Approval execution</span><StatusPill tone="warning">Disabled</StatusPill></div><div><span>Live data connection</span><StatusPill tone="neutral">Not connected</StatusPill></div><div><span>Audit persistence</span><StatusPill tone="neutral">Not connected</StatusPill></div></div><p className="panel-note">This preview validates navigation, responsive layout and shared UI patterns. It does not execute business transactions or grant backend permissions.</p></Panel>
        </div>}
        <footer className="footer"><span><strong>AUTRAVA Operations</strong> · Internal business workspace</span><span>UI preview v0.1 · Illustrative data · Not production</span></footer>
      </div>
    </main>
  </div>;
}