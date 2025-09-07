# Transaction Types Reference

## Overview

QB Pharma operates with 12 distinct transaction types that cover all pharmaceutical business operations. Each transaction type has specific stakeholder requirements, cash flow impacts, and business purposes.

## Transaction Categories

### 💰 Revenue Transactions (Cash Inflow)

#### 1. Pharmacy Sale (`pharmacy_sale`)
- **Purpose**: Daily medicine sales revenue
- **Stakeholder**: None required
- **Cash Flow**: **+Revenue** (increases cash position)
- **Business Logic**: Core pharmacy income from medicine sales
- **Accounting**: Credit transaction
- **Example**: Daily medicine sales of ₹5,000

#### 2. Consultation Fee (`consultation_fee`) 
- **Purpose**: Doctor consultation fees from patients
- **Stakeholder**: **Doctor (required)**
- **Cash Flow**: **+Revenue** (increases cash position)
- **Business Logic**: Doctor generates consultation income for clinic
- **Accounting**: Credit transaction 
- **Profit Sharing**: May be subject to doctor commission calculations
- **Example**: Dr. Smith consultation fees ₹1,500

#### 3. Patient Payment (`patient_payment`)
- **Purpose**: Credit payments received from patients
- **Stakeholder**: **Patient (required)**
- **Cash Flow**: **+Revenue** (recovers previously issued credit)
- **Business Logic**: Patients paying off their credit balances
- **Accounting**: Credit transaction
- **Impact**: Reduces patient credit balance, increases cash
- **Example**: Patient John pays ₹800 towards credit balance

#### 4. Distributor Credit Note (`distributor_credit_note`)
- **Purpose**: Returns of expired/damaged items to distributor
- **Stakeholder**: **Distributor (required)**
- **Cash Flow**: **+Credit Reduction** (reduces distributor debt)
- **Business Logic**: Returns reduce money owed to distributor
- **Accounting**: Credit transaction
- **Impact**: Reduces distributor credit balance
- **Example**: Returned expired medicines worth ₹2,000 to ABC Distributors

---

### 💸 Expense Transactions (Cash Outflow)

#### 5. Distributor Payment (`distributor_payment`)
- **Purpose**: Payments made to medicine suppliers
- **Stakeholder**: **Distributor (required)** 
- **Cash Flow**: **-Expense** (decreases cash position)
- **Business Logic**: Paying suppliers for medicine inventory
- **Accounting**: Debit transaction
- **Impact**: Reduces cash and distributor credit balance
- **Example**: Payment ₹15,000 to XYZ Pharmaceuticals

#### 6. Doctor Expense (`doctor_expense`)
- **Purpose**: Doctor-related costs and expenses
- **Stakeholder**: **Doctor (required)**
- **Cash Flow**: **-Expense** (decreases cash position)
- **Business Logic**: Costs associated with doctor services
- **Accounting**: Debit transaction
- **Example**: Dr. Smith equipment allowance ₹3,000

#### 7. Employee Payment (`employee_payment`)
- **Purpose**: Staff salary and bonus payments
- **Stakeholder**: **Employee (required)**
- **Cash Flow**: **-Expense** (decreases cash position)
- **Business Logic**: Staff compensation
- **Accounting**: Debit transaction
- **Example**: Monthly salary ₹25,000 to staff member

#### 8. Clinic Expense (`clinic_expense`)
- **Purpose**: General operational expenses
- **Stakeholder**: None required
- **Cash Flow**: **-Expense** (decreases cash position)
- **Business Logic**: Utilities, rent, supplies, equipment
- **Accounting**: Debit transaction
- **Example**: Electricity bill ₹4,500

#### 9. Patient Credit Sale (`patient_credit_sale`)
- **Purpose**: Medicine sales on credit to patients
- **Stakeholder**: **Patient (required)**
- **Cash Flow**: **-Credit Issued** (decreases immediate cash)
- **Business Logic**: Giving medicines on credit creates receivable
- **Accounting**: Debit transaction
- **Impact**: Increases patient credit balance, reduces immediate cash
- **Example**: ₹1,200 medicines given on credit to Patient Sarah

---

### 🤝 Distribution Transactions

#### 10. Sales Profit Distribution (`sales_profit_distribution`)
- **Purpose**: Profit sharing with business partners
- **Stakeholder**: **Business Partner (required)**
- **Cash Flow**: **-Distribution** (decreases cash position)
- **Business Logic**: Partners receive share of pharmacy profits based on equity
- **Accounting**: Debit transaction  
- **Settlement**: Generated during settlement process
- **Example**: Partner equity distribution ₹8,000 to Partner A

---

### 📋 Credit Management Transactions

#### 11. Distributor Credit Purchase (`distributor_credit_purchase`)
- **Purpose**: Taking medicine inventory on credit
- **Stakeholder**: **Distributor (required)**
- **Cash Flow**: **+Credit Received** (no immediate cash impact)
- **Business Logic**: Increases inventory without immediate payment
- **Accounting**: Neutral (creates liability)
- **Impact**: Increases distributor credit balance
- **Special**: Requires Bill Number for tracking
- **Example**: ₹20,000 medicines taken on credit from supplier (Bill #12345)

---

### 🏁 System Transactions

#### 12. Settlement Point (`settlement_point`)
- **Purpose**: Marks fresh business cycle start
- **Stakeholder**: None required
- **Cash Flow**: **Neutral** (₹0 amount)
- **Business Logic**: Indicates all dues cleared, cash was zero
- **Accounting**: System marker
- **Usage**: Generated by settlement system
- **Impact**: Resets profit calculations and creates new baseline
- **Example**: "Settlement Point - 15/12/2024 - Total Distributed: ₹45,000"

---

## Business Rules & Classifications

### Cash Flow Impact Matrix

| Category | Type | Immediate Cash Impact | Credit Balance Impact |
|----------|------|----------------------|---------------------|
| `pharmacy_sale` | Revenue | ✅ **Increases Cash** | - |
| `consultation_fee` | Revenue | ✅ **Increases Cash** | - |
| `patient_payment` | Revenue | ✅ **Increases Cash** | ⬇️ **Reduces Patient Credit** |
| `distributor_credit_note` | Credit Reduction | ✅ **Increases Cash** | ⬇️ **Reduces Distributor Credit** |
| `distributor_payment` | Expense | ❌ **Decreases Cash** | ⬇️ **Reduces Distributor Credit** |
| `doctor_expense` | Expense | ❌ **Decreases Cash** | - |
| `employee_payment` | Expense | ❌ **Decreases Cash** | - |
| `clinic_expense` | Expense | ❌ **Decreases Cash** | - |
| `patient_credit_sale` | Credit Issued | ❌ **Decreases Cash** | ⬆️ **Increases Patient Credit** |
| `sales_profit_distribution` | Distribution | ❌ **Decreases Cash** | - |
| `distributor_credit_purchase` | Credit Received | ➡️ **No Immediate Impact** | ⬆️ **Increases Distributor Credit** |
| `settlement_point` | System Marker | ➡️ **No Impact** | - |

### Revenue Classification

**Pharmacy Revenue**: `pharmacy_sale`, `patient_payment`, `distributor_credit_note`
**Doctor Revenue**: `consultation_fee`  
**Total Revenue**: All pharmacy + doctor revenue

### Expense Classification

**Pharmacy Operational Expenses**: `distributor_payment`, `patient_credit_sale`
**Pharmacy Total Expenses**: Operational + `employee_payment`, `clinic_expense`, `sales_profit_distribution`
**Doctor Expenses**: `doctor_expense`

### Special Business Logic

#### Profit Distribution Eligibility
- Only **pharmacy profits** (revenue minus operational expenses) are distributed to partners
- Doctor revenue/expenses are separate and not subject to profit sharing
- Settlement system calculates partner equity based on pharmacy performance only

#### Credit Management Rules
- **Patient Credits**: Track medicine given on credit, payments reduce balance
- **Distributor Credits**: Track money owed for inventory, payments/returns reduce balance
- **Daily Limits**: Some transaction types limited to one entry per day for data integrity

#### Settlement Process
- **Settlement Points** mark when cash position was zero and all dues were cleared
- Profit calculations always start from the most recent Settlement Point
- Partners receive distributions based on pharmacy profits since last settlement
- Settlement creates new baseline for future profit calculations

---

## File References

**Frontend Constants**: `/frontend/src/constants/transactionTypes.ts`
**Type Definitions**: `/frontend/src/types.ts`
**Business Logic**: Various context files in `/frontend/src/contexts/`

---

*This documentation reflects the business domain as implemented in QB Pharma v5.0*