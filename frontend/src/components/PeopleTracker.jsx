import React from 'react';

export default function PeopleTracker({ requests, onViewPerson }) {
  // Group requests by assignee
  const people = {};
  requests.forEach((req) => {
    const assignee = req.assignee || 'Unassigned';
    if (!people[assignee]) {
      people[assignee] = { total: 0, done: 0, overdue: [], in_progress: [], todo: [], urgent: [] };
    }
    people[assignee].total++;
    if (req.status === 'done') {
      people[assignee].done++;
    } else {
      // Check if overdue
      const isOverdue = req.target_date && new Date(req.target_date) < new Date() && req.status !== 'done';
      if (isOverdue) {
        people[assignee].overdue.push(req);
      }
      if (req.status === 'in_progress') people[assignee].in_progress.push(req);
      if (req.status === 'todo') people[assignee].todo.push(req);
      if (req.status === 'urgent') people[assignee].urgent.push(req);
    }
  });

  const sortedPeople = Object.entries(people).sort((a, b) => b[1].overdue.length - a[1].overdue.length);

  return (
    <div className="people-tracker">
      <h3>👥 Team Tracker</h3>
      <div className="people-grid">
        {sortedPeople.map(([name, data]) => {
          const completionPct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
          return (
            <div key={name} className="person-card" onClick={() => onViewPerson(name)}>
              <div className="person-header">
                <span className="person-name">{name}</span>
                <span className="person-pct">{completionPct}%</span>
              </div>
              <div className="person-bar">
                <div className="person-bar-fill" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="person-stats">
                <span className="stat stat-done">✅ {data.done} done</span>
                <span className="stat stat-active">🟠 {data.in_progress.length + data.todo.length + data.urgent.length} active</span>
                {data.overdue.length > 0 && (
                  <span className="stat stat-overdue">⚠️ {data.overdue.length} overdue</span>
                )}
              </div>
              {data.overdue.length > 0 && (
                <div className="overdue-list">
                  {data.overdue.map((req) => (
                    <div key={req.id} className="overdue-item">
                      <span className="overdue-title">#{req.id} {req.title}</span>
                      <span className="overdue-date">Due: {req.target_date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
