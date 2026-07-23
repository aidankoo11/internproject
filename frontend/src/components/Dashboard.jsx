import React, { useState } from 'react';
import { updateRequest } from '../services/api';

const STATUS_CONFIG = {
  urgent: { label: 'Urgent', color: '#d13212', bg: '#fdf3f0', emoji: '🔴', cssClass: 'urgent' },
  in_progress: { label: 'In Progress', color: '#ec7211', bg: '#fef6ed', emoji: '🟠', cssClass: 'in-progress' },
  todo: { label: 'To Do', color: '#5f6b7a', bg: '#ffffff', emoji: '⚪', cssClass: 'todo' },
  done: { label: 'Done', color: '#1d8102', bg: '#f2f8f0', emoji: '🟢', cssClass: 'done' },
};

export default function Dashboard({ requests, statusFilter, onStatusFilterChange, onViewDetail, onRefresh }) {
  const [collapsed, setCollapsed] = useState({});
  const toggleFolder = (name) => setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  // Group requests into control folders. Only show items tied to a control
  // (RCM-generated) — ungrouped/other requests are not shown.
  const groups = {};
  requests.forEach((r) => {
    const key = r.control || r.risk_tag;
    if (!key) return; // skip ungrouped ("Other") requests
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  const groupNames = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  // Counts reflect only the shown (grouped) items
  const shownRequests = Object.values(groups).flat();
  const total = shownRequests.length;
  const counts = {
    urgent: shownRequests.filter(r => r.status === 'urgent').length,
    in_progress: shownRequests.filter(r => r.status === 'in_progress').length,
    todo: shownRequests.filter(r => r.status === 'todo').length,
    done: shownRequests.filter(r => r.status === 'done').length,
  };

  const donePercent = total > 0 ? Math.round((counts.done / total) * 100) : 0;
  const inProgressPercent = total > 0 ? Math.round((counts.in_progress / total) * 100) : 0;
  const urgentPercent = total > 0 ? Math.round((counts.urgent / total) * 100) : 0;

  const handleQuickStatus = async (e, id, newStatus) => {
    e.stopPropagation();
    await updateRequest(id, { status: newStatus });
    onRefresh();
  };

  return (
    <div className="dashboard">
      {/* Summary bar — like Enrolled/Waitlisted/Past */}
      <div className="summary-bar">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div
            key={key}
            className={`summary-item ${statusFilter === key ? 'active' : ''}`}
            onClick={() => onStatusFilterChange(statusFilter === key ? '' : key)}
          >
            <div className="summary-item-label">{config.label}</div>
            <div className={`summary-item-count ${config.cssClass}`}>{counts[key]}</div>
          </div>
        ))}
      </div>

      {/* Progress tracker */}
      <div className="progress-tracker">
        <div className="progress-header">
          <span className="progress-title">Overall Progress</span>
          <span className="progress-pct">{donePercent}% complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-segment progress-done" style={{ width: `${donePercent}%` }} />
          <div className="progress-segment progress-inprogress" style={{ width: `${inProgressPercent}%` }} />
          <div className="progress-segment progress-urgent" style={{ width: `${urgentPercent}%` }} />
        </div>
        <div className="progress-legend">
          <span><span className="legend-dot" style={{ background: '#1d8102' }} /> Done {counts.done}/{total}</span>
          <span><span className="legend-dot" style={{ background: '#ec7211' }} /> In Progress {counts.in_progress}/{total}</span>
          <span><span className="legend-dot" style={{ background: '#d13212' }} /> Urgent {counts.urgent}/{total}</span>
          <span><span className="legend-dot" style={{ background: '#eaeded' }} /> To Do {counts.todo}/{total}</span>
        </div>
      </div>

      {/* Request cards grouped into control folders */}
      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No data requests yet. Click "+ New Request" to get started.</p>
        </div>
      ) : (
        <div className="dash-folders">
          {groupNames.map((name) => {
            const rawItems = groups[name];
            // Keep not-done steps on top; completed ones sink to the bottom
            const items = [...rawItems].sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0));
            const doneCount = items.filter((r) => r.status === 'done').length;
            const pct = Math.round((doneCount / items.length) * 100);
            const isCollapsed = !!collapsed[name];
            const pctColor = pct === 100 ? '#037f0c' : pct > 0 ? '#ec7211' : '#9ca3af';
            return (
              <div key={name} className="dash-folder">
                <div className="dash-folder-head" onClick={() => toggleFolder(name)}>
                  <span className="dash-folder-caret">{isCollapsed ? '▸' : '▾'}</span>
                  <span className="dash-folder-icon">{isCollapsed ? '📁' : '📂'}</span>
                  <span className="dash-folder-name">{name}</span>
                  <span className="dash-folder-count">{doneCount}/{items.length} done</span>
                  <span className="dash-folder-pct" style={{ color: pctColor }}>{pct}%</span>
                </div>
                {!isCollapsed && (
                  <div className="request-grid dash-folder-grid">
                    {items.map((req) => {
                      const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.todo;
                      return (
                        <div
                          key={req.id}
                          className="request-box"
                          onClick={() => onViewDetail(req.id)}
                        >
                          <div className="box-tag" style={{ color: config.color }}>
                            {config.label}
                          </div>
                          <h3 className="box-title">{req.title}</h3>
                          <div className="box-details">
                            {req.assignee && (
                              <div className="box-detail-row">
                                <span className="box-label">Assignee</span>
                                <span className="box-value">{req.assignee}</span>
                              </div>
                            )}
                            {req.workpaper_ref && (
                              <div className="box-detail-row">
                                <span className="box-label">Workpaper</span>
                                <span className="box-value">{req.workpaper_ref}</span>
                              </div>
                            )}
                          </div>
                          {req.tags && req.tags.length > 0 && (
                            <div className="box-tags">
                              {req.tags.map(t => <span key={t} className="box-tag-pill">{t}</span>)}
                            </div>
                          )}
                          <div className="box-footer">
                            {req.target_date && <span className="box-due">Due: {req.target_date}</span>}
                            <div className="box-actions">
                              {req.status !== 'done' && (
                                <button className="status-btn done-btn" onClick={(e) => handleQuickStatus(e, req.id, 'done')} title="Done">✓</button>
                              )}
                              {req.status !== 'in_progress' && req.status !== 'done' && (
                                <button className="status-btn inprogress-btn" onClick={(e) => handleQuickStatus(e, req.id, 'in_progress')} title="In Progress">◐</button>
                              )}
                              {req.status !== 'urgent' && req.status !== 'done' && (
                                <button className="status-btn urgent-btn" onClick={(e) => handleQuickStatus(e, req.id, 'urgent')} title="Urgent">!</button>
                              )}
                              {req.status === 'done' && (
                                <button className="status-btn reopen-btn" onClick={(e) => handleQuickStatus(e, req.id, 'todo')} title="Reopen">↺</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
