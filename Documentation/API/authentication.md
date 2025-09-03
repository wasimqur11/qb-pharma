# Authentication API

## Overview

The authentication system uses JWT tokens for secure access to the QB Pharma API.

## Endpoints

### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1y2z3...",
    "username": "admin",
    "email": "admin@qbpharma.com",
    "name": "System Administrator",
    "role": "super_admin",
    "pharmaUnitId": "clx1y2z3...",
    "pharmaUnitName": "QB Pharma Main Unit",
    "permissions": [
      {
        "module": "stakeholders",
        "actions": ["create", "read", "update", "delete"],
        "scope": "all"
      }
    ],
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

### User Profile

**GET** `/api/auth/profile`

Get current user's profile information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "user": {
    "id": "clx1y2z3...",
    "username": "admin",
    "email": "admin@qbpharma.com",
    "name": "System Administrator",
    "role": "super_admin",
    "permissions": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Change Password

**POST** `/api/auth/change-password`

Change current user's password.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### User Registration

**POST** `/api/auth/register`

Register a new user (Admin only).

**Headers:**
```http
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Request:**
```json
{
  "username": "john.doe",
  "email": "john@qbpharma.com",
  "password": "secure_password",
  "name": "John Doe",
  "phone": "+1-555-0199",
  "role": "operator",
  "pharmaUnitId": "clx1y2z3...",
  "linkedStakeholderId": "clx1y2z4...",
  "linkedStakeholderType": "doctor"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx1y2z5...",
    "username": "john.doe",
    "email": "john@qbpharma.com",
    "name": "John Doe",
    "role": "operator",
    "isActive": true
  }
}
```

### Logout

**POST** `/api/auth/logout`

Logout user (client-side token removal).

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | System administrator | Full access to all modules |
| `admin` | Pharmacy administrator | Manage users, stakeholders, transactions |
| `manager` | Department manager | Manage department data, reports |
| `operator` | Data entry operator | Create/edit transactions, basic reports |
| `doctor` | Linked doctor user | View own data, account statements |
| `partner` | Business partner | View own data, settlements |
| `distributor` | Distributor user | View own credit, payment history |

## Permission System

Permissions are module-based with specific actions:

**Modules:**
- `pharma_units` - Pharmacy unit management
- `users` - User management
- `transactions` - Financial transactions
- `stakeholders` - Stakeholders (doctors, partners, etc.)
- `reports` - Data reports and analytics
- `settlements` - Settlement processing
- `dashboard` - Dashboard access
- `system_settings` - System configuration

**Actions:**
- `create` - Create new records
- `read` - View data
- `update` - Modify existing records
- `delete` - Remove records
- `export` - Export data
- `approve` - Approve transactions/settlements

**Scopes:**
- `all` - Access to all data
- `own` - Access to own data only
- `department` - Access to department data
- `unit` - Access to pharmacy unit data
- `none` - No access

## Token Details

- **Algorithm**: HS256
- **Expiry**: 7 days (configurable)
- **Refresh**: No automatic refresh (re-login required)

## Error Codes

| Code | Description |
|------|-------------|
| `401` | Invalid or missing token |
| `403` | Insufficient permissions |
| `409` | Username/email already exists |
| `400` | Validation error |

## Security Considerations

1. Tokens are stateless (no server-side session storage)
2. Passwords are hashed with bcrypt (cost: 12)
3. Rate limiting applies to authentication endpoints
4. Failed login attempts are logged
5. Sensitive data is excluded from responses

## Example Usage

### JavaScript/Frontend
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);
```

### Authenticated Requests
```javascript
const response = await fetch('/api/stakeholders/doctors', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```