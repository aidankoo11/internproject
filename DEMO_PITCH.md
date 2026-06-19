# Data Requirement Tracker — Intern Project Summary

## Problem
Our team currently tracks audit test steps, data requests, POC meetings, and workpaper progress across multiple Excel sheets. This creates:
- Version control issues (who has the latest copy?)
- No real-time visibility into team progress
- Manual status updates that get stale
- No easy way to see blockers, overdue items, or who's waiting on what
- Meeting notes scattered across emails and docs

## Solution
A lightweight web-based tracker built specifically for our audit workflow. Replaces the spreadsheet with a shared, real-time dashboard the whole team can access.

## Key Features

**Dashboard**
- Color-coded request cards (🔴 Urgent, 🟠 In Progress, ⚪ To Do, 🟢 Done)
- Overall progress bar with live percentage
- "My Tasks" section showing what's due today, overdue, and upcoming
- Activity feed showing recent team actions in real-time
- Search across all requests, workpapers, tags, and assignees

**Controls / Test Steps**
- Group test steps under RCM Controls (Control 1–6)
- Visual checklist with per-control progress bars
- Edit/Save mode to prevent accidental changes
- Each step has: status, assignee, workpaper ref, tags, target date

**Team Collaboration**
- Account creation with team invite codes (share a 6-char code to join)
- People tracker showing each person's workload and completion rate
- Click on a person to see their tasks, overdue items, and what they've completed

**POC Tracker**
- Collapsible contact list with name, email, role, and inline notes
- Meeting log per POC: who met, when, summary of discussion
- Upcoming meetings with Zoom/Chime links
- File attachments per meeting
- Upload Zoom transcripts (.vtt) to auto-populate meeting summaries

**Other**
- Workpaper reference linking (WP-001, WP-002, etc.)
- Custom tags (Blocked, Waiting on PBC, Escalated)
- File uploads on requests for evidence/documentation
- Comments thread on each request
- Profile pictures (optional)

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Storage: JSON file (upgradeable to DynamoDB/Postgres for production)
- Styling: Custom CSS matching AWS Skill Builder design language

## Next Steps (if approved for team use)
1. Deploy to EC2 for always-on access (~$8/month)
2. Swap JSON storage for DynamoDB (handles concurrent users)
3. Add Midway/SSO auth for seamless Amazon login
4. Optional: Slack notifications when tasks get assigned or go overdue

## Time Investment
- Built in ~1 week as a side project
- Fully functional prototype, ready for team testing
- Production deployment: ~1 additional day

## Demo
Available for live demo via screen share. All features are working with sample data pre-loaded.

---

*Built by Aidan Koo — Summer 2025 Intern Project*
