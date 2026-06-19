import React from 'react';

export default function PersonProfile({ person, requests, onBack, onViewDetail }) {
  const theirRequests = requests.filter(r => r.assignee === person);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const done = theirRequests.filter(r => r.status === 'done');
  const active = theirRequests.filter(r => r.status !== 'done');
  const overdue = active.filter(r => r.target_date && new Date(r.target_date) < today);
  const onTrack = active.filter(r => !r.target_date || new Date(r.target_date) >= today);

  // Sort by target_date (earliest first), items without dates go last
  const sortByDate = (a, b) => {
    if (!a.target_date && !b.target_date) return 0;
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return new Date(a.target_date) - new Date(b.target_date);
  };

  overdue.sort(sortByDate);
  onTrack.sort(sortByDate);
  done.sort(sortByDate);

  const completionPct = theirRequests.length > 0
    ? Math.round((done.length / theirRequests.length) * 100)
    : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const statusEmoji = {
    urgent: '🔴',
    in_progress: '🟠',
    todo: '⚪',
    done: '🟢',
  };

  return (
    <div className="person-profile">
      <div className="profile-header">
        <h2>👤 {person}</h2>
        <div className="profile-summary">
          <span className="profile-pct">{completionPct}% complete</span>
          <span className="profile-counts">{done.length} done · {active.length} active · {overdue.length} overdue</span>
        </div>
        <div className="profile-bar">
          <div className="profile-bar-fill" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="profile-section">
          <h3>🔴 Overdue ({overdue.length})</h3>
          <div className="profile-tasks">
            {overdue.map(req => (
              <div key={req.id} className="profile-task-item profile-task-overdue" onClick={() => onViewDetail(req.id)}>
                <div className="profile-task-main">
                  <span className="profile-task-status">{statusEmoji[req.status]}</span>
                  <span className="profile-task-title">#{req.id} {req.title}</span>
                </div>
                <span className="profile-task-due">Due {formatDate(req.target_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onTrack.length > 0 && (
        <div className="profile-section">
          <h3>📋 Active ({onTrack.length})</h3>
          <div className="profile-tasks">
            {onTrack.map(req => (
              <div key={req.id} className="profile-task-item profile-task-active" onClick={() => onViewDetail(req.id)}>
                <div className="profile-task-main">
                  <span className="profile-task-status">{statusEmoji[req.status]}</span>
                  <span className="profile-task-title">#{req.id} {req.title}</span>
                </div>
                <span className="profile-task-due">{formatDate(req.target_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="profile-section">
          <h3>✅ Completed ({done.length})</h3>
          <div className="profile-tasks">
            {done.map(req => (
              <div key={req.id} className="profile-task-item profile-task-done" onClick={() => onViewDetail(req.id)}>
                <div className="profile-task-main">
                  <span className="profile-task-status">🟢</span>
                  <span className="profile-task-title">#{req.id} {req.title}</span>
                </div>
                <span className="profile-task-due">{formatDate(req.target_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {theirRequests.length === 0 && (
        <p className="muted">No tasks assigned to {person}.</p>
      )}
    </div>
  );
}
