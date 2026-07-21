import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// Heuristics to auto-detect which columns hold what
const COLUMN_HINTS = {
  control: ['control', 'control id', 'control name', 'control #', 'control ref'],
  stepId: ['test step id', 'step id', 'step #', 'test id', 'ref', 'step ref', 'test step ref'],
  step: ['test step', 'test procedure', 'procedure', 'step', 'test', 'testing step', 'audit step', 'description'],
  owner: ['assigned to', 'owner', 'assignee', 'responsible', 'preparer'],
};

const STORAGE_KEY = 'rcm_todo_list';

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

export default function RcmUpload({ onGenerate, onGoToDashboard, teamRequests = [] }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ control: '', stepId: '', step: '', owner: '' });
  const [fileName, setFileName] = useState('');
  const [selectedControls, setSelectedControls] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [dragging, setDragging] = useState(false);
  // The user's own generated to-do list (persisted). Each control -> steps with `done`.
  const [myList, setMyList] = useState([]);
  // Which control folders are collapsed (by control name)
  const [collapsed, setCollapsed] = useState({});

  // Load any previously generated checklist on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMyList(JSON.parse(saved));
    } catch { /* ignore corrupt storage */ }
  }, []);

  const persist = (list) => {
    setMyList(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const parseFile = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!/\.(xlsx|xls|csv)$/.test(name)) {
      setError('Unsupported file type. Please upload an .xlsx, .xls, or .csv file.');
      return;
    }
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

  const handleFile = (e) => parseFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseFile(e.dataTransfer.files[0]);
    }
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
    const totalStepsChosen = chosen.reduce((n, c) => n + c.steps.length, 0);
    if (totalStepsChosen === 0) { setToast('No test steps found for the selected controls.'); return; }

    // Preserve any previously-ticked steps when regenerating
    const prevDone = {};
    myList.forEach((c) => c.steps.forEach((s) => { prevDone[`${c.name}||${s.stepId}||${s.step}`] = s.done; }));

    // Build the user's own checkbox to-do list (grouped by control)
    const checklist = chosen.map((c) => ({
      name: c.name,
      steps: c.steps.map((s) => ({
        stepId: s.stepId,
        step: s.step,
        owner: s.owner,
        done: prevDone[`${c.name}||${s.stepId}||${s.step}`] || false,
      })),
    }));
    persist(checklist);

    // Also feed the shared team dashboard (unchanged behaviour)
    const todos = [];
    chosen.forEach((c) => {
      c.steps.forEach((s) => {
        todos.push({
          title: s.stepId ? `${s.stepId} — ${s.step}` : s.step,
          status: 'todo',
          priority: 'medium',
          requester: fileName || 'RCM',
          assignee: s.owner || 'Unassigned',
          assigned_to: s.owner || '',
          control: c.name,
          risk_tag: c.name,
          description: `Test step from control "${c.name}" (RCM: ${fileName}).${s.owner ? ` Assigned to ${s.owner}.` : ''}`,
        });
      });
    });
    onGenerate?.(todos);
    setToast(`Built your to-do list: ${totalStepsChosen} step${totalStepsChosen === 1 ? '' : 's'} across ${chosen.length} control${chosen.length === 1 ? '' : 's'}.`);
  };

  const toggleStep = (controlName, stepId, stepText) => {
    persist(myList.map((c) => {
      if (c.name !== controlName) return c;
      return { ...c, steps: c.steps.map((s) => (s.stepId === stepId && s.step === stepText) ? { ...s, done: !s.done } : s) };
    }));
  };

  const clearList = () => {
    persist([]);
    setToast('');
  };

  const toggleFolder = (name) => setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  const totalSteps = controls.filter((c) => selectedControls.includes(c.name)).reduce((n, c) => n + c.steps.length, 0);

  // Personal completion — from the user's own generated checklist
  const listDoneCount = myList.reduce((n, c) => n + c.steps.filter((s) => s.done).length, 0);
  const listTotal = myList.reduce((n, c) => n + c.steps.length, 0);
  const personalPct = listTotal > 0 ? Math.round((listDoneCount / listTotal) * 100) : 0;

  // Team completion — from the shared tracker (all requests marked done)
  const teamDone = teamRequests.filter((r) => r.status === 'done').length;
  const teamTotal = teamRequests.length;
  const teamPct = teamTotal > 0 ? Math.round((teamDone / teamTotal) * 100) : 0;

  const pctColor = (p) => (p === 100 ? '#037f0c' : p > 0 ? '#ec7211' : '#9ca3af');

  return (
    <div className="rcm-upload">
      <div className="rcm-header">
        <h3>📤 Upload RCM → Generate Your To-Do List</h3>
        <p className="muted">Upload your Risk Control Matrix, pick the controls assigned to you, and get a checklist built from the test steps.</p>
      </div>

      <label
        className={`rcm-dropzone ${dragging ? 'rcm-dropzone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={handleDrop}
      >
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
        <span className="rcm-drop-icon">📄</span>
        <span className="rcm-drop-text">{fileName || (dragging ? 'Drop your RCM file here…' : 'Click to upload or drag & drop an RCM file (.xlsx or .csv)')}</span>
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
            {controls.map((c) => {
              const isSelected = selectedControls.includes(c.name);
              return (
                <div key={c.name} className={`rcm-control-block ${isSelected ? 'rcm-control-selected' : ''}`}>
                  <label className="rcm-control-item">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleControl(c.name)} />
                    <span className="rcm-control-name">{c.name}</span>
                    <span className="rcm-control-count">{c.steps.length} test steps</span>
                  </label>
                  {isSelected && (
                    <ul className="rcm-control-steps">
                      {c.steps.map((s, i) => (
                        <li key={`${s.stepId}-${i}`} className="rcm-control-step">
                          {s.stepId && <span className="rcm-step-id">{s.stepId}</span>}
                          <span className="rcm-step-text">{s.step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
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
          <button className="risk-toast-close" onClick={() => setToast('')}>✕</button>
        </div>
      )}

      {myList.length > 0 && (
        <div className="rcm-mylist">
          {/* Overall completion — personal + team */}
          <div className="rcm-overall">
            <div className="rcm-overall-card">
              <div className="rcm-overall-top">
                <span className="rcm-overall-label">👤 Personal Overall</span>
                <span className="rcm-overall-pct" style={{ color: pctColor(personalPct) }}>{personalPct}%</span>
              </div>
              <div className="rcm-overall-bar"><div className="rcm-overall-fill" style={{ width: `${personalPct}%`, background: pctColor(personalPct) }} /></div>
              <span className="rcm-overall-sub">{listDoneCount} of {listTotal} test steps done</span>
            </div>
            <div className="rcm-overall-card">
              <div className="rcm-overall-top">
                <span className="rcm-overall-label">👥 Team Overall</span>
                <span className="rcm-overall-pct" style={{ color: pctColor(teamPct) }}>{teamPct}%</span>
              </div>
              <div className="rcm-overall-bar"><div className="rcm-overall-fill" style={{ width: `${teamPct}%`, background: pctColor(teamPct) }} /></div>
              <span className="rcm-overall-sub">{teamDone} of {teamTotal} tracker items done</span>
            </div>
          </div>

          <div className="control-checklist">
            <div className="checklist-header">
              <h3>✅ My To-Do List <span className="rcm-mylist-progress">{listDoneCount}/{listTotal} done</span></h3>
              <div className="checklist-actions">
                {onGoToDashboard && <button className="btn btn-secondary btn-sm" onClick={onGoToDashboard}>Go to Dashboard →</button>}
                <button className="btn btn-secondary btn-sm" onClick={clearList}>🗑️ Clear</button>
              </div>
            </div>

            {/* One collapsible folder per control */}
            <div className="rcm-folders">
              {myList.map((c) => {
                const doneCount = c.steps.filter((s) => s.done).length;
                const pct = Math.round((doneCount / c.steps.length) * 100);
                const isCollapsed = !!collapsed[c.name];
                return (
                  <div key={c.name} className="rcm-folder">
                    <div className="rcm-folder-head" onClick={() => toggleFolder(c.name)}>
                      <span className="rcm-folder-caret">{isCollapsed ? '▸' : '▾'}</span>
                      <span className="rcm-folder-icon">{isCollapsed ? '📁' : '📂'}</span>
                      <span className="rcm-folder-name">{c.name}</span>
                      <span className="rcm-folder-count">{doneCount}/{c.steps.length} steps</span>
                      <span className="rcm-folder-pct" style={{ color: pctColor(pct) }}>{pct}%</span>
                    </div>
                    <div className="checklist-bar rcm-folder-bar"><div className="checklist-bar-fill" style={{ width: `${pct}%` }} /></div>
                    {!isCollapsed && (
                      <div className="checklist-steps rcm-folder-steps">
                        {c.steps.map((s, i) => (
                          <label key={`${s.stepId}-${i}`} className={`checklist-step ${s.done ? 'checklist-step-done' : ''}`}>
                            <input type="checkbox" checked={s.done} onChange={() => toggleStep(c.name, s.stepId, s.step)} />
                            {s.stepId && <span className="checklist-step-id">{s.stepId}</span>}
                            <span className="checklist-step-label">{s.step}{s.owner ? ` — ${s.owner}` : ''}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
