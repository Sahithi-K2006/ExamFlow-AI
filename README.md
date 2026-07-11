<div align="center">

# 🚀 ExamFlow AI

### Intelligent Smart Virtual Queue & Examination Management Platform

A modern, scalable examination management platform designed to simplify the entire exam lifecycle — from exam creation and student registration to live queue management, real-time monitoring, secure authentication, and analytics.

Built with a production-ready architecture using **FastAPI**, **React**, **TypeScript**, **Redis**, **PostgreSQL (Supabase)**, and **WebSockets**.

---

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12+-yellow?logo=python)
![Redis](https://img.shields.io/badge/Redis-Queue-red?logo=redis)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?logo=postgresql)
![WebSockets](https://img.shields.io/badge/WebSocket-Realtime-success)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

# 📖 Overview

ExamFlow AI is a next-generation smart examination platform developed to solve common problems faced during online examinations and practical assessments.

Instead of simply conducting examinations, ExamFlow AI intelligently manages:

- Student Authentication
- Secure Exam Sessions
- Live Student Queue
- Real-Time Exam Monitoring
- Question Management
- Faculty Administration
- Result Generation
- Analytics Dashboard

The platform is designed with scalability in mind and follows modern software engineering practices suitable for enterprise-level deployments.

---

# ✨ Key Features

## 👨‍🎓 Student Portal

- Student Registration
- Secure Login (JWT Authentication)
- Persistent Login Sessions
- Live Queue Status
- Exam Dashboard
- Attempt Live Exams
- Automatic Answer Saving
- Countdown Timer
- Submit Exam
- Result Summary

---

## 👨‍💼 Admin Portal

- Secure Admin Authentication
- Dashboard Analytics
- Student Management
- Question Bank
- Exam Builder
- Publish / Unpublish Exams
- Live Queue Monitoring
- Reports
- Activity Logs

---

## 📚 Question Management

- Create Questions
- Edit Questions
- Delete Questions
- MCQ Support
- Difficulty Levels
- Subject Categorization
- Topic Categorization
- Image Attachments
- Code Snippets
- Bulk Question Organization

---

## 📝 Examination Module

- Multiple Exams
- Live Publishing
- Student Admission Queue
- Auto Session Management
- Exam Timer
- Question Navigation
- Auto Save
- Final Submission

---

## ⚡ Smart Queue Engine

Unlike traditional examination systems, ExamFlow AI includes a dedicated queue management engine.

Features include:

- FIFO Queue
- Capacity Management
- Live Queue Updates
- Automatic Admission
- Real-Time Position Updates
- Queue Release Logic

Powered by Redis for high performance.

---

## 🔐 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Role-Based Access Control (RBAC)
- Protected API Routes
- Session Validation
- Secure WebSocket Authentication

---

## 📡 Real-Time Communication

Powered by WebSockets.

Supports:

- Live Queue Updates
- Student Status
- Exam Status
- Live Dashboard Refresh
- Instant Notifications

---

# 🏗 Architecture

```
                    React + TypeScript
                           │
                     REST API + WebSocket
                           │
                      FastAPI Backend
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   PostgreSQL         Redis Queue        Storage
  (Supabase)         Smart Engine       (Supabase)
```

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Three.js
- Spline
- Lucide Icons

---

## Backend

- FastAPI
- Python
- SQLAlchemy
- Alembic
- Pydantic
- JWT Authentication
- Bcrypt
- WebSockets

---

## Database

- PostgreSQL (Supabase)

---

## Storage

- Supabase Storage

Used for:

- Question Images
- Attachments
- Student Uploads
- Reports
- PDFs

---

## Queue Engine

- Redis

Handles:

- Student Queue
- Admission Control
- Capacity Management
- Real-Time Updates

---

## Authentication

- JWT Tokens
- Password Hashing
- Role-Based Authorization

---

# 📂 Project Structure

```
ExamFlow-AI/

├── backend/
│   ├── app/
│   ├── alembic/
│   ├── scripts/
│   ├── requirements.txt
│   └── Dockerfile
│
├── src/
│   ├── api/
│   ├── components/
│   ├── layouts/
│   ├── router/
│   ├── theme/
│   └── App.tsx
│
├── public/
├── README.md
├── package.json
└── docker-compose.yml
```

---

# 🚀 Installation

## Clone

```bash
git clone https://github.com/Sahithi-K2006/ExamFlow-AI.git

cd ExamFlow-AI
```

---

## Frontend

```bash
npm install

npm run dev
```

---

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

# 🌐 Deployment

Frontend

- Vercel

Backend

- Railway / Render

Database

- Supabase PostgreSQL

Storage

- Supabase Storage

Queue

- Redis

---

# 📊 Current Status

✅ Authentication System

✅ Student Portal

✅ Admin Dashboard

✅ Exam Builder

✅ Question Bank

✅ Queue Engine

✅ Redis Integration

✅ PostgreSQL Integration

✅ WebSocket Communication

✅ Activity Logging

✅ Responsive UI

---

# 🛣 Roadmap

Planned enhancements include:

- AI-assisted Question Recommendations
- Wait-Time Prediction
- Intelligent Analytics
- NLP-based Question Categorization
- ML-powered Student Performance Insights
- Advanced Reporting
- Multi-Institution Support
- Mobile Application
- AI Validation Center

These features are part of the long-term vision and are not yet included in the current release.

---

# 🤝 Contributing

Contributions, suggestions, and feature requests are welcome.

Fork the repository, create a new branch, and submit a Pull Request.

---

# 👩‍💻 Author

## Satya Sahithi Kodidasu

B.Sc Data Science Student

Full Stack Developer | Machine Learning Enthusiast | AI Developer

GitHub:
https://github.com/Sahithi-K2006

LinkedIn:
https://linkedin.com/in/satyasahithikodidasu

---

# ⭐ Support

If you found this project useful,

⭐ Star the repository

🍴 Fork the project

📢 Share it with others

---

## License

This project is licensed under the MIT License.

© 2026 Satya Sahithi Kodidasu. All Rights Reserved.
