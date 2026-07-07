import React, { useState } from 'react';

// Sample RCM (Risk Control Matrix): controls -> test steps.
// Each test step carries the "how to complete it" breakdown that becomes the
// generated to-do. In production this maps to an imported/linked RCM.
const SAMPLE_RCMS = [
  {
    id: 'rcm1',
    name: 'Private Brands – Global Sourcing (WW)',
    code: '5001647',
    controls: [
      {
        id: 'c1',
        name: 'Control 1',
        title: 'Factory Quality Audit (FQA) Program',
        risk: 'Suppliers begin production without a completed FQA, exposing customers to unverified quality.',
        testSteps: [
          {
            id: '1.1',
            label: 'Obtain full population of FQA reports (2023–2025)',
            priority: 'high',
            howTo: [
              'Request the complete FQA report population from the QA team for 2023–2025.',
              'Confirm completeness against the supplier master list.',
              'Log the total count received and note any suppliers with no report.',
            ],
          },
          {
            id: '1.2',
            label: 'Compare FQA dates to production launch dates',
            priority: 'high',
            howTo: [
              'Pull production launch dates per supplier from PBC Stage 3.',
              'Match each FQA date against its supplier’s launch date.',
              'Flag any supplier whose FQA occurred after production launch.',
            ],
          },
          {
            id: '1.4',
            label: 'Cross-reference auditors against the approved list',
            priority: 'medium',
            howTo: [
              'Obtain the current approved FQA auditor list with qualification dates.',
              'Match auditors who signed each FQA against that list.',
              'Flag any FQA performed by an unapproved or lapsed auditor.',
            ],
          },
        ],
      },
      {
        id: 'c2',
        name: 'Control 2',
        title: 'Supplier Pre-Qualification & Vendor Selection',
        risk: 'Suppliers are onboarded without complete due diligence or a MAP gate review.',
        testSteps: [
          {
            id: '2.1',
            label: 'Identify suppliers without a MAP gate review',
            priority: 'high',
            howTo: [
              'Obtain the onboarding population and the MAP gate review log.',
              'Match each onboarded supplier to its MAP gate record.',
              'List suppliers missing a completed gate review.',
            ],
          },
          {
            id: '2.2',
            label: 'Confirm financial statements are ≤12 months old',
            priority: 'medium',
            howTo: [
              'Collect the latest financial statement date for each supplier.',
              'Compare each against the onboarding/review date.',
              'Flag suppliers whose statements are older than 12 months.',
            ],
          },
        ],
      },
      {
        id: 'c3',
        name: 'Control 3',
        title: 'Production Testing & Shipment Controls',
        risk: 'Failed test results do not trigger shipment holds, allowing non-conforming product to ship.',
        testSteps: [
          {
            id: '3.3',
            label: 'Confirm PSI sampling AQL levels',
            priority: 'medium',
            howTo: [
              'Obtain the PSI sampling plans for active production lines.',
              'Verify the AQL levels used match policy.',
              'Note any lines sampled below the required AQL.',
            ],
          },
          {
            id: '3.4',
            label: 'Test failed tests → shipment holds linkage',
            priority: 'high',
            howTo: [
              'Pull the failed-test log and the shipment hold log for the period.',
              'Trace each failed test to a corresponding shipment hold.',
              'Flag any failed test with no hold applied.',
            ],
          },
        ],
      },
    ],
  },
];

const PRIORITY_COLOR = { high: '#d13212', medium: '#ec7211', low: '#5f6b7a' };

export default function RiskDigest({ onGenerateRequests, onGoToDashboard }) {
  const [rcmId, setRcmId] = useState(SAMPLE_RCMS[0].id);
  const [expanded, setExpanded] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [thinking, setThinking] = useState(false);
  const [generatedIds, setGeneratedIds] = useState([]);
  const [toast, setToast] = useState('');

  const rcm = SAMPLE_RCMS.find((r) => r.id === rcmId);
  const allSteps = rcm.controls.flatMap((c) => c.testSteps.map((s) => ({ ...s, control: c })));

  // Turn a test step into a to-do whose description explains how to complete it
  const stepToTodo = (step, control) => ({
    title: step.label,
    status: 'open',
    priority: step.priority || 'medium',
    assignee: 'Unassigned',
    assigned_to: '',
    risk_tag: `${control.name}: ${control.title}`,
    description:
      `Test step ${step.id} — ${control.name}: ${control.title} (${rcm.name}, ${rcm.code}).\n\n` +
      `To complete this test step:\n` +
      step.howTo.map((h, i) => `${i + 1}. ${h}`).join('\n'),
  });

  const generateForControl = (control) => {
    const steps = control.testSteps.filter((s) => !generatedIds.includes(`${control.id}.${s.id}`));
    if (steps.length === 0) { setToast(`All test steps in ${control.name} already have to-dos.`); return; }
    onGenerateRequests?.(steps.map((s) => stepToTodo(s, control)));
    setGeneratedIds((prev) => [...prev, ...steps.map((s) => `${control.id}.${s.id}`)]);
    setToast(`Created ${steps.length} to-do${steps.length === 1 ? '' : 's'} from ${control.name}.`);
  };

  const generateAll = (filterFn) => {
    const items = [];
    rcm.controls.forEach((control) => {
      control.testSteps.forEach((s) => {
        const key = `${control.id}.${s.id}`;
        if (generatedIds.includes(key)) return;
        if (filterFn && !filterFn(s, control)) return;
        items.push({ ...stepToTodo(s, control), _key: key });
      });
    });
    if (items.length === 0) { setToast('Nothing new to generate — those test steps already have to-dos.'); return; }
    onGenerateRequests?.(items.map(({ _key, ...rest }) => rest));
    setGeneratedIds((prev) => [...prev, ...items.map((i) => i._key)]);
    setToast(`Created ${items.length} to-do${items.length === 1 ? '' : 's'}. Check the Dashboard.`);
  };

  // Prompt-driven: match the prompt against control titles / step labels, then generate
  const handleAsk = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setThinking(true);
    const q = prompt.toLowerCase();
    setTimeout(() => {
      generateAll((s, c) =>
        `${c.title} ${c.name} ${s.label} ${s.howTo.join(' ')}`.toLowerCase().split(/\W+/).some((w) => w && q.includes(w))
      );
      setThinking(false);
      setPrompt('');
    }, 900);
  };

  const samplePrompts = [
    'Generate to-dos for the FQA control',
    'Build to-dos for supplier onboarding test steps',
    'Create to-dos for shipment / testing controls',
  ];

  return (
    <div className="risk-digest">
      <div className="risk-digest-header">
        <div>
          <h3>🧩 RCM → To-Do Generator</h3>
          <p className="muted">Reads the RCM's test steps and turns them into tracked to-dos — each one explaining how to complete the step.</p>
        </div>
        <select className="risk-report-select" value={rcmId} onChange={(e) => setRcmId(e.target.value)}>
          {SAMPLE_RCMS.map((r) => (
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
            placeholder="Describe the test steps you want to-dos for…"
          />
          <button type="submit" className="btn btn-primary ask-btn" disabled={thinking}>
            {thinking ? '…' : '✨ Generate'}
          </button>
        </form>
        <div className="ask-suggestions">
          {samplePrompts.map((p) => (
            <button key={p} className="ask-chip" onClick={() => setPrompt(p)}>{p}</button>
          ))}
        </div>
        {thinking && (
          <div className="ask-response ask-thinking">
            <span className="ask-spinner">⟳</span> Reading the RCM and building to-dos…
          </div>
        )}
      </div>

      <div className="risk-report-meta">
        <span className="risk-meta-badge">📄 {rcm.code}</span>
        <span className="risk-meta-badge">🧩 {rcm.controls.length} controls</span>
        <span className="risk-meta-badge">✅ {allSteps.length} test steps</span>
      </div>

      <div className="risk-overall-card">
        <div className="risk-overall-top">
          <span className="risk-overall-label">Generate to-dos from this RCM</span>
          <span className="risk-overall-pct" style={{ color: '#0972d3' }}>{generatedIds.length}/{allSteps.length}</span>
        </div>
        <div className="risk-generate-bar">
          <button className="btn btn-primary btn-sm" onClick={() => generateAll()}>⚡ Generate to-dos for all test steps</button>
          <span className="risk-generate-hint">Each to-do lands in the Dashboard with step-by-step instructions on how to complete it.</span>
        </div>
      </div>

      {toast && (
        <div className="risk-toast">
          <span>✅ {toast}</span>
          {onGoToDashboard && <button className="risk-toast-link" onClick={onGoToDashboard}>Go to Dashboard →</button>}
          <button className="risk-toast-close" onClick={() => setToast('')}>✕</button>
        </div>
      )}

      <div className="risk-list">
        {rcm.controls.map((control) => {
          const isOpen = expanded === control.id;
          const genCount = control.testSteps.filter((s) => generatedIds.includes(`${control.id}.${s.id}`)).length;
          return (
            <div key={control.id} className="risk-card">
              <div className="risk-card-head" onClick={() => setExpanded(isOpen ? null : control.id)}>
                <span className="risk-expand">{isOpen ? '▾' : '▸'}</span>
                <div className="risk-card-title-wrap">
                  <span className="risk-card-title">{control.name}: {control.title}</span>
                  <span className="risk-severity">{control.testSteps.length} test steps · {genCount} generated</span>
                </div>
              </div>

              {isOpen && (
                <div className="risk-card-body">
                  <p className="risk-scenario">Risk: {control.risk}</p>
                  <div className="risk-evidence-head">
                    <h5>Test Steps</h5>
                    <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); generateForControl(control); }}>⚡ Generate to-dos for this control</button>
                  </div>
                  <div className="evidence-list">
                    {control.testSteps.map((s) => {
                      const isGen = generatedIds.includes(`${control.id}.${s.id}`);
                      return (
                        <div key={s.id} className="evidence-item" style={{ borderLeftColor: PRIORITY_COLOR[s.priority] }}>
                          <span className="evidence-status">🔹</span>
                          <div className="evidence-main">
                            <span className="evidence-label">{s.id} — {s.label}</span>
                            <span className="evidence-source">To complete: {s.howTo.join(' → ')}</span>
                          </div>
                          {isGen
                            ? <span className="evidence-gen-badge">📋 to-do created</span>
                            : <button className="evidence-gen-btn" onClick={(e) => { e.stopPropagation(); onGenerateRequests?.([stepToTodo(s, control)]); setGeneratedIds((prev) => [...prev, `${control.id}.${s.id}`]); setToast(`Created to-do for step ${s.id}.`); }}>+ To-do</button>}
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

      <p className="risk-digest-footnote">Sample RCM shown. Connects to a live RCM once linked.</p>
    </div>
  );
}
