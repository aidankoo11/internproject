const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../db/data.json');

const DEFAULT_DATA = {
  users: [],
  teams: [],
  groups: [],
  requests: [],
  comments: [],
  files: [],
  activities: [],
  nextUserId: 1,
  nextTeamId: 1,
  nextGroupId: 1,
  nextRequestId: 1,
  nextCommentId: 1,
  nextFileId: 1,
};

function loadData() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { loadData, saveData };
