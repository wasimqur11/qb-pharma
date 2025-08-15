import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Doctor, BusinessPartner, Employee, Distributor, Patient } from '../types';

interface StakeholderContextType {
  // Data
  doctors: Doctor[];
  businessPartners: BusinessPartner[];
  employees: Employee[];
  distributors: Distributor[];
  patients: Patient[];
  
  // Doctor operations
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  
  // Business Partner operations
  addBusinessPartner: (partner: Omit<BusinessPartner, 'id' | 'createdAt'>) => void;
  updateBusinessPartner: (id: string, updates: Partial<BusinessPartner>) => void;
  deleteBusinessPartner: (id: string) => void;
  
  // Employee operations
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  updateEmployeeSalaryDueDate: (employeeId: string) => void;
  
  // Distributor operations
  addDistributor: (distributor: Omit<Distributor, 'id' | 'createdAt'>) => void;
  updateDistributor: (id: string, updates: Partial<Distributor>) => void;
  deleteDistributor: (id: string) => void;
  
  // Patient operations
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'currentCredit'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  togglePatientStatus: (id: string) => void;
  
  // Utility functions
  getDoctorById: (id: string) => Doctor | undefined;
  getBusinessPartnerById: (id: string) => BusinessPartner | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getDistributorById: (id: string) => Distributor | undefined;
  getPatientById: (id: string) => Patient | undefined;
  
  // Stats
  getTotalStakeholders: () => number;
  getActivePatients: () => Patient[];
}

const StakeholderContext = createContext<StakeholderContextType | undefined>(undefined);

export const useStakeholders = () => {
  const context = useContext(StakeholderContext);
  if (context === undefined) {
    throw new Error('useStakeholders must be used within a StakeholderProvider');
  }
  return context;
};

interface StakeholderProviderProps {
  children: ReactNode;
}

export const StakeholderProvider: React.FC<StakeholderProviderProps> = ({ children }) => {
  // Initialize with dummy data for testing
  const initializeDummyData = () => {
    const now = new Date();
    
    // 1 Doctor
    const dummyDoctors: Doctor[] = [
      {
        id: 'doc-001',
        name: 'Dr. Ahmed Hassan',
        consultationFee: 2000,
        commissionRate: 10,
        email: 'ahmed.hassan@qbpharma.com',
        phone: '+91 98765 43210',
        createdAt: now
      }
    ];
    
    // 4 Business Partners (25% each)
    const dummyBusinessPartners: BusinessPartner[] = [
      {
        id: 'bp-001',
        name: 'Wasim Qureshi',
        ownershipPercentage: 25,
        email: 'wasim.qureshi@qbpharma.com',
        phone: '+91 98765 43211',
        createdAt: now
      },
      {
        id: 'bp-002',
        name: 'Sarah Khan',
        ownershipPercentage: 25,
        email: 'sarah.khan@qbpharma.com',
        phone: '+91 98765 43212',
        createdAt: now
      },
      {
        id: 'bp-003',
        name: 'Ali Ahmed',
        ownershipPercentage: 25,
        email: 'ali.ahmed@qbpharma.com',
        phone: '+91 98765 43213',
        createdAt: now
      },
      {
        id: 'bp-004',
        name: 'Fatima Sheikh',
        ownershipPercentage: 25,
        email: 'fatima.sheikh@qbpharma.com',
        phone: '+91 98765 43214',
        createdAt: now
      }
    ];
    
    // 3 Distributors with specified balances and payment schedules
    const dummyDistributors: Distributor[] = [
      {
        id: 'dist-001',
        name: 'Karachi Medical Supplies',
        contactPerson: 'Muhammad Tariq',
        email: 'tariq@karachimedical.com',
        phone: '+92 21 1234 5678',
        address: 'Block 5, Gulshan-e-Iqbal, Karachi',
        creditBalance: 50000,
        initialBalanceDate: '2024-01-01',
        paymentSchedule: 'weekly',
        paymentPercentage: 10,
        nextPaymentDue: '2024-08-22', // Next Friday
        lastPaymentDate: '2024-08-15', // Last Friday
        createdAt: now
      },
      {
        id: 'dist-002',
        name: 'Lahore Pharma Distribution',
        contactPerson: 'Aisha Malik',
        email: 'aisha@lahorepharma.com',
        phone: '+92 42 9876 5432',
        address: 'DHA Phase 3, Lahore',
        creditBalance: 60000,
        initialBalanceDate: '2024-01-01',
        paymentSchedule: 'weekly',
        paymentPercentage: 12,
        nextPaymentDue: '2024-08-23', // Next Friday
        lastPaymentDate: '2024-08-16', // Last Friday
        createdAt: now
      },
      {
        id: 'dist-003',
        name: 'Islamabad Medicine Hub',
        contactPerson: 'Hassan Ali',
        email: 'hassan@islamabadmed.com',
        phone: '+92 51 5555 1234',
        address: 'F-7 Markaz, Islamabad',
        creditBalance: 70000,
        initialBalanceDate: '2024-01-01',
        paymentSchedule: 'bi-weekly',
        paymentPercentage: 15,
        nextPaymentDue: '2024-08-29', // Bi-weekly
        lastPaymentDate: '2024-08-15', // Two weeks ago
        createdAt: now
      }
    ];
    
    // 1 Employee
    const dummyEmployees: Employee[] = [
      {
        id: 'emp-001',
        name: 'Zainab Hussain',
        salary: 8000,
        department: 'Operations',
        email: 'zainab.hussain@qbpharma.com',
        phone: '+91 98765 43215',
        salaryDueDate: '2024-09-01', // Next month due
        lastPaidDate: '2024-08-01', // Last paid 
        salaryFrequency: 'monthly',
        createdAt: now
      }
    ];
    
    // Sample Patients
    const dummyPatients: Patient[] = [
      {
        id: 'pat-001',
        name: 'Omar Sheikh',
        email: 'omar.sheikh@email.com',
        phone: '+91 98765 43216',
        address: 'Block A, Defence Phase 2',
        dateOfBirth: '1985-06-15',
        emergencyContact: 'Ayesha Sheikh',
        emergencyPhone: '+91 98765 43217',
        creditLimit: 5000,
        currentCredit: 0,
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        notes: 'Regular customer, diabetic patient',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pat-002',
        name: 'Mariam Ali',
        email: 'mariam.ali@email.com',
        phone: '+91 98765 43218',
        address: 'Gulberg III, Lahore',
        dateOfBirth: '1990-03-22',
        emergencyContact: 'Ahmed Ali',
        emergencyPhone: '+91 98765 43219',
        creditLimit: 3000,
        currentCredit: 1200,
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        notes: 'Pregnant, requires prenatal vitamins',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'pat-003',
        name: 'Khalid Rahman',
        phone: '+91 98765 43220',
        creditLimit: 2000,
        currentCredit: 0,
        lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        notes: 'Elderly patient, hypertension medication',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];
    
    return {
      doctors: dummyDoctors,
      businessPartners: dummyBusinessPartners,
      distributors: dummyDistributors,
      employees: dummyEmployees,
      patients: dummyPatients
    };
  };
  
  const dummyData = initializeDummyData();
  
  const [doctors, setDoctors] = useState<Doctor[]>(dummyData.doctors);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>(dummyData.businessPartners);
  const [employees, setEmployees] = useState<Employee[]>(dummyData.employees);
  const [distributors, setDistributors] = useState<Distributor[]>(dummyData.distributors);
  const [patients, setPatients] = useState<Patient[]>(dummyData.patients);

  // Doctor operations
  const addDoctor = (doctorData: Omit<Doctor, 'id' | 'createdAt'>) => {
    const newDoctor: Doctor = {
      ...doctorData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setDoctors(prev => [...prev, newDoctor]);
  };

  const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    setDoctors(prev => prev.map(doctor => 
      doctor.id === id ? { ...doctor, ...updates } : doctor
    ));
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(doctor => doctor.id !== id));
  };

  // Business Partner operations
  const addBusinessPartner = (partnerData: Omit<BusinessPartner, 'id' | 'createdAt'>) => {
    const newPartner: BusinessPartner = {
      ...partnerData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setBusinessPartners(prev => [...prev, newPartner]);
  };

  const updateBusinessPartner = (id: string, updates: Partial<BusinessPartner>) => {
    setBusinessPartners(prev => prev.map(partner => 
      partner.id === id ? { ...partner, ...updates } : partner
    ));
  };

  const deleteBusinessPartner = (id: string) => {
    setBusinessPartners(prev => prev.filter(partner => partner.id !== id));
  };

  // Employee operations
  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === id ? { ...employee, ...updates } : employee
    ));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
  };

  // Helper function to update salary due date after payment
  const updateEmployeeSalaryDueDate = (employeeId: string) => {
    setEmployees(prevEmployees => {
      return prevEmployees.map(employee => {
        if (employee.id !== employeeId) return employee;

        const currentDueDate = new Date(employee.salaryDueDate);
        const nextDueDate = new Date(currentDueDate);

        // Calculate next due date based on frequency
        if (employee.salaryFrequency === 'monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else if (employee.salaryFrequency === 'bi-weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 14);
        } else if (employee.salaryFrequency === 'weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        }

        return {
          ...employee,
          salaryDueDate: nextDueDate.toISOString().split('T')[0],
          lastPaidDate: new Date().toISOString().split('T')[0]
        };
      });
    });
  };

  // Distributor operations
  const addDistributor = (distributorData: Omit<Distributor, 'id' | 'createdAt'>) => {
    const newDistributor: Distributor = {
      ...distributorData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setDistributors(prev => [...prev, newDistributor]);
  };

  const updateDistributor = (id: string, updates: Partial<Distributor>) => {
    setDistributors(prev => prev.map(distributor => 
      distributor.id === id ? { ...distributor, ...updates } : distributor
    ));
  };

  const deleteDistributor = (id: string) => {
    setDistributors(prev => prev.filter(distributor => distributor.id !== id));
  };

  // Patient operations
  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'currentCredit'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
      currentCredit: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(patient => 
      patient.id === id 
        ? { ...patient, ...updates, updatedAt: new Date() }
        : patient
    ));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
  };

  const togglePatientStatus = (id: string) => {
    setPatients(prev => prev.map(patient => 
      patient.id === id 
        ? { ...patient, isActive: !patient.isActive, updatedAt: new Date() }
        : patient
    ));
  };

  // Utility functions
  const getDoctorById = (id: string) => doctors.find(doctor => doctor.id === id);
  const getBusinessPartnerById = (id: string) => businessPartners.find(partner => partner.id === id);
  const getEmployeeById = (id: string) => employees.find(employee => employee.id === id);
  const getDistributorById = (id: string) => distributors.find(distributor => distributor.id === id);
  const getPatientById = (id: string) => patients.find(patient => patient.id === id);

  // Stats
  const getTotalStakeholders = () => 
    doctors.length + businessPartners.length + employees.length + distributors.length + patients.length;
  
  const getActivePatients = () => patients.filter(patient => patient.isActive);

  const contextValue: StakeholderContextType = {
    // Data
    doctors,
    businessPartners,
    employees,
    distributors,
    patients,
    
    // Operations
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addBusinessPartner,
    updateBusinessPartner,
    deleteBusinessPartner,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateEmployeeSalaryDueDate,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addPatient,
    updatePatient,
    deletePatient,
    togglePatientStatus,
    
    // Utilities
    getDoctorById,
    getBusinessPartnerById,
    getEmployeeById,
    getDistributorById,
    getPatientById,
    getTotalStakeholders,
    getActivePatients
  };

  return (
    <StakeholderContext.Provider value={contextValue}>
      {children}
    </StakeholderContext.Provider>
  );
};