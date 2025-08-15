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
  cashPosition: 0,
  monthlyProfit: 0,
  doctorPayables: [],
  businessPartnerPayables: [],
  employeeSalaryDue: [],
  distributorCredits: []
};