import type { 
  Partner, 
  Doctor, 
  BusinessPartner, 
  Employee, 
  Distributor, 
  Transaction, 
  DashboardStats
} from '../types';

// Mock Partners
export const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Ahmed Khan',
    ownershipPercentage: 40,
    email: 'ahmed@qbpharma.com',
    phone: '+92-300-1234567',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Sarah Ali',
    ownershipPercentage: 35,
    email: 'sarah@qbpharma.com',
    phone: '+92-301-1234567',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Dr. Wasim Qureshi',
    ownershipPercentage: 25,
    email: 'wasim@qbpharma.com',
    phone: '+92-302-1234567',
    createdAt: new Date('2024-01-01')
  }
];

// Mock Doctors
export const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Wasim Qureshi',
    consultationFee: 2000,
    commissionRate: 70,
    email: 'wasim@qbpharma.com',
    phone: '+92-302-1234567',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Dr. Fatima Sheikh',
    consultationFee: 1500,
    commissionRate: 65,
    email: 'fatima@qbpharma.com',
    phone: '+92-303-1234567',
    createdAt: new Date('2024-02-01')
  }
];

// Mock Business Partners
export const mockBusinessPartners: BusinessPartner[] = [
  {
    id: '1',
    name: 'Karachi Business Partners',
    commissionRate: 8,
    email: 'karachi@businesspartner.com',
    phone: '+92-304-1234567',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Lahore Medical Partners',
    commissionRate: 10,
    email: 'lahore@medicalpartners.com',
    phone: '+92-305-1234567',
    createdAt: new Date('2024-01-15')
  }
];

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ali Hassan',
    salary: 45000,
    department: 'Pharmacy',
    email: 'ali@qbpharma.com',
    phone: '+92-306-1234567',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Ayesha Khan',
    salary: 40000,
    department: 'Reception',
    email: 'ayesha@qbpharma.com',
    phone: '+92-307-1234567',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Muhammad Usman',
    salary: 35000,
    department: 'Assistant',
    email: 'usman@qbpharma.com',
    phone: '+92-308-1234567',
    createdAt: new Date('2024-02-01')
  }
];

// Mock Distributors
export const mockDistributors: Distributor[] = [
  {
    id: '1',
    name: 'Pharma Solutions Ltd',
    contactPerson: 'Imran Malik',
    email: 'imran@pharmasolutions.com',
    phone: '+92-309-1234567',
    address: 'Industrial Area, Karachi',
    creditBalance: 125000,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'MedSupply Corporation',
    contactPerson: 'Nadia Ahmed',
    email: 'nadia@medsupply.com',
    phone: '+92-310-1234567',
    address: 'Medical Complex, Lahore',
    creditBalance: 89000,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'HealthCare Distributors',
    contactPerson: 'Tariq Shah',
    email: 'tariq@healthcare.com',
    phone: '+92-311-1234567',
    address: 'Business District, Islamabad',
    creditBalance: 67500,
    createdAt: new Date('2024-01-15')
  }
];

// Mock Recent Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    category: 'pharmacy_sale',
    amount: 15000,
    description: 'Daily pharmacy sales',
    date: new Date(),
    createdBy: 'Ali Hassan',
    createdAt: new Date()
  },
  {
    id: '2',
    category: 'consultation_fee',
    stakeholderId: '1',
    stakeholderType: 'doctor',
    amount: 12000,
    description: 'Dr. Wasim - 6 patients consultation',
    date: new Date(),
    createdBy: 'Ayesha Khan',
    createdAt: new Date()
  },
  {
    id: '3',
    category: 'distributor_payment',
    stakeholderId: '1',
    stakeholderType: 'distributor',
    amount: 45000,
    description: 'Payment to Pharma Solutions Ltd',
    date: new Date(Date.now() - 86400000), // Yesterday
    createdBy: 'Ahmed Khan',
    createdAt: new Date(Date.now() - 86400000)
  }
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  todayRevenue: 27000,
  cashPosition: 185000,
  monthlyProfit: 425000,
  doctorPayables: [
    {
      stakeholderId: '1',
      stakeholderType: 'doctor',
      stakeholderName: 'Dr. Wasim Qureshi',
      totalEarned: 156000,
      totalPaid: 125000,
      netPayable: 31000,
      lastUpdated: new Date()
    },
    {
      stakeholderId: '2',
      stakeholderType: 'doctor',
      stakeholderName: 'Dr. Fatima Sheikh',
      totalEarned: 89000,
      totalPaid: 75000,
      netPayable: 14000,
      lastUpdated: new Date()
    }
  ],
  businessPartnerPayables: [
    {
      stakeholderId: '1',
      stakeholderType: 'business_partner',
      stakeholderName: 'Karachi Business Partners',
      totalEarned: 24000,
      totalPaid: 18000,
      netPayable: 6000,
      lastUpdated: new Date()
    },
    {
      stakeholderId: '2',
      stakeholderType: 'business_partner',
      stakeholderName: 'Lahore Medical Partners',
      totalEarned: 35000,
      totalPaid: 25000,
      netPayable: 10000,
      lastUpdated: new Date()
    }
  ],
  employeeSalaryDue: [
    {
      stakeholderId: '1',
      stakeholderType: 'employee',
      stakeholderName: 'Ali Hassan',
      totalEarned: 45000,
      totalPaid: 30000,
      netPayable: 15000,
      lastUpdated: new Date()
    },
    {
      stakeholderId: '2',
      stakeholderType: 'employee',
      stakeholderName: 'Ayesha Khan',
      totalEarned: 40000,
      totalPaid: 25000,
      netPayable: 15000,
      lastUpdated: new Date()
    },
    {
      stakeholderId: '3',
      stakeholderType: 'employee',
      stakeholderName: 'Muhammad Usman',
      totalEarned: 35000,
      totalPaid: 20000,
      netPayable: 15000,
      lastUpdated: new Date()
    }
  ],
  distributorCredits: [
    { id: '1', name: 'Pharma Solutions Ltd', creditBalance: 125000 },
    { id: '2', name: 'MedSupply Corporation', creditBalance: 89000 },
    { id: '3', name: 'HealthCare Distributors', creditBalance: 67500 }
  ]
};