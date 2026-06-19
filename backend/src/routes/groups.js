const express = require('express');
const { loadData, saveData } = require('../db/connection');

const router = express.Router();

router.get('/', (req, res) => {
  const data = loadData();
  const groups = (data.groups || []).map((group) => {
    const tasks = data.requests.filter(r => r.group_id === group.id);
    const total = tasks.length;
    const done = tasks.filter(r => r.status === 'done').length;
    const urgent = tasks.filter(r => r.status === 'urgent').length;
    const inProgress = tasks.filter(r => r.status === 'in_progress').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...group, total, done, urgent, in_progress: inProgress, pct };
  });
  res.json(groups);
});

router.get('/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const group = (data.groups || []).find(g => g.id === id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const tasks = data.requests.filter(r => r.group_id === id);
  const total = tasks.length;
  const done = tasks.filter(r => r.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  res.json({ ...group, tasks, total, done, pct });
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const data = loadData();
  const newGroup = { id: data.nextGroupId++, name, description: description || null, created_at: new Date().toISOString() };
  if (!data.groups) data.groups = [];
  data.groups.push(newGroup);
  saveData(data);
  res.status(201).json(newGroup);
});

router.delete('/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  if (!data.groups) data.groups = [];
  const index = data.groups.findIndex(g => g.id === id);
  if (index === -1) return res.status(404).json({ error: 'Group not found' });
  data.requests.forEach(r => { if (r.group_id === id) r.group_id = null; });
  data.groups.splice(index, 1);
  saveData(data);
  res.status(204).send();
});

module.exports = router;
