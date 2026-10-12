const metrics = [
  { label: 'Active projects', value: '12', note: 'Illustrative data', tone: 'blue', icon: '◫' },
  { label: 'Open pull requests', value: '28', note: 'Illustrative data', tone: 'purple', icon: '⑂' },
  { label: 'CI success rate', value: '96.8%', note: 'Illustrative data', tone: 'green', icon: '✓' },
  { label: 'Security findings', value: '04', note: 'Illustrative data', tone: 'amber', icon: '◇' },
];
const projects = [
  { name: 'Enterprise Export Platform', repo: 'enterprise-export-platform-usa', team: 'Platform', progress: 72, status: 'In progress', tone: 'blue' },
  { name: 'Business Automation System', repo: 'business-automation-system', team: 'Automation', progress: 88, status: 'On track', tone: 'green' },
  { name: 'Full-Stack Product Development', repo: 'Full-stack-product-development', team: 'Product', progress: 46, status: 'In review', tone: 'purple' },
  { name: 'Export Client Apps', repo: 'export-client-web-sync · mobile · desktop', team: 'Client apps', progress: 31, status: 'Needs review', tone: 'amber' },
];
const agents = [
  { name: 'Frontend agent', task: 'UI implementation · Next.js', status: 'Design only', tone: 'blue' },
  { name: 'Backend agent', task: 'API contracts · authorization', status: 'Design only', tone: 'cyan' },
  { name: 'QA & security agent', task: 'Tests · dependency review', status: 'Review gate', tone: 'green' },
  { name: 'DevOps agent', task: 'CI diagnostics · release plan', status: 'Approval gate', tone: 'purple' },
];
const pipeline = [
  ['Lint & typecheck', 'Not run', 'muted'],
  ['Unit / integration tests', 'Not run', 'muted'],
  ['Dependency scan', 'Not run', 'muted'],
  ['Build artifact', 'Not run', 'muted'],
  ['Production release', 'Human approval required', 'amber'],
];
export default function DashboardPage() {
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">N</div><div><strong>NEXUS AI</strong><small>ENGINEERING CONTROL PLANE</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Primary navigation">
        {['Overview', 'Projects', 'Repositories', 'AI Agents', 'Quality & Security', 'CI / CD Pipelines', 'Approvals', 'Audit Logs'].map((item, i) => <a className={`nav-item ${i === 0 ? 'active' : ''}`} href={i === 0 ? '#overview' : `#${item.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} key={item}><span className="nav-glyph">{['◫','▦','⌘','✳','◇','↗','✓','≡'][i]}</span>{item}{item === 'Approvals' && <span className="count">3</span>}</a>)}
      </nav>
      <div className="sidebar-rule" />
      <div className="nav-label">GOVERNANCE</div>
      <div className="env-row"><span className="dot green-dot" />Environment <span className="env-pill">STAGING</span></div>
      <div className="approval-note"><span>◉</span><span>Human approval required</span></div>
      <div className="profile"><div className="avatar">MB</div><div><strong>Workspace Admin</strong><small>Platform owner</small></div></div>
    </aside>
    <section className="main-content" id="overview">
      <header className="topbar"><div><div className="eyebrow">WORKSPACE / ENGINEERING</div><h1>AI Development Overview</h1><p>One control plane for teams, repositories, agents and releases.</p></div><div className="top-actions"><span className="select-chip"><i className="dot green-dot" /> Staging</span><span className="select-chip">Last 7 days</span><a className="primary-button" href="#projects">＋ Invite team</a></div></header>
      <div className="demo-banner"><span className="demo-dot" /> DEMO MODE <span>Metrics and workstream statuses are illustrative until connected to verified data sources.</span></div>
      <section className="kpi-grid" aria-label="Executive KPIs">{metrics.map((m) => <article className="panel kpi-card" key={m.label}><div className={`kpi-icon ${m.tone}`}>{m.icon}</div><div className="kpi-label">{m.label}</div><div className="kpi-value">{m.value}</div><div className="kpi-note">{m.note}</div></article>)}</section>
      <div className="content-grid">
        <section className="panel projects-panel" id="projects"><div className="panel-heading"><div><h2>Project delivery</h2><p>Workstream progress and repository ownership</p></div><span className="subtle-chip">MULTI-REPO</span></div><div className="table-wrap"><table><thead><tr><th>PROJECT / REPOSITORY</th><th>TEAM</th><th>PROGRESS</th><th>STATUS</th></tr></thead><tbody>{projects.map((p) => <tr key={p.repo}><td><div className="project-name">{p.name}</div><div className="repo-name">{p.repo}</div></td><td>{p.team}</td><td><div className="progress-cell"><div className="progress-track"><div className={`progress-fill ${p.tone}`} style={{ width: `${p.progress}%` }} /></div><span>{p.progress}%</span></div></td><td><span className={`status-pill ${p.tone}`}>{p.status}</span></td></tr>)}</tbody></table></div><p className="panel-footnote">Repository metadata is not live until the GitHub integration is configured.</p></section>
        <section className="panel agents-panel" id="ai-agents"><div className="panel-heading"><div><h2>AI agent orchestration</h2><p>Hybrid mode · advisory + controlled execution</p></div><span className="subtle-chip">POLICY CONTROL</span></div><div className="agent-list">{agents.map((a, i) => <div className="agent-row" key={a.name}><div className={`agent-avatar ${a.tone}`}>{String(i + 1).padStart(2, '0')}</div><div className="agent-copy"><strong>{a.name}</strong><small>{a.task}</small></div><span className={`status-pill ${a.tone}`}>{a.status}</span></div>)}</div><p className="panel-footnote">Agent execution is not enabled in this scaffold.</p></section>
        <section className="panel pipeline-panel" id="ci-cd-pipelines"><div className="panel-heading"><div><h2>CI / CD pipeline health</h2><p>Latest checks · awaiting pipeline integration</p></div><span className="subtle-chip">5 GATES</span></div><div className="pipeline-list">{pipeline.map(([label, state, tone]) => <div className="pipeline-row" key={label}><span className={`pipeline-dot ${tone}`} /><span>{label}</span><strong className={tone}>{state}</strong></div>)}</div></section>
        <section className="panel security-panel" id="quality-security"><div className="panel-heading"><div><h2>Quality & security</h2><p>Policy gates before release</p></div><span className="subtle-chip">BASELINE</span></div><div className="security-metrics"><div><span>Critical vulnerabilities</span><strong className="green">Not assessed</strong></div><div><span>High severity findings</span><strong className="amber">Not assessed</strong></div><div><span>Test coverage</span><strong>Not measured</strong></div><div><span>Secrets scanning</span><strong>Not configured</strong></div></div></section>
        <section className="panel approvals-panel" id="approvals"><div className="panel-heading"><div><h2>Human approval queue</h2><p>Approval controls are planned, not active</p></div><span className="status-pill amber">GATED</span></div><div className="approval-card"><div className="approval-symbol">↗</div><div><strong>Merge pull request</strong><small>Approval workflow API not implemented</small></div></div><div className="approval-card"><div className="approval-symbol warning-symbol">!</div><div><strong>Deploy to production</strong><small>Human authorization required</small></div></div><div className="approval-card"><div className="approval-symbol">◇</div><div><strong>Security-sensitive change</strong><small>Independent reviewer required</small></div></div><p className="panel-footnote">No merge or deployment action is available from this dashboard.</p></section>
        <section className="panel audit-panel" id="audit-logs"><div className="panel-heading"><div><h2>Audit & governance</h2><p>Traceability requirements</p></div><span className="subtle-chip">SCHEMA BASELINE</span></div><div className="audit-grid"><div><small>Actor attribution</small><strong>Human · AI · System</strong></div><div><small>Change reference</small><strong>Commit · PR · workflow run</strong></div><div><small>Decision evidence</small><strong>Approver · reason · timestamp</strong></div></div><p className="panel-footnote">Database schema exists; audit persistence is not wired into application routes yet.</p></section>
      </div>
      <footer className="footer"><span>● Secure-by-default foundation</span><span>Integration status: <strong>Not connected</strong></span><span>Production actions: <strong>Human approval required</strong></span></footer>
    </section>
  </main>;
}
