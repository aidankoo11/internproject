const express = require('express');
const crypto = require('crypto');
const { loadData, saveData } = require('../db/connection');

const router = express.Router();

// Generate a 6-character team invite code
function generateTeamCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Hash password (simple for prototype)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Register a new user
router.post('/register', (req, res) => {
  const { username, password, displayName, avatarUrl } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const data = loadData();

  // Check if username already exists
  if (data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const user = {
    id: data.nextUserId++,
    username: username.toLowerCase(),
    displayName: displayName || username,
    avatarUrl: avatarUrl || null,
    passwordHash: hashPassword(password),
    teamId: null,
    role: 'member',
    createdAt: new Date().toISOString(),
  };

  data.users.push(user);
  saveData(data);

  const { passwordHash, ...safeUser } = user;
  res.status(201).json(safeUser);
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const data = loadData();
  const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Find team info
  let team = null;
  if (user.teamId) {
    team = data.teams.find(t => t.id === user.teamId);
  }

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, team: team || null });
});

// Create a new team
router.post('/teams', (req, res) => {
  const { userId, teamName } = req.body;

  if (!userId || !teamName) {
    return res.status(400).json({ error: 'userId and teamName are required' });
  }

  const data = loadData();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.teamId) {
    return res.status(400).json({ error: 'User is already in a team. Leave first.' });
  }

  const team = {
    id: data.nextTeamId++,
    name: teamName,
    code: generateTeamCode(),
    ownerId: userId,
    createdAt: new Date().toISOString(),
  };

  data.teams.push(team);

  // Add user to team as admin
  user.teamId = team.id;
  user.role = 'admin';

  saveData(data);
  res.status(201).json(team);
});

// Join a team with invite code
router.post('/teams/join', (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: 'userId and code are required' });
  }

  const data = loadData();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.teamId) {
    return res.status(400).json({ error: 'User is already in a team. Leave first.' });
  }

  const team = data.teams.find(t => t.code.toUpperCase() === code.toUpperCase());

  if (!team) {
    return res.status(404).json({ error: 'Invalid team code' });
  }

  user.teamId = team.id;
  user.role = 'member';

  saveData(data);

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, team });
});

// Leave team
router.post('/teams/leave', (req, res) => {
  const { userId } = req.body;

  const data = loadData();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.teamId = null;
  user.role = 'member';

  saveData(data);

  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

// Get team info and members
router.get('/teams/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const team = data.teams.find(t => t.id === id);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const members = data.users
    .filter(u => u.teamId === id)
    .map(({ passwordHash, ...u }) => u);

  res.json({ ...team, members });
});

// Update avatar
router.post('/avatar', (req, res) => {
  const { userId, avatarUrl } = req.body;

  const data = loadData();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.avatarUrl = avatarUrl || null;
  saveData(data);

  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;
