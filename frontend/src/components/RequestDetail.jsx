import React, { useState, useEffect, useRef } from 'react';
import { fetchRequest, updateRequest, addComment, uploadFile, deleteFile } from '../services/api';

const STATUSES = [
  { value: 'todo', label: '⚪ To Do' },
  { value: 'in_progress', label: '🟠 In Progress' },
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'done', label: '🟢 Done' },
];

export default function RequestDetail({ id, onBack }) {
  const [request, setRequest] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadRequest = async () => {
    const data = await fetchRequest(id);
    setRequest(data);
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const handleStatusChange = async (e) => {
    await updateRequest(id, { status: e.target.value });
    loadRequest();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) return;
    await addComment(id, { author: commentAuthor, content: newComment });
    setNewComment('');
    loadRequest();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadFile(id, file, commentAuthor || 'unknown');
      loadRequest();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    await deleteFile(id, fileId);
    loadRequest();
  };

  if (!request) return <p className="loading">Loading...</p>;

  const statusColor = {
    urgent: '#ef4444',
    in_progress: '#f97316',
    todo: '#94a3b8',
    done: '#22c55e',
  }[request.status];

  return (
    <div className="request-detail" style={{ borderTopColor: statusColor }}>
      <div className="detail-header">
        <h2>#{request.id} — {request.title}</h2>
        <div className="detail-meta">
          <span><strong>Requester:</strong> {request.requester}</span>
          <span><strong>Assignee:</strong> {request.assignee || 'Unassigned'}</span>
          {request.target_date && <span><strong>Due:</strong> {request.target_date}</span>}
          <span><strong>Created:</strong> {new Date(request.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Status selector */}
      <div className="detail-section">
        <h3>Status</h3>
        <select value={request.status} onChange={handleStatusChange} className="status-select">
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      {request.description && (
        <div className="detail-section">
          <h3>Description</h3>
          <p className="description-text">{request.description}</p>
        </div>
      )}

      {/* Files */}
      <div className="detail-section">
        <h3>📎 Files</h3>
        {request.files && request.files.length > 0 ? (
          <ul className="files-list">
            {request.files.map((f) => (
              <li key={f.id} className="file-item">
                <a href={`/uploads/${f.filename}`} target="_blank" rel="noopener noreferrer" className="file-link">
                  {f.original_name}
                </a>
                <span className="file-meta">
                  ({(f.size / 1024).toFixed(1)} KB) — uploaded by {f.uploaded_by}
                </span>
                <button className="btn-icon" onClick={() => handleDeleteFile(f.id)} title="Delete file">🗑</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No files uploaded yet.</p>
        )}
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && <span className="muted">Uploading...</span>}
        </div>
      </div>

      {/* Comments */}
      <div className="detail-section">
        <h3>💬 Comments</h3>
        {request.comments && request.comments.length > 0 ? (
          <ul className="comments-list">
            {request.comments.map((c) => (
              <li key={c.id} className="comment">
                <strong>{c.author}</strong>
                <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                <p>{c.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No comments yet.</p>
        )}

        <form className="comment-form" onSubmit={handleAddComment}>
          <input
            placeholder="Your alias"
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
          />
          <textarea
            placeholder="Add a comment or update..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="2"
          />
          <button type="submit" className="btn btn-primary">Post Comment</button>
        </form>
      </div>
    </div>
  );
}
