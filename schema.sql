-- IIITCONF Database Schema
-- Run this file to set up your MySQL database

CREATE DATABASE IF NOT EXISTS iiitconf;
USE iiitconf;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('author', 'reviewer', 'admin') DEFAULT 'author',
  expertise_tags JSON DEFAULT NULL,
  institution VARCHAR(200),
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tracks/Categories
CREATE TABLE tracks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  deadline DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Papers table
CREATE TABLE papers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  abstract TEXT NOT NULL,
  keywords VARCHAR(500),
  track_id INT,
  author_id INT NOT NULL,
  file_path VARCHAR(500),
  file_name VARCHAR(300),
  status ENUM('submitted','under_assignment','to_review','reviewed','revision','accepted','rejected','archived') DEFAULT 'submitted',
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  admin_notes TEXT,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE SET NULL
);

-- Paper files (version history)
CREATE TABLE paper_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(300),
  version INT DEFAULT 1,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- Reviewer Assignments
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  assigned_by INT NOT NULL,
  deadline DATETIME,
  status ENUM('pending','accepted','declined','completed') DEFAULT 'pending',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (paper_id, reviewer_id)
);

-- Reviews table
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  assignment_id INT,
  originality_score INT CHECK (originality_score BETWEEN 1 AND 10),
  technical_quality_score INT CHECK (technical_quality_score BETWEEN 1 AND 10),
  relevance_score INT CHECK (relevance_score BETWEEN 1 AND 10),
  clarity_score INT CHECK (clarity_score BETWEEN 1 AND 10),
  presentation_score INT CHECK (presentation_score BETWEEN 1 AND 10),
  confidence_score INT CHECK (confidence_score BETWEEN 1 AND 5),
  overall_score DECIMAL(5,2),
  recommendation ENUM('accept','minor_revision','major_revision','reject') NOT NULL,
  detailed_comments TEXT,
  private_comments TEXT,
  author_comments TEXT,
  is_submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL
);

-- Revision Requests
CREATE TABLE revision_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_id INT NOT NULL,
  requested_by INT NOT NULL,
  request_type ENUM('minor','major') DEFAULT 'minor',
  instructions TEXT,
  deadline DATETIME,
  status ENUM('pending','submitted','approved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  related_paper_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_paper_id) REFERENCES papers(id) ON DELETE SET NULL
);

-- Comments
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paper_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Logs
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Conflict of Interest
CREATE TABLE conflicts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewer_id INT NOT NULL,
  author_id INT NOT NULL,
  reason TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed default admin
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@iiitconf.ac.in', '$2b$10$YourHashedPasswordHere', 'admin');

-- Seed sample tracks
INSERT INTO tracks (name, description, deadline) VALUES
('Artificial Intelligence', 'Papers on AI, ML, Deep Learning', '2025-06-30 23:59:59'),
('Computer Networks', 'Papers on networking, protocols, security', '2025-06-30 23:59:59'),
('Software Engineering', 'Papers on SE methodologies, tools, practices', '2025-06-30 23:59:59'),
('Data Science', 'Papers on big data, analytics, visualization', '2025-06-30 23:59:59'),
('Human Computer Interaction', 'Papers on UX, UI, accessibility', '2025-06-30 23:59:59');
