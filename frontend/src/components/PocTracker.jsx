import React, { useState, useEffect } from 'react';

export default function PocTracker() {
  const [pocs, setPocs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '', topic_ownership: '', notes: '' });

  const loadPocs = async () => {
    const res = await fetch('/api/pocs');
    if (res.ok) setPocs(await res.json());
  };

  useEffect(() => { loadPocs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await fetch('/api/pocs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', email: '', role: '', topic_ownership: '', notes: '' });
    setShowForm(false);
    loadPocs();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/pocs/${id}`, { method: 'DELETE' });
    loadPocs();
  };

  const handleMarkContacted = async (poc) => {
    await fetch(`/api/pocs/${poc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calls_done: (poc.calls_done || 0) + 1, last_contact: new Date().toISOString() }),
    });
    loadPocs();
  };

  return (
    <div className="poc-tracker">
      <div className="poc-header">
        <h3>📞 Points of Contact</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add POC'}
        </button>
      </div>

      {showForm && (
        <form className="poc-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nancy" /></div>
            <div className="form-group"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alias@amazon.com" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Role</label><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Sr. Quality Manager" /></div>
            <div className="form-group"><label>Topic Ownership</label><input value={form.topic_ownership} onChange={(e) => setForm({ ...form, topic_ownership: e.target.value })} placeholder="e.g. PSI, FQA" /></div>
          </div>
          <div className="form-group"><label>Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any context..." /></div>
          <button type="submit" className="btn btn-primary btn-sm">Save POC</button>
        </form>
      )}

      {pocs.length === 0 ? (
        <p className="muted">No POCs added yet. Add your first point of contact.</p>
      ) : (
        <div className="poc-grid">
          {pocs.map(poc => (
            <div key={poc.id} className="poc-card">
              <div className="poc-card-top">
                <div className="poc-avatar">{poc.name.charAt(0).toUpperCase()}</div>
                <div className="poc-info">
                  <span className="poc-name">{poc.name}</span>
                  {poc.role && <span className="poc-role">{poc.role}</span>}
                </div>
              </div>
              {poc.topic_ownership && <div className="poc-topic"><strong>Owns:</strong> {poc.topic_ownership}</div>}
              {poc.email && <div className="poc-email">{poc.email}</div>}
              {poc.notes && <div className="poc-notes">{poc.notes}</div>}
              <div className="poc-card-footer">
                <span className="poc-calls">📞 {poc.calls_done || 0} calls</span>
                <div className="poc-actions">
                  <button className="btn-link" onClick={() => handleMarkContacted(poc)}>+ Call</button>
                  <button className="btn-icon" onClick={() => handleDelete(poc.id)} title="Remove">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
