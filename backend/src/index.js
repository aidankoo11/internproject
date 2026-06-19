const express = require('express');
const cors = require('cors');
const path = require('path');
const requestsRouter = require('./routes/requests');
const groupsRouter = require('./routes/groups');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/requests', requestsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/activities', (req, res) => {
  const { loadData } = require('./db/connection');
  const data = loadData();
  res.json(data.activities || []);
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const { loadData } = require('./db/connection');
  const data = loadData();
  const query = q.toLowerCase();
  const results = data.requests.filter(r =>
    (r.title && r.title.toLowerCase().includes(query)) ||
    (r.description && r.description.toLowerCase().includes(query)) ||
    (r.requester && r.requester.toLowerCase().includes(query)) ||
    (r.assignee && r.assignee.toLowerCase().includes(query)) ||
    (r.workpaper_ref && r.workpaper_ref.toLowerCase().includes(query)) ||
    (r.tags && r.tags.some(t => t.toLowerCase().includes(query)))
  );
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Data Requirement Tracker API running on http://localhost:${PORT}`);
});
