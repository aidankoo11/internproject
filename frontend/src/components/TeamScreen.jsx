import React, { useState, useEffect } from 'react';
import { createTeam, joinTeam, getTeam } from '../services/auth';

export default function TeamScreen({ user, onTeamJoined }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'create' | 'join'
  const [teamName, setTeamName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTeam, setCreatedTeam] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const team = await createTeam(user.id, teamName);
      setCreatedTeam(team);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await joinTeam(user.id, code);
      onTeamJoined(result.user, result.team);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onTeamJoined({ ...user, teamId: createdTeam.id, role: 'admin' }, createdTeam);
  };

  if (createdTeam) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>🎉 Team Created!</h2>
          <p className="auth-subtitle">Share this code with your team members:</p>
          <div className="team-code-display">{createdTeam.code}</div>
          <p className="team-code-hint">Team: {createdTeam.name}</p>
          <button className="btn btn-primary auth-btn" onClick={handleContinue}>
            Continue to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2>👋 Welcome, {user.displayName}!</h2>
        <p className="auth-subtitle">Join or create a team to get started.</p>

        {error && <div className="error">{error}</div>}

        {mode === 'choose' && (
          <div className="team-choices">
            <button className="btn btn-primary auth-btn" onClick={() => setMode('create')}>
              Create a New Team
            </button>
            <button className="btn btn-secondary auth-btn" onClick={() => setMode('join')}>
              Join with Team Code
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Team Name</label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. WWAS Audit Team"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? '...' : 'Create Team'}
            </button>
            <button type="button" className="btn-link" onClick={() => setMode('choose')} style={{ marginTop: 12, display: 'block' }}>
              ← Back
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label>Team Invite Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A3F2B1"
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px', fontWeight: 700 }}
              />
            </div>
            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? '...' : 'Join Team'}
            </button>
            <button type="button" className="btn-link" onClick={() => setMode('choose')} style={{ marginTop: 12, display: 'block' }}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
