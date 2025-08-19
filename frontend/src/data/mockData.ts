import type { 
  Partner, 
  Doctor, 
  BusinessPartner, 
  Employee, 
  Distributor, 
  Transaction, 
  DashboardStats
} from '../types';

// Empty arrays for fresh pharmacy setup
export const mockPartners: Partner[] = [];

export const mockDoctors: Doctor[] = [];

export const mockBusinessPartners: BusinessPartner[] = [];

export const mockEmployees: Employee[] = [];

export const mockDistributors: Distributor[] = [];

export const mockTransactions: Transaction[] = [];

// Empty dashboard stats for new pharmacy
export const mockDashboardStats: DashboardStats = {
  todayRevenue: 0,
  totalExpenses: 0,
  cashPosition: 0,
  monthlyProfit: 0,
  pharmacyRevenue: 0,
  todayPharmacyRevenue: 0,
  pharmacyExpenses: 0,
  pharmacyCashPosition: 0,
  pharmacyMonthlyProfit: 0,
  doctorRevenue: 0,
  todayDoctorRevenue: 0,
  doctorExpenses: 0,
  doctorCashPosition: 0,
  doctorPayables: [],
  businessPartnerPayables: [],
  employeeSalaryDue: [],
  distributorCredits: []
};