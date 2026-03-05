# Event Sphere Management

A full-scale **MERN** event management system for organizing large-scale expos and trade shows. Event Sphere Management addresses traditional expo challenges—manual registration, disjointed communication, and limited real-time information—with a robust, role-based platform.

## Scope (per MERN-EventSphere_Management)

- **User Authentication:** Registration, login, roles (admin/organizer, exhibitor, attendee), password encryption
- **Admin/Organizer:** Expo CRUD, booth allocation, exhibitor approval, schedule management, analytics
- **Exhibitor Portal:** Registration, profile management, booth selection, communication
- **Attendee Interface:** Event info, registration, exhibitor search, session booking
- **General:** Real-time updates (Socket.io), feedback mechanism

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Auth:** JWT + bcrypt
- **Real-time:** Socket.io
- **State:** Redux Toolkit

## Project Structure

```
event-sphere-management/
├── src/                 # React Frontend
│   ├── api/             # API calls (axios)
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── routes/         # React Router setup
│   ├── store/          # Redux store
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── server/             # Node.js Backend
│   ├── config/         # DB config
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   └── server.js
└── package.json
```

## Setup

### 1. MongoDB

See **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** for full instructions.

**Quick option (no install):** Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) free tier → create cluster → add user → allow IP `0.0.0.0/0` → copy connection string → paste into `server/.env` as `MONGO_URI`

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm install
npm run dev
```

### 3. Frontend

```bash
# From project root
npm install
npm run dev
```

### 4. Create Admin User

```bash
cd server
npm run seed:admin
# Login: admin@expo.com / admin123
```

## Roles

| Role     | Access                                      |
|----------|---------------------------------------------|
| Admin    | Full access, analytics, exhibitor approval   |
| Organizer| Create/manage expos, allocate booths        |
| Exhibitor| View allocated booths (after approval)      |
| Attendee | Register for expos, book sessions            |

## API Endpoints

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Current user
- `GET /api/expos` - List expos
- `POST /api/expos` - Create expo (admin/organizer)
- `GET /api/expos/:id` - Get expo
- `PUT /api/expos/:id` - Update expo
- `DELETE /api/expos/:id` - Delete expo
- `GET /api/expos/:id/booths` - List booths
- `POST /api/expos/:id/booths` - Create booth
- `GET /api/expos/:id/sessions` - List sessions
- `POST /api/expos/:id/sessions` - Create session
- `GET /api/exhibitors/pending` - Pending exhibitors (admin)
- `PUT /api/exhibitors/:id/approve` - Approve exhibitor
- `PUT /api/exhibitors/booth/:boothId/allocate` - Allocate booth
- `POST /api/attendees/register/expo/:expoId` - Register for expo
- `POST /api/attendees/register/session/:sessionId` - Book session
- `GET /api/attendees/registrations` - My registrations
- `GET /api/analytics/dashboard` - Dashboard stats (admin)
- `POST /api/feedback` - Submit feedback (public)
- `GET /api/feedback` - List feedback (admin)

## Development

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

Vite proxy is configured for `/api` and `/socket.io` to the backend.
