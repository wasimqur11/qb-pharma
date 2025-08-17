import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import type { TransactionCategory, StakeholderType } from '../types';

export interface TransactionTypeConfig {
  id: TransactionCategory;
  label: string;
  icon: any;
  color: string;
  requiresStakeholder: boolean;
  stakeholderType?: StakeholderType;
  description: string;
}

export const TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    id: 'pharmacy_sale',
    label: 'Pharmacy Sale',
    icon: CurrencyDollarIcon,
    color: 'text-green-400',
    requiresStakeholder: false,
    description: 'Daily pharmacy revenue from medicine sales'
  },
  {
    id: 'consultation_fee',
    label: 'Consultation Fee',
    icon: UserGroupIcon,
    color: 'text-blue-400',
    requiresStakeholder: true,
    stakeholderType: 'doctor',
    description: 'Doctor consultation fees from patients'
  },
  {
    id: 'distributor_payment',
    label: 'Distributor Payment',
    icon: TruckIcon,
    color: 'text-orange-400',
    requiresStakeholder: true,
    stakeholderType: 'distributor',
    description: 'Payments made to medicine distributors'
  },
  {
    id: 'distributor_credit_purchase',
    label: 'Distributor Credit Purchase',
    icon: TruckIcon,
    color: 'text-amber-400',
    requiresStakeholder: true,
    stakeholderType: 'distributor',
    description: 'Taking medicines on credit from distributors'
  },
  {
    id: 'distributor_credit_note',
    label: 'Distributor Credit Note',
    icon: TruckIcon,
    color: 'text-indigo-400',
    requiresStakeholder: true,
    stakeholderType: 'distributor',
    description: 'Returning expired/unwanted items to distributor (reduces credit balance)'
  },
  {
    id: 'doctor_expense',
    label: 'Doctor Expense',
    icon: UserGroupIcon,
    color: 'text-red-400',
    requiresStakeholder: true,
    stakeholderType: 'doctor',
    description: 'Doctor-related expenses and costs'
  },
  {
    id: 'sales_profit_distribution',
    label: 'Sales Profit Distribution',
    icon: UsersIcon,
    color: 'text-purple-400',
    requiresStakeholder: true,
    stakeholderType: 'business_partner',
    description: 'Profit distribution to business partners from pharmacy sales'
  },
  {
    id: 'employee_payment',
    label: 'Employee Payment',
    icon: UsersIcon,
    color: 'text-cyan-400',
    requiresStakeholder: true,
    stakeholderType: 'employee',
    description: 'Salary and bonus payments to employees'
  },
  {
    id: 'clinic_expense',
    label: 'Clinic Expense',
    icon: BuildingOfficeIcon,
    color: 'text-yellow-400',
    requiresStakeholder: false,
    description: 'General clinic operational expenses'
  },
  {
    id: 'patient_credit_sale',
    label: 'Patient Credit Sale',
    icon: CreditCardIcon,
    color: 'text-pink-400',
    requiresStakeholder: true,
    stakeholderType: 'patient',
    description: 'Medicine sales on credit to patients'
  },
  {
    id: 'patient_payment',
    label: 'Patient Payment',
    icon: CreditCardIcon,
    color: 'text-green-400',
    requiresStakeholder: true,
    stakeholderType: 'patient',
    description: 'Credit payments received from patients'
  }
];

// Helper function to get transaction type config by id
export const getTransactionTypeConfig = (id: TransactionCategory): TransactionTypeConfig | undefined => {
  return TRANSACTION_TYPES.find(type => type.id === id);
};

// Helper function to get transaction type label
export const getTransactionTypeLabel = (id: TransactionCategory): string => {
  const config = getTransactionTypeConfig(id);
  return config?.label || id;
};

// Helper function to get transaction type color
export const getTransactionTypeColor = (id: TransactionCategory): string => {
  const config = getTransactionTypeConfig(id);
  return config?.color || 'text-gray-400';
};