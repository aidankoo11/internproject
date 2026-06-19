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

  useEffect(() => {
    fetchActivities().then(setActivities);
    const interval = setInterval(() => fetchActivities().then(setActivities), 15000);
    return () => clearInterval(interval);
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
