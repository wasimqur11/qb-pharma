// Core Business Types
export interface Partner {
  id: string;
  name: string;
  ownershipPercentage: number;
  email: string;
  phone: string;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  consultationFee: number;
  commissionRate: number;
  email: string;
  phone: string;
  createdAt: Date;
}

export interface BusinessPartner {
  id: string;
  name: string;
  ownershipPercentage: number;
  email: string;
  phone: string;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  salary: number;
  department: string;
  email: string;
  phone: string;
  // Salary tracking fields
  salaryDueDate: string; // Next salary due date (YYYY-MM-DD)
  lastPaidDate?: string; // When salary was last paid (YYYY-MM-DD)
  salaryFrequency: 'monthly' | 'bi-weekly' | 'weekly'; // Default: monthly
  createdAt: Date;
}

export interface Distributor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  creditBalance: number; // Money we owe them (internal tracking)
  initialBalanceDate?: string;
  // Payment schedule tracking
  paymentSchedule: 'weekly' | 'bi-weekly' | 'monthly';
  paymentPercentage: number; // % of credit balance to pay each cycle (e.g., 10%)
  nextPaymentDue: string; // Next payment due date (YYYY-MM-DD)
  lastPaymentDate?: string; // When we last paid them
  createdAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  creditLimit: number;
  currentCredit: number;
  lastVisit?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types
export type TransactionCategory = 
  | 'pharmacy_sale' 
  | 'consultation_fee' 
  | 'distributor_payment' 
  | 'distributor_credit_purchase' // Taking items on credit (increases their credit balance)
  | 'distributor_credit_note' // Returning items to distributor (decreases their credit balance)
  | 'doctor_expense' 
  | 'sales_profit_distribution'
  | 'employee_payment' 
  | 'clinic_expense'
  | 'patient_credit_sale'
  | 'patient_payment'
  | 'settlement_point'; // Mark point where cash was zero and all dues cleared

export type StakeholderType = 'doctor' | 'business_partner' | 'employee' | 'distributor' | 'patient';

export interface Transaction {
  id: string;
  category: TransactionCategory;
  stakeholderId?: string;
  stakeholderType?: StakeholderType;
  amount: number;
  description: string;
  billNo?: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

// Balance Types
export interface PayableBalance {
  stakeholderId: string;
  stakeholderType: StakeholderType;
  stakeholderName: string;
  totalEarned: number;
  totalPaid: number;
  netPayable: number;
  lastUpdated: Date;
}

// Dashboard Types
export interface DashboardStats {
  // Combined metrics (all businesses)
  todayRevenue: number;
  totalExpenses: number;
  cashPosition: number;
  monthlyProfit: number;
  
  // Pharmacy-specific metrics (pharmacy business only)
  pharmacyRevenue: number;
  todayPharmacyRevenue: number;
  pharmacyExpenses: number;
  pharmacyCashPosition: number;
  pharmacyMonthlyProfit: number;
  
  // Doctor-specific metrics (doctor accounts only)
  doctorRevenue: number;
  todayDoctorRevenue: number;
  doctorExpenses: number;
  doctorCashPosition: number;
  
  // Payables
  doctorPayables: PayableBalance[];
  businessPartnerPayables: PayableBalance[];
  employeeSalaryDue: PayableBalance[];
  distributorCredits: { id: string; name: string; creditBalance: number }[];
}

// Account Statement
export interface AccountStatementEntry {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: TransactionCategory;
}

export interface AccountStatement {
  stakeholderId: string;
  stakeholderName: string;
  stakeholderType: StakeholderType;
  entries: AccountStatementEntry[];
  currentBalance: number;
}

// Configuration Management Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfiguration {
  departments: Department[];
  // Future: stakeholderTypes, transactionCategories, etc.
}

export interface ConfigurationState {
  departments: Department[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

// Authentication Types
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}