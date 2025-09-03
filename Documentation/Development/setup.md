# Development Environment Setup

## Overview

This guide will help you set up a complete development environment for QB Pharma on your local machine.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 5GB free space
- **Internet**: Stable connection for package downloads

### Required Software

#### 1. Node.js and npm
Install Node.js 18.x or higher:

**Windows/macOS:**
- Download from [nodejs.org](https://nodejs.org/)
- Run the installer
- Verify installation:
  ```bash
  node --version  # Should show 18.x or higher
  npm --version   # Should show 8.x or higher
  ```

**Linux (Ubuntu/Debian):**
```bash
# Install via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Git
Install Git for version control:

**Windows:**
- Download from [git-scm.com](https://git-scm.com/)
- Use Git Bash for command line operations

**macOS:**
```bash
# Install via Homebrew (recommended)
brew install git

# Or download from git-scm.com
```

**Linux:**
```bash
sudo apt update
sudo apt install git
```

#### 3. Code Editor
**VS Code (Recommended):**
- Download from [code.visualstudio.com](https://code.visualstudio.com/)
- Install recommended extensions (see Extensions section)

**Alternative Editors:**
- WebStorm
- Atom
- Sublime Text

## Project Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/qb-pharma.git
cd qb-pharma

# Verify project structure
ls -la
# Should show: backend/, frontend/, Documentation/, etc.
```

### 2. Backend Setup

#### 2.1 Install Dependencies
```bash
cd backend
npm install
```

#### 2.2 Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Configure `.env` file:**
```bash
NODE_ENV=development
PORT=3001
HOST=localhost
DATABASE_URL="file:./prisma/data/qb-pharma.db"

# Generate a secure JWT secret (use a random string)
JWT_SECRET="your-local-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Local development settings
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"

# Rate limiting (disabled in development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Prisma settings
PRISMA_HIDE_UPDATE_MESSAGE=true
PRISMA_TELEMETRY_INFORMATION=false
```

#### 2.3 Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations (if any exist)
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

**Verify database setup:**
```bash
# Open Prisma Studio to view data
npm run db:studio
# Opens browser at http://localhost:5555
```

#### 2.4 Start Backend Server
```bash
npm run dev
```

Server should start at `http://localhost:3001`. Verify with:
```bash
# Test health endpoint
curl http://localhost:3001/health
```

### 3. Frontend Setup

#### 3.1 Install Dependencies
```bash
# Open new terminal, navigate to frontend
cd frontend
npm install
```

#### 3.2 Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
```

**Configure frontend `.env` file:**
```bash
VITE_API_URL="/api"
VITE_APP_NAME="QB Pharma"
VITE_NODE_ENV=development
VITE_LOCAL_API=true
```

#### 3.3 Start Frontend Server
```bash
npm run dev
```

Frontend should start at `http://localhost:5173`.

### 4. Verify Setup

#### 4.1 Test Application
1. Open browser to `http://localhost:5173`
2. You should see the QB Pharma login page
3. Use default credentials (from seed data):
   - **Username**: `admin`
   - **Password**: `admin123`

#### 4.2 Test API Connection
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## VS Code Setup

### Recommended Extensions

Install these extensions for optimal development experience:

```bash
# Install via VS Code extension marketplace or command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension Prisma.prisma
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension formulahendry.auto-rename-tag
code --install-extension eamodio.gitlens
code --install-extension humao.rest-client
```

### Workspace Configuration

Create `.vscode/settings.json` in project root:
```json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### Debugging Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

## Development Workflow

### Daily Development

1. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   
   # Terminal 3: Database Studio (optional)
   cd backend && npm run db:studio
   ```

2. **Make Changes**
   - Edit code with hot-reload enabled
   - Use Prisma Studio for database operations
   - Test changes in browser at `http://localhost:5173`

3. **Code Quality Checks**
   ```bash
   # Before committing, run:
   npm run lint        # Check code style
   npm run test        # Run tests (when available)
   npm run build       # Verify build works
   ```

### Database Development

#### Making Schema Changes
1. Edit `backend/prisma/schema.prisma`
2. Create migration:
   ```bash
   cd backend
   npm run db:migrate
   ```
3. Update Prisma client:
   ```bash
   npm run db:generate
   ```

#### Resetting Database
```bash
# Reset database to clean state
cd backend
rm prisma/data/qb-pharma.db  # Remove existing database
npm run db:generate          # Regenerate client
npm run db:migrate          # Apply migrations
npm run db:seed             # Seed with sample data
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find and kill process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3001 | xargs kill -9
```

#### 2. Node Modules Issues
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 3. Database Connection Issues
```bash
# Check database file exists
ls -la backend/prisma/data/

# Regenerate Prisma client
cd backend
npm run db:generate
```

#### 4. TypeScript Errors
```bash
# Restart TypeScript service in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild project
npm run build
```

### Environment-Specific Issues

#### Windows
- Use Git Bash for command line operations
- Ensure Node.js is in PATH
- Use PowerShell as administrator if needed

#### macOS
- Install Xcode Command Line Tools: `xcode-select --install`
- Use Homebrew for package management
- Check permissions for global npm packages

#### Linux
- Install build essentials: `sudo apt install build-essential`
- Check Node.js installation method
- Verify file permissions in project directory

## Performance Tips

### Development Optimization
1. **Enable Fast Refresh**: Automatically enabled in Vite
2. **Use TypeScript Strict Mode**: Better error catching
3. **Enable Source Maps**: Better debugging experience
4. **Use Development Browser Extensions**:
   - React Developer Tools
   - Redux DevTools (if using Redux)

### System Optimization
1. **Increase Node.js Memory**: `export NODE_OPTIONS="--max-old-space-size=4096"`
2. **SSD Storage**: Use SSD for better I/O performance
3. **Close Unnecessary Applications**: Free up RAM for development
4. **Use Efficient Terminal**: Terminal with good performance (iTerm2, Windows Terminal)

## Next Steps

After successful setup:

1. **Read Architecture Documentation**: [architecture.md](./architecture.md)
2. **Review Code Standards**: [standards.md](./standards.md)
3. **Set Up Testing**: [testing.md](./testing.md)
4. **Understand Contributing Workflow**: [contributing.md](./contributing.md)

## Getting Help

If you encounter issues:

1. **Check Documentation**: Review relevant documentation files
2. **Search Issues**: Check GitHub issues for similar problems
3. **Ask Team**: Reach out to development team
4. **Create Issue**: Document new issues for team resolution

---

Your development environment should now be ready for QB Pharma development!