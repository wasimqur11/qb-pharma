import type { Transaction, Distributor } from '../types';

export interface ExcelRowData {
  date: string;
  consultationFee: number;
  doctorExpenses: number;
  pharmacySale: number;
  distributorPayments: number;
  otherExpenses: number;
  remarks: string;
}

export interface ImportResult {
  transactions: Transaction[];
  distributors: Distributor[];
  summary: {
    totalTransactions: number;
    consultationFees: number;
    doctorExpenses: number;
    pharmacySales: number;
    distributorPayments: number;
    partnerDistributions: number;
    employeeSalaries: number;
    clinicExpenses: number;
  };
}

/**
 * Clean currency value by removing symbols and commas
 */
function cleanCurrencyValue(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remove currency symbols, commas, and quotes
  const cleaned = value.replace(/[₹$,"\s]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Parse CSV content into structured data
 * Expected columns: Date, Fee, Payment, Sale, Payment, Expenses, Note
 */
export function parseCSVData(csvContent: string): ExcelRowData[] {
  const lines = csvContent.split('\n');
  const data: ExcelRowData[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma but handle quoted values
    const columns = parseCSVLine(line);
    
    if (columns.length >= 7) {
      const row: ExcelRowData = {
        date: columns[0] || '', // Date column
        consultationFee: cleanCurrencyValue(columns[1]), // Fee column
        doctorExpenses: cleanCurrencyValue(columns[2]), // Payment column (doctor expenses)
        pharmacySale: cleanCurrencyValue(columns[3]), // Sale column
        distributorPayments: cleanCurrencyValue(columns[4]), // Payment column (distributor)
        otherExpenses: cleanCurrencyValue(columns[5]), // Expenses column
        remarks: columns[6] || '' // Note column
      };
      
      data.push(row);
    }
  }
  
  return data;
}

/**
 * Parse a CSV line handling quoted values with commas
 */
function parseCSVLine(line: string): string[] {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  columns.push(current.trim());
  return columns;
}

/**
 * Convert Excel row data to application transactions
 */
export function convertToTransactions(data: ExcelRowData[]): ImportResult {
  const transactions: Transaction[] = [];
  const distributorMap = new Map<string, Distributor>();
  
  // Generate unique import session ID to prevent conflicts
  const importSessionId = Date.now().toString(36);
  let transactionId = 1;
  
  const summary = {
    totalTransactions: 0,
    consultationFees: 0,
    doctorExpenses: 0,
    pharmacySales: 0,
    distributorPayments: 0,
    partnerDistributions: 0,
    employeeSalaries: 0,
    clinicExpenses: 0
  };

  data.forEach(row => {
    const date = parseDate(row.date);
    if (!date) return;
    
    // Consultation Fee
    if (row.consultationFee > 0) {
      transactions.push({
        id: `import-${importSessionId}-${transactionId++}`,
        category: 'consultation_fee',
        amount: row.consultationFee,
        description: `Consultation fees - ${date.toDateString()}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      });
      summary.consultationFees += row.consultationFee;
    }
    
    // Doctor Expenses
    if (row.doctorExpenses > 0) {
      transactions.push({
        id: `import-${importSessionId}-${transactionId++}`,
        category: 'doctor_expense',
        amount: row.doctorExpenses,
        description: `Doctor expenses - ${date.toDateString()}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      });
      summary.doctorExpenses += row.doctorExpenses;
    }
    
    // Pharmacy Sale
    if (row.pharmacySale > 0) {
      transactions.push({
        id: `import-${importSessionId}-${transactionId++}`,
        category: 'pharmacy_sale',
        amount: row.pharmacySale,
        description: `Pharmacy sales - ${date.toDateString()}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      });
      summary.pharmacySales += row.pharmacySale;
    }
    
    // Distributor Payments
    if (row.distributorPayments > 0) {
      transactions.push({
        id: `import-${importSessionId}-${transactionId++}`,
        category: 'distributor_payment',
        amount: row.distributorPayments,
        description: `Distributor payment - ${date.toDateString()}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      });
      summary.distributorPayments += row.distributorPayments;
    }
    
    // Other Expenses - Parse based on remarks
    if (row.otherExpenses > 0 && row.remarks) {
      const expense = categorizeExpense(row.otherExpenses, row.remarks, date, transactionId++, importSessionId);
      if (expense.transaction) {
        transactions.push(expense.transaction);
        
        // Update summary
        switch (expense.category) {
          case 'partner':
            summary.partnerDistributions += row.otherExpenses;
            break;
          case 'employee':
            summary.employeeSalaries += row.otherExpenses;
            break;
          case 'clinic':
            summary.clinicExpenses += row.otherExpenses;
            break;
        }
      }
    }
  });
  
  summary.totalTransactions = transactions.length;
  
  return {
    transactions,
    distributors: Array.from(distributorMap.values()),
    summary
  };
}

/**
 * Categorize expense based on remarks from Column F (Expenses) and Column G (Notes)
 * Expected names in CSV: Ajaz, Anayat, Wasim (Partners), Afzal (Employee), Clinic (Clinic expense)
 */
function categorizeExpense(amount: number, remarks: string, date: Date, id: number, importSessionId: string): {
  transaction: Transaction | null;
  category: 'partner' | 'employee' | 'clinic' | 'unknown';
} {
  const lowerRemarks = remarks.toLowerCase().trim();
  
  // Partner distributions (Anayat, Wasim, Ajaz - actual names from CSV data)
  if (lowerRemarks.includes('anayat') || lowerRemarks.includes('wasim') || 
      lowerRemarks.includes('ajaz') || lowerRemarks.includes('profit') || 
      lowerRemarks.includes('distribution')) {
    
    // Map partner names to stakeholder IDs based on actual CSV data
    let stakeholderId = 'bp-001'; // Default to Wasim Qureshi
    if (lowerRemarks.includes('wasim')) {
      stakeholderId = 'bp-001'; // Wasim Qureshi
    } else if (lowerRemarks.includes('anayat')) {
      stakeholderId = 'bp-002'; // Sarah Khan as placeholder for Anayat
    } else if (lowerRemarks.includes('ajaz')) {
      stakeholderId = 'bp-003'; // Ali Ahmed as placeholder for Ajaz
    }
    
    return {
      transaction: {
        id: `import-${importSessionId}-${id}`,
        category: 'sales_profit_distribution',
        stakeholderId,
        stakeholderType: 'business_partner',
        amount,
        description: `Partner distribution - ${remarks}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      },
      category: 'partner'
    };
  }
  
  // Employee salary (Afzal)
  if (lowerRemarks.includes('afzal') || lowerRemarks.includes('salary') || 
      lowerRemarks.includes('employee')) {
    return {
      transaction: {
        id: `import-${importSessionId}-${id}`,
        category: 'employee_payment',
        stakeholderId: 'emp-001', // Zainab Hussain as placeholder for Afzal
        stakeholderType: 'employee',
        amount,
        description: `Employee salary - ${remarks}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      },
      category: 'employee'
    };
  }
  
  // Clinic expenses
  if (lowerRemarks.includes('clinic') || lowerRemarks.includes('expense') || 
      lowerRemarks.includes('rent') || lowerRemarks.includes('utility')) {
    return {
      transaction: {
        id: `import-${importSessionId}-${id}`,
        category: 'clinic_expense',
        amount,
        description: `Clinic expense - ${remarks}`,
        date,
        createdBy: 'data_import',
        createdAt: new Date()
      },
      category: 'clinic'
    };
  }
  
  // Default to clinic expense if unclear or no remarks provided
  return {
    transaction: {
      id: `import-${importSessionId}-${id}`,
      category: 'clinic_expense',
      amount,
      description: remarks ? `Other expense - ${remarks}` : 'Other clinic expense (no details provided)',
      date,
      createdBy: 'data_import',
      createdAt: new Date()
    },
    category: 'unknown'
  };
}

/**
 * Parse date from various formats including DD-MMM-YYYY
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Handle DD-MMM-YYYY format (e.g., "01-Jun-2025")
  const monthNames = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const ddMmmYyyy = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
  const match = dateString.match(ddMmmYyyy);
  if (match) {
    const [, dayStr, monthStr, yearStr] = match;
    const day = parseInt(dayStr);
    const month = monthNames[monthStr as keyof typeof monthNames];
    const year = parseInt(yearStr);
    
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }
  
  // Try other formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  ];
  
  for (const format of formats) {
    const formatMatch = dateString.match(format);
    if (formatMatch) {
      const [, part1, part2, part3] = formatMatch;
      
      // Determine if it's DD/MM/YYYY or YYYY-MM-DD
      if (part3.length === 4) {
        // DD/MM/YYYY or DD-MM-YYYY
        const day = parseInt(part1);
        const month = parseInt(part2) - 1; // JS months are 0-indexed
        const year = parseInt(part3);
        return new Date(year, month, day);
      } else {
        // YYYY-MM-DD
        const year = parseInt(part1);
        const month = parseInt(part2) - 1;
        const day = parseInt(part3);
        return new Date(year, month, day);
      }
    }
  }
  
  // Try standard Date parsing as fallback
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Validate imported data
 */
export function validateImportData(data: ExcelRowData[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.length === 0) {
    errors.push('No data found in file');
    return { isValid: false, errors, warnings };
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because array is 0-indexed and we skip header
    
    // Check date
    if (!row.date) {
      errors.push(`Row ${rowNum}: Missing date`);
    } else if (!parseDate(row.date)) {
      errors.push(`Row ${rowNum}: Invalid date format - ${row.date}`);
    }
    
    // Check for negative values
    if (row.consultationFee < 0) warnings.push(`Row ${rowNum}: Negative consultation fee`);
    if (row.doctorExpenses < 0) warnings.push(`Row ${rowNum}: Negative doctor expenses`);
    if (row.pharmacySale < 0) warnings.push(`Row ${rowNum}: Negative pharmacy sale`);
    if (row.distributorPayments < 0) warnings.push(`Row ${rowNum}: Negative distributor payments`);
    if (row.otherExpenses < 0) warnings.push(`Row ${rowNum}: Negative other expenses`);
    
    // Check if row has any data
    const hasData = row.consultationFee > 0 || row.doctorExpenses > 0 || 
                   row.pharmacySale > 0 || row.distributorPayments > 0 || row.otherExpenses > 0;
    if (!hasData) {
      warnings.push(`Row ${rowNum}: No transaction data found`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}