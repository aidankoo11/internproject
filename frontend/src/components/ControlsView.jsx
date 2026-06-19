import React, { useState, useEffect } from 'react';
import { fetchGroups, createGroup, fetchGroup, updateRequest } from '../services/api';

const STATUS_CONFIG = {
  urgent: { color: '#ef4444', emoji: '🔴' },
  in_progress: { color: '#f97316', emoji: '🟠' },
  todo: { color: '#94a3b8', emoji: '⚪' },
  done: { color: '#22c55e', emoji: '🟢' },
};

export default function ControlsView({ onViewDetail }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const loadGroups = async () => {
    const data = await fetchGroups();
    setGroups(data);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSelectGroup = async (id) => {
    if (selectedGroup === id) {
      setSelectedGroup(null);
      setGroupDetail(null);
    } else {
      setSelectedGroup(id);
      const detail = await fetchGroup(id);
      setGroupDetail(detail);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup({ name: newGroupName, description: newGroupDesc });
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateForm(false);
    loadGroups();
  };

  const handleQuickStatus = async (taskId, newStatus) => {
    await updateRequest(taskId, { status: newStatus });
    // Reload the group detail
    if (selectedGroup) {
      const detail = await fetchGroup(selectedGroup);
      setGroupDetail(detail);
    }
    loadGroups();
  };

  return (
    <div className="controls-view">
      <div className="controls-header">
        <h3>🗂️ Controls / Test Groups</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Control'}
        </button>
      </div>

      {showCreateForm && (
        <form className="create-group-form" onSubmit={handleCreateGroup}>
          <input
            placeholder="Control name (e.g. SOX Control 1.1)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <input
            placeholder="Description (optional)"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">Create</button>
        </form>
      )}

      <div className="controls-grid">
        {groups.length === 0 ? (
          <p className="muted">No controls yet. Create one to group test steps together.</p>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="control-card-wrapper">
              <div
                className={`control-card ${selectedGroup === group.id ? 'control-card-active' : ''}`}
                onClick={() => handleSelectGroup(group.id)}
              >
                <div className="control-card-top">
                  <span className="control-name">{group.name}</span>
                  <span className="control-pct">{group.pct}%</span>
                </div>
                {group.description && (
                  <p className="control-desc">{group.description}</p>
                )}
                <div className="control-bar">
                  <div className="control-bar-fill" style={{ width: `${group.pct}%` }} />
                </div>
                <div className="control-stats">
                  <span>{group.done}/{group.total} done</span>
                  {group.urgent > 0 && <span className="stat-overdue">🔴 {group.urgent} urgent</span>}
                  {group.in_progress > 0 && <span>🟠 {group.in_progress} in progress</span>}
                </div>
              </div>

              {/* Expanded task list */}
              {selectedGroup === group.id && groupDetail && (
                <div className="control-tasks">
                  {groupDetail.tasks.length === 0 ? (
                    <p className="muted">No test steps in this control yet.</p>
                  ) : (
                    groupDetail.tasks.map((task) => {
                      const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                      return (
                        <div
                          key={task.id}
                          className="control-task-item"
                          style={{ borderLeftColor: config.color }}
                        >
                          <div className="control-task-main" onClick={() => onViewDetail(task.id)}>
                            <span className="control-task-emoji">{config.emoji}</span>
                            <span className="control-task-title">#{task.id} {task.title}</span>
                            {task.assignee && <span className="control-task-assignee">→ {task.assignee}</span>}
                          </div>
                          <div className="control-task-actions">
                            {task.status !== 'done' && (
                              <button
                                className="status-btn-sm done-btn-sm"
                                onClick={() => handleQuickStatus(task.id, 'done')}
                                title="Done"
                              >✓</button>
                            )}
                            {task.status !== 'in_progress' && task.status !== 'done' && (
                              <button
                                className="status-btn-sm inprogress-btn-sm"
                                onClick={() => handleQuickStatus(task.id, 'in_progress')}
                                title="In Progress"
                              >◐</button>
                            )}
                            {task.status === 'done' && (
                              <button
                                className="status-btn-sm reopen-btn-sm"
                                onClick={() => handleQuickStatus(task.id, 'todo')}
                                title="Reopen"
                              >↺</button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
