import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'rcm_todo_list';

// Find the column index whose header label matches a predicate
function findCol(labelRow, predicate) {
  for (let i = 0; i < labelRow.length; i++) {
    const v = String(labelRow[i] || '').trim().toLowerCase();
    if (v && predicate(v)) return i;
  }
  return -1;
}

// Split a "How to Test" cell into individual test steps.
// Handles top-level "1." / "2." and lettered sub-steps "a)" / "b)".
function parseSteps(raw) {
  const text = String(raw || '').replace(/\r/g, '');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsed = [];
  let curNum = null;
  let lastIdx = -1;
  for (const line of lines) {
    const top = line.match(/^(\d+)\.\s*(.*)$/);
    const sub = line.match(/^([a-zA-Z])\)\s*(.*)$/);
    if (top) {
      curNum = top[1];
      parsed.push({ num: curNum, letter: '', text: top[2], hasSub: false });
      lastIdx = parsed.length - 1;
    } else if (sub && curNum) {
      // mark the owning top-level as having sub-steps
      for (let i = parsed.length - 1; i >= 0; i--) {
        if (parsed[i].num === curNum && parsed[i].letter === '') { parsed[i].hasSub = true; break; }
      }
      parsed.push({ num: curNum, letter: sub[1].toLowerCase(), text: sub[2], hasSub: false });
      lastIdx = parsed.length - 1;
    } else if (lastIdx >= 0) {
      parsed[lastIdx].text += ' ' + line;
    }
  }
  // Final steps: keep sub-steps, and top-levels that have no sub-steps
  return parsed
    .filter((p) => p.letter !== '' || !p.hasSub)
    .map((p) => ({ id: `${p.num}${p.letter}`, text: p.text.trim() }));
}

// Build a short one-liner headline from a full test-step sentence
function headline(text) {
  let t = String(text || '').trim();
  // cut at the first strong delimiter (dash, colon, semicolon)
  const delims = [' — ', ' – ', ' -- ', '—', '–', ': ', '; '];
  let cut = t.length;
  for (const d of delims) { const i = t.indexOf(d); if (i > 3 && i < cut) cut = i; }
  t = t.slice(0, cut).trim();
  // cut at first sentence period or opening parenthesis
  const p = t.search(/\.\s/); if (p > 3) t = t.slice(0, p).trim();
  const paren = t.indexOf(' ('); if (paren > 3) t = t.slice(0, paren).trim();
  // hard cap length on a word boundary
  if (t.length > 60) t = t.slice(0, 58).replace(/\s+\S*$/, '').trim() + '…';
  return t || String(text).trim().slice(0, 58);
}

// Parse an RCM workbook into controls -> test steps
function parseRcm(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames.includes('RCM') ? 'RCM' : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });

  // Locate the label row (the one that contains "how to test")
  let labelRowIdx = rows.findIndex((r) => r.some((c) => String(c).trim().toLowerCase() === 'how to test'));
  if (labelRowIdx === -1) return { controls: [], error: 'Could not find a "How to Test" column. Is this an RCM export?' };

  const labelRow = rows[labelRowIdx];
  const howToCol = findCol(labelRow, (v) => v === 'how to test' || v.includes('how to test'));
  const numCol = findCol(labelRow, (v) => v === 'control #' || v.includes('control #') || v === 'control#');
  const nameCol = findCol(labelRow, (v) => v === 'sub-process');
  const procCol = findCol(labelRow, (v) => v.includes('process description'));
  const assignedCol = findCol(labelRow, (v) => v.includes('assigned'));

  const controls = [];
  for (let i = labelRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const howTo = String(r[howToCol] || '').trim();
    if (!howTo) continue;
    // Skip the instructions/description row (no numbered steps in it)
    const steps = parseSteps(howTo);
    if (steps.length === 0) continue;
    const num = numCol > -1 ? String(r[numCol] || '').trim() : '';
    const name = (nameCol > -1 && String(r[nameCol]).trim()) || (procCol > -1 && String(r[procCol]).trim()) || `Control ${num || i}`;
    const assigned = assignedCol > -1 ? String(r[assignedCol] || '').trim() : '';
    controls.push({
      key: `${num || i}-${name}`,
      num,
      name,
      assigned,
      steps,
    });
  }
  return { controls, error: controls.length === 0 ? 'No controls with test steps were found in this file.' : '' };
}

export default function RcmUpload({ onGenerate, onGoToDashboard, teamRequests = [] }) {
  const [fileName, setFileName] = useState('');
  const [controls, setControls] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [dragging, setDragging] = useState(false);
  const [myList, setMyList] = useState([]);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMyList(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const persist = (list) => {
    setMyList(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const readFile = (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError('Unsupported file type. Please upload an .xlsx, .xls, or .csv RCM file.');
      return;
    }
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { controls: parsed, error: perr } = parseRcm(ev.target.result);
        setControls(parsed);
        setSelectedKeys([]);
        if (perr) setError(perr);
      } catch {
        setError('Could not read that file. Make sure it is a valid RCM (.xlsx or .csv).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = (e) => readFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) readFile(e.dataTransfer.files[0]);
  };

  const toggleControl = (key) =>
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleFolder = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const controlLabel = (c) => (c.num ? `Control ${c.num} — ${c.name}` : c.name);

  const generate = () => {
    const chosen = controls.filter((c) => selectedKeys.includes(c.key));
    const totalStepsChosen = chosen.reduce((n, c) => n + c.steps.length, 0);
    if (totalStepsChosen === 0) { setToast('Select at least one control with test steps.'); return; }

    // Preserve already-ticked steps when regenerating
    const prevDone = {};
    myList.forEach((c) => c.steps.forEach((s) => { prevDone[`${c.name}||${s.id}`] = s.done; }));

    const checklist = chosen.map((c) => ({
      name: controlLabel(c),
      assigned: c.assigned,
      steps: c.steps.map((s) => ({ id: s.id, step: s.text, done: prevDone[`${controlLabel(c)}||${s.id}`] || false })),
    }));
    persist(checklist);

    // Feed the shared dashboard as well
    const todos = [];
    chosen.forEach((c) => {
      c.steps.forEach((s) => {
        todos.push({
          title: `${s.id} — ${headline(s.text)}`,
          status: 'todo',
          priority: 'medium',
          requester: fileName || 'RCM',
          assignee: c.assigned || 'Unassigned',
          assigned_to: c.assigned || '',
          control: controlLabel(c),
          risk_tag: controlLabel(c),
          // Full RCM sentence shown when the user opens the box
          description: `${s.text}\n\n— Test step ${s.id} · ${controlLabel(c)}${c.assigned ? ` · Assigned: ${c.assigned}` : ''} · RCM: ${fileName}`,
        });
      });
    });
    onGenerate?.(todos);
    setToast(`Built your to-do list: ${totalStepsChosen} test steps across ${chosen.length} control${chosen.length === 1 ? '' : 's'}.`);
  };

  const toggleStep = (controlName, stepId) => {
    persist(myList.map((c) => {
      if (c.name !== controlName) return c;
      return { ...c, steps: c.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)) };
    }));
  };

  const clearList = () => { persist([]); setToast(''); };

  const listDoneCount = myList.reduce((n, c) => n + c.steps.filter((s) => s.done).length, 0);
  const listTotal = myList.reduce((n, c) => n + c.steps.length, 0);
  const personalPct = listTotal > 0 ? Math.round((listDoneCount / listTotal) * 100) : 0;
  const teamDone = teamRequests.filter((r) => r.status === 'done').length;
  const teamTotal = teamRequests.length;
  const teamPct = teamTotal > 0 ? Math.round((teamDone / teamTotal) * 100) : 0;
  const pctColor = (p) => (p === 100 ? '#037f0c' : p > 0 ? '#ec7211' : '#9ca3af');
  const selectedStepCount = controls.filter((c) => selectedKeys.includes(c.key)).reduce((n, c) => n + c.steps.length, 0);

  return (
    <div className="rcm-upload">
      <div className="rcm-header">
        <h3>📤 Upload RCM → Generate Your To-Do List</h3>
        <p className="muted">Upload your Risk Control Matrix. We read each control's "How to Test" steps, then you pick your assigned controls to build a checklist.</p>
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

      {controls.length > 0 && (
        <div className="rcm-controls">
          <h4>Select your assigned control(s)</h4>
          <div className="rcm-control-list">
            {controls.map((c) => {
              const isSelected = selectedKeys.includes(c.key);
              return (
                <div key={c.key} className={`rcm-control-block ${isSelected ? 'rcm-control-selected' : ''}`}>
                  <label className="rcm-control-item">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleControl(c.key)} />
                    <span className="rcm-control-name">{controlLabel(c)}</span>
                    <span className="rcm-control-count">{c.steps.length} test steps{c.assigned ? ` · ${c.assigned}` : ''}</span>
                  </label>
                  {isSelected && (
                    <ul className="rcm-control-steps">
                      {c.steps.map((s) => (
                        <li key={s.id} className="rcm-control-step">
                          <span className="rcm-step-id">{s.id}</span>
                          <span className="rcm-step-text">{s.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rcm-generate-bar">
            <button className="btn btn-primary" onClick={generate} disabled={selectedKeys.length === 0}>
              ⚡ Generate my to-do list{selectedStepCount > 0 ? ` (${selectedStepCount} steps)` : ''}
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
                        {c.steps.map((s) => (
                          <label key={s.id} className={`checklist-step ${s.done ? 'checklist-step-done' : ''}`}>
                            <input type="checkbox" checked={s.done} onChange={() => toggleStep(c.name, s.id)} />
                            <span className="checklist-step-id">{s.id}</span>
                            <span className="checklist-step-label">{s.step}</span>
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
