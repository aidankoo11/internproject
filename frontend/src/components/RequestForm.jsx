import React, { useState, useEffect } from 'react';
import { createRequest, fetchGroups } from '../services/api';

export default function RequestForm({ onSuccess, currentUser }) {
  const [form, setForm] = useState({ title: '', description: '', requester: currentUser || '', assignee: '', status: 'todo', target_date: '', group_id: '', workpaper_ref: '', tags: '' });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { fetchGroups().then(setGroups); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.requester.trim()) { setError('Title and Requester are required.'); return; }
    try {
      await createRequest({ ...form, group_id: form.group_id ? parseInt(form.group_id) : null, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] });
      onSuccess();
    } catch { setError('Failed to create request.'); }
  };

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <h2>New Data Request</h2>
      {error && <div className="error">{error}</div>}
      <div className="form-group"><label>What do you need? *</label><input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Verify monthly reconciliation totals" /></div>
      <div className="form-group"><label>Details</label><textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="More context..." /></div>
      <div className="form-row">
        <div className="form-group"><label>Your Name *</label><input name="requester" value={form.requester} onChange={handleChange} /></div>
        <div className="form-group"><label>Assign To</label><input name="assignee" value={form.assignee} onChange={handleChange} placeholder="Who should work on this?" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Status</label><select name="status" value={form.status} onChange={handleChange}><option value="todo">⚪ To Do</option><option value="in_progress">🟠 In Progress</option><option value="urgent">🔴 Urgent</option><option value="done">🟢 Done</option></select></div>
        <div className="form-group"><label>Target Date</label><input name="target_date" type="date" value={form.target_date} onChange={handleChange} /></div>
      </div>
      <div className="form-group"><label>Control / Group</label><select name="group_id" value={form.group_id} onChange={handleChange}><option value="">— No group —</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
      <div className="form-row">
        <div className="form-group"><label>Workpaper Ref</label><input name="workpaper_ref" value={form.workpaper_ref} onChange={handleChange} placeholder="e.g. WP-001" /></div>
        <div className="form-group"><label>Tags (comma separated)</label><input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. Blocked, Waiting on PBC" /></div>
      </div>
      <button type="submit" className="btn btn-primary">Create Request</button>
    </form>
  );
}
