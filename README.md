# 🏛️ Community Hall Booking and Management System

A premium, modern, interactive 3D web application designed to manage community hall booking requests, schedule maintenance, and maintain verifiable booking records.

---

## 🌟 Architecture & Tech Stack

### Frontend
- **Framework:** React 19 + Vite (TypeScript)
- **Styling:** Tailwind CSS v4, Custom Glassmorphism, CSS Custom Properties
- **3D Graphics:** Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Forms & Validation:** React Hook Form + Zod
- **Analytics & Data Visualizations:** Recharts
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

### Backend
- **Runtime & Framework:** Node.js (v24), Express.js (TypeScript)
- **Database ORM:** Prisma ORM
- **Database Engine:** MySQL 8.0 (Docker / Native)
- **Authentication:** JWT (JSON Web Tokens), bcryptjs password hashing
- **Middleware & Security:** CORS, Morgan logger, Zod validation, Role-based Access Control (RBAC)

---

## 📁 Project Structure

```text
community-hall-booking-system/
│
├── frontend/
│   ├── src/
│   │   ├── assets/       # Static media and brand elements
│   │   ├── components/   # Reusable UI components (Navbar, Footer, Modals, Cards)
│   │   ├── contexts/     # Auth and Theme context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Public, Customer, and Admin layouts
│   │   ├── pages/        # Public pages, Customer Portal, Admin Dashboard
│   │   ├── services/     # Axios API service instances
│   │   ├── three/        # 3D R3F architectural scenes, lighting, and models
│   │   ├── types/        # TypeScript interfaces and schema types
│   │   ├── App.tsx       # Route definitions and Providers
│   │   ├── index.css     # Luxury theme variables & glassmorphism classes
│   │   └── main.tsx      # Application entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/       # Environment variables & constants
│   │   ├── controllers/  # Route controller handlers
│   │   ├── database/     # Prisma client instance & seed scripts
│   │   ├── middleware/   # JWT auth, error handlers, role gates
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic & transaction operations
│   │   ├── utils/        # Token helpers, response formatters
│   │   ├── validators/   # Zod request payload schemas
│   │   └── server.ts     # Express server setup & health endpoint
│   ├── prisma/
│   │   └── schema.prisma # Normalized relational database schema
│   ├── .env.example      # Environment variables template
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                 # Architectural specifications and guides
├── .gitignore
├── package.json          # Root orchestration scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18 (Current: v24.18.1)
- MySQL 8.0 (Container running on `localhost:3306`)

### Running the Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173
```
