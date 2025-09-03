# API Documentation

## Overview

The QB Pharma API is a RESTful service built with Express.js and TypeScript, providing comprehensive pharmaceutical management capabilities.

**Base URL**: `http://localhost:3001/api`

## Quick Start

```bash
# Health check
GET /health

# Authentication
POST /api/auth/login
```

## Documentation Files

- [Authentication](./authentication.md) - Login, logout, and token management
- [Users](./users.md) - User management and permissions  
- [Stakeholders](./stakeholders.md) - Doctors, partners, employees, distributors, patients
- [Transactions](./transactions.md) - Financial transactions and records
- [Dashboard](./dashboard.md) - Analytics and summary data
- [Error Handling](./errors.md) - Error codes and responses

## Authentication

All API endpoints (except `/health` and `/api/auth/login`) require authentication using Bearer tokens.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Common Request Headers

```http
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error description",
  "operation": "create",
  "resource": "stakeholders",
  "details": "Additional error information"
}
```

## Pagination

List endpoints support pagination:

```http
GET /api/stakeholders/doctors?page=1&limit=50&search=john
```

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `search` (optional): Search term for filtering

**Response:**
```json
{
  "stakeholders": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

## Rate Limiting

- **Development**: No rate limiting
- **Production**: 1000 requests per 15 minutes per IP

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Postman Collection

```bash
# Import the Postman collection (to be created)
# File: QB_Pharma_API.postman_collection.json
```

## Testing

```bash
# Run API tests
npm run test

# Test specific endpoints
npm run test:api
```

---

*For detailed endpoint documentation, see the specific documentation files in this folder.*