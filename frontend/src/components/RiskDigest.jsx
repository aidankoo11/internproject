import React, { useState } from 'react';

// Sample data modeled on IA Researcher output: a report -> risk scenarios ->
// the specific evidence each risk requires, with what's been collected.
// In production this is populated from the researcher MCP (get_risk_scenarios, get_coes, etc.)
const SAMPLE_REPORTS = [
  {
    id: 'r1',
    name: 'Private Brands – Global Sourcing (WW)',
    code: '5001647',
    vp: 'Adam Baker',
    risks: [
      {
        id: 'risk1',
        title: 'Supplier onboarded without completed FQA',
        scenario: 'A supplier begins production before a Factory Quality Audit is performed, exposing customers to unverified manufacturing quality.',
        severity: 'High',
        evidence: [
          { id: 'e1', label: 'Full population of FQA reports (2023–2025)', status: 'collected', source: 'SharePoint / QA team', note: 'Received 312 reports' },
          { id: 'e2', label: 'Production launch dates per supplier', status: 'collected', source: 'PBC Stage 3 export' },
          { id: 'e3', label: 'Supplier onboarding date log', status: 'partial', source: 'Vendor Mgmt', note: '4 of 9 packages received' },
          { id: 'e4', label: 'Approved auditor list with qualification dates', status: 'missing', source: 'QA team' },
        ],
      },
      {
        id: 'risk2',
        title: 'Testing performed by non-independent / unaccredited lab',
        scenario: 'Product testing is submitted to a lab that lacks accreditation scope or has a structural conflict of interest, undermining test validity.',
        severity: 'High',
        evidence: [
          { id: 'e5', label: 'Approved lab list with accreditation scope', status: 'collected', source: 'APQP' },
          { id: 'e6', label: 'ISO 17025 certificates per lab', status: 'partial', source: 'Lab Mgmt', note: '11 of 18 received' },
          { id: 'e7', label: 'Lab audit frequency & coverage records', status: 'missing', source: 'Lab Oversight' },
        ],
      },
      {
        id: 'risk3',
        title: 'Expired supplier financial statements',
        scenario: 'Supplier financial viability is assessed using statements older than 12 months, risking continuity of supply.',
        severity: 'Medium',
        evidence: [
          { id: 'e8', label: 'Supplier financial statements (≤12 months)', status: 'partial', source: 'Finance', note: '38 of 60 current' },
          { id: 'e9', label: 'Financial review dates per supplier', status: 'collected', source: 'Vendor Mgmt' },
        ],
      },
      {
        id: 'risk4',
        title: 'Incomplete regulatory coverage across geographies',
        scenario: 'Products sold in multiple regions are not assessed against all applicable regulatory requirements, leading to non-compliance.',
        severity: 'Medium',
        evidence: [
          { id: 'e10', label: 'Multi-geo production authorizations', status: 'missing', source: 'Regulatory' },
          { id: 'e11', label: 'Regulatory change monitoring log', status: 'partial', source: 'Horizon Scanning', note: 'EU/UK only so far' },
        ],
      },
    ],
  },
];

const STATUS_META = {
  collected: { label: 'Collected', color: '#037f0c', emoji: '🟢' },
  partial: { label: 'Partial', color: '#ec7211', emoji: '🟠' },
  missing: { label: 'Missing', color: '#d13212', emoji: '🔴' },
};

const SEVERITY_COLOR = { High: '#d13212', Medium: '#ec7211', Low: '#5f6b7a' };

function coveragePct(evidence) {
  if (!evidence.length) return 0;
  const score = evidence.reduce((acc, e) => acc + (e.status === 'collected' ? 1 : e.status === 'partial' ? 0.5 : 0), 0);
  return Math.round((score / evidence.length) * 100);
}

export default function RiskDigest() {
  const [reportId, setReportId] = useState(SAMPLE_REPORTS[0].id);
  const [expanded, setExpanded] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [thinking, setThinking] = useState(false);

  const report = SAMPLE_REPORTS.find((r) => r.id === reportId);

  // Overall coverage across all risks
  const allEvidence = report.risks.flatMap((r) => r.evidence);
  const overallPct = coveragePct(allEvidence);
  const missingCount = allEvidence.filter((e) => e.status === 'missing').length;
  const partialCount = allEvidence.filter((e) => e.status === 'partial').length;

  // Generates a digest summary from the report's risk/evidence data.
  // In production this call routes through Kiro + the IA Researcher MCP
  // (get_risk_scenarios, get_coes, etc.) to summarize live findings.
  const buildSummary = () => {
    const missing = allEvidence.filter((e) => e.status === 'missing');
    const partial = allEvidence.filter((e) => e.status === 'partial');
    const topRisks = [...report.risks].sort((a, b) => coveragePct(a.evidence) - coveragePct(b.evidence)).slice(0, 2);
    const highSev = report.risks.filter((r) => r.severity === 'High');

    return {
      headline: `${report.name} — ${overallPct}% evidence coverage across ${report.risks.length} risks.`,
      points: [
        `${highSev.length} high-severity risk${highSev.length === 1 ? '' : 's'} in scope: ${highSev.map((r) => r.title).join('; ')}.`,
        `Biggest gaps are in "${topRisks[0].title}" (${coveragePct(topRisks[0].evidence)}% covered)${topRisks[1] ? ` and "${topRisks[1].title}" (${coveragePct(topRisks[1].evidence)}% covered)` : ''}.`,
        `${missing.length} evidence item${missing.length === 1 ? '' : 's'} not yet collected — e.g. ${missing.slice(0, 3).map((e) => e.label).join('; ')}.`,
        `${partial.length} item${partial.length === 1 ? '' : 's'} partially collected and need follow-up to close.`,
      ],
      recommendation: missing.length > 0
        ? `Priority: chase the ${missing.length} missing item${missing.length === 1 ? '' : 's'}, starting with the high-severity risks, before fieldwork begins.`
        : `Coverage is strong — focus on closing the ${partial.length} partial item${partial.length === 1 ? '' : 's'}.`,
    };
  };

  const handleAsk = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setThinking(true);
    setResponse(null);
    // Simulated round-trip to Kiro + Researcher MCP
    setTimeout(() => {
      setResponse(buildSummary());
      setThinking(false);
    }, 1200);
  };

  const samplePrompts = [
    'Summarize the key findings and what evidence is still missing',
    'Which risks are least covered?',
    'What should I prioritize before fieldwork?',
  ];

  return (
    <div className="risk-digest">
      <div className="risk-digest-header">
        <div>
          <h3>🎯 Risk-Driven Evidence Digest</h3>
          <p className="muted">Only the evidence each risk actually needs — coverage and gaps at a glance.</p>
        </div>
        <select className="risk-report-select" value={reportId} onChange={(e) => setReportId(e.target.value)}>
          {SAMPLE_REPORTS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="ask-box">
        <form onSubmit={handleAsk} className="ask-form">
          <input
            className="ask-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about this report's risks & findings…"
          />
          <button type="submit" className="btn btn-primary ask-btn" disabled={thinking}>
            {thinking ? '…' : '✨ Ask Kiro'}
          </button>
        </form>
        <div className="ask-suggestions">
          {samplePrompts.map((p) => (
            <button key={p} className="ask-chip" onClick={() => setPrompt(p)}>{p}</button>
          ))}
        </div>
        {thinking && (
          <div className="ask-response ask-thinking">
            <span className="ask-spinner">⟳</span> Querying IA Researcher via Kiro…
          </div>
        )}
        {response && !thinking && (
          <div className="ask-response">
            <div className="ask-response-head">🤖 Digest Summary</div>
            <p className="ask-headline">{response.headline}</p>
            <ul className="ask-points">
              {response.points.map((pt, i) => <li key={i}>{pt}</li>)}
            </ul>
            <p className="ask-reco">💡 {response.recommendation}</p>
            <p className="ask-disclaimer">Generated from report data. Live mode routes through the IA Researcher MCP.</p>
          </div>
        )}
      </div>

      <div className="risk-report-meta">
        <span className="risk-meta-badge">📄 {report.code}</span>
        <span className="risk-meta-badge">👤 VP: {report.vp}</span>
        <span className="risk-meta-badge">⚠️ {report.risks.length} risks in scope</span>
      </div>

      <div className="risk-overall-card">
        <div className="risk-overall-top">
          <span className="risk-overall-label">Overall Evidence Coverage</span>
          <span className="risk-overall-pct" style={{ color: overallPct >= 80 ? '#037f0c' : overallPct >= 50 ? '#ec7211' : '#d13212' }}>{overallPct}%</span>
        </div>
        <div className="risk-overall-bar"><div className="risk-overall-fill" style={{ width: `${overallPct}%`, background: overallPct >= 80 ? '#037f0c' : overallPct >= 50 ? '#ec7211' : '#d13212' }} /></div>
        <div className="risk-overall-stats">
          <span className="stat stat-overdue">🔴 {missingCount} missing</span>
          <span className="stat stat-active">🟠 {partialCount} partial</span>
          <span className="stat stat-done">🟢 {allEvidence.length - missingCount - partialCount} collected</span>
        </div>
      </div>

      <div className="risk-list">
        {report.risks.map((risk) => {
          const pct = coveragePct(risk.evidence);
          const isOpen = expanded === risk.id;
          return (
            <div key={risk.id} className="risk-card">
              <div className="risk-card-head" onClick={() => setExpanded(isOpen ? null : risk.id)}>
                <span className="risk-expand">{isOpen ? '▾' : '▸'}</span>
                <div className="risk-card-title-wrap">
                  <span className="risk-card-title">{risk.title}</span>
                  <span className="risk-severity" style={{ color: SEVERITY_COLOR[risk.severity] }}>{risk.severity} severity</span>
                </div>
                <span className="risk-card-pct" style={{ color: pct >= 80 ? '#037f0c' : pct >= 50 ? '#ec7211' : '#d13212' }}>{pct}%</span>
              </div>
              <div className="risk-card-bar"><div className="risk-card-fill" style={{ width: `${pct}%`, background: pct >= 80 ? '#037f0c' : pct >= 50 ? '#ec7211' : '#d13212' }} /></div>

              {isOpen && (
                <div className="risk-card-body">
                  <p className="risk-scenario">{risk.scenario}</p>
                  <h5>Required Evidence</h5>
                  <div className="evidence-list">
                    {risk.evidence.map((e) => {
                      const meta = STATUS_META[e.status];
                      return (
                        <div key={e.id} className="evidence-item" style={{ borderLeftColor: meta.color }}>
                          <span className="evidence-status">{meta.emoji}</span>
                          <div className="evidence-main">
                            <span className="evidence-label">{e.label}</span>
                            <span className="evidence-source">{e.source}{e.note ? ` — ${e.note}` : ''}</span>
                          </div>
                          <span className="evidence-badge" style={{ color: meta.color, borderColor: meta.color }}>{meta.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="risk-digest-footnote">Sample data shown. Connects to IA Researcher (risk scenarios, COEs, report data) once the researcher MCP is configured.</p>
    </div>
  );
}
