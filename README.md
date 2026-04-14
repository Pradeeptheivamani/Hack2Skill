# AI-Powered Government Grievance Redressal System
### Smart India Hackathon 2024 — Government of Tamil Nadu

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env if needed (MONGODB_URI, JWT_SECRET)
npm run dev
```
> Runs on http://localhost:5000

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> Runs on http://localhost:5173

---

## 📁 Project Structure
```
grievance-system/
├── backend/           # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/    # DB connection
│   │   ├── models/    # User, Complaint, Department
│   │   ├── routes/    # auth, complaint, admin, department
│   │   ├── controllers/
│   │   ├── services/  # AI Classifier, Priority Engine, Notifications
│   │   ├── middleware/ # Auth (JWT), Error Handler
│   │   └── socket/    # Socket.IO real-time handler
│   └── server.js
│
└── frontend/          # React 18 + Vite
    └── src/
        ├── pages/     # Landing, Dashboard, Submit, Admin, Department
        ├── components/ # Navbar, Sidebar, StatCard, Charts, Map
        ├── context/   # Auth, Language
        ├── hooks/     # useSocket
        ├── utils/     # API instance
        └── i18n/      # EN + Tamil translations
```

---

## 🛠️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Vite, React Router v6         |
| Styling    | Vanilla CSS — Deep Navy + Saffron theme |
| Charts     | Recharts                                |
| Maps       | Leaflet.js + React-Leaflet              |
| Real-time  | Socket.IO                               |
| Backend    | Node.js, Express.js                     |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT + bcrypt                            |
| AI/NLP     | Keyword-based classifier (83+ keywords) |
| i18n       | Custom EN + Tamil context               |

---

## 👥 User Roles

| Role                | Access                                      |
|---------------------|---------------------------------------------|
| Citizen             | Register, submit complaints, track, dashboard |
| Admin               | All complaints, analytics, assign depts, users |
| Department Officer  | View assigned complaints, update status       |

### Demo Credentials
- **Admin**: `admin@grievance.gov.in` / `admin123`
- **Citizen**: Register a new account

---

## 🤖 AI Features

### Complaint Classification
- 83+ weighted keywords across 8 categories
- Tamil + English language support
- Confidence score (0-100%)
- Real-time suggestions while typing

### Priority Engine
- Critical keyword detection (death, accident, flood, etc.)
- Category-based base priority
- Location-weighted scoring
- SLA deadlines: High=24h, Medium=72h, Low=7 days

---

## 📡 API Endpoints

### Auth
| Method | Route                          | Description |
|--------|--------------------------------|-------------|
| POST   | /api/auth/register             | Register citizen |
| POST   | /api/auth/login                | Login |
| GET    | /api/auth/me                   | Get profile |
| GET    | /api/auth/notifications        | Get notifications |

### Complaints
| Method | Route                          | Description |
|--------|--------------------------------|-------------|
| POST   | /api/complaints                | Submit complaint (with AI) |
| GET    | /api/complaints/my             | My complaints |
| GET    | /api/complaints/track/:id      | Public tracking |
| PUT    | /api/complaints/:id/status     | Update status |
| POST   | /api/complaints/suggest        | AI suggestions |

### Admin
| Method | Route                          | Description |
|--------|--------------------------------|-------------|
| GET    | /api/admin/analytics           | Full analytics |
| GET    | /api/admin/complaints          | All complaints with filters |
| PUT    | /api/admin/complaints/:id/assign | Assign department |
| GET    | /api/admin/map-data            | Geo-tagged complaints |

---

## 🗺️ Features

- ✅ Premium Deep Navy + Saffron UI
- ✅ AI complaint classification (83+ keywords)
- ✅ Smart priority assignment + SLA management
- ✅ Real-time Socket.IO notifications
- ✅ Leaflet.js map with color-coded markers
- ✅ Recharts analytics (4 chart types)
- ✅ Voice input (Web Speech API)
- ✅ File attachments (up to 5 files)
- ✅ Tamil + English i18n
- ✅ JWT auth with role-based access
- ✅ Animated counters & micro-animations
- ✅ Responsive design (mobile + desktop)
- ✅ Multi-step complaint form
- ✅ Collapsible sidebar
- ✅ Department auto-seeding on startup

---

*Built for Smart India Hackathon 2024 — Government of Tamil Nadu*
