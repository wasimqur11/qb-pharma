import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Doctor, BusinessPartner, Employee, Distributor, Patient } from '../types';
import apiClient from '../utils/apiClient';
import { useAuth } from './AuthContext';

interface StakeholderContextType {
  // Data
  doctors: Doctor[];
  businessPartners: BusinessPartner[];
  employees: Employee[];
  distributors: Distributor[];
  patients: Patient[];
  
  // Loading state
  isLoading: boolean;
  
  // Data loading
  loadAllData: () => Promise<void>;
  
  // Doctor operations
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => Promise<void>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  
  // Business Partner operations
  addBusinessPartner: (partner: Omit<BusinessPartner, 'id' | 'createdAt'>) => Promise<void>;
  updateBusinessPartner: (id: string, updates: Partial<BusinessPartner>) => Promise<void>;
  deleteBusinessPartner: (id: string) => Promise<void>;
  
  // Employee operations
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  updateEmployeeSalaryDueDate: (employeeId: string) => Promise<void>;
  
  // Distributor operations
  addDistributor: (distributor: Omit<Distributor, 'id' | 'createdAt'>) => Promise<void>;
  updateDistributor: (id: string, updates: Partial<Distributor>) => Promise<void>;
  deleteDistributor: (id: string) => Promise<void>;
  
  // Patient operations
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'currentCredit'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  togglePatientStatus: (id: string) => Promise<void>;
  
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
  // State management
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Load all stakeholder data from backend database
  const loadAllData = async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading stakeholder data from database...');
      
      const [doctorsRes, partnersRes, employeesRes, distributorsRes, patientsRes] = await Promise.all([
        apiClient.getDoctors(),
        apiClient.getBusinessPartners(),
        apiClient.getEmployees(),
        apiClient.getDistributors(),
        apiClient.getPatients()
      ]);

      // Set data from backend
      if (doctorsRes.success) {
        setDoctors(doctorsRes.data || []);
        console.log('Loaded', doctorsRes.data?.length || 0, 'doctors');
      }
      if (partnersRes.success) {
        setBusinessPartners(partnersRes.data || []);
        console.log('Loaded', partnersRes.data?.length || 0, 'business partners');
      }
      if (employeesRes.success) {
        setEmployees(employeesRes.data || []);
        console.log('Loaded', employeesRes.data?.length || 0, 'employees');
      }
      if (distributorsRes.success) {
        setDistributors(distributorsRes.data || []);
        console.log('Loaded', distributorsRes.data?.length || 0, 'distributors');
      }
      if (patientsRes.success) {
        setPatients(patientsRes.data || []);
        console.log('Loaded', patientsRes.data?.length || 0, 'patients');
      }
      
      console.log('Stakeholder data loaded from database');
    } catch (error) {
      console.error('Failed to load stakeholder data:', error);
      // Set empty arrays on error
      setDoctors([]);
      setBusinessPartners([]);
      setEmployees([]);
      setDistributors([]);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadAllData();
    }
  }, [isAuthenticated, authLoading]);

  // Doctor operations
  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'createdAt'>) => {
    try {
      const response = await apiClient.createStakeholder('doctors', doctorData);
      if (response.success) {
        setDoctors(prev => [...prev, response.data]);
      } else {
        console.error('Failed to add doctor:', response.error);
      }
    } catch (error) {
      console.error('Failed to add doctor:', error);
    }
  };

  const updateDoctor = async (id: string, updates: Partial<Doctor>) => {
    try {
      const response = await apiClient.updateStakeholder('doctors', id, updates);
      if (response.success) {
        setDoctors(prev => prev.map(doctor => 
          doctor.id === id ? { ...doctor, ...updates } : doctor
        ));
      } else {
        console.error('Failed to update doctor:', response.error);
      }
    } catch (error) {
      console.error('Failed to update doctor:', error);
    }
  };

  const deleteDoctor = async (id: string) => {
    try {
      const response = await apiClient.deleteStakeholder('doctors', id);
      if (response.success) {
        setDoctors(prev => prev.filter(doctor => doctor.id !== id));
      } else {
        console.error('Failed to delete doctor:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    }
  };

  // Business Partner operations
  const addBusinessPartner = async (partnerData: Omit<BusinessPartner, 'id' | 'createdAt'>) => {
    try {
      const response = await apiClient.createStakeholder('business-partners', partnerData);
      if (response.success) {
        setBusinessPartners(prev => [...prev, response.data]);
      } else {
        console.error('Failed to add business partner:', response.error);
      }
    } catch (error) {
      console.error('Failed to add business partner:', error);
    }
  };

  const updateBusinessPartner = async (id: string, updates: Partial<BusinessPartner>) => {
    try {
      const response = await apiClient.updateStakeholder('business-partners', id, updates);
      if (response.success) {
        setBusinessPartners(prev => prev.map(partner => 
          partner.id === id ? { ...partner, ...updates } : partner
        ));
      } else {
        console.error('Failed to update business partner:', response.error);
      }
    } catch (error) {
      console.error('Failed to update business partner:', error);
    }
  };

  const deleteBusinessPartner = async (id: string) => {
    try {
      const response = await apiClient.deleteStakeholder('business-partners', id);
      if (response.success) {
        setBusinessPartners(prev => prev.filter(partner => partner.id !== id));
      } else {
        console.error('Failed to delete business partner:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete business partner:', error);
    }
  };

  // Employee operations
  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    try {
      const response = await apiClient.createStakeholder('employees', employeeData);
      if (response.success) {
        setEmployees(prev => [...prev, response.data]);
      } else {
        console.error('Failed to add employee:', response.error);
      }
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const response = await apiClient.updateStakeholder('employees', id, updates);
      if (response.success) {
        setEmployees(prev => prev.map(employee => 
          employee.id === id ? { ...employee, ...updates } : employee
        ));
      } else {
        console.error('Failed to update employee:', response.error);
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const response = await apiClient.deleteStakeholder('employees', id);
      if (response.success) {
        setEmployees(prev => prev.filter(employee => employee.id !== id));
      } else {
        console.error('Failed to delete employee:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const updateEmployeeSalaryDueDate = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      await updateEmployee(employeeId, { 
        lastPaidDate: today.toISOString().split('T')[0],
        salaryDueDate: nextMonth.toISOString().split('T')[0]
      });
    }
  };

  // Distributor operations
  const addDistributor = async (distributorData: Omit<Distributor, 'id' | 'createdAt'>) => {
    try {
      const response = await apiClient.createStakeholder('distributors', distributorData);
      if (response.success) {
        setDistributors(prev => [...prev, response.data]);
      } else {
        console.error('Failed to add distributor:', response.error);
      }
    } catch (error) {
      console.error('Failed to add distributor:', error);
    }
  };

  const updateDistributor = async (id: string, updates: Partial<Distributor>) => {
    try {
      const response = await apiClient.updateStakeholder('distributors', id, updates);
      if (response.success) {
        setDistributors(prev => prev.map(distributor => 
          distributor.id === id ? { ...distributor, ...updates } : distributor
        ));
      } else {
        console.error('Failed to update distributor:', response.error);
      }
    } catch (error) {
      console.error('Failed to update distributor:', error);
    }
  };

  const deleteDistributor = async (id: string) => {
    try {
      const response = await apiClient.deleteStakeholder('distributors', id);
      if (response.success) {
        setDistributors(prev => prev.filter(distributor => distributor.id !== id));
      } else {
        console.error('Failed to delete distributor:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete distributor:', error);
    }
  };

  // Patient operations
  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'currentCredit'>) => {
    try {
      const response = await apiClient.createStakeholder('patients', patientData);
      if (response.success) {
        setPatients(prev => [...prev, response.data]);
      } else {
        console.error('Failed to add patient:', response.error);
      }
    } catch (error) {
      console.error('Failed to add patient:', error);
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const response = await apiClient.updateStakeholder('patients', id, updates);
      if (response.success) {
        setPatients(prev => prev.map(patient => 
          patient.id === id ? { ...patient, ...updates } : patient
        ));
      } else {
        console.error('Failed to update patient:', response.error);
      }
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const response = await apiClient.deleteStakeholder('patients', id);
      if (response.success) {
        setPatients(prev => prev.filter(patient => patient.id !== id));
      } else {
        console.error('Failed to delete patient:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  };

  const togglePatientStatus = async (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      await updatePatient(id, { isActive: !patient.isActive });
    }
  };

  // Utility functions
  const getDoctorById = (id: string) => doctors.find(doctor => doctor.id === id);
  const getBusinessPartnerById = (id: string) => businessPartners.find(partner => partner.id === id);
  const getEmployeeById = (id: string) => employees.find(employee => employee.id === id);
  const getDistributorById = (id: string) => distributors.find(distributor => distributor.id === id);
  const getPatientById = (id: string) => patients.find(patient => patient.id === id);

  // Stats
  const getTotalStakeholders = () => doctors.length + businessPartners.length + employees.length + distributors.length + patients.length;
  const getActivePatients = () => patients.filter(patient => patient.isActive);

  const contextValue: StakeholderContextType = {
    // Data
    doctors,
    businessPartners,
    employees,
    distributors,
    patients,
    
    // Loading state
    isLoading,
    
    // Data loading
    loadAllData,
    
    // Doctor operations
    addDoctor,
    updateDoctor,
    deleteDoctor,
    
    // Business Partner operations
    addBusinessPartner,
    updateBusinessPartner,
    deleteBusinessPartner,
    
    // Employee operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateEmployeeSalaryDueDate,
    
    // Distributor operations
    addDistributor,
    updateDistributor,
    deleteDistributor,
    
    // Patient operations
    addPatient,
    updatePatient,
    deletePatient,
    togglePatientStatus,
    
    // Utility functions
    getDoctorById,
    getBusinessPartnerById,
    getEmployeeById,
    getDistributorById,
    getPatientById,
    
    // Stats
    getTotalStakeholders,
    getActivePatients
  };

  return (
    <StakeholderContext.Provider value={contextValue}>
      {children}
    </StakeholderContext.Provider>
  );
};