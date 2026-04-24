# IIITCONF – Conference Paper Submission & Review Management System

A full-stack academic conference management platform built with React, Node.js, Express, and MySQL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0+ |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer (PDF only, max 10MB) |
| Styling | Custom CSS (no framework) |

---

## Project Structure

```
iiitconf/
├── schema.sql              ← Run this first in MySQL
├── backend/
│   ├── server.js           ← Entry point
│   ├── .env.example        ← Copy to .env
│   ├── config/db.js        ← MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js         ← JWT + role middleware
│   │   └── upload.js       ← Multer PDF upload
│   ├── routes/
│   │   ├── auth.js         ← /api/auth/*
│   │   ├── papers.js       ← /api/papers/*
│   │   ├── reviews.js      ← /api/reviews/*
│   │   ├── assignments.js  ← /api/assignments/*
│   │   ├── notifications.js← /api/notifications/*
│   │   └── admin.js        ← /api/admin/*
│   └── uploads/            ← PDF files stored here
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx          ← Routes
        ├── index.css        ← Global styles
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js       ← Axios API layer
        ├── components/
        │   └── Sidebar.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── PaperDetail.jsx
            ├── Notifications.jsx
            ├── author/
            │   ├── AuthorDashboard.jsx
            │   ├── SubmitPaper.jsx
            │   ├── MySubmissions.jsx
            │   └── Revisions.jsx
            ├── reviewer/
            │   ├── ReviewerDashboard.jsx
            │   ├── ReviewForm.jsx
            │   └── ToReview.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── AllPapers.jsx
                ├── AssignReviewers.jsx
                └── UserManagement.jsx
```

---

## Local Setup (Step by Step)

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm

---

### Step 1: Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source /path/to/iiitconf/schema.sql

# OR copy-paste the schema.sql contents into MySQL Workbench
```

After running schema.sql, create the admin user with a real password:

```sql
USE iiitconf;

-- First generate a bcrypt hash of your password
-- Use: node -e "const b=require('bcryptjs');b.hash('admin123',10).then(h=>console.log(h));"
-- Then insert:
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@iiitconf.ac.in', '<PASTE_HASH_HERE>', 'admin');
```

Or use the quick seed script (see below).

---

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env
```

**.env contents:**
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=iiitconf
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
FRONTEND_URL=http://localhost:5173
```

**Seed admin account:**
```bash
node -e "
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  await db.execute(
    'INSERT IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)',
    ['Admin','admin@iiitconf.ac.in', hash,'admin']
  );
  console.log('Admin created: admin@iiitconf.ac.in / admin123');
  await db.end();
})();
"
```

**Start backend:**
```bash
npm run dev    # development (nodemon)
npm start      # production
```

Backend runs at: http://localhost:5000

---

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iiitconf.ac.in | admin123 |
| Author | Register at /register | — |
| Reviewer | Register at /register (select Reviewer) | — |

---

## Feature Overview

### Author
- Register/Login
- Submit paper with PDF upload, abstract, keywords, track
- View submission status in real-time
- Receive notifications
- Resubmit revised papers when requested

### Reviewer
- Assigned papers appear in "To Review" tab
- Download PDF and read abstract
- Submit detailed review with 5 criteria (scored 1–10) + confidence (1–5)
- Choose recommendation: Accept / Minor / Major / Reject
- Add comments for author, private notes for admin
- Save as draft or submit final review

### Admin
- Full analytics dashboard with Recharts graphs:
  - Submissions by status (pie)
  - Papers by track (bar)
  - Monthly submissions (line)
  - Review recommendation distribution (pie)
  - Reviewer workload table
- View and filter all papers
- Assign 1–3 reviewers per paper (workload-balanced, conflict-aware)
- Compare all reviewer scores side-by-side
- Request minor/major revision from authors
- Accept/Reject papers
- Manage all users (activate/deactivate, change roles)
- Audit log tracking

---

## Deployment

### Option A: Railway (Recommended – Easiest)

1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add MySQL service → copy credentials to backend `.env`
4. Set environment variables in Railway dashboard
5. Deploy backend and frontend as separate services

### Option B: Render + PlanetScale (Free Tier)

**Backend on Render:**
1. Create Web Service → connect GitHub repo → set root dir to `backend/`
2. Build command: `npm install`
3. Start command: `npm start`
4. Add all env vars from `.env`

**Database on PlanetScale:**
1. Create database at planetscale.com
2. Get connection string → update `DB_*` vars in Render

**Frontend on Vercel:**
1. Import GitHub repo → set root dir to `frontend/`
2. Build command: `npm run build`
3. Output dir: `dist`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com`

Then in `frontend/src/services/api.js`, change:
```js
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL + '/api' });
```

### Option C: VPS (DigitalOcean / AWS / Hostinger)

```bash
# On server:
sudo apt update && sudo apt install -y nodejs npm mysql-server nginx

# Clone project
git clone https://github.com/you/iiitconf.git
cd iiitconf

# Setup MySQL
sudo mysql_secure_installation
mysql -u root -p < schema.sql

# Backend
cd backend && npm install
cp .env.example .env && nano .env
npm install -g pm2
pm2 start server.js --name iiitconf-api
pm2 startup && pm2 save

# Frontend
cd ../frontend && npm install && npm run build
# dist/ folder is your static site

# Nginx config
sudo nano /etc/nginx/sites-available/iiitconf
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (static)
    location / {
        root /var/www/iiitconf/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads {
        alias /path/to/iiitconf/backend/uploads;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/iiitconf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Backend port | 5000 |
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | mypassword |
| DB_NAME | Database name | iiitconf |
| JWT_SECRET | Secret for JWT signing | 64+ char random string |
| JWT_EXPIRES_IN | Token expiry | 7d |
| UPLOAD_DIR | Upload directory name | uploads |
| MAX_FILE_SIZE | Max PDF size in bytes | 10485760 (10MB) |
| FRONTEND_URL | CORS origin | http://localhost:5173 |

---

## API Endpoints Summary

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |

### Papers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/papers | Submit paper (author) |
| GET | /api/papers | List papers (role-filtered) |
| GET | /api/papers/:id | Get paper details |
| GET | /api/papers/:id/download | Download PDF |
| PUT | /api/papers/:id/status | Update status (admin) |
| POST | /api/papers/:id/revise | Submit revision (author) |
| POST | /api/papers/:id/revision-request | Request revision (admin) |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reviews/paper/:id | Get all reviews for paper |
| GET | /api/reviews/my/:paperId | Get reviewer's own review |
| POST | /api/reviews | Submit/save review |
| GET | /api/reviews/comparison/:paperId | Admin review comparison |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assignments/reviewers/:paperId | Get available reviewers |
| POST | /api/assignments | Assign reviewer |
| DELETE | /api/assignments/:id | Remove assignment |
| PUT | /api/assignments/:id/decline | Reviewer declines |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/analytics | Dashboard statistics |
| GET | /api/admin/users | List all users |
| PUT | /api/admin/users/:id/toggle | Toggle user active |
| PUT | /api/admin/users/:id/role | Change user role |
| GET | /api/admin/audit-logs | Audit log |
| POST | /api/admin/conflicts | Add conflict of interest |
| POST | /api/admin/tracks | Create track |

---

## Resume Description

**Developed IIITCONF, a full-stack conference paper submission and peer-review management system using React, Node.js, Express, MySQL, and JWT authentication. The platform supports author paper submission with PDF upload, admin reviewer assignment with workload balancing and conflict-of-interest handling, multi-criteria review scoring (originality, technical quality, relevance, clarity, presentation), revision workflow, deadline tracking, role-based dashboards, Recharts analytics graphs, and complete submission-to-decision lifecycle management.**
