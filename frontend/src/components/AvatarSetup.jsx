import React, { useState, useRef } from 'react';

export default function AvatarSetup({ user, onComplete }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to base64 for storage (simple prototype approach)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      // Save avatar to backend
      await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, avatarUrl: preview }),
      });
      onComplete({ ...user, avatarUrl: preview });
    } catch (err) {
      onComplete(user);
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onComplete(user);
  };

  const initials = (user.displayName || user.username)
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2>Set up your profile</h2>
        <p className="auth-subtitle">Add a profile picture so your team can recognize you.</p>

        <div className="avatar-upload-area" onClick={() => fileInputRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="Profile" className="avatar-preview" />
          ) : (
            <div className="avatar-placeholder">
              <span className="avatar-initials">{initials}</span>
            </div>
          )}
          <div className="avatar-upload-overlay">
            <span>📷</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <p className="muted" style={{ marginTop: 12, marginBottom: 20 }}>
          Click the circle to upload a photo
        </p>

        <div className="avatar-actions">
          {preview && (
            <button className="btn btn-primary auth-btn" onClick={handleSave} disabled={uploading}>
              {uploading ? 'Saving...' : 'Save & Continue'}
            </button>
          )}
          <button className="btn-link" onClick={handleSkip} style={{ marginTop: 12, display: 'block', textAlign: 'center', width: '100%' }}>
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
