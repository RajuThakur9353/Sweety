# 🩸 Sweety – Blood Glucose Tracker (PERN Stack)

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-27%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

**Sweety** is a modern, responsive web application designed for diabetes patients to record up to 4 daily blood glucose readings, track their health trends, and view detailed daily, month-to-date, and previous-month reports.

Built with **Node.js, Express, PostgreSQL, and React**, featuring complete JWT authentication, strict validation, comprehensive tests, and interactive charts.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Bonus Tasks Implemented](#-bonus-tasks-implemented)
3. [Tech Stack](#-tech-stack)
4. [Prerequisites](#-prerequisites)
5. [Installation & Setup](#-installation--setup)
6. [Database Setup & Seeding](#-database-setup--seeding)
7. [Running the Application](#-running-the-application)
8. [Running Tests](#-running-tests)
9. [Docker Deployment](#-docker-deployment)
10. [API Reference](#-api-reference)
11. [Validation Rules Specification](#-validation-rules-specification)
12. [Database Schema](#-database-schema)
13. [Notes & Assumptions](#-notes--assumptions)

---

## 🌟 Core Features

### 1. Sign Up and Log In
- **User Registration**: Register with Name, Email, and Password.
- **Secure Password Storage**: Passwords are encrypted with **bcrypt** (10 salt rounds); plain-text passwords are never stored.
- **JWT Authentication**: Secure Bearer tokens for all protected endpoints.
- **Data Isolation**: Multi-tenant data segregation ensuring patients only see and manage their own readings.

### 2. Add, View, Edit, and Delete Readings
Each reading records:
- **Date**: (`YYYY-MM-DD`, cannot be in the future).
- **Time Slot**: 4 standardized slots per day:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- **Glucose Value**: Whole number in `mg/dl` between 40 and 600.
- **Optional Notes**: Dietary notes, exercise, or symptoms.

### 3. Comprehensive Reports
Given any selected date (e.g. `15 Oct 2026` or today):
- **Daily Report**:
  - Date Range: The selected date (e.g., `15 Oct 2026`).
  - Aggregates: Highest, lowest, and average reading (rounded to 1 decimal), and reading count.
  - Lists each reading for that day along with its slot and status badge.
- **Month-to-date Report**:
  - Date Range: 1st of the month to the selected date (e.g., `1 Oct – 15 Oct 2026`).
  - Aggregates: Highest, lowest, average (rounded to 1 decimal), and reading count.
- **Monthly Report**:
  - Date Range: The whole previous calendar month (e.g., `1 Sep – 30 Sep 2026`).
  - Aggregates: Highest, lowest, average (rounded to 1 decimal), and reading count.
- **Friendly Empty State**: Informative, clean fallback when no readings exist for any date range.

---

## 🎁 Bonus Tasks Implemented

- ✅ **Pagination on GET /readings**: `?page=1&limit=20` with total count, total pages, and navigation controls.
- ✅ **Interactive Line Chart (Recharts)**: Trend curve across the month showing target normal glucose thresholds (70 mg/dl and 140 mg/dl).
- ✅ **Docker Setup**: Production-ready `docker-compose.yml` with PostgreSQL (health check + persistent volumes), Node.js API server, and Nginx client.
- ✅ **Frontend Tests (React Testing Library & Vitest)**: 8 comprehensive unit tests for reading form validation rules and submissions.
- ✅ **Backend Integration Tests (Jest & Supertest)**: 19 end-to-end tests covering auth, tenant isolation, CRUD, reports, and validation error messages.
- ✅ **Demo Seed Script**: Generates 180+ realistic sample readings across 45 days for instant demonstration.
- ✅ **Doctor Role (Bonus)**: Doctors can log in and view reports and readings of assigned patients.
- ✅ **Zero-Friction Dual-Mode Database**: Supports live PostgreSQL out of the box, with automatic `pg-mem` fallback so tests and development run seamlessly in any environment.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Node.js (v20+), Express 4, bcryptjs, jsonwebtoken, morgan, cors |
| **Database** | PostgreSQL 16+ (with `pg` connection pool) & `pg-mem` fallback |
| **Testing** | Jest, Supertest, Vitest, React Testing Library, JSDOM |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **PostgreSQL**: v14+ (or Docker)

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/sweety.git
cd sweety
```

### 2. Install Dependencies
You can install dependencies for root, server, and client in one command:
```bash
npm run install:all
```
*(Or manually run `npm install` in both `/server` and `/client` directories).*

### 3. Environment Variables
Create `.env` in `server/` (a sample template is provided in `server/.env.example`):
```bash
cp server/.env.example server/.env
```

Contents of `server/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety_db
JWT_SECRET=sweety_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 🗄 Database Setup & Seeding

### 1. Set Up PostgreSQL Database
If you have PostgreSQL running locally:
```sql
CREATE DATABASE sweety_db;
```

### 2. Run Migrations & Seed Demo Data
Populate the database with the schema and 45 days of realistic sample readings:
```bash
npm run seed
```

> **Note on Zero-Config Fallback:** If a local PostgreSQL instance is not yet running, Sweety will automatically connect to its built-in in-memory PostgreSQL engine, allowing you to run the app and all tests immediately without setup friction!

### 🔑 Demo Credentials
The seed script creates two test accounts:

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Patient** | `demo@sweety.app` | `password123` | Full reading history, reports, and charts |
| **Doctor** | `doctor@sweety.app` | `password123` | View assigned patient reports & history |

*(Fast 1-click login buttons for both demo accounts are provided on the login page!)*

---

## 💻 Running the Application

### Start Both Server & Client Concurrently
From the root directory:
```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:server

# Terminal 2: React Frontend (port 5173)
npm run dev:client
```

Open your browser and navigate to:
**`http://localhost:5173`**

---

## 🧪 Running Tests

The project includes **27 automated tests** (19 backend integration tests + 8 frontend component tests).

### Run All Tests (Backend + Frontend)
```bash
npm test
```

### Run Backend Tests Only (Jest + Supertest)
```bash
npm run test:server
```
Tests cover:
- User registration, duplicate email rejection, and password bcrypt hashing.
- User login and invalid credential rejection.
- All 5 required validation rules with verbatim error messages.
- Multi-tenant data segregation (User B cannot view or modify User A's data).
- Daily report calculation, slot listing, MTD calculation, previous-month calculation, and empty states.
- Server-side pagination.

### Run Frontend Tests Only (Vitest + React Testing Library)
```bash
npm run test:client
```
Tests cover:
- ReadingFormModal rendering.
- Empty value validation ("Please enter a glucose value.").
- Out-of-bounds & decimal validation ("Value must be between 40 and 600 mg/dl.").
- Duplicate slot validation ("You already have an After lunch reading for this date.").
- Max 4 readings validation ("You can add only 4 readings per day.").
- Future date validation ("Date cannot be in the future.").
- Successful reading submission.

---

## 🐳 Docker Deployment

To spin up the entire application (PostgreSQL + Express API + React Web Client):
```bash
docker-compose up --build
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **PostgreSQL Database**: `localhost:5432`

To shut down:
```bash
docker-compose down -v
```

---

## 🔌 API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`name`, `email`, `password`, `role`) | No |
| `POST` | `/api/auth/login` | Login with credentials (`email`, `password`) | No |
| `GET` | `/api/auth/me` | Get current authenticated user profile | Yes (Bearer) |
| `GET` | `/api/auth/patients` | Get list of patients (Doctor role only) | Yes (Doctor) |

### Readings Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/readings` | Create reading (`date`, `slot`, `value`, `notes`) | Yes |
| `GET` | `/api/readings` | Get readings (supports `?page=1&limit=20`, `startDate`, `endDate`) | Yes |
| `GET` | `/api/readings/:id` | Get single reading by ID | Yes |
| `PUT` | `/api/readings/:id` | Update reading by ID | Yes |
| `DELETE` | `/api/readings/:id` | Delete reading by ID | Yes |

### Reports Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports?date=YYYY-MM-DD` | Returns Daily, Month-to-date, and Monthly reports | Yes |

---

## 🛡 Validation Rules Specification

The application enforces the exact validation rules specified in the requirements across both frontend UI and backend API:

| Rule | Trigger Condition | Exact Error Message |
|---|---|---|
| **Value is required** | Glucose field is empty or undefined | `"Please enter a glucose value."` |
| **Value range** | Value is non-integer or not between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
| **Single slot per day** | Slot already recorded for chosen date | `"You already have an After lunch reading for this date."` |
| **Max 4 per day** | 4 slots already recorded for chosen date | `"You can add only 4 readings per day."` |
| **No future dates** | Date is greater than current date | `"Date cannot be in the future."` |

---

## 🗃 Database Schema

```mermaid
erDiagram
    USERS ||--o{ READINGS : "has many"

    USERS {
        serial id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
        timestamp created_at
        timestamp updated_at
    }

    READINGS {
        serial id PK
        integer user_id FK
        date reading_date
        varchar slot
        integer value
        text notes
        timestamp created_at
        timestamp updated_at
    }
```

### Constraints & Indexes
- `unique_user_date_slot`: Unique constraint on `(user_id, reading_date, slot)`.
- `valid_slot`: Check constraint ensuring slot is one of the 4 designated slots.
- `valid_value`: Check constraint ensuring `value >= 40 AND value <= 600`.
- `idx_readings_user_date`: B-tree index on `(user_id, reading_date)` for fast range and report aggregation queries.

---

## 📝 Notes & Assumptions

### Assumptions Made
1. **Timezone & Date Selection**: Dates are treated using calendar day representations (`YYYY-MM-DD`). "Future date" is determined relative to the user's local date.
2. **Previous Month Boundary**: The "Monthly" report strictly computes the entire previous calendar month. For example, selecting any day in `October 2026` produces a monthly report for `1 Sep 2026 – 30 Sep 2026`. If selected date is in `January 2027`, previous month correctly rolls back to `1 Dec 2026 – 31 Dec 2026`.
3. **Empty States**: If no readings exist in a date range, reports return `count: 0` with `highest: null, lowest: null, average: null`, and the frontend displays a helpful, friendly empty state.
4. **Clinical Target Indicators**: Blood glucose values are categorized according to ADA (American Diabetes Association) guidelines:
   - Fasting normal: 70–99 mg/dl
   - Post-meal normal: < 140 mg/dl
   - Elevated: 100–125 (fasting) / 140–199 (post-meal)
   - High: ≥ 126 (fasting) / ≥ 200 (post-meal)

### What I'd Improve With More Time
1. **Automated Reminders (BullMQ + Redis)**: Scheduled daily background job at 8:00 PM checking if a patient has fewer than 4 readings and dispatching an email or push reminder.
2. **Report Export**: 1-click PDF/CSV export for patients to take to their endocrinologist appointments.
3. **Estimated HbA1c Calculation**: Calculate estimated average glucose (eAG) and projected HbA1c percentage from the 30-day and 90-day averages.
4. **Medication & Insulin Logging**: Allow recording insulin units and oral medication alongside glucose values.
5. **Progressive Web App (PWA)**: Add service workers and offline caching so patients can log readings without an active internet connection.

---

## 📄 License
MIT License. Built for the Sweety Blood Glucose Tracker Assignment.
