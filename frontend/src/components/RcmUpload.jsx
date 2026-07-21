import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// Heuristics to auto-detect which columns hold what
const COLUMN_HINTS = {
  control: ['control', 'control id', 'control name', 'control #', 'control ref'],
  stepId: ['test step id', 'step id', 'step #', 'test id', 'ref', 'step ref', 'test step ref'],
  step: ['test step', 'test procedure', 'procedure', 'step', 'test', 'testing step', 'audit step', 'description'],
  owner: ['assigned to', 'owner', 'assignee', 'responsible', 'preparer'],
};

function guessColumn(headers, hints) {
  const lower = headers.map((h) => String(h).toLowerCase().trim());
  for (const hint of hints) {
    const idx = lower.findIndex((h) => h === hint);
    if (idx !== -1) return headers[idx];
  }
  for (const hint of hints) {
    const idx = lower.findIndex((h) => h.includes(hint));
    if (idx !== -1) return headers[idx];
  }
  return '';
}

export default function RcmUpload({ onGenerate, onGoToDashboard }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ control: '', stepId: '', step: '', owner: '' });
  const [fileName, setFileName] = useState('');
  const [selectedControls, setSelectedControls] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (json.length === 0) { setError('That sheet looks empty.'); return; }
        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setRows(json);
        setMapping({
          control: guessColumn(hdrs, COLUMN_HINTS.control),
          stepId: guessColumn(hdrs, COLUMN_HINTS.stepId),
          step: guessColumn(hdrs, COLUMN_HINTS.step),
          owner: guessColumn(hdrs, COLUMN_HINTS.owner),
        });
        setSelectedControls([]);
      } catch (err) {
        setError('Could not read that file. Make sure it is a valid .xlsx or .csv.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Group rows into controls -> steps using the current mapping
  const controls = React.useMemo(() => {
    if (!mapping.control || !mapping.step) return [];
    const map = {};
    rows.forEach((r) => {
      const control = String(r[mapping.control] || '').trim();
      const step = String(r[mapping.step] || '').trim();
      if (!control || !step) return;
      if (!map[control]) map[control] = [];
      map[control].push({
        stepId: mapping.stepId ? String(r[mapping.stepId] || '').trim() : '',
        step,
        owner: mapping.owner ? String(r[mapping.owner] || '').trim() : '',
      });
    });
    return Object.entries(map).map(([name, steps]) => ({ name, steps }));
  }, [rows, mapping]);

  const toggleControl = (name) => {
    setSelectedControls((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]);
  };

  const generate = () => {
    const chosen = controls.filter((c) => selectedControls.includes(c.name));
    const todos = [];
    chosen.forEach((c) => {
      c.steps.forEach((s) => {
        todos.push({
          title: s.stepId ? `${s.stepId} — ${s.step}` : s.step,
          status: 'open',
          priority: 'medium',
          assignee: s.owner || 'Unassigned',
          assigned_to: s.owner || '',
          risk_tag: c.name,
          description: `Test step from control "${c.name}" (RCM: ${fileName}).${s.owner ? ` Assigned to ${s.owner}.` : ''}`,
        });
      });
    });
    if (todos.length === 0) { setToast('No test steps found for the selected controls.'); return; }
    onGenerate?.(todos);
    setToast(`Generated ${todos.length} to-do${todos.length === 1 ? '' : 's'} from ${chosen.length} control${chosen.length === 1 ? '' : 's'}. Check the Dashboard.`);
  };

  const totalSteps = controls.filter((c) => selectedControls.includes(c.name)).reduce((n, c) => n + c.steps.length, 0);

  return (
    <div className="rcm-upload">
      <div className="rcm-header">
        <h3>📤 Upload RCM → Generate Your To-Do List</h3>
        <p className="muted">Upload your Risk Control Matrix, pick the controls assigned to you, and get a checklist built from the test steps.</p>
      </div>

      <label className="rcm-dropzone">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
        <span className="rcm-drop-icon">📄</span>
        <span className="rcm-drop-text">{fileName || 'Click to upload an RCM file (.xlsx or .csv)'}</span>
      </label>

      {error && <div className="error">{error}</div>}

      {headers.length > 0 && (
        <div className="rcm-mapping">
          <h4>Column mapping</h4>
          <p className="muted">We auto-detected these. Adjust if anything's off.</p>
          <div className="rcm-map-grid">
            {[
              { key: 'control', label: 'Control' },
              { key: 'stepId', label: 'Test Step ID' },
              { key: 'step', label: 'Test Step / Description' },
              { key: 'owner', label: 'Assigned To' },
            ].map((f) => (
              <div key={f.key} className="rcm-map-field">
                <label>{f.label}{(f.key === 'control' || f.key === 'step') && <span className="req">*</span>}</label>
                <select value={mapping[f.key]} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}>
                  <option value="">— none —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {controls.length > 0 && (
        <div className="rcm-controls">
          <h4>Select your assigned control(s)</h4>
          <div className="rcm-control-list">
            {controls.map((c) => (
              <label key={c.name} className={`rcm-control-item ${selectedControls.includes(c.name) ? 'rcm-control-selected' : ''}`}>
                <input type="checkbox" checked={selectedControls.includes(c.name)} onChange={() => toggleControl(c.name)} />
                <span className="rcm-control-name">{c.name}</span>
                <span className="rcm-control-count">{c.steps.length} test steps</span>
              </label>
            ))}
          </div>

          <div className="rcm-generate-bar">
            <button className="btn btn-primary" onClick={generate} disabled={selectedControls.length === 0}>
              ⚡ Generate my to-do list{totalSteps > 0 ? ` (${totalSteps} steps)` : ''}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="risk-toast">
          <span>✅ {toast}</span>
          {onGoToDashboard && <button className="risk-toast-link" onClick={onGoToDashboard}>Go to Dashboard →</button>}
          <button className="risk-toast-close" onClick={() => setToast('')}>✕</button>
        </div>
      )}
    </div>
  );
}
