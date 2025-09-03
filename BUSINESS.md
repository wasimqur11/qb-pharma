# QB Pharma - Business Functionality Documentation

## Overview

QB Pharma is a comprehensive pharmaceutical management system designed to manage multi-stakeholder relationships, financial transactions, and equity-based profit distribution. The system handles complex accounting scenarios involving various stakeholder types with different financial arrangements.

## Core Business Model

### Stakeholder Types

1. **Business Partners** - Equity holders with ownership percentages who receive profit distributions
2. **Doctors** - Medical practitioners who receive consultation fees and commissions
3. **Employees** - Staff members with salary arrangements and payment schedules
4. **Distributors** - Supply chain partners with credit arrangements and payment terms
5. **Patients** - End customers with credit limits and payment capabilities

### Multi-Unit Structure

The system supports multiple pharmaceutical units (PharmaUnit), each with:
- Unique licensing and contact information
- Separate stakeholder management
- Independent transaction tracking
- Role-based access control per unit

## Financial & Accounting System

### Transaction Categories

#### Revenue Streams
- **Pharmacy Sales** (`pharmacy_sale`) - Direct pharmaceutical product sales
- **Consultation Fees** (`consultation_fee`) - Medical consultation charges
- **Patient Payments** (`patient_payment`) - Payments received from patients

#### Expense Categories
- **Distributor Payments** (`distributor_payment`) - Payments to suppliers
- **Distributor Credit Purchases** (`distributor_credit_purchase`) - Inventory purchases on credit
- **Distributor Credit Notes** (`distributor_credit_note`) - Credit adjustments
- **Doctor Expenses** (`doctor_expense`) - Medical practitioner related costs
- **Employee Payments** (`employee_payment`) - Staff salary and benefit payments
- **Clinic Expenses** (`clinic_expense`) - Operational costs

#### Profit Distribution
- **Sales Profit Distribution** (`sales_profit_distribution`) - Partner equity distributions
- **Patient Credit Sales** (`patient_credit_sale`) - Credit-based patient transactions

#### Special Categories
- **Settlement Points** (`settlement_point`) - Accounting checkpoints for equity calculations

### Stakeholder Financial Arrangements

#### Business Partners
- **Ownership Percentage**: Defines profit-sharing ratio
- **Equity Tracking**: Maintains running balance of owed vs. received distributions
- **Settlement History**: Complete record of all distributions with equity adjustments

#### Doctors
- **Consultation Fee**: Fixed fee per consultation
- **Commission Rate**: Percentage-based commission on consultations
- **Payable Calculations**: Net consultation fees minus any advances or deductions

#### Employees
- **Salary Structure**: Fixed monthly/bi-weekly/weekly compensation
- **Due Date Tracking**: Automated salary scheduling
- **Payment History**: Track salary payments and outstanding dues

#### Distributors
- **Credit Balance**: Running total of outstanding invoices
- **Payment Schedule**: Automated payment due date calculation
- **Payment Percentage**: Percentage of invoice amount typically paid
- **Credit Terms**: Flexible payment arrangements

#### Patients
- **Credit Limit**: Maximum allowed outstanding balance
- **Current Credit**: Running balance of unpaid services/products
- **Payment History**: Complete transaction and payment record

## Advanced Accounting Features

### Settlement & Equity Management

#### Settlement Process
1. **Cash Position Analysis**: Calculate available cash for distribution
2. **Equity Calculation**: Determine what each partner is owed based on:
   - Current period profits
   - Historical equity imbalances
   - Ownership percentages
3. **Allocation Adjustment**: Allow manual adjustments with equity tracking
4. **Settlement Point Creation**: Create accounting checkpoint
5. **Equity Updates**: Automatically update partner equity records

#### Equity Tracking System
- **Current Equity**: Running balance of owed vs. received amounts
- **Historical Tracking**: Complete settlement history per partner
- **Adjustment Reasons**: Documentation for manual equity adjustments
- **Projected Equity**: Future equity position after pending settlements

### Payment Processing

#### Bulk Payment System
- **Multi-Stakeholder Payments**: Process payments across different stakeholder types
- **Payment Methods**: Support for bank transfers, cash, and checks
- **Batch Processing**: Group payments for efficiency
- **Reference Tracking**: Maintain payment reference numbers

#### Payment Estimation
- **Distributor Payment Estimation**: Calculate upcoming payment obligations
- **Salary Due Tracking**: Monitor employee payment schedules
- **Commission Calculations**: Automated doctor commission computations

### Financial Reporting & Analytics

#### Dashboard Analytics
- **Revenue Tracking**: Real-time revenue monitoring by category
- **Expense Analysis**: Breakdown of operational costs
- **Profit Calculations**: Net profit with margin analysis
- **Stakeholder Performance**: Individual stakeholder revenue/cost analysis

#### Account Statements
- **Business Partner Statements**: Equity history and distribution records
- **Doctor Statements**: Consultation activity and commission tracking
- **Distributor Statements**: Credit balances and payment history
- **Patient Statements**: Service history and payment records

## Role-Based Access Control

### User Roles
- **Super Admin**: Full system access across all units
- **Admin**: Full access within assigned pharmaceutical unit
- **Operator**: Limited operational access for daily transactions
- **Doctor**: Access to own consultation records and statements
- **Partner**: View own equity and distribution history
- **Distributor**: Access to own credit and payment information

### Permission System
- **Module-Based Permissions**: Granular control over system features
- **Action-Level Security**: Read, create, update, delete permissions
- **Scope Restrictions**: Unit-level and stakeholder-level data isolation
- **Conditional Access**: Role-specific data filtering

## Business Workflows

### Daily Operations
1. **Transaction Recording**: Record sales, consultations, and expenses
2. **Stakeholder Management**: Add/update stakeholder information
3. **Payment Processing**: Process routine payments to stakeholders
4. **Account Monitoring**: Track outstanding balances and due dates

### Periodic Settlements
1. **Cash Position Review**: Analyze available funds for distribution
2. **Partner Equity Analysis**: Review partner distribution requirements
3. **Settlement Planning**: Plan distribution amounts and timing
4. **Settlement Execution**: Process distributions and update equity records

### Financial Management
1. **Revenue Analysis**: Monitor income streams and trends
2. **Expense Control**: Track and analyze operational costs
3. **Stakeholder Performance**: Evaluate individual stakeholder contributions
4. **Profit Distribution**: Execute equity-based profit sharing

## Data Management

### Transaction Management
- **Comprehensive Logging**: All financial activities with full audit trail
- **Bulk Import**: CSV-based transaction import for data migration
- **Data Validation**: Strict validation rules for financial data integrity
- **Backup Integration**: Automated database backup during deployments

### Stakeholder Data
- **Complete Profiles**: Detailed stakeholder information and preferences
- **Relationship Tracking**: Link users to stakeholder records
- **Historical Preservation**: Maintain complete stakeholder history
- **Data Export**: Generate stakeholder reports and statements

## Security & Compliance

### Data Protection
- **Access Control**: Role-based permissions with stakeholder isolation
- **Audit Trail**: Complete transaction and modification history
- **Data Validation**: Server-side validation for all financial data
- **Secure Authentication**: JWT-based authentication system

### Financial Controls
- **Transaction Validation**: Comprehensive business rule enforcement
- **Balance Verification**: Automated balance reconciliation
- **Settlement Controls**: Multi-step settlement process with validation
- **Permission Enforcement**: Strict role-based operation restrictions

## Integration Features

### Import/Export Capabilities
- **Bulk Transaction Import**: CSV-based transaction data import
- **Stakeholder Import**: Bulk stakeholder data import
- **Report Generation**: Automated statement and report generation
- **Data Migration**: Support for data migration between systems

### API Architecture
- **RESTful APIs**: Complete REST API for all business operations
- **Authentication**: Token-based API security
- **Role-based API Access**: API permissions based on user roles
- **Error Handling**: Comprehensive error handling and logging

This business functionality documentation provides a comprehensive overview of QB Pharma's sophisticated pharmaceutical management and accounting system, designed to handle complex multi-stakeholder financial relationships with full equity tracking and automated settlement capabilities.