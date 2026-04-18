# Taumoeba Filter

**Compliance-Driven Food Waste Management System**

Transform unstructured food surplus into structured, risk-scored, and audit-ready donation records.

## 🧠 System Purpose

This system is a **compliance + risk + documentation** platform for food donors (restaurants, hostels, caterers). It generates immutable batch records with risk scoring, proof documentation, and downloadable compliance reports.

## 🏗️ Architecture

```
taumoeba-filter/
├── server/                     # Express API (Port 5000)
│   ├── config/db.js           # MongoDB connection
│   ├── models/                # User & Batch schemas
│   ├── controllers/           # Auth & Batch handlers
│   ├── routes/                # API routes
│   ├── engines/               # Risk, Compliance, Cost engines
│   ├── middleware/auth.js     # JWT authentication
│   ├── utils/pdfGenerator.js  # PDF report generator
│   └── uploads/               # Uploaded food images
│
├── client/                     # Next.js Frontend (Port 3000)
│   └── src/
│       ├── app/               # Pages (App Router)
│       ├── components/        # UI Components
│       ├── context/           # Auth Context
│       └── lib/api.js         # API Client (Axios)
```

## ⚙️ Tech Stack

| Layer      | Technology           |
|------------|---------------------|
| Frontend   | Next.js 14 + React 18 |
| Styling    | Tailwind CSS 3       |
| Backend    | Express.js           |
| Database   | MongoDB (Mongoose)   |
| Auth       | JWT (7-day tokens)   |
| Upload     | Multer (local storage) |
| PDF        | PDFKit               |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Start Backend

```bash
cd server
npm install
npm run dev
```

> Server runs on http://localhost:5000

### 2. Start Frontend

```bash
cd client
npm install
npm run dev
```

> Client runs on http://localhost:3000

### 3. Environment Variables

**Server** (`server/.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taumoeba-filter
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:3000
```

**Client** (`client/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📡 API Endpoints

| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | `/auth/register`           | No   | Register donor account   |
| POST   | `/auth/login`              | No   | Login with email/password|
| GET    | `/auth/profile`            | Yes  | Get current user profile |
| POST   | `/batches`                 | Yes  | Create surplus batch     |
| GET    | `/batches`                 | Yes  | List all donor batches   |
| GET    | `/batches/stats`           | Yes  | Dashboard statistics     |
| GET    | `/batches/:id`             | Yes  | Get batch by ID          |
| GET    | `/batches/:id/report`      | Yes  | JSON compliance report   |
| GET    | `/batches/:id/report?format=pdf` | Yes | PDF compliance report |

## 🧮 Risk Scoring Rules

| Food Category | Safe Window | Risk Levels              |
|---------------|-------------|--------------------------|
| Bread         | 4 hours     | ≥3h: LOW, 1-3h: MEDIUM, <1h: HIGH |
| Snacks        | 4 hours     |                          |
| Fruits        | 3 hours     |                          |
| Vegetables    | 3 hours     |                          |
| Dal           | 2.5 hours   |                          |
| Rice          | 2 hours     |                          |
| Mixed         | 2 hours     |                          |
| Curry         | 1 hour      |                          |
| Dairy         | 1 hour      |                          |

## ✨ Features

- ✅ JWT Authentication (register/login)
- ✅ Surplus Entry Form with drag-drop image upload
- ✅ Automated UUID batch IDs
- ✅ Real-time risk scoring engine
- ✅ Immutable compliance records
- ✅ JSON & PDF compliance reports
- ✅ Cost estimation engine
- ✅ Daily reminder system
- ✅ Dark theme (black + orange accents)
- ✅ Mobile responsive
- ✅ Search & filter batches
- ✅ Dashboard with analytics
