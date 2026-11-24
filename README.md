# community-hall-booking-system
A modern 3D-enabled community hall booking platform to discover venues, check availability, submit booking requests, and manage halls, reservations, and maintenance through an intuitive dashboard.
# 🏛️ Sabhā Halls – Community Hall Booking & Management System

A modern, web-based platform designed to simplify community hall discovery, booking requests, scheduling, and management.

Sabhā Halls connects customers with community venues while providing administrators with tools to manage halls, reservations, maintenance schedules, and booking records.

## ✨ Project Overview

Finding and booking a suitable community hall can involve time-consuming communication, manual availability checks, and paperwork.

Sabhā Halls aims to digitize this process through a centralized platform where customers can explore venues and request bookings, while administrators can manage the complete booking workflow.

## 🚀 Key Features

### Customer Features
- Browse available community halls.
- Explore hall details and facilities.
- Check hall availability.
- Submit booking requests.
- Track booking request status.
- View booking history.

### Admin Features
- Admin dashboard and booking overview.
- Manage community hall information.
- Review, approve, or reject booking requests.
- Manage hall availability.
- Schedule maintenance periods.
- Maintain booking records and reports.

### Additional Features
- Modern, responsive user interface.
- Premium 3D-inspired landing page experience.
- AI-powered receptionist integration using ElevenLabs.
- Centralized booking management.

*Feature availability depends on the current implementation and deployment status.*

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| 3D Experience | Three.js |
| Backend | Node.js, Express.js, TypeScript |
| Database | MySQL |
| ORM | Prisma |
| AI Receptionist | ElevenLabs |
| Frontend Hosting | Netlify |
| Backend Hosting | Render |
| Version Control | Git & GitHub |

## 📁 Project Structure

```text
community-hall-booking-system/
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── docs/
│
├── .gitignore
└── README.md
```

*The exact folders may vary as development progresses.*

## ⚙️ Getting Started

### Prerequisites
- Node.js
- npm
- MySQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

### 2. Open the project

```bash
cd YOUR-REPOSITORY
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

Create the required frontend environment configuration using the project's environment example.

Start the frontend:

```bash
npm run dev
```

### 4. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

Configure the backend environment variables in a local `.env` file. Refer to `.env.example` if available.

Build and start the backend using the scripts defined in `backend/package.json`.

## 🔐 Environment Variables

Keep all credentials and API keys private.

Typical configuration may include:

- `DATABASE_URL` – MySQL database connection.
- `NODE_ENV` – Application environment.
- `ELEVENLABS_API_KEY` – ElevenLabs API key.
- `ELEVENLABS_AGENT_ID` – Receptionist agent ID.
- `ELEVENLABS_BRANCH_ID` – Receptionist branch ID.
- `VITE_API_BASE_URL` – Frontend API base URL.

Never commit `.env` files or production credentials to GitHub.

## 🌐 Deployment

The project is designed for deployment using:

- **Frontend:** Netlify
- **Backend:** Render
- **Database:** Managed MySQL

## 🎯 Project Goals

- Make community hall discovery and booking easier.
- Reduce manual booking administration.
- Improve reservation tracking and transparency.
- Simplify maintenance scheduling.
- Provide a scalable digital solution for community hall management.

## 🔮 Future Enhancements

- Online payment integration.
- Automated email and SMS notifications.
- Hall-owner management portal.
- Advanced analytics and reporting.
- Calendar synchronization.
- Multilingual AI receptionist enhancements.

## 👨‍💻 Project Status

**Active Development**

This project is being developed and improved incrementally. Features and integrations may evolve throughout development.

## 📄 License

A license has not yet been selected. All rights are reserved unless a license is added to this repository.
