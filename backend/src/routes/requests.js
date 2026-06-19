const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { loadData, saveData } = require('../db/connection');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const { status } = req.query;
  const data = loadData();
  let requests = data.requests;
  if (status) requests = requests.filter(r => r.status === status);
  const order = { urgent: 0, in_progress: 1, todo: 2, done: 3 };
  requests.sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2));
  res.json(requests);
});

router.get('/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const request = data.requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const comments = data.comments.filter(c => c.request_id === id);
  const files = data.files.filter(f => f.request_id === id);
  res.json({ ...request, comments, files });
});

router.post('/', (req, res) => {
  const { title, description, requester, assignee, status, target_date, group_id, workpaper_ref, tags } = req.body;
  if (!title || !requester) return res.status(400).json({ error: 'title and requester are required' });
  const data = loadData();
  const now = new Date().toISOString();
  const newRequest = {
    id: data.nextRequestId++, title, description: description || null, requester, assignee: assignee || null,
    status: status || 'todo', target_date: target_date || null, group_id: group_id ? parseInt(group_id) : null,
    workpaper_ref: workpaper_ref || null, tags: tags || [], created_at: now, updated_at: now,
  };
  data.requests.push(newRequest);
  if (!data.activities) data.activities = [];
  data.activities.unshift({ id: Date.now(), type: 'created', request_id: newRequest.id, request_title: newRequest.title, user: requester, timestamp: now });
  if (data.activities.length > 50) data.activities = data.activities.slice(0, 50);
  saveData(data);
  res.status(201).json(newRequest);
});

router.patch('/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const index = data.requests.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: 'Request not found' });
  const { title, description, assignee, status, target_date, group_id, workpaper_ref, tags, changed_by } = req.body;
  const oldStatus = data.requests[index].status;
  if (title !== undefined) data.requests[index].title = title;
  if (description !== undefined) data.requests[index].description = description;
  if (assignee !== undefined) data.requests[index].assignee = assignee;
  if (status !== undefined) data.requests[index].status = status;
  if (target_date !== undefined) data.requests[index].target_date = target_date;
  if (group_id !== undefined) data.requests[index].group_id = group_id ? parseInt(group_id) : null;
  if (workpaper_ref !== undefined) data.requests[index].workpaper_ref = workpaper_ref;
  if (tags !== undefined) data.requests[index].tags = tags;
  data.requests[index].updated_at = new Date().toISOString();
  if (status && status !== oldStatus) {
    if (!data.activities) data.activities = [];
    data.activities.unshift({ id: Date.now(), type: 'status_changed', request_id: data.requests[index].id, request_title: data.requests[index].title, user: changed_by || 'someone', old_status: oldStatus, new_status: status, timestamp: new Date().toISOString() });
    if (data.activities.length > 50) data.activities = data.activities.slice(0, 50);
  }
  saveData(data);
  res.json(data.requests[index]);
});

router.delete('/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const index = data.requests.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: 'Request not found' });
  data.requests.splice(index, 1);
  data.comments = data.comments.filter(c => c.request_id !== id);
  data.files = data.files.filter(f => f.request_id !== id);
  saveData(data);
  res.status(204).send();
});

router.post('/:id/comments', (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'author and content are required' });
  const data = loadData();
  const id = parseInt(req.params.id);
  if (!data.requests.find(r => r.id === id)) return res.status(404).json({ error: 'Request not found' });
  const comment = { id: data.nextCommentId++, request_id: id, author, content, created_at: new Date().toISOString() };
  data.comments.push(comment);
  saveData(data);
  res.status(201).json(comment);
});

router.post('/:id/files', upload.single('file'), (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  if (!data.requests.find(r => r.id === id)) return res.status(404).json({ error: 'Request not found' });
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const fileRecord = { id: data.nextFileId++, request_id: id, filename: req.file.filename, original_name: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, uploaded_by: req.body.uploaded_by || 'unknown', uploaded_at: new Date().toISOString() };
  data.files.push(fileRecord);
  saveData(data);
  res.status(201).json(fileRecord);
});

module.exports = router;
