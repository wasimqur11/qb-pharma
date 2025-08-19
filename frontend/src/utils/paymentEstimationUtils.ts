import type { Transaction, Distributor } from '../types';
import { SYSTEM_CONFIG } from '../constants/systemConfig';

export interface WeeklySalesData {
  weekStart: Date;
  weekEnd: Date;
  totalSales: number;
  profitAllocation: number; // 25%
  distributorAllocation: number; // 75%
}

export interface DistributorPaymentEstimate {
  distributorId: string;
  distributorName: string;
  creditBalance: number;
  maxPayment: number; // 10% of credit balance
  estimatedPayment: number;
  paymentPercentage: number; // percentage of total distributor allocation
}

export interface PaymentEstimationResult {
  weeklyData: WeeklySalesData;
  distributorEstimates: DistributorPaymentEstimate[];
  totalEstimatedPayments: number;
  remainingFunds: number;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  // Set to start of day
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  // Set to end of day
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get the previous week's date range
 */
export function getPreviousWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(currentWeekStart.getDate() - 1);
  const previousWeekStart = getWeekStart(previousWeekEnd);
  
  return {
    start: previousWeekStart,
    end: previousWeekEnd
  };
}

/**
 * Calculate total pharmacy sales for a given week
 */
export function calculateWeeklySales(
  transactions: Transaction[],
  weekStart: Date,
  weekEnd: Date
): number {
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const isPharmacySale = transaction.category === 'pharmacy_sale';
    const isInRange = transactionDate >= weekStart && transactionDate <= weekEnd;
    
    return isPharmacySale && isInRange;
  });
  
  return filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
}

/**
 * Calculate payment estimates for distributors based on previous week sales
 */
export function calculateDistributorPaymentEstimates(
  transactions: Transaction[],
  distributors: Distributor[],
  customConfig?: {
    profitPercentage?: number;
    distributorPercentage?: number;
    maxPaymentPercentage?: number;
  }
): PaymentEstimationResult {
  const { start: weekStart, end: weekEnd } = getPreviousWeekRange();
  const totalSales = calculateWeeklySales(transactions, weekStart, weekEnd);
  
  // Use custom config if provided, otherwise use system defaults
  const profitPercentage = customConfig?.profitPercentage ?? SYSTEM_CONFIG.PROFIT_ALLOCATION_PERCENTAGE;
  const distributorPercentage = customConfig?.distributorPercentage ?? SYSTEM_CONFIG.DISTRIBUTOR_ALLOCATION_PERCENTAGE;
  const maxPaymentPercentage = customConfig?.maxPaymentPercentage ?? SYSTEM_CONFIG.MAX_DISTRIBUTOR_PAYMENT_PERCENTAGE;
  
  const profitAllocation = totalSales * (profitPercentage / 100);
  const distributorAllocation = totalSales * (distributorPercentage / 100);
  
  const weeklyData: WeeklySalesData = {
    weekStart,
    weekEnd,
    totalSales,
    profitAllocation,
    distributorAllocation
  };
  
  // Filter distributors with positive credit balance
  const eligibleDistributors = distributors.filter(d => d.creditBalance > 0);
  
  if (eligibleDistributors.length === 0) {
    return {
      weeklyData,
      distributorEstimates: [],
      totalEstimatedPayments: 0,
      remainingFunds: distributorAllocation
    };
  }
  
  // Calculate total credit balance for proportional distribution
  const totalCreditBalance = eligibleDistributors.reduce(
    (sum, distributor) => sum + distributor.creditBalance,
    0
  );
  
  // Calculate initial estimates and caps
  const distributorEstimates: DistributorPaymentEstimate[] = eligibleDistributors.map(distributor => {
    const maxPayment = distributor.creditBalance * (maxPaymentPercentage / 100);
    const proportionalShare = distributorAllocation * (distributor.creditBalance / totalCreditBalance);
    const estimatedPayment = Math.min(proportionalShare, maxPayment);
    
    return {
      distributorId: distributor.id,
      distributorName: distributor.name,
      creditBalance: distributor.creditBalance,
      maxPayment,
      estimatedPayment,
      paymentPercentage: (estimatedPayment / distributorAllocation) * 100
    };
  });
  
  const totalEstimatedPayments = distributorEstimates.reduce(
    (sum, estimate) => sum + estimate.estimatedPayment,
    0
  );
  
  const remainingFunds = distributorAllocation - totalEstimatedPayments;
  
  return {
    weeklyData,
    distributorEstimates,
    totalEstimatedPayments,
    remainingFunds
  };
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}