import React, { useState, useEffect } from 'react';
import { fetchActivities } from '../services/api';

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  urgent: 'Urgent',
};

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  const sampleActivities = [
    { id: 1, type: 'status_changed', user: 'Wilson Park', request_id: 3, request_title: 'PSI Sampling Results Q1 2025', old_status: 'in_progress', new_status: 'done', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 2, type: 'created', user: 'Aidan Koo', request_id: 15, request_title: 'Supplier Financial Statements – Overdue', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, type: 'status_changed', user: 'Nancy Chen', request_id: 6, request_title: 'CAPA Closure Tracking Report', old_status: 'open', new_status: 'blocked', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, type: 'status_changed', user: 'Eric Cheng', request_id: 11, request_title: 'APQP Control Plan Gap Analysis', old_status: 'open', new_status: 'in_progress', timestamp: new Date(Date.now() - 14400000).toISOString() },
    { id: 5, type: 'created', user: 'Marcia Santos', request_id: 13, request_title: 'Multi-Geo Production Authorization Docs', timestamp: new Date(Date.now() - 21600000).toISOString() },
    { id: 6, type: 'status_changed', user: 'Lyes Amrani', request_id: 8, request_title: 'ISO 9001 Cert Verification – APAC', old_status: 'open', new_status: 'in_progress', timestamp: new Date(Date.now() - 43200000).toISOString() },
    { id: 7, type: 'created', user: 'Wilson Park', request_id: 9, request_title: 'Annual Re-Audit Schedule 2025', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 8, type: 'status_changed', user: 'Marc Ethers', request_id: 14, request_title: 'Design FMEA Records – CPB Products', old_status: 'in_progress', new_status: 'blocked', timestamp: new Date(Date.now() - 90000000).toISOString() },
  ];

  useEffect(() => {
    fetchActivities().then(data => {
      if (data && data.length > 0) setActivities(data);
      else setActivities(sampleActivities);
    }).catch(() => setActivities(sampleActivities));
  }, []);

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="activity-feed">
      <h3>⚡ Recent Activity</h3>
      <div className="activity-list">
        {activities.slice(0, 10).map((a) => (
          <div key={a.id} className="activity-item">
            <div className="activity-content">
              {a.type === 'created' && (
                <span><strong>{a.user}</strong> created <strong>#{a.request_id}</strong> {a.request_title}</span>
              )}
              {a.type === 'status_changed' && (
                <span>
                  <strong>{a.user}</strong> moved <strong>#{a.request_id}</strong> from {STATUS_LABELS[a.old_status] || a.old_status} → <strong>{STATUS_LABELS[a.new_status] || a.new_status}</strong>
                </span>
              )}
            </div>
            <span className="activity-time">{timeAgo(a.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
