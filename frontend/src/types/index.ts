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
  commissionRate: number;
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
  createdAt: Date;
}

export interface Distributor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  creditBalance: number;
  createdAt: Date;
}

// Transaction Types
export type TransactionCategory = 
  | 'pharmacy_sale' 
  | 'consultation_fee' 
  | 'distributor_payment' 
  | 'doctor_expense' 
  | 'business_partner_payment' 
  | 'employee_payment' 
  | 'clinic_expense'
  | 'partner_profit';

export type StakeholderType = 'doctor' | 'business_partner' | 'employee' | 'distributor';

export interface Transaction {
  id: string;
  category: TransactionCategory;
  stakeholderId?: string;
  stakeholderType?: StakeholderType;
  amount: number;
  description: string;
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
  todayRevenue: number;
  cashPosition: number;
  monthlyProfit: number;
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
}

export interface AccountStatement {
  stakeholderId: string;
  stakeholderName: string;
  stakeholderType: StakeholderType;
  entries: AccountStatementEntry[];
  currentBalance: number;
}