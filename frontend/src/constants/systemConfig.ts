// System Configuration Constants
// Centralized configuration for all hardcoded values

export const SYSTEM_CONFIG = {
  // Default balance settings
  DEFAULT_DOCTOR_OPENING_BALANCE: 0,
  DEFAULT_PHARMACY_OPENING_BALANCE: 0,
  
  // Date range defaults (in days)
  DEFAULT_TRANSACTION_HISTORY_DAYS: 30,
  DEFAULT_BUSINESS_STATEMENT_DAYS: 90,
  DEFAULT_DOCTOR_STATEMENT_DAYS: 90,
  
  // Pagination settings
  DEFAULT_PAGE_SIZE: 50,
  MAX_TRANSACTIONS_PER_PAGE: 100,
  
  // Export settings
  MAX_EXPORT_RECORDS: 10000,
  
  // Currency settings
  CURRENCY_SYMBOL: '₹',
  CURRENCY_CODE: 'INR',
  
  // Chart settings
  DEFAULT_CHART_MONTHS: 6,
  DEFAULT_CHART_DAYS: 7,
  
  // Performance thresholds
  GOOD_PROFIT_MARGIN_THRESHOLD: 20, // %
  AVERAGE_PROFIT_MARGIN_THRESHOLD: 10, // %
  GOOD_EXPENSE_RATIO_THRESHOLD: 70, // %
  AVERAGE_EXPENSE_RATIO_THRESHOLD: 85, // %
  
  // Credit limits
  DEFAULT_PATIENT_CREDIT_LIMIT: 10000,
  DEFAULT_DISTRIBUTOR_CREDIT_LIMIT: 100000,
  
  // Timeouts and intervals
  AUTO_SAVE_INTERVAL_MS: 30000, // 30 seconds
  SESSION_TIMEOUT_MS: 3600000, // 1 hour
  
  // File upload limits
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMPORT_FORMATS: ['csv', 'xlsx', 'xls'],
  
  // UI settings
  DEFAULT_ITEMS_PER_PAGE: 20,
  NOTIFICATION_DISPLAY_DURATION_MS: 3000,
  
  // Business rules
  MIN_TRANSACTION_AMOUNT: 1,
  MAX_TRANSACTION_AMOUNT: 1000000,
  
  // Report settings
  DEFAULT_REPORT_TITLE: 'QB Pharmacy Management System',
  REPORT_FOOTER_TEXT: 'Confidential Business Report',
  
  // Date formats
  DATE_FORMAT: 'DD/MM/YYYY',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm:ss',
  
  // Payment Estimation Settings
  PROFIT_ALLOCATION_PERCENTAGE: 25, // % of weekly sales allocated for profit/expenses
  DISTRIBUTOR_ALLOCATION_PERCENTAGE: 75, // % of weekly sales allocated for distributor payments
  MAX_DISTRIBUTOR_PAYMENT_PERCENTAGE: 10, // % of distributor credit balance as payment cap
  
  // Feature flags
  ENABLE_DOCTOR_ACCOUNTS: true,
  ENABLE_PATIENT_CREDIT: true,
  ENABLE_DISTRIBUTOR_CREDIT: true,
  ENABLE_BUSINESS_PARTNER_TRACKING: true,
  ENABLE_ADVANCED_REPORTING: true,
} as const;

// Validation rules
export const VALIDATION_RULES = {
  TRANSACTION_DESCRIPTION_MIN_LENGTH: 3,
  TRANSACTION_DESCRIPTION_MAX_LENGTH: 255,
  STAKEHOLDER_NAME_MIN_LENGTH: 2,
  STAKEHOLDER_NAME_MAX_LENGTH: 100,
  PHONE_NUMBER_LENGTH: 10,
  EMAIL_MAX_LENGTH: 255,
} as const;

// Helper functions for configuration
export const formatCurrency = (amount: number): string => {
  return `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;
};

export const isGoodProfitMargin = (margin: number): boolean => {
  return margin >= SYSTEM_CONFIG.GOOD_PROFIT_MARGIN_THRESHOLD;
};

export const isAverageProfitMargin = (margin: number): boolean => {
  return margin >= SYSTEM_CONFIG.AVERAGE_PROFIT_MARGIN_THRESHOLD && 
         margin < SYSTEM_CONFIG.GOOD_PROFIT_MARGIN_THRESHOLD;
};

export const isGoodExpenseRatio = (ratio: number): boolean => {
  return ratio <= SYSTEM_CONFIG.GOOD_EXPENSE_RATIO_THRESHOLD;
};

export const isAverageExpenseRatio = (ratio: number): boolean => {
  return ratio <= SYSTEM_CONFIG.AVERAGE_EXPENSE_RATIO_THRESHOLD && 
         ratio > SYSTEM_CONFIG.GOOD_EXPENSE_RATIO_THRESHOLD;
};

export const getDefaultDateRange = (type: 'transaction' | 'business' | 'doctor' = 'transaction') => {
  const today = new Date();
  let days: number;
  
  switch (type) {
    case 'business':
      days = SYSTEM_CONFIG.DEFAULT_BUSINESS_STATEMENT_DAYS;
      break;
    case 'doctor':
      days = SYSTEM_CONFIG.DEFAULT_DOCTOR_STATEMENT_DAYS;
      break;
    default:
      days = SYSTEM_CONFIG.DEFAULT_TRANSACTION_HISTORY_DAYS;
  }
  
  const fromDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  
  return {
    from: fromDate.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  };
};