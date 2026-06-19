# Data Requirement Tracker

A tool for the team to track data requests and their status — replacing the spreadsheet.

## Project Structure

```
├── backend/          # Express API server
│   ├── src/
│   │   ├── index.js        # Entry point
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   └── middleware/     # Auth, validation, etc.
│   ├── db/
│   │   └── schema.sql      # Database schema
│   └── package.json
├── frontend/         # React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page views
│   │   ├── services/       # API client
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5173

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Styling:** CSS (keeping it simple)
