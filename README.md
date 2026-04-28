# IIITCONF — Conference Paper Submission & Review Management System

<p align="center">
  <a href="https://iiitconf.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-🚀-brightgreen?style=for-the-badge" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/JWT-Auth-purple?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Deployed-Vercel%20%2B%20Render-brightgreen?style=for-the-badge" alt="Deployed"/>
</p>

---

## 📌 About the Project

**IIITCONF** is a production‑deployed full‑stack web application that digitises the entire academic conference workflow – from paper submission, reviewer assignment, and multi‑criteria peer review, to final decision and analytics. The platform enforces role‑based access (Author, Reviewer, Admin) and includes OTP‑based email verification, secure JWT authentication, and PDF upload handling.

---

## 🛠️ Tech Stack

| Layer       | Technology |
|------------|------------|
| Frontend   | React 18, Vite, React Router v6, Recharts, Axios |
| Backend    | Node.js, Express.js |
| Database   | MySQL 8 / TiDB Cloud (serverless) |
| Auth       | JWT + bcryptjs + OTP via Nodemailer |
| File Upload| Multer (PDF‑only, ≤10 MB) |
| Deployment | Vercel (frontend) • Render (backend) |

---

## ✨ Core Features

### Author Portal
- Register with email OTP verification
- Submit papers (title, abstract, keywords, track, PDF)
- Real‑time submission status tracking
- Receive in‑app notifications
- Resubmit revised manuscripts when requested

### Reviewer Portal
- View assigned papers with deadline tracking
- Download PDF and read abstract
- Score on **5 criteria** (Originality, Technical Quality, Relevance, Clarity, Presentation) – each 1‑10
- Set confidence level (1‑5) and recommendation (Accept / Minor / Major / Reject)
- Save drafts or submit final review
- Add author‑facing comments and private admin notes

### Admin Dashboard
- Analytics (Recharts) – submission trends, status distribution, track breakdown, reviewer workload
- Assign 1‑3 reviewers per paper with **conflict‑of‑interest detection** and **workload balancing**
- Side‑by‑side review comparison
- Request minor/major revisions, accept/reject papers
- User management (activate/deactivate, role changes)
- Comprehensive audit log (action, entity, old/new values, IP, timestamp)

---

## 🔒 Security Highlights
- **OTP verification** for registration & password reset (6‑digit, 10 min expiry, single‑use)
- **bcrypt** password hashing (salt rounds = 10)
- **Stateless JWT** authentication with 7‑day expiry
- **Role‑based middleware** on both frontend (ProtectedRoute) and backend (requireRole)
- **CORS** limited to `http://localhost:5173` (dev) and the Vercel domain (prod)
- **File validation** – only PDFs ≤10 MB accepted via Multer
- **Audit logging** for every admin action

---

## 🏗️ Architecture (ASCII)
```
+-------------------+        +-------------------+        +-------------------+
|   Frontend (Vercel)  | <---> |   Backend (Render) | <---> |   TiDB Cloud (MySQL) |
|  React SPA + API   |   HTTP  |  Express REST API  |   SQL  |  Serverless DB      |
+-------------------+        +-------------------+        +-------------------+
            ^                              ^
            |                              |
            +----- JWT + OTP (Nodemailer) --+
```

---

## 📁 Project Structure
```
iiitconf/
├── schema.sql                     # 12‑table schema
├── backend/
│   ├── server.js                 # Express entry point
│   ├── config/db.js              # MySQL pool (TLS)
│   ├── middleware/
│   │   ├── auth.js               # JWT & role guard
│   │   └── upload.js             # Multer PDF handler
│   ├── routes/
│   │   ├── auth.js               # Register, login, OTP, forgot‑pwd
│   │   ├── papers.js             # Submit, list, download, revise
│   │   ├── reviews.js            # CRUD, draft, comparison
│   │   ├── assignments.js        # Assign reviewers, COI logic
│   │   └── admin.js              # Analytics, users, audit log
│   └── utils/email.js            # Nodemailer helper
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes + ProtectedRoute
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js       # Axios instance
│   │   ├── components/Sidebar.jsx
│   │   └── pages/                # Login, Register, ForgotPassword, …
│   └── vite.config.js
└── .gitignore                     # already ignores backend/.env
```

---

## ⚙️ Local Setup

**Prerequisites**: Node 18+, MySQL 8+, npm

```bash
# 1️⃣ Clone the repo
git clone https://github.com/raghunathpu/iiitconf.git
cd iiitconf

# 2️⃣ Database – run the schema
mysql -u root -p < schema.sql

# 3️⃣ Backend
cd backend
npm install
cp .env.example .env   # edit with your DB creds, JWT secret, and SMTP settings
npm run dev            # http://localhost:5000

# 4️⃣ Frontend
cd ../frontend
npm install
npm run dev            # http://localhost:5173
```

**Required `.env` keys** (example values omitted for brevity):
```
PORT
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
JWT_EXPIRES_IN
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
FRONTEND_URL
```

---

## 🎮 Demo Accounts

| Role   | Email                     | Password |
|--------|---------------------------|----------|
| Admin  | admin@iiitconf.ac.in      | ******** |
| Author | Register at `/register`   | —        |
| Reviewer| Register at `/register`  | —        |

---

## 📚 Database Schema (12 Tables)
`users`, `tracks`, `papers`, `paper_files`, `assignments`, `reviews`, `revision_requests`, `notifications`, `comments`, `audit_logs`, `conflicts`, `sessions` (optional).

---

## 📄 One-Line Project Description
> **IIITCONF** – Full‑stack conference management system built with React 18, Node .js, Express, MySQL (TiDB Cloud), JWT + OTP authentication, Multer PDF handling, and Recharts analytics; deployed on Vercel (frontend) and Render (backend).

---

