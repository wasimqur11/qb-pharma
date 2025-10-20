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
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Create and apply migrations
npm run db:deploy      # Deploy migrations (production)
npm run db:seed        # Seed database with all sample data
npm run db:seed:users  # Seed database with user data only
npm run db:studio      # Prisma Studio GUI
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

## Deployment

### Deploy Script Usage
The `deploy.sh` script is designed to be always up-to-date and handle both scenarios:

```bash
./deploy.sh                 # Fresh deployment or update with user-only seeding
./deploy.sh --clean-data    # Clean non-user data before deployment
```

**Important:** The deploy script automatically:
- Detects if it's a fresh deployment (no existing directory) or an update
- For fresh deployments: Clones repository and sets up everything from scratch
- For updates: Pulls latest changes while preserving database and configurations
- Uses user-only seeding by default to avoid creating sample business data
- Backs up database before updates
- Handles all dependencies, builds, and service management

### Deployment Process
1. **Repository Management**: Auto-detects fresh vs update deployment
2. **Database**: Uses `npm run db:seed:users` for minimal seeding (admin user only)
3. **Services**: Configures nginx reverse proxy and systemd service
4. **Health Checks**: Verifies all services are running correctly

## Development Notes

- Backend runs on port 3001 by default
- Frontend uses Vite for fast development and HMR
- SQLite database is versioned and backed up during deployments
- Deploy script handles both fresh installs and incremental updates intelligently
- Prisma schema changes require migration creation and deployment

## ⚠️ CRITICAL: DATABASE PROTECTION POLICY

**DO NOT MAKE CHANGES TO DATABASE SCHEMA OR DATA DURING REGULAR DEPLOYMENTS**

### Database Change Policy
- **NEVER** modify Prisma schema during code deployments
- **NEVER** run database migrations automatically in deploy.sh
- **NEVER** seed or modify production data without explicit approval
- **ALWAYS** treat database changes as separate, planned operations

### When Database Changes Are Required
1. **Create a separate database migration plan**
2. **Document all schema changes and their impact**
3. **Test migrations thoroughly in development first**
4. **Schedule database maintenance window**
5. **Run migrations separately from code deployments**
6. **Verify data integrity after migrations**

### Deploy Script Behavior
- The deploy.sh script is ONLY for code updates (frontend/backend)
- Database seeding ONLY runs on fresh installations (empty database)
- Existing data is ALWAYS preserved during updates
- Database backups are created before any deployment

## CRITICAL: Deploy Script Updates
**MANDATORY**: When making ANY changes to backend functionality, API endpoints, or system configurations, you MUST immediately update the deploy.sh script to reflect these changes. This includes:
- Adding new API endpoints or route handlers
- Including new permissions or user setup requirements
- Updating build processes or dependencies
- Adding new environment variables or configuration files
- Any changes that affect fresh deployments or updates

**PROHIBITED in deploy.sh:**
- Automatic Prisma schema changes (db push/migrate)
- Database seeding on existing databases
- Any operation that modifies existing data structure

The deploy.sh script must always be kept current and comprehensive to ensure seamless deployments.