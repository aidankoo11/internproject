import React, { useState, useEffect } from 'react';
import { fetchRequests, updateRequest } from './services/api';
import Dashboard from './components/Dashboard';
import RequestForm from './components/RequestForm';
import RequestDetail from './components/RequestDetail';
import PeopleTracker from './components/PeopleTracker';
import MyTasks from './components/MyTasks';
import PersonProfile from './components/PersonProfile';
import ControlsView from './components/ControlsView';
import AuthScreen from './components/AuthScreen';
import TeamScreen from './components/TeamScreen';
import AvatarSetup from './components/AvatarSetup';
import SearchBar from './components/SearchBar';
import ActivityFeed from './components/ActivityFeed';

export default function App() {
  const [user, setUser] = useState(() => { const s = localStorage.getItem('tracker_session'); return s ? JSON.parse(s).user : null; });
  const [team, setTeam] = useState(() => { const s = localStorage.getItem('tracker_session'); return s ? JSON.parse(s).team : null; });
  const [needsAvatar, setNeedsAvatar] = useState(false);
  const sampleRequests = [
    { id: 1, title: 'FQA Report – Full Population Extract', status: 'in_progress', priority: 'high', assigned_to: 'nancy', assignee: 'Nancy Chen', created_by: 'nancy', created_at: '2025-06-01', description: 'Need complete FQA audit report dataset from 2023-2025 for all HPB/SPB suppliers.', comments: [], files: [] },
    { id: 2, title: 'Supplier Onboarding Checklist Data', status: 'open', priority: 'medium', assigned_to: 'demo', assignee: 'demo', created_by: 'eric', created_at: '2025-06-05', target_date: '2025-06-27', description: 'APQP pre-qualification documentation for new vendor onboarding process.', comments: [], files: [] },
    { id: 3, title: 'PSI Sampling Results Q1 2025', status: 'done', priority: 'high', assigned_to: 'wilson', assignee: 'Wilson Park', created_by: 'demo', created_at: '2025-05-20', description: 'Pre-shipment inspection AQL sampling data from all active production lines.', comments: [], files: [] },
    { id: 4, title: 'Lab Accreditation Certificates', status: 'open', priority: 'low', assigned_to: 'marc', assignee: 'Marc Ethers', created_by: 'demo', created_at: '2025-06-10', description: 'Collect ISO 17025 accreditation docs for all approved third-party labs.', comments: [], files: [] },
    { id: 5, title: 'Regulatory Change Log – EU/UK', status: 'in_progress', priority: 'medium', assigned_to: 'marcia', assignee: 'Marcia Santos', created_by: 'lyes', created_at: '2025-06-08', description: 'Horizon scanning updates for regulatory changes impacting multi-geo compliance.', comments: [], files: [] },
    { id: 6, title: 'CAPA Closure Tracking Report', status: 'blocked', priority: 'high', assigned_to: 'nancy', assignee: 'Nancy Chen', created_by: 'demo', created_at: '2025-06-12', description: 'Status of all open corrective actions from FQA findings – need closure evidence.', comments: [], files: [] },
    { id: 7, title: 'Vendor Risk Tiering Matrix', status: 'done', priority: 'high', assigned_to: 'eric', assignee: 'Eric Cheng', created_by: 'demo', created_at: '2025-05-15', description: 'Complete risk tiering for all active suppliers based on product category and volume.', comments: [{ id: 1, author: 'eric', text: 'Completed for all Tier 1 suppliers', created_at: '2025-05-28' }], files: [] },
    { id: 8, title: 'ISO 9001 Cert Verification – APAC Suppliers', status: 'in_progress', priority: 'medium', assigned_to: 'lyes', assignee: 'Lyes Amrani', created_by: 'nancy', created_at: '2025-06-03', description: 'Verify ISO 9001 certificates cover specific manufacturing facilities, not just HQ.', comments: [], files: [] },
    { id: 9, title: 'Annual Re-Audit Schedule 2025', status: 'in_progress', priority: 'medium', assigned_to: 'demo', assignee: 'demo', created_by: 'wilson', created_at: '2025-06-11', target_date: '2025-06-24', description: 'Build schedule for annual factory re-audits. Prioritize suppliers with prior non-conformances.', comments: [], files: [] },
    { id: 10, title: 'Shipment Hold Log – Q2 2025', status: 'done', priority: 'high', assigned_to: 'wilson', assignee: 'Wilson Park', created_by: 'nancy', created_at: '2025-04-30', description: 'Extract all shipment holds triggered by failed PSI or lab tests in Q2.', comments: [{ id: 2, author: 'wilson', text: 'Exported from SAP. 14 holds total.', created_at: '2025-05-10' }, { id: 3, author: 'nancy', text: 'Can you break down by supplier?', created_at: '2025-05-11' }], files: [] },
    { id: 11, title: 'APQP Control Plan Gap Analysis', status: 'in_progress', priority: 'high', assigned_to: 'eric', assignee: 'Eric Cheng', created_by: 'demo', created_at: '2025-06-02', description: 'Identify gaps between APQP control plans and actual production testing protocols.', comments: [], files: [] },
    { id: 12, title: 'Approved Auditor List – Current', status: 'done', priority: 'low', assigned_to: 'demo', assignee: 'demo', created_by: 'nancy', created_at: '2025-05-25', description: 'Obtain current approved FQA auditor list with qualification dates and scope.', comments: [{ id: 4, author: 'demo', text: 'List received from QA team, 23 auditors total.', created_at: '2025-05-27' }], files: [] },
    { id: 13, title: 'Multi-Geo Production Authorization Docs', status: 'open', priority: 'high', assigned_to: 'marcia', assignee: 'Marcia Santos', created_by: 'lyes', created_at: '2025-06-14', description: 'Collect production authorization documents for products manufactured across multiple geographies.', comments: [], files: [] },
    { id: 14, title: 'Design FMEA Records – CPB Products', status: 'blocked', priority: 'medium', assigned_to: 'marc', assignee: 'Marc Ethers', created_by: 'eric', created_at: '2025-06-09', description: 'Retrieve Design FMEA documentation for all CPB product lines. Blocked on access permissions.', comments: [{ id: 5, author: 'marc', text: 'Waiting on PLM system access from IT', created_at: '2025-06-10' }], files: [] },
    { id: 15, title: 'Supplier Financial Statements – Overdue', status: 'in_progress', priority: 'high', assigned_to: 'demo', assignee: 'demo', created_by: 'nancy', created_at: '2025-06-07', target_date: '2025-06-18', description: 'Identify suppliers with financial statements older than 12 months and request updated versions.', comments: [], files: [] },
    { id: 16, title: 'Lab Audit Frequency Report', status: 'open', priority: 'medium', assigned_to: 'nancy', assignee: 'Nancy Chen', created_by: 'demo', created_at: '2025-06-15', description: 'Report on audit frequency and coverage for all approved third-party testing labs.', comments: [], files: [] },
    { id: 17, title: 'IPC Checkpoint Documentation', status: 'done', priority: 'medium', assigned_to: 'wilson', assignee: 'Wilson Park', created_by: 'eric', created_at: '2025-05-18', description: 'Collect in-process control checkpoint records for active production lines.', comments: [{ id: 6, author: 'wilson', text: 'All 8 production lines documented', created_at: '2025-06-01' }], files: [] },
    { id: 18, title: 'Exception Handling Procedures – Compliance', status: 'open', priority: 'low', assigned_to: 'lyes', assignee: 'Lyes Amrani', created_by: 'marcia', created_at: '2025-06-13', description: 'Document exception handling procedures for multi-geography compliance deviations.', comments: [], files: [] },
    { id: 19, title: 'Cross-reference FQA Auditors to Approved List', status: 'open', priority: 'high', assigned_to: 'demo', assignee: 'demo', created_by: 'nancy', created_at: '2025-06-16', target_date: '2025-06-30', description: 'Match auditors who performed FQAs against the approved auditor list. Flag any mismatches.', comments: [], files: [] },
    { id: 20, title: 'Compile Supplier MAP Gate Evidence', status: 'in_progress', priority: 'medium', assigned_to: 'demo', assignee: 'demo', created_by: 'eric', created_at: '2025-06-14', target_date: '2025-06-20', description: 'Gather MAP gate review documentation for all suppliers onboarded in last 6 months.', comments: [{ id: 7, author: 'demo', text: 'Have 4 out of 9 packages so far', created_at: '2025-06-19' }], files: [] },
    { id: 21, title: 'Verify Facility Addresses vs FQA Reports', status: 'open', priority: 'medium', assigned_to: 'demo', assignee: 'demo', created_by: 'wilson', created_at: '2025-06-17', target_date: '2025-07-02', description: 'Confirm facility addresses on supplier docs match what appears on FQA audit reports.', comments: [], files: [] },
  ];

  const [requests, setRequests] = useState(sampleRequests);
  const [allRequests, setAllRequests] = useState(sampleRequests);
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState('dashboard');

  const loadRequests = async () => {
    try {
      const data = await fetchRequests(statusFilter ? { status: statusFilter } : {});
      if (data && data.length > 0) {
        setRequests(data);
        if (statusFilter) { const all = await fetchRequests({}); setAllRequests(all); }
        else setAllRequests(data);
      }
    } catch (e) { /* use sample data if API unavailable */ }
  };

  useEffect(() => { if (user && team) loadRequests(); }, [statusFilter, user, team]);

  const handleLogin = (session) => { setUser(session.user); setTeam(session.team); if (!session.team && !session.user.avatarUrl) setNeedsAvatar(true); localStorage.setItem('tracker_session', JSON.stringify(session)); };
  const handleAvatarComplete = (u) => { setUser(u); setNeedsAvatar(false); localStorage.setItem('tracker_session', JSON.stringify({ user: u, team })); };
  const handleTeamJoined = (u, t) => { setUser(u); setTeam(t); localStorage.setItem('tracker_session', JSON.stringify({ user: u, team: t })); };
  const handleLogout = () => { setUser(null); setTeam(null); localStorage.removeItem('tracker_session'); };
  const handleViewDetail = (id) => { setSelectedId(id); setView('detail'); };
  const handleViewPerson = (name) => { setSelectedPerson(name); setView('person'); };
  const handleBack = () => { setView('dashboard'); setSelectedId(null); setSelectedPerson(null); loadRequests(); };

  if (!user) return <AuthScreen onLogin={handleLogin} />;
  if (needsAvatar) return <AvatarSetup user={user} onComplete={handleAvatarComplete} />;
  if (!team) return <TeamScreen user={user} onTeamJoined={handleTeamJoined} />;

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <img src={`${import.meta.env.BASE_URL}getsitelogo.png`} alt="Internal Audit" className="amazon-logo" />
        </div>
        <div className="header-actions">
          <span className="team-badge">🏢 {team.name}</span>
          <span className="current-user" onClick={handleLogout} title="Logout">👤 {user.displayName}</span>
          {view !== 'dashboard' && <button className="btn btn-secondary" onClick={handleBack}>← Back</button>}
          {view === 'dashboard' && <button className="btn btn-primary" onClick={() => setView('create')}>+ New Request</button>}
        </div>
      </header>

      {view === 'dashboard' && <SearchBar onViewDetail={handleViewDetail} />}

      {view === 'dashboard' && (
        <div className="tabs">
          <button className={`tab ${tab === 'dashboard' ? 'tab-active' : ''}`} onClick={() => setTab('dashboard')}>📋 Dashboard</button>
          <button className={`tab ${tab === 'team' ? 'tab-active' : ''}`} onClick={() => setTab('team')}>👥 Team</button>
        </div>
      )}

      <main className="main">
        {view === 'dashboard' && tab === 'dashboard' && (
          <div className="dashboard-layout">
            <div className="dashboard-main">
              <MyTasks requests={allRequests} currentUser={user.username} />
              <Dashboard requests={requests} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} onViewDetail={handleViewDetail} onRefresh={loadRequests} />
            </div>
            <div className="dashboard-sidebar">
              <ActivityFeed />
              <PeopleTracker requests={allRequests} onViewPerson={handleViewPerson} />
            </div>
          </div>
        )}
        {view === 'dashboard' && tab === 'team' && (
          <div className="team-panel">
            <div className="team-info-card">
              <h3>🏢 {team.name}</h3>
              <div className="team-code-section"><span className="team-code-label">Invite Code:</span><span className="team-code-value">{team.code}</span></div>
              <p className="muted">Share this code with teammates so they can join.</p>
              <a href="https://amazon.sharepoint.com/sites/internal-audit/WWAS%20Library/Forms/AllItems.aspx?e=5%3A38803bcfe93e4c7ba2ca22bbb39c8c92&sharingv2=true&fromShare=true&at=9&CT=1779240908620&OR=OWA%2DNT%2DMail&CID=f4ccbdf3%2Dcadc%2D2a99%2Dc467%2De2a527b29630&FolderCTID=0x01200042C5DB005FAB984BAF2DE95F1F00A412&id=%2Fsites%2Finternal%2Daudit%2FWWAS%20Library%2FProject%20Files%2F5001647%20%E2%80%93%20Private%20Brands%20%2D%20Global%20Sourcing%20%28WW%29" target="_blank" rel="noopener noreferrer" className="btn btn-secondary sharepoint-link">📁 Open SharePoint Folder</a>
            </div>
            <ControlChecklist />
            <PocSection />
            <PeopleTracker requests={allRequests} onViewPerson={handleViewPerson} />
          </div>
        )}
        {view === 'create' && <RequestForm onSuccess={handleBack} currentUser={user.username} />}
        {view === 'detail' && <RequestDetail id={selectedId} onBack={handleBack} />}
        {view === 'person' && <PersonProfile person={selectedPerson} requests={allRequests} onBack={handleBack} onViewDetail={handleViewDetail} />}
      </main>
    </div>
  );
}

function PocSection() {
  const [pocs, setPocs] = useState([
    { id: 1, name: 'Nancy', email: 'nancy@amazon.com', role: 'PSI + FQA (HPB/SPB/CPB)', notes: '', meetings: [] },
    { id: 2, name: 'Eric Cheng', email: '', role: 'APQP', notes: '', meetings: [] },
    { id: 3, name: 'Wilson', email: '', role: 'Post-launch incident mgmt, PT, PPT', notes: '', meetings: [] },
    { id: 4, name: 'Marc (ethers)', email: 'ethers@amazon.com', role: 'CPB PT, Risk', notes: '', meetings: [] },
    { id: 5, name: 'Lyes', email: '', role: 'HPB/SPB Compliance Dev', notes: '', meetings: [] },
    { id: 6, name: 'Marcia', email: '', role: 'Regulatory Horizon Scanning', notes: '', meetings: [] },
    { id: 7, name: 'Cristal', email: '', role: 'Sr Mgr, Supplier Mgmt HPB', notes: '', meetings: [] },
    { id: 8, name: 'Violette', email: 'naviav@amazon.lu', role: 'Sr Risk Mgr, PB Compliance Dev', notes: '', meetings: [] },
  ]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [selectedPoc, setSelectedPoc] = useState(null);
  const [meetingForm, setMeetingForm] = useState({ date: '', who: '', summary: '', is_future: false, link: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setPocs([...pocs, { id: Date.now(), name: newName, email: newEmail, role: newRole, notes: '', meetings: [] }]);
    setNewName(''); setNewEmail(''); setNewRole('');
  };

  const handleRemove = (id) => { setPocs(pocs.filter(p => p.id !== id)); if (selectedPoc === id) setSelectedPoc(null); };
  const handleNoteChange = (id, value) => setPocs(pocs.map(p => p.id === id ? { ...p, notes: value } : p));

  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!meetingForm.date || !meetingForm.summary) return;
    setPocs(pocs.map(p => {
      if (p.id !== selectedPoc) return p;
      return { ...p, meetings: [...p.meetings, { ...meetingForm, id: Date.now(), files: [] }] };
    }));
    setMeetingForm({ date: '', who: '', summary: '', is_future: false, link: '' });
  };

  const handleRemoveMeeting = (pocId, meetingId) => {
    setPocs(pocs.map(p => {
      if (p.id !== pocId) return p;
      return { ...p, meetings: p.meetings.filter(m => m.id !== meetingId) };
    }));
  };

  return (
    <div className="poc-section">
      <h3>📞 Points of Contact</h3>
      <div className="poc-list">
        <div className="poc-list-header">
          <span></span>
          <span>Name</span>
          <span>Email</span>
          <span>Role / Topic</span>
          <span>Notes</span>
          <span></span>
        </div>
        {pocs.map(p => (
          <div key={p.id} className="poc-collapsible">
            <div className="poc-row" onClick={() => setSelectedPoc(selectedPoc === p.id ? null : p.id)}>
              <span className="poc-expand-icon">{selectedPoc === p.id ? '▾' : '▸'}</span>
              <span className="poc-name-cell">{p.name}</span>
              <span className="poc-email-cell">{p.email || '—'}</span>
              <span className="poc-role-cell">{p.role}</span>
              <input className="poc-notes-input" value={p.notes} onChange={(e) => { e.stopPropagation(); handleNoteChange(p.id, e.target.value); }} onClick={(e) => e.stopPropagation()} placeholder="Add notes..." />
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}>✕</button>
            </div>
            {selectedPoc === p.id && (
              <div className="poc-detail">
                {p.meetings.filter(m => !m.is_future).length > 0 && (
                  <div className="poc-meetings-section">
                    <h5>Past Meetings</h5>
                    {p.meetings.filter(m => !m.is_future).sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => (
                      <div key={m.id} className="poc-meeting-item">
                        <div className="poc-meeting-top">
                          <span className="poc-meeting-date">📅 {m.date}</span>
                          <span className="poc-meeting-who">with {m.who}</span>
                          <button className="btn-icon" onClick={() => handleRemoveMeeting(p.id, m.id)}>✕</button>
                        </div>
                        <p className="poc-meeting-summary">{m.summary}</p>
                        {m.files && m.files.length > 0 && (
                          <div className="poc-meeting-files">{m.files.map((f, i) => <span key={i} className="poc-file-badge">📎 {f.name}</span>)}</div>
                        )}
                        <input type="file" className="poc-file-input" onChange={(e) => { const file = e.target.files[0]; if (!file) return; setPocs(pocs.map(pc => { if (pc.id !== p.id) return pc; return { ...pc, meetings: pc.meetings.map(mt => mt.id === m.id ? { ...mt, files: [...(mt.files || []), { name: file.name }] } : mt) }; })); e.target.value = ''; }} />
                      </div>
                    ))}
                  </div>
                )}
                {p.meetings.filter(m => m.is_future).length > 0 && (
                  <div className="poc-meetings-section">
                    <h5>🗓️ Upcoming</h5>
                    {p.meetings.filter(m => m.is_future).sort((a, b) => new Date(a.date) - new Date(b.date)).map(m => (
                      <div key={m.id} className="poc-meeting-item poc-meeting-future">
                        <div className="poc-meeting-top">
                          <span className="poc-meeting-date">📅 {m.date}</span>
                          <span className="poc-meeting-who">with {m.who}</span>
                          <button className="btn-icon" onClick={() => handleRemoveMeeting(p.id, m.id)}>✕</button>
                        </div>
                        <p className="poc-meeting-summary">{m.summary}</p>
                        {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="poc-meeting-link">🔗 Join Link</a>}
                        {m.files && m.files.length > 0 && (
                          <div className="poc-meeting-files">{m.files.map((f, i) => <span key={i} className="poc-file-badge">📎 {f.name}</span>)}</div>
                        )}
                        <input type="file" className="poc-file-input" onChange={(e) => { const file = e.target.files[0]; if (!file) return; setPocs(pocs.map(pc => { if (pc.id !== p.id) return pc; return { ...pc, meetings: pc.meetings.map(mt => mt.id === m.id ? { ...mt, files: [...(mt.files || []), { name: file.name }] } : mt) }; })); e.target.value = ''; }} />
                      </div>
                    ))}
                  </div>
                )}
                {p.meetings.length === 0 && <p className="muted">No meetings logged yet.</p>}
                <form className="poc-meeting-form" onSubmit={handleAddMeeting}>
                  <div className="form-row">
                    <input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} required />
                    <input placeholder="Who attended" value={meetingForm.who} onChange={(e) => setMeetingForm({ ...meetingForm, who: e.target.value })} />
                  </div>
                  <input placeholder="Summary of discussion" value={meetingForm.summary} onChange={(e) => setMeetingForm({ ...meetingForm, summary: e.target.value })} required />
                  <div className="transcript-upload">
                    <label className="transcript-upload-btn">
                      📝 Upload Zoom Transcript (.vtt)
                      <input type="file" accept=".vtt,.txt,.srt" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target.result;
                          // Parse VTT: remove timestamps and metadata, keep dialogue
                          const lines = text.split('\n');
                          const dialogue = [];
                          let lastSpeaker = '';
                          for (const line of lines) {
                            const trimmed = line.trim();
                            // Skip empty, WEBVTT header, timestamps, and numeric cue IDs
                            if (!trimmed) continue;
                            if (trimmed === 'WEBVTT') continue;
                            if (trimmed.match(/^\d+$/)) continue;
                            if (trimmed.includes('-->')) continue;
                            if (trimmed.startsWith('NOTE')) continue;
                            // Clean up speaker labels and collect text
                            const speakerMatch = trimmed.match(/^(.+?):\s*(.+)$/);
                            if (speakerMatch) {
                              const speaker = speakerMatch[1].trim();
                              const msg = speakerMatch[2].trim();
                              if (speaker !== lastSpeaker) {
                                dialogue.push(`${speaker}: ${msg}`);
                                lastSpeaker = speaker;
                              } else {
                                dialogue.push(msg);
                              }
                            } else {
                              dialogue.push(trimmed);
                            }
                          }
                          // Condense into summary (take first 500 chars or key points)
                          const fullText = dialogue.join(' ');
                          const summary = fullText.length > 600 ? fullText.slice(0, 600) + '...' : fullText;
                          setMeetingForm(prev => ({ ...prev, summary }));
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }} />
                    </label>
                    <span className="transcript-hint">or type summary manually</span>
                  </div>
                  <input placeholder="Meeting link (Zoom/Chime URL)" value={meetingForm.link} onChange={(e) => setMeetingForm({ ...meetingForm, link: e.target.value })} />
                  <div className="poc-meeting-form-bottom">
                    <label className="poc-future-check"><input type="checkbox" checked={meetingForm.is_future} onChange={(e) => setMeetingForm({ ...meetingForm, is_future: e.target.checked })} /> Scheduled / Future</label>
                    <button type="submit" className="btn btn-primary btn-sm">Add</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="poc-add-form" onSubmit={handleAdd}>
        <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        <input placeholder="Role / Topic" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>
    </div>
  );
}

function ControlChecklist() {
  const [controls, setControls] = useState([
    { id: 1, name: 'Control 1', title: 'Factory Quality Audit (FQA) Program', steps: [
      { id: '1.1', label: 'Obtain full population of FQA reports', done: true },
      { id: '1.2a', label: 'Compare FQA dates to production launch dates', done: false },
      { id: '1.2b', label: 'Identify suppliers with no FQA prior to onboarding', done: false },
      { id: '1.3', label: 'Verify FQA checklist content rigour', done: false },
      { id: '1.4a', label: 'Cross-reference auditors against approved list', done: false },
      { id: '1.4b', label: 'Identify FQAs by unapproved auditors', done: false },
      { id: '1.5', label: 'Test FQA scoring and escalation', done: false },
      { id: '1.6', label: 'Test annual re-audit cadence', done: false },
      { id: '1.7', label: 'Confirm FQA findings tracked to CAPA closure', done: false },
    ]},
    { id: 2, name: 'Control 2', title: 'Supplier Pre-Qualification & Vendor Selection', steps: [
      { id: '2.1a', label: 'Identify incomplete due diligence packages', done: false },
      { id: '2.1b', label: 'Identify suppliers without MAP gate review', done: false },
      { id: '2.2a', label: 'Confirm financial statements ≤12 months', done: false },
      { id: '2.2b', label: 'Confirm ISO certs cover specific facility', done: false },
      { id: '2.3c', label: 'Verify facility address matches FQA report', done: false },
      { id: '2.5', label: 'Test approval independence', done: false },
      { id: '2.6', label: 'Verify risk-tiering consistency', done: true },
      { id: '2.8', label: 'Verify onboarding playbook compliance', done: true },
    ]},
    { id: 3, name: 'Control 3', title: 'Production Testing & Shipment Controls', steps: [
      { id: '3.1', label: 'Obtain active PRDs from PBC Stage 3', done: false },
      { id: '3.2', label: 'Verify IPC checkpoints during production', done: false },
      { id: '3.3a', label: 'Confirm PSI sampling AQL levels', done: false },
      { id: '3.3b', label: 'Confirm PSI inspector independence', done: true },
      { id: '3.4', label: 'Test failed tests → shipment holds linkage', done: false },
      { id: '3.5', label: 'Verify testing independence & lab accreditation', done: false },
    ]},
    { id: 4, name: 'Control 4', title: 'Third-Party Lab Verification & Validation', steps: [
      { id: '4.1', label: 'Obtain product launches + lab test data', done: false },
      { id: '4.2', label: 'Verify APQP Control Plan alignment', done: false },
      { id: '4.4', label: 'Verify submission chain integrity', done: false },
      { id: '4.5', label: 'Verify lab accreditation scope', done: false },
      { id: '4.7', label: 'Test periodic re-testing & document integrity', done: false },
    ]},
    { id: 5, name: 'Control 5', title: 'Testing Integrity & Lab Oversight', steps: [
      { id: '5.1', label: 'Obtain vendor submissions + approved lab list', done: true },
      { id: '5.2', label: 'Test structural independence conflicts', done: false },
      { id: '5.5', label: 'Test lab audit frequency & coverage', done: false },
      { id: '5.6', label: 'Verify scope of lab audits', done: false },
      { id: '5.8', label: 'Test discrepancy & finding follow-up', done: false },
    ]},
    { id: 6, name: 'Control 6', title: 'Multi-Geography Compliance & Regulatory Change', steps: [
      { id: '6.1', label: 'Obtain multi-geography production authorizations', done: false },
      { id: '6.2', label: 'Verify APQP Design FMEA for multi-geo products', done: false },
      { id: '6.3', label: 'Test completeness of regulatory coverage', done: false },
      { id: '6.4', label: 'Test regulatory change monitoring process', done: false },
      { id: '6.5', label: 'Verify exception handling', done: false },
    ]},
  ]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(controls)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveEdit = () => {
    setControls(draft);
    setDraft(null);
    setEditing(false);
  };

  const toggleStep = (controlId, stepId) => {
    if (!editing) return;
    setDraft(draft.map(c => {
      if (c.id !== controlId) return c;
      return { ...c, steps: c.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) };
    }));
  };

  const displayData = editing ? draft : controls;

  return (
    <div className="control-checklist">
      <div className="checklist-header">
        <h3>✅ Test Step Checklist</h3>
        <div className="checklist-actions">
          {!editing && <button className="btn btn-secondary btn-sm" onClick={startEdit}>✏️ Edit</button>}
          {editing && <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>}
          {editing && <button className="btn btn-primary btn-sm" onClick={saveEdit}>💾 Save</button>}
        </div>
      </div>
      {editing && <p className="checklist-edit-hint">Editing mode — check/uncheck steps, then Save.</p>}
      <div className="checklist-grid">
        {displayData.map(c => {
          const doneCount = c.steps.filter(s => s.done).length;
          const pct = Math.round((doneCount / c.steps.length) * 100);
          return (
            <div key={c.id} className="checklist-control">
              <div className="checklist-control-header">
                <span className="checklist-control-name">{c.name}</span>
                <span className="checklist-control-pct" style={{ color: pct === 100 ? '#037f0c' : pct > 0 ? '#ec7211' : '#9ca3af' }}>{pct}%</span>
              </div>
              <div className="checklist-control-title">{c.title}</div>
              <div className="checklist-bar"><div className="checklist-bar-fill" style={{ width: `${pct}%` }} /></div>
              <div className="checklist-steps">
                {c.steps.map(s => (
                  <label key={s.id} className={`checklist-step ${s.done ? 'checklist-step-done' : ''} ${!editing ? 'checklist-step-locked' : ''}`}>
                    <input type="checkbox" checked={s.done} onChange={() => toggleStep(c.id, s.id)} disabled={!editing} />
                    <span className="checklist-step-id">{s.id}</span>
                    <span className="checklist-step-label">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
