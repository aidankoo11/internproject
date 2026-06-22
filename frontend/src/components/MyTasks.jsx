import React from 'react';

export default function MyTasks({ requests, currentUser }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const myRequests = requests.filter(
    (r) => (r.assignee === currentUser || r.assigned_to === currentUser) && r.status !== 'done'
  );

  const overdue = myRequests.filter(
    (r) => r.target_date && new Date(r.target_date) < today
  );

  const dueToday = myRequests.filter((r) => {
    if (!r.target_date) return false;
    const due = new Date(r.target_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  });

  const upcoming = myRequests.filter((r) => {
    if (!r.target_date) return false;
    const due = new Date(r.target_date);
    due.setHours(0, 0, 0, 0);
    return due > today;
  });

  const noDueDate = myRequests.filter((r) => !r.target_date);

  // Sort all sections chronologically (earliest due date first)
  const sortByDate = (a, b) => {
    if (!a.target_date && !b.target_date) return 0;
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return new Date(a.target_date) - new Date(b.target_date);
  };

  overdue.sort(sortByDate);
  dueToday.sort(sortByDate);
  upcoming.sort(sortByDate);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const todayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="my-tasks">
      <div className="my-tasks-header">
        <h3>📋 My Tasks</h3>
        <span className="my-tasks-date">{todayLabel}</span>
      </div>

      {myRequests.length === 0 ? (
        <p className="muted">No tasks assigned to you right now. 🎉</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="task-section task-section-overdue">
              <h4>🔴 Overdue ({overdue.length})</h4>
              {overdue.map((req) => (
                <div key={req.id} className="task-item task-overdue">
                  <span className="task-title">#{req.id} {req.title}</span>
                  <span className="task-due">Was due {formatDate(req.target_date)}</span>
                </div>
              ))}
            </div>
          )}

          {dueToday.length > 0 && (
            <div className="task-section task-section-today">
              <h4>🟠 Due Today ({dueToday.length})</h4>
              {dueToday.map((req) => (
                <div key={req.id} className="task-item task-today">
                  <span className="task-title">#{req.id} {req.title}</span>
                </div>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="task-section task-section-upcoming">
              <h4>📅 Upcoming ({upcoming.length})</h4>
              {upcoming.map((req) => (
                <div key={req.id} className="task-item task-upcoming">
                  <span className="task-title">#{req.id} {req.title}</span>
                  <span className="task-due">Due {formatDate(req.target_date)}</span>
                </div>
              ))}
            </div>
          )}

          {noDueDate.length > 0 && (
            <div className="task-section task-section-nodate">
              <h4>⚪ No Due Date ({noDueDate.length})</h4>
              {noDueDate.map((req) => (
                <div key={req.id} className="task-item task-nodate">
                  <span className="task-title">#{req.id} {req.title}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
