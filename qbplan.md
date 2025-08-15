# QB Pharmacy Account Management App - Development Plan

## Project Overview
Scalable account management app for pharmacy business with multiple doctors, partners, and stakeholders. Replaces current Excel-based workflow with professional web application.

## ✅ CONFIRMED DESIGN THEME: DARK CORPORATE ENTERPRISE
**Final approved design:** Dark corporate dashboard with professional enterprise styling
- **Color Scheme:** Dark gray backgrounds (`bg-gray-900`), charcoal cards (`bg-gray-800`), white text
- **Style:** Clean, minimal, professional - like GitHub Enterprise, Microsoft Azure, Slack Enterprise
- **Layout:** Fixed header with tabs (Dashboard, Analytics, Reports), responsive grid layout
- **Components:** Dark metric cards, professional data tables, dark charts with custom tooltips
- **User Experience:** Corporate-grade interface suitable for Fortune 500 companies

## Business Requirements

### Daily Transaction Recording
1. Sale of Pharmacy
2. Consultation fee of the doctor(s) 
3. Payments to distributors
4. Doctor(s) Expenses
5. Payment to sales partner
6. Payment to employee(s)
7. Clinic expenses

### Real-time Dashboard Requirements
1. Payable amount to doctor(s)
2. Payable amount to sales partner(s) 
3. Current credit balance of Distributor
4. Salary due to employee(s)
5. Account statement of each stakeholder

### Key Stakeholders
- **Business Partners:** Multiple owners with percentage ownership
- **Doctors:** Individual P&L tracking with consultation fees and expenses
- **Distributors:** Credit balance management and payment tracking
- **Sales Partners:** Commission-based payments
- **Employees:** Salary management
- **Patients:** Consultation and pharmacy purchase tracking

## Technology Stack
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL 
- **Frontend:** React + TypeScript + Tailwind CSS
- **State Management:** Zustand
- **Authentication:** JWT tokens
- **Validation:** Zod schemas
- **File Processing:** Multer + SheetJS (for Excel uploads)

## Database Schema

### Core Tables
```sql
-- Business Structure
partners (id, name, ownership_percentage, created_at)
doctors (id, name, consultation_fee, commission_rate, created_at)
sales_partners (id, name, commission_rate, created_at)
employees (id, name, salary, department, created_at)
distributors (id, name, contact_person, phone, email, address, created_at)

-- Transaction Management
transaction_categories (id, name, belongs_to: 'pharmacy'|'doctor'|'shared')
transactions (id, category_id, stakeholder_id, stakeholder_type, amount, description, date, created_by)

-- Stakeholder Balances
doctor_balances (id, doctor_id, consultation_earned, expenses_paid, net_payable, last_updated)
sales_partner_balances (id, partner_id, commission_earned, payments_made, net_payable, last_updated)
employee_balances (id, employee_id, salary_due, advances_paid, net_payable, last_updated)
distributor_credits (id, distributor_id, credit_balance, last_updated, updated_by)

-- Account Statements
account_statements (id, stakeholder_id, stakeholder_type, transaction_date, description, debit, credit, balance)

-- Profit Allocation
profit_allocations (id, transaction_id, partner_id, allocated_amount, allocation_date)
```

## STAGE-1 Development Plan

### Phase 1: Foundation Setup (Week 1)
- [x] Analyze business requirements and data structure
- [x] Design database schema for transactions and entities  
- [x] Plan application architecture and technology stack
- [ ] Create basic project structure and setup
- [ ] Setup development environment with Docker
- [ ] Initialize Git repository and basic CI/CD

### Phase 2: Frontend Prototype with Dummy Data (Week 2-3)
- [ ] Create React app with TypeScript and Tailwind
- [ ] Build main dashboard with dummy data
- [ ] Design transaction entry forms (all 7 types)
- [ ] Create stakeholder management interfaces
- [ ] Implement payables dashboard widgets
- [ ] Build account statement views
- [ ] Create Excel upload interface mockup

### Phase 3: Backend API Development (Week 3-4)  
- [ ] Setup PostgreSQL database and Prisma
- [ ] Implement core models and database setup
- [ ] Create authentication system
- [ ] Build transaction recording API endpoints
- [ ] Implement stakeholder management APIs
- [ ] Create real-time balance calculation logic

### Phase 4: Integration & Core Features (Week 4-5)
- [ ] Connect frontend to backend APIs
- [ ] Implement real-time payables calculations
- [ ] Build distributor credit management system
- [ ] Create Excel bulk upload functionality
- [ ] Implement account statement generation
- [ ] Add form validation and error handling

### Phase 5: Advanced Features (Week 6-7)
- [ ] Build partner profit sharing calculations
- [ ] Create comprehensive reporting system
- [ ] Implement cash flow management
- [ ] Add inventory alerts (basic)
- [ ] Create patient & visit management
- [ ] Build automated calculation engines

### Phase 6: Polish & Deploy (Week 8)
- [ ] Add user management and role-based access
- [ ] Implement audit trails and data backup
- [ ] Create export functionality (PDF/Excel)
- [ ] Setup production deployment
- [ ] User testing and bug fixes
- [ ] Documentation and training materials

## Core Dashboard Widgets

### Financial Overview
1. **Today's Revenue:** Pharmacy sales + consultation fees
2. **Cash Position:** Current bank + cash balances
3. **Monthly P&L:** Quick profit/loss summary

### Payables Dashboard
1. **Doctor Payables:** Outstanding consultation fees minus expenses
2. **Sales Partner Payables:** Pending commission payments
3. **Employee Salary Due:** Pending salary payments
4. **Distributor Credits:** Outstanding balances by distributor

### Quick Actions
- Daily transaction entry
- Make payments to stakeholders
- Upload distributor credits (Excel)
- Generate account statements
- Daily closing summary

## Key Features for STAGE-1

### 1. Transaction Management
- Daily entry interface for all 7 transaction types
- Auto-categorization and stakeholder assignment
- Bulk Excel import capabilities
- Transaction search and filtering

### 2. Stakeholder Management
- Partner, doctor, employee, distributor master data
- Individual account tracking
- Payment processing interfaces
- Account statement generation

### 3. Real-time Calculations
- Automatic payables calculation
- Partner profit allocation
- Balance updates on transaction entry
- Running totals and summaries

### 4. Reporting Suite
- Daily summary reports
- Monthly financial reports  
- Stakeholder payables reports
- Account statements (PDF export)

### 5. Cash Flow Management
- Daily cash register tracking
- Bank account management
- Payment method tracking
- Petty cash management

### 6. User Management
- Role-based access control
- Audit trail for all changes
- Multi-user concurrent access
- Data backup and security

## File Structure
```
qb-pharma/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
├── docs/
└── README.md
```

## Success Metrics
- Complete replacement of Excel-based workflow
- Real-time financial visibility
- Automated profit calculations
- Streamlined stakeholder payments
- Professional account statements
- Scalable multi-user system

## Next Steps
1. Setup project structure
2. Create frontend prototype with dummy data
3. Get stakeholder feedback on UI/UX
4. Build backend APIs
5. Integrate and test core functionality