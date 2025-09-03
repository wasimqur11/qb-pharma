# Stakeholders API

## Overview

The Stakeholders API manages different types of stakeholders in the pharmaceutical system: doctors, business partners, employees, distributors, and patients.

## Base URL
`/api/stakeholders`

## Stakeholder Types

- `doctors` - Medical practitioners
- `business-partners` - Business partners with ownership percentage
- `employees` - Staff members with salary information
- `distributors` - Suppliers with credit/payment tracking
- `patients` - Customers with credit limits

## Endpoints

### List Stakeholders

**GET** `/api/stakeholders/{type}`

Get paginated list of stakeholders by type.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `search` (optional): Search term (name, email, phone)

**Example:**
```http
GET /api/stakeholders/doctors?page=1&limit=20&search=ahmed
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "stakeholders": [
    {
      "id": "clx1y2z3...",
      "name": "Dr. Ahmed Hassan",
      "consultationFee": 50.00,
      "commissionRate": 15.0,
      "email": "dr.ahmed@qbpharma.com",
      "phone": "+1-555-0124",
      "pharmaUnitId": "clx1y2z1...",
      "pharmaUnitName": "QB Pharma Main Unit",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Stakeholder

**GET** `/api/stakeholders/{type}/{id}`

Get specific stakeholder by ID and type.

**Example:**
```http
GET /api/stakeholders/doctors/clx1y2z3...
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "stakeholder": {
    "id": "clx1y2z3...",
    "name": "Dr. Ahmed Hassan",
    "consultationFee": 50.00,
    "commissionRate": 15.0,
    "email": "dr.ahmed@qbpharma.com",
    "phone": "+1-555-0124",
    "pharmaUnitId": "clx1y2z1...",
    "pharmaUnitName": "QB Pharma Main Unit",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create Stakeholder

**POST** `/api/stakeholders/{type}`

Create a new stakeholder.

**Permissions Required:** `stakeholders:create`

#### Doctor Creation
```json
{
  "name": "Dr. Sarah Smith",
  "consultationFee": 75.00,
  "commissionRate": 12.0,
  "email": "dr.sarah@qbpharma.com",
  "phone": "+1-555-0199",
  "pharmaUnitId": "clx1y2z1..."
}
```

#### Business Partner Creation
```json
{
  "name": "John Wilson",
  "ownershipPercentage": 25.0,
  "email": "john@qbpharma.com",
  "phone": "+1-555-0198",
  "pharmaUnitId": "clx1y2z1..."
}
```

#### Employee Creation
```json
{
  "name": "Mary Johnson",
  "salary": 3500.00,
  "department": "Pharmacy",
  "email": "mary@qbpharma.com",
  "phone": "+1-555-0197",
  "salaryDueDate": "2024-02-28",
  "lastPaidDate": "2024-01-31",
  "salaryFrequency": "monthly",
  "pharmaUnitId": "clx1y2z1..."
}
```

#### Distributor Creation
```json
{
  "name": "PharmSupply Co.",
  "contactPerson": "Robert Brown",
  "email": "orders@pharmsupply.com",
  "phone": "+1-555-0196",
  "address": "123 Supply Street, City, State 12345",
  "creditBalance": 0.00,
  "paymentSchedule": "monthly",
  "paymentPercentage": 80.0,
  "nextPaymentDue": "2024-02-15",
  "pharmaUnitId": "clx1y2z1..."
}
```

#### Patient Creation
```json
{
  "name": "Alice Cooper",
  "email": "alice@email.com",
  "phone": "+1-555-0195",
  "address": "456 Patient Avenue, City, State 12345",
  "dateOfBirth": "1985-05-15",
  "emergencyContact": "Bob Cooper",
  "emergencyPhone": "+1-555-0194",
  "creditLimit": 1000.00,
  "currentCredit": 0.00,
  "notes": "Regular customer",
  "isActive": true,
  "pharmaUnitId": "clx1y2z1..."
}
```

**Response:**
```json
{
  "message": "Doctor created successfully",
  "stakeholder": {
    "id": "clx1y2z9...",
    "name": "Dr. Sarah Smith",
    "consultationFee": 75.00,
    "commissionRate": 12.0,
    "email": "dr.sarah@qbpharma.com",
    "phone": "+1-555-0199",
    "pharmaUnitName": "QB Pharma Main Unit",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Stakeholder

**PUT** `/api/stakeholders/{type}/{id}`

Update existing stakeholder. All fields are optional (partial update).

**Permissions Required:** `stakeholders:update`

**Example:**
```json
{
  "consultationFee": 80.00,
  "email": "newemail@qbpharma.com"
}
```

**Response:**
```json
{
  "message": "Doctor updated successfully",
  "stakeholder": {
    "id": "clx1y2z3...",
    "name": "Dr. Ahmed Hassan",
    "consultationFee": 80.00,
    "commissionRate": 15.0,
    "email": "newemail@qbpharma.com",
    "phone": "+1-555-0124",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Delete Stakeholder

**DELETE** `/api/stakeholders/{type}/{id}`

Delete stakeholder if no transaction history exists.

**Permissions Required:** `stakeholders:delete`

**Response (Success):**
```json
{
  "message": "Doctor deleted successfully",
  "deleted": true,
  "deactivated": false
}
```

**Response (Has Transactions):**
```json
{
  "error": "Cannot delete stakeholder with transaction history",
  "transactionCount": 25
}
```

**Response (Patient with Transactions - Deactivated):**
```json
{
  "message": "Patient deactivated successfully (has transaction history)",
  "deleted": false,
  "deactivated": true
}
```

## Validation Rules

### Common Fields
- `name`: Required, minimum 1 character
- `email`: Required, valid email format
- `phone`: Required, minimum 1 character

### Doctor-Specific
- `consultationFee`: Required, positive number
- `commissionRate`: Required, 0-100

### Business Partner-Specific
- `ownershipPercentage`: Required, 0-100

### Employee-Specific
- `salary`: Required, positive number
- `department`: Required, minimum 1 character
- `salaryDueDate`: Required, YYYY-MM-DD format
- `salaryFrequency`: Enum: 'monthly', 'bi_weekly', 'weekly'

### Distributor-Specific
- `contactPerson`: Required, minimum 1 character
- `address`: Required, minimum 1 character
- `paymentSchedule`: Enum: 'weekly', 'bi_weekly', 'monthly'
- `paymentPercentage`: Required, 0-100
- `nextPaymentDue`: Required, YYYY-MM-DD format

### Patient-Specific
- `creditLimit`: Default 0
- `currentCredit`: Default 0
- `isActive`: Default true

## Access Control

### Role-Based Access
- **Super Admin**: Full access to all stakeholders
- **Admin/Manager**: Access to stakeholders in their pharmacy unit
- **Operator**: Create/update stakeholders, limited delete
- **Doctor/Partner/Distributor**: Read-only access to own data

### Multi-Unit Support
- Users with `pharmaUnitId` can only access stakeholders from their unit
- Super admins can access stakeholders from all units
- Cross-unit access is denied with 403 Forbidden

## Error Responses

### Validation Error
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "consultationFee",
      "message": "Consultation fee must be positive",
      "code": "too_small"
    }
  ]
}
```

### Access Denied
```json
{
  "error": "Access denied to stakeholders from other pharma units"
}
```

### Not Found
```json
{
  "error": "Stakeholder not found"
}
```

## Example Usage Scenarios

### Healthcare Management
```javascript
// Create a new doctor
const doctor = await createStakeholder('doctors', {
  name: 'Dr. New Doctor',
  consultationFee: 60.00,
  commissionRate: 10.0,
  email: 'newdoc@clinic.com',
  phone: '+1-555-0123'
});

// Search for patients
const patients = await getStakeholders('patients', {
  search: 'john',
  page: 1,
  limit: 25
});
```

### Business Operations
```javascript
// Update distributor credit terms
await updateStakeholder('distributors', distributorId, {
  paymentPercentage: 90.0,
  nextPaymentDue: '2024-03-01'
});

// Deactivate patient
await updateStakeholder('patients', patientId, {
  isActive: false
});
```