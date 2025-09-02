# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

QB Pharma is a full-stack pharmaceutical management system with a React frontend and Express.js backend:

- **Backend** (`backend/`): Express.js REST API with TypeScript, Prisma ORM, SQLite database
- **Frontend** (`frontend/`): React + TypeScript + Vite application with Tailwind CSS
- **Database**: SQLite with Prisma ORM for stakeholder management, transactions, and settlements

### Key Components

**Backend Architecture:**
- Main entry point: `backend/src/index.ts`
- Routes organized by domain: auth, users, transactions, stakeholders, dashboard
- Prisma client for database operations with comprehensive logging in development
- Security: Helmet, CORS, rate limiting, JWT authentication
- Database located at: `backend/prisma/data/qb-pharma.db`

**Frontend Architecture:**
- Main app: `frontend/src/App.tsx` - Provider-wrapped with nested context providers
- Context hierarchy: Auth → Configuration → Stakeholder → Transaction → Settlement providers
- Primary dashboard: `DarkCorporateDashboard` component
- Comprehensive stakeholder and transaction management systems
- Features: bulk uploads, payment processing, settlement wizards, account statements

## Development Commands

### Backend
```bash
cd backend
npm run dev          # Development server with hot reload
npm run build        # TypeScript compilation
npm run start        # Production server
npm run lint         # ESLint
npm run test         # Jest testing
```

### Database Management
```bash
cd backend
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Create and apply migrations
npm run db:deploy    # Deploy migrations (production)
npm run db:seed      # Seed database
npm run db:studio    # Prisma Studio GUI
```

### Frontend
```bash
cd frontend
npm run dev          # Vite development server
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

## Project Structure

- Authentication system with role-based access control
- Multi-context state management for complex business logic
- Settlement processing with equity calculations
- Comprehensive stakeholder management (distributors, doctors, patients)
- Transaction processing with bulk upload capabilities
- Account statements and payment estimation features
- Corporate dashboard with dark theme

## Development Notes

- Backend runs on port 3001 by default
- Frontend uses Vite for fast development and HMR
- SQLite database is versioned and backed up during deployments
- Deployment script (`deploy.sh`) handles both fresh installs and updates
- Prisma schema changes require migration creation and deployment