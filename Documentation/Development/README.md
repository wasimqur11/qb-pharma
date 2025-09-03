# Development Documentation

## Overview

This section contains comprehensive guides for setting up and contributing to the QB Pharma development environment.

## Documentation Files

- [Setup Guide](./setup.md) - Local development environment setup
- [Code Standards](./standards.md) - Coding standards and best practices
- [Testing Guide](./testing.md) - Testing procedures and frameworks
- [Contributing](./contributing.md) - Contribution guidelines and workflow
- [Architecture](./architecture.md) - System architecture and design patterns
- [Debugging](./debugging.md) - Debugging tips and common issues

## Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher
- Git
- VS Code (recommended)

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/your-org/qb-pharma.git
cd qb-pharma

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Setup environment
cd ../backend && cp .env.example .env
cd ../frontend && cp .env.example .env

# 4. Initialize database
cd ../backend
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev              # Backend (port 3001)
cd ../frontend && npm run dev  # Frontend (port 5173)
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow code standards
   - Write tests for new features
   - Update documentation

3. **Test Changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Submit Pull Request**
   - Ensure all tests pass
   - Include clear description
   - Request code review

## Development Environment

### Required Tools
- **IDE**: VS Code with recommended extensions
- **Database Tool**: Prisma Studio (`npm run db:studio`)
- **API Testing**: Postman or Thunder Client
- **Version Control**: Git with conventional commits

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Prisma
- ESLint
- Prettier
- Auto Rename Tag
- GitLens
- REST Client

### File Structure
```
qb-pharma/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── routes/       # API route definitions
│   │   ├── middleware/   # Express middleware
│   │   └── index.ts      # Application entry point
│   ├── prisma/           # Database schema and migrations
│   └── package.json
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript definitions
│   └── package.json
└── Documentation/        # Project documentation
```

## Code Quality

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for git messages

### Testing Strategy
- Unit tests for utilities and business logic
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical user flows

### Performance Guidelines
- Use React.memo for expensive components
- Implement proper database indexing
- Optimize API queries with pagination
- Use lazy loading for large components

## Support

### Getting Help
1. Check existing documentation
2. Review code comments and examples
3. Ask questions in team discussions
4. Create issues for bugs or feature requests

### Common Commands
```bash
# Backend development
npm run dev              # Start development server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Run ESLint
npm run db:studio       # Open Prisma Studio

# Frontend development
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

---

*For detailed information, see the specific documentation files in this folder.*