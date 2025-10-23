import type { Transaction, Distributor } from '../types';
import { SYSTEM_CONFIG } from '../constants/systemConfig';

// Configuration service for fetching payment estimation settings
export class ConfigurationService {
  private static instance: ConfigurationService;
  private configCache: Map<string, any> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  private async fetchConfigFromAPI(): Promise<Record<string, any>> {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/configurations/payment_estimation', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.configurations || {};
    } catch (error) {
      console.error('Failed to fetch configuration from API:', error);
      return {};
    }
  }

  async getPaymentEstimationConfig(): Promise<{
    profitPercentage: number;
    distributorPercentage: number;
    maxPaymentPercentage: number;
  }> {
    const now = Date.now();
    
    // Check if cache is valid
    if (this.configCache.size === 0 || (now - this.cacheTimestamp) > this.CACHE_DURATION) {
      const config = await this.fetchConfigFromAPI();
      
      // Update cache
      this.configCache.clear();
      Object.entries(config).forEach(([key, value]) => {
        this.configCache.set(key, value);
      });
      this.cacheTimestamp = now;
    }

    // Extract payment estimation values with fallbacks to system defaults
    const profitConfig = this.configCache.get('profit_allocation_percentage');
    const distributorConfig = this.configCache.get('distributor_allocation_percentage');
    const maxPaymentConfig = this.configCache.get('max_distributor_payment_percentage');

    // Use system defaults only as last resort if configuration is missing
    const DEFAULT_PROFIT_PERCENTAGE = 25;
    const DEFAULT_DISTRIBUTOR_PERCENTAGE = 75;
    const DEFAULT_MAX_PAYMENT_PERCENTAGE = 10;

    return {
      profitPercentage: profitConfig?.value ?? DEFAULT_PROFIT_PERCENTAGE,
      distributorPercentage: distributorConfig?.value ?? DEFAULT_DISTRIBUTOR_PERCENTAGE,
      maxPaymentPercentage: maxPaymentConfig?.value ?? DEFAULT_MAX_PAYMENT_PERCENTAGE
    };
  }

  // Method to update configuration and invalidate cache
  async updateConfiguration(category: string, key: string, value: string): Promise<void> {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/configurations/${category}/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Invalidate cache
      this.cacheTimestamp = 0;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }

  // Method to clear cache manually
  clearCache(): void {
    this.configCache.clear();
    this.cacheTimestamp = 0;
  }
}

export interface WeeklySalesData {
  weekStart: Date;
  weekEnd: Date;
  totalSales: number;
  profitAllocation: number; // 25%
  distributorAllocation: number; // 75%
}

export interface CurrentWeekData {
  weekStart: Date;
  weekEnd: Date;
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
  currentWeekData: CurrentWeekData;
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
 * Get the current week's date range
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const currentWeekEnd = getWeekEnd(today);
  
  return {
    start: currentWeekStart,
    end: currentWeekEnd
  };
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
export async function calculateDistributorPaymentEstimates(
  transactions: Transaction[],
  distributors: Distributor[],
  customConfig?: {
    profitPercentage?: number;
    distributorPercentage?: number;
    maxPaymentPercentage?: number;
  },
  calculateBalance?: (distributorId: string) => number
): Promise<PaymentEstimationResult> {
  const { start: weekStart, end: weekEnd } = getPreviousWeekRange();
  const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekRange();
  const totalSales = calculateWeeklySales(transactions, weekStart, weekEnd);
  
  // Get configuration from database or use custom config
  let profitPercentage: number;
  let distributorPercentage: number;
  let maxPaymentPercentage: number;

  if (customConfig) {
    // Configuration service fallback for missing custom config values
    const configService = ConfigurationService.getInstance();
    let fallbackConfig = { profitPercentage: 25, distributorPercentage: 75, maxPaymentPercentage: 10 };
    
    try {
      fallbackConfig = await configService.getPaymentEstimationConfig();
    } catch (error) {
      console.error('Failed to fetch fallback configuration, using defaults:', error);
    }
    
    profitPercentage = customConfig.profitPercentage ?? fallbackConfig.profitPercentage;
    distributorPercentage = customConfig.distributorPercentage ?? fallbackConfig.distributorPercentage;
    maxPaymentPercentage = customConfig.maxPaymentPercentage ?? fallbackConfig.maxPaymentPercentage;
  } else {
    try {
      const configService = ConfigurationService.getInstance();
      const dbConfig = await configService.getPaymentEstimationConfig();
      profitPercentage = dbConfig.profitPercentage;
      distributorPercentage = dbConfig.distributorPercentage;
      maxPaymentPercentage = dbConfig.maxPaymentPercentage;
    } catch (error) {
      console.error('Failed to fetch configuration from database, using built-in defaults:', error);
      profitPercentage = 25;
      distributorPercentage = 75;
      maxPaymentPercentage = 10;
    }
  }
  
  const profitAllocation = totalSales * (profitPercentage / 100);
  const distributorAllocation = totalSales * (distributorPercentage / 100);
  
  const weeklyData: WeeklySalesData = {
    weekStart,
    weekEnd,
    totalSales,
    profitAllocation,
    distributorAllocation
  };

  const currentWeekData: CurrentWeekData = {
    weekStart: currentWeekStart,
    weekEnd: currentWeekEnd
  };

  // Helper function to get current balance - either calculated or from stored field
  const getCurrentBalance = (distributorId: string, fallbackBalance: number): number => {
    if (calculateBalance) {
      return calculateBalance(distributorId);
    }
    return fallbackBalance;
  };

  // Calculate current balances for all distributors and filter those with positive balance
  const distributorsWithBalances = distributors.map(d => ({
    ...d,
    currentBalance: getCurrentBalance(d.id, d.creditBalance)
  }));

  const eligibleDistributors = distributorsWithBalances.filter(d => d.currentBalance > 0);

  if (eligibleDistributors.length === 0) {
    return {
      weeklyData,
      currentWeekData,
      distributorEstimates: [],
      totalEstimatedPayments: 0,
      remainingFunds: distributorAllocation
    };
  }

  // Calculate total credit balance for proportional distribution
  const totalCreditBalance = eligibleDistributors.reduce(
    (sum, distributor) => sum + distributor.currentBalance,
    0
  );

  // Calculate initial estimates and caps
  const distributorEstimates: DistributorPaymentEstimate[] = eligibleDistributors.map(distributor => {
    const currentBalance = distributor.currentBalance;
    const maxPayment = currentBalance * (maxPaymentPercentage / 100);
    const proportionalShare = distributorAllocation * (currentBalance / totalCreditBalance);
    const rawEstimatedPayment = Math.min(proportionalShare, maxPayment);

    // Smart rounding: Round to nearest 100, but ensure it doesn't exceed constraints
    const roundedUp = Math.ceil(rawEstimatedPayment / 100) * 100;
    const roundedDown = Math.floor(rawEstimatedPayment / 100) * 100;

    // Use rounded up if it doesn't exceed max payment, otherwise round down
    // This keeps amounts clean (multiples of 100) while respecting limits
    const estimatedPayment = roundedUp <= maxPayment ? roundedUp : roundedDown;

    return {
      distributorId: distributor.id,
      distributorName: distributor.name,
      creditBalance: currentBalance,
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
    currentWeekData,
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