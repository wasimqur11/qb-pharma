import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SYSTEM_CONFIG } from '../constants/systemConfig';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export interface ExportData {
  title: string;
  subtitle?: string;
  headers: string[];
  data: (string | number)[][];
  summary?: { label: string; value: string | number }[];
}

export interface BusinessReportData {
  companyName: string;
  reportTitle: string;
  reportPeriod: string;
  generatedDate: string;
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    cashPosition: number;
    pharmacyRevenue: number;
    doctorRevenue: number;
  };
  transactions?: any[];
  chartData?: any[];
}

const addLogoAndHeader = async (pdf: jsPDF, title: string, subtitle?: string) => {
  const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  
  pdf.setFillColor(31, 41, 55);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(SYSTEM_CONFIG.DEFAULT_REPORT_TITLE, margin, 25);
  
  if (subtitle) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, margin, 35);
  }
  
  pdf.setTextColor(59, 130, 246);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, 70);
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth - margin - 100, 25);
  
  const currentY = 85;
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  
  return currentY + 10;
};

const addFooter = (pdf: jsPDF) => {
  const pageCount = pdf.getNumberOfPages();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    pdf.setFillColor(31, 41, 55);
    pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(SYSTEM_CONFIG.DEFAULT_REPORT_TITLE, 20, pageHeight - 12);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 12);
    pdf.text(SYSTEM_CONFIG.REPORT_FOOTER_TEXT, pageWidth / 2 - 40, pageHeight - 12);
  }
};

export const exportToPDF = async (data: ExportData): Promise<void> => {
  const pdf = new jsPDF();
  let currentY = await addLogoAndHeader(pdf, data.title, data.subtitle);
  
  currentY += 10;
  
  if (data.summary && data.summary.length > 0) {
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', 20, currentY);
    currentY += 15;
    
    data.summary.forEach((item, index) => {
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${item.label}:`, 25, currentY);
      
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'bold');
      const valueText = typeof item.value === 'number' 
        ? `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${item.value.toLocaleString()}` 
        : item.value.toString();
      pdf.text(valueText, 120, currentY);
      
      currentY += 12;
    });
    
    currentY += 10;
  }
  
  pdf.setTextColor(75, 85, 99);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detailed Report', 20, currentY);
  currentY += 10;
  
  autoTable(pdf, {
    head: [data.headers],
    body: data.data,
    startY: currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [31, 41, 55]
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    styles: {
      lineColor: [229, 231, 235],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    didDrawPage: () => {
      addFooter(pdf);
    }
  });
  
  addFooter(pdf);
  
  const fileName = `${data.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const exportBusinessReportToPDF = async (reportData: BusinessReportData): Promise<void> => {
  const pdf = new jsPDF();
  let currentY = await addLogoAndHeader(pdf, reportData.reportTitle, reportData.reportPeriod);
  
  currentY += 20;
  
  pdf.setTextColor(75, 85, 99);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 20, currentY);
  currentY += 20;
  
  const summaryItems = [
    { label: 'Total Revenue', value: reportData.metrics.totalRevenue },
    { label: 'Pharmacy Revenue', value: reportData.metrics.pharmacyRevenue },
    { label: 'Doctor Revenue', value: reportData.metrics.doctorRevenue },
    { label: 'Total Expenses', value: reportData.metrics.totalExpenses },
    { label: 'Net Profit', value: reportData.metrics.netProfit },
    { label: 'Cash Position', value: reportData.metrics.cashPosition }
  ];
  
  summaryItems.forEach((item, index) => {
    const xPos = 20 + (index % 2) * 250;
    const yPos = currentY + Math.floor(index / 2) * 20;
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${item.label}:`, xPos, yPos);
    
    if (item.value >= 0) {
      pdf.setTextColor(34, 197, 94);
    } else {
      pdf.setTextColor(239, 68, 68);
    }
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${SYSTEM_CONFIG.CURRENCY_SYMBOL}${item.value.toLocaleString()}`, xPos + 100, yPos);
  });
  
  currentY += summaryItems.length * 10 + 30;
  
  if (reportData.transactions && reportData.transactions.length > 0) {
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent Transactions', 20, currentY);
    currentY += 10;
    
    const transactionHeaders = ['Date', 'Description', 'Category', 'Amount'];
    const transactionData = reportData.transactions.slice(0, 20).map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description || 'N/A',
      t.category?.replace('_', ' ').toUpperCase() || 'N/A',
      `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${t.amount.toLocaleString()}`
    ]);
    
    autoTable(pdf, {
      head: [transactionHeaders],
      body: transactionData,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 6
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
  }
  
  addFooter(pdf);
  
  const fileName = `business_report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const exportToExcel = (data: ExportData): void => {
  const workbook = XLSX.utils.book_new();
  
  const worksheetData = [
    [`${SYSTEM_CONFIG.DEFAULT_REPORT_TITLE} - ${data.title}`],
    [data.subtitle || ''],
    [`Generated on: ${new Date().toLocaleDateString()}`],
    [''],
    data.headers,
    ...data.data
  ];
  
  if (data.summary && data.summary.length > 0) {
    worksheetData.splice(4, 0, ['Summary'], ...data.summary.map(s => [s.label, s.value]), ['']);
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  worksheet['!cols'] = [
    { width: 25 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 20 }
  ];
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      const cell = worksheet[cellAddress];
      
      if (R === 0) {
        cell.s = {
          font: { bold: true, sz: 16, color: { rgb: "1F2937" } },
          fill: { fgColor: { rgb: "E5E7EB" } },
          alignment: { horizontal: "center" }
        };
      } else if (R === 4 || (data.summary && R === 5 + data.summary.length)) {
        cell.s = {
          font: { bold: true, sz: 12, color: { rgb: "374151" } },
          fill: { fgColor: { rgb: "F3F4F6" } },
          alignment: { horizontal: "center" }
        };
      }
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, data.title.substring(0, 30));
  
  const fileName = `${data.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Enhanced professional Excel export for transactions
export const exportTransactionsToExcel = (
  transactions: any[], 
  title: string = 'Transaction History',
  dateRange?: { from: string; to: string },
  additionalMetrics?: any
): void => {
  const workbook = XLSX.utils.book_new();
  
  // Professional headers with enhanced information
  const headers = [
    'Transaction Date', 
    'Description', 
    'Transaction Type', 
    'Stakeholder/Entity', 
    'Amount (₹)', 
    'Bill/Reference No', 
    'Payment Method',
    'Status',
    'Created Date'
  ];
  
  // Enhanced data mapping with better formatting
  const data = transactions.map(t => [
    new Date(t.date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    t.description || 'No Description',
    (t.category?.replace('_', ' ') || 'Unknown').split(' ').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '),
    t.stakeholderId || 'Internal',
    t.amount || 0,
    t.billNo || '-',
    t.paymentMethod || 'Cash',
    t.status || 'Completed',
    new Date(t.createdAt || t.date).toLocaleDateString('en-IN')
  ]);
  
  // Enhanced summary with more metrics
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const revenueTransactions = transactions.filter(t => 
    ['pharmacy_sale', 'consultation_fee', 'patient_payment'].includes(t.category)
  );
  const expenseTransactions = transactions.filter(t => 
    ['distributor_payment', 'employee_payment', 'doctor_expense', 'clinic_expense'].includes(t.category)
  );
  
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netPosition = totalRevenue - totalExpenses;
  
  const summary = [
    ['TRANSACTION SUMMARY', ''],
    ['Total Transactions', transactions.length],
    ['Report Period', dateRange ? 
      `${new Date(dateRange.from).toLocaleDateString('en-IN')} to ${new Date(dateRange.to).toLocaleDateString('en-IN')}` : 
      'All Time'
    ],
    [''],
    ['FINANCIAL OVERVIEW', ''],
    ['Total Revenue', totalRevenue],
    ['Total Expenses', totalExpenses],
    ['Net Position', netPosition],
    ['Total Transaction Value', totalAmount],
    [''],
    ['TRANSACTION BREAKDOWN', ''],
    ['Revenue Transactions', revenueTransactions.length],
    ['Expense Transactions', expenseTransactions.length],
    ['Average Transaction Value', transactions.length > 0 ? Math.round(totalAmount / transactions.length) : 0]
  ];
  
  // Create professional worksheet structure
  const worksheetData = [
    [SYSTEM_CONFIG.DEFAULT_REPORT_TITLE.toUpperCase()],
    [title.toUpperCase()],
    [`Generated on: ${new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`],
    [`Report Time: ${new Date().toLocaleTimeString('en-IN')}`],
    [''],
    ...summary,
    [''],
    ['DETAILED TRANSACTION RECORDS'],
    headers,
    ...data
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Enhanced column formatting
  worksheet['!cols'] = [
    { width: 15 },  // Transaction Date
    { width: 35 },  // Description
    { width: 18 },  // Transaction Type
    { width: 20 },  // Stakeholder
    { width: 15 },  // Amount
    { width: 18 },  // Bill No
    { width: 15 },  // Payment Method
    { width: 12 },  // Status
    { width: 15 }   // Created Date
  ];
  
  // Professional styling
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      const cell = worksheet[cellAddress];
      
      // Title row styling
      if (R === 0) {
        cell.s = {
          font: { bold: true, sz: 20, color: { rgb: "1F2937" } },
          fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "1F2937" } },
            bottom: { style: "thick", color: { rgb: "1F2937" } }
          }
        };
      }
      // Subtitle row
      else if (R === 1) {
        cell.s = {
          font: { bold: true, sz: 14, color: { rgb: "374151" } },
          fill: { fgColor: { rgb: "E5E7EB" } },
          alignment: { horizontal: "center" }
        };
      }
      // Header rows for sections
      else if (worksheet[cellAddress].v && typeof worksheet[cellAddress].v === 'string' && 
               (worksheet[cellAddress].v.includes('SUMMARY') || 
                worksheet[cellAddress].v.includes('OVERVIEW') || 
                worksheet[cellAddress].v.includes('BREAKDOWN') ||
                worksheet[cellAddress].v.includes('RECORDS'))) {
        cell.s = {
          font: { bold: true, sz: 12, color: { rgb: "1F2937" } },
          fill: { fgColor: { rgb: "F3F4F6" } },
          alignment: { horizontal: "left" }
        };
      }
      // Data headers row
      else if (R === summary.length + 7) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "374151" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "1F2937" } },
            bottom: { style: "medium", color: { rgb: "1F2937" } },
            left: { style: "thin", color: { rgb: "6B7280" } },
            right: { style: "thin", color: { rgb: "6B7280" } }
          }
        };
      }
      // Data rows
      else if (R > summary.length + 7) {
        cell.s = {
          font: { sz: 10, color: { rgb: "374151" } },
          fill: { fgColor: { rgb: R % 2 === 0 ? "F9FAFB" : "FFFFFF" } },
          alignment: { horizontal: C === 4 ? "right" : "left", vertical: "center" },
          border: {
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };
        
        // Special formatting for amount column
        if (C === 4 && typeof cell.v === 'number') {
          cell.z = `"${SYSTEM_CONFIG.CURRENCY_SYMBOL}"#,##0.00`;
        }
      }
    }
  }
  
  // Add data validation and conditional formatting for amounts
  const summaryStartRow = 5;
  const dataStartRow = summary.length + 8;
  
  // Freeze panes for better navigation
  worksheet['!freeze'] = { xSplit: 1, ySplit: dataStartRow };
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction Report');
  
  // Generate professional filename
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const fileName = `${SYSTEM_CONFIG.DEFAULT_REPORT_TITLE.replace(/\s+/g, '_')}_${title.replace(/\s+/g, '_')}_${dateStr}_${timeStr}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

// Professional Account Statement Excel Export
export const exportAccountStatementToExcel = (
  statementData: any,
  stakeholderInfo: any,
  dateRange: { from: string; to: string }
): void => {
  const workbook = XLSX.utils.book_new();
  
  // Calculate totals
  const totalDebits = statementData.reduce((sum: number, t: any) => sum + (t.debit || 0), 0);
  const totalCredits = statementData.reduce((sum: number, t: any) => sum + (t.credit || 0), 0);
  const netBalance = totalCredits - totalDebits;
  const openingBalance = statementData[0]?.balance - (statementData[0]?.credit || 0) + (statementData[0]?.debit || 0) || 0;
  const closingBalance = statementData[statementData.length - 1]?.balance || 0;
  
  const headers = [
    'Date',
    'Description', 
    'Reference',
    'Debit (₹)',
    'Credit (₹)',
    'Balance (₹)'
  ];
  
  const data = statementData.map((t: any) => [
    new Date(t.date).toLocaleDateString('en-IN'),
    t.description || 'No Description',
    t.reference || '-',
    t.debit || 0,
    t.credit || 0,
    t.balance || 0
  ]);
  
  const summary = [
    ['ACCOUNT STATEMENT SUMMARY', ''],
    ['Account Holder', stakeholderInfo.name || 'Unknown'],
    ['Account Type', stakeholderInfo.type || 'General'],
    ['Statement Period', `${new Date(dateRange.from).toLocaleDateString('en-IN')} to ${new Date(dateRange.to).toLocaleDateString('en-IN')}`],
    [''],
    ['BALANCE OVERVIEW', ''],
    ['Opening Balance', openingBalance],
    ['Total Debits', totalDebits],
    ['Total Credits', totalCredits],
    ['Net Movement', netBalance],
    ['Closing Balance', closingBalance],
    [''],
    ['TRANSACTION ANALYSIS', ''],
    ['Total Transactions', statementData.length],
    ['Debit Transactions', statementData.filter((t: any) => t.debit > 0).length],
    ['Credit Transactions', statementData.filter((t: any) => t.credit > 0).length],
    ['Average Transaction', statementData.length > 0 ? Math.round((totalDebits + totalCredits) / statementData.length) : 0]
  ];
  
  const worksheetData = [
    [SYSTEM_CONFIG.DEFAULT_REPORT_TITLE.toUpperCase()],
    ['ACCOUNT STATEMENT REPORT'],
    [`Generated on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`],
    [`Report Time: ${new Date().toLocaleTimeString('en-IN')}`],
    [''],
    ...summary,
    [''],
    ['DETAILED TRANSACTION HISTORY'],
    headers,
    ...data
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  worksheet['!cols'] = [
    { width: 12 },  // Date
    { width: 40 },  // Description
    { width: 15 },  // Reference
    { width: 15 },  // Debit
    { width: 15 },  // Credit
    { width: 15 }   // Balance
  ];
  
  // Professional styling
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      const cell = worksheet[cellAddress];
      
      if (R === 0) {
        cell.s = {
          font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1F2937" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      } else if (R === 1) {
        cell.s = {
          font: { bold: true, sz: 14, color: { rgb: "374151" } },
          fill: { fgColor: { rgb: "E5E7EB" } },
          alignment: { horizontal: "center" }
        };
      } else if (worksheet[cellAddress].v && typeof worksheet[cellAddress].v === 'string' && 
                 (worksheet[cellAddress].v.includes('SUMMARY') || 
                  worksheet[cellAddress].v.includes('OVERVIEW') || 
                  worksheet[cellAddress].v.includes('ANALYSIS') ||
                  worksheet[cellAddress].v.includes('HISTORY'))) {
        cell.s = {
          font: { bold: true, sz: 12, color: { rgb: "1F2937" } },
          fill: { fgColor: { rgb: "F3F4F6" } },
          alignment: { horizontal: "left" }
        };
      } else if (R === summary.length + 7) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "374151" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "1F2937" } },
            bottom: { style: "medium", color: { rgb: "1F2937" } }
          }
        };
      } else if (R > summary.length + 7) {
        cell.s = {
          font: { sz: 10, color: { rgb: "374151" } },
          fill: { fgColor: { rgb: R % 2 === 0 ? "F9FAFB" : "FFFFFF" } },
          alignment: { 
            horizontal: (C >= 3 && C <= 5) ? "right" : "left", 
            vertical: "center" 
          },
          border: {
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };
        
        // Number formatting for financial columns
        if ((C >= 3 && C <= 5) && typeof cell.v === 'number') {
          cell.z = `"${SYSTEM_CONFIG.CURRENCY_SYMBOL}"#,##0.00`;
        }
      }
    }
  }
  
  worksheet['!freeze'] = { xSplit: 1, ySplit: summary.length + 8 };
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Statement');
  
  const fileName = `${SYSTEM_CONFIG.DEFAULT_REPORT_TITLE.replace(/\s+/g, '_')}_Account_Statement_${stakeholderInfo.name?.replace(/\s+/g, '_') || 'Unknown'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Enhanced Professional PDF Export for Business Reports
export const exportEnhancedBusinessReportToPDF = async (reportData: BusinessReportData): Promise<void> => {
  const pdf = new jsPDF();
  let currentY = await addLogoAndHeader(pdf, reportData.reportTitle, reportData.reportPeriod);
  
  // Company Information Section
  currentY += 15;
  pdf.setTextColor(75, 85, 99);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Business Performance Overview', 20, currentY);
  currentY += 20;
  
  // Executive Summary with enhanced formatting
  const metrics = reportData.metrics;
  const profitMargin = metrics.totalRevenue > 0 ? ((metrics.netProfit / metrics.totalRevenue) * 100) : 0;
  const expenseRatio = metrics.totalRevenue > 0 ? ((metrics.totalExpenses / metrics.totalRevenue) * 100) : 0;
  
  // Key Performance Indicators
  const kpiData = [
    ['Key Performance Indicators', '', 'Financial Health Metrics', ''],
    ['Total Revenue', `₹${metrics.totalRevenue.toLocaleString()}`, 'Profit Margin', `${profitMargin.toFixed(1)}%`],
    ['Total Expenses', `₹${metrics.totalExpenses.toLocaleString()}`, 'Expense Ratio', `${expenseRatio.toFixed(1)}%`],
    ['Net Profit', `₹${metrics.netProfit.toLocaleString()}`, 'Cash Position', `₹${metrics.cashPosition.toLocaleString()}`],
    ['', '', '', ''],
    ['Revenue Breakdown', '', 'Business Analysis', ''],
    ['Pharmacy Revenue', `₹${metrics.pharmacyRevenue.toLocaleString()}`, 'Pharmacy Share', `${metrics.totalRevenue > 0 ? ((metrics.pharmacyRevenue / metrics.totalRevenue) * 100).toFixed(1) : 0}%`],
    ['Doctor Revenue', `₹${metrics.doctorRevenue.toLocaleString()}`, 'Doctor Share', `${metrics.totalRevenue > 0 ? ((metrics.doctorRevenue / metrics.totalRevenue) * 100).toFixed(1) : 0}%`]
  ];
  
  autoTable(pdf, {
    body: kpiData,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 8,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [243, 244, 246] },
      1: { halign: 'right' },
      2: { fontStyle: 'bold', fillColor: [243, 244, 246] },
      3: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 20;
  
  // Business Insights Section
  pdf.setTextColor(75, 85, 99);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Business Insights & Analysis', 20, currentY);
  currentY += 15;
  
  const insights = [
    `• Revenue Performance: ${metrics.netProfit >= 0 ? 'Profitable' : 'Loss-making'} operations with ${profitMargin >= 0 ? '+' : ''}${profitMargin.toFixed(1)}% margin`,
    `• Business Mix: Pharmacy contributes ${((metrics.pharmacyRevenue / metrics.totalRevenue) * 100).toFixed(1)}% of total revenue`,
    `• Cash Position: ${metrics.cashPosition >= 0 ? 'Positive' : 'Negative'} cash flow of ₹${metrics.cashPosition.toLocaleString()}`,
    `• Expense Management: ${expenseRatio.toFixed(1)}% expense ratio ${expenseRatio <= 70 ? '(Good)' : expenseRatio <= 85 ? '(Average)' : '(High)'}`
  ];
  
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  insights.forEach(insight => {
    pdf.text(insight, 25, currentY);
    currentY += 12;
  });
  
  currentY += 15;
  
  // Recent Transactions with enhanced formatting
  if (reportData.transactions && reportData.transactions.length > 0) {
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent Transaction Summary', 20, currentY);
    currentY += 10;
    
    const transactionHeaders = ['Date', 'Description', 'Type', 'Amount'];
    const transactionData = reportData.transactions.slice(0, 15).map(t => [
      new Date(t.date).toLocaleDateString('en-IN'),
      (t.description || 'N/A').substring(0, 30) + (t.description?.length > 30 ? '...' : ''),
      (t.category?.replace('_', ' ') || 'N/A').toUpperCase(),
      `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${t.amount.toLocaleString()}`
    ]);
    
    autoTable(pdf, {
      head: [transactionHeaders],
      body: transactionData,
      startY: currentY,
      theme: 'striped',
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 6
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: 20, right: 20 }
    });
  }
  
  // Add recommendations section
  currentY = (pdf as any).lastAutoTable?.finalY + 20 || currentY + 20;
  
  pdf.setTextColor(75, 85, 99);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Management Recommendations', 20, currentY);
  currentY += 15;
  
  const recommendations = [];
  if (profitMargin < 10) {
    recommendations.push('• Consider reviewing pricing strategy to improve profit margins');
  }
  if (expenseRatio > 80) {
    recommendations.push('• Focus on expense optimization to improve operational efficiency');
  }
  if (metrics.cashPosition < 0) {
    recommendations.push('• Implement cash flow management strategies');
  }
  if (recommendations.length === 0) {
    recommendations.push('• Continue current operational strategy - performance indicators are healthy');
  }
  recommendations.push('• Regular monthly reviews recommended for sustained growth');
  
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  recommendations.forEach(rec => {
    pdf.text(rec, 25, currentY);
    currentY += 12;
  });
  
  addFooter(pdf);
  
  const fileName = `${SYSTEM_CONFIG.DEFAULT_REPORT_TITLE.replace(/\s+/g, '_')}_Business_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Daily Credit-Debit Report Export Functions
interface DailyBalance {
  date: string;
  openingBalance: number;
  credits: number;
  debits: number;
  closingBalance: number;
  creditTransactions: number;
  debitTransactions: number;
}

interface DailyCreditDebitSummary {
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  finalBalance: number;
}

export const exportDailyCreditDebitToPDF = async (
  dailyBalances: DailyBalance[],
  reportTitle: string,
  dateRange: { from: string; to: string },
  summary: DailyCreditDebitSummary
): Promise<void> => {
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  const formatCurrency = (amount: number) => {
    const sign = amount < 0 ? '-' : '';
    return `${sign}${SYSTEM_CONFIG.CURRENCY_SYMBOL}${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ============ HEADER ============
  let currentY = margin;

  // Company name
  pdf.setTextColor(33, 33, 33);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(SYSTEM_CONFIG.DEFAULT_REPORT_TITLE, margin, currentY);
  currentY += 8;

  // Report title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportTitle, margin, currentY);
  currentY += 6;

  // Date range and generation info
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Report Period: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`, margin, currentY);

  const genDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const genText = `Generated: ${genDate}`;
  const genWidth = pdf.getTextWidth(genText);
  pdf.text(genText, pageWidth - margin - genWidth, currentY);

  currentY += 4;

  // Separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // ============ SUMMARY SECTION ============
  pdf.setTextColor(33, 33, 33);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SUMMARY', margin, currentY);
  currentY += 6;

  // Summary table
  const summaryData = [
    ['Opening Balance', formatCurrency(summary.openingBalance), formatDate(dateRange.from)],
    ['Total Credits (In)', formatCurrency(summary.totalCredits), 'Money received'],
    ['Total Debits (Out)', formatCurrency(summary.totalDebits), 'Money paid'],
    ['Closing Balance', formatCurrency(summary.finalBalance), formatDate(dateRange.to)]
  ];

  autoTable(pdf, {
    startY: currentY,
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      textColor: [33, 33, 33]
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 60,
        halign: 'left'
      },
      1: {
        cellWidth: 50,
        halign: 'right',
        fontStyle: 'bold'
      },
      2: {
        cellWidth: 80,
        halign: 'left',
        textColor: [120, 120, 120],
        fontSize: 9
      }
    },
    didDrawCell: (data: any) => {
      // Add subtle bottom border to each row
      if (data.section === 'body' && data.column.index === 0) {
        const { x, y, width, height } = data.cell;
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.3);
        pdf.line(x, y + height, x + contentWidth, y + height);
      }
    }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;

  // ============ DAILY BREAKDOWN ============
  pdf.setTextColor(33, 33, 33);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DAILY BREAKDOWN', margin, currentY);
  currentY += 2;

  // Prepare table data
  const tableData = dailyBalances.map(day => [
    formatDate(day.date),
    formatCurrency(day.openingBalance),
    formatCurrency(day.credits),
    `${day.creditTransactions}`,
    formatCurrency(day.debits),
    `${day.debitTransactions}`,
    formatCurrency(day.closingBalance)
  ]);

  // Add totals row
  const totalCreditTxns = dailyBalances.reduce((sum, d) => sum + d.creditTransactions, 0);
  const totalDebitTxns = dailyBalances.reduce((sum, d) => sum + d.debitTransactions, 0);

  tableData.push([
    'TOTAL',
    '',
    formatCurrency(summary.totalCredits),
    `${totalCreditTxns}`,
    formatCurrency(summary.totalDebits),
    `${totalDebitTxns}`,
    formatCurrency(summary.finalBalance)
  ]);

  autoTable(pdf, {
    startY: currentY,
    head: [['Date', 'Opening Bal.', 'Credits', '#', 'Debits', '#', 'Closing Bal.']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [33, 33, 33],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [33, 33, 33],
      lineWidth: 0.1,
      lineColor: [220, 220, 220]
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252]
    },
    columnStyles: {
      0: {
        cellWidth: 35,
        fontStyle: 'normal',
        halign: 'left'
      },
      1: {
        cellWidth: 38,
        halign: 'right'
      },
      2: {
        cellWidth: 35,
        halign: 'right',
        fontStyle: 'bold'
      },
      3: {
        cellWidth: 15,
        halign: 'center',
        textColor: [120, 120, 120],
        fontSize: 8
      },
      4: {
        cellWidth: 35,
        halign: 'right',
        fontStyle: 'bold'
      },
      5: {
        cellWidth: 15,
        halign: 'center',
        textColor: [120, 120, 120],
        fontSize: 8
      },
      6: {
        cellWidth: 38,
        halign: 'right',
        fontStyle: 'bold'
      }
    },
    didParseCell: (data: any) => {
      // Style the totals row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [240, 240, 240];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 10;
        data.cell.styles.lineWidth = 0.5;
        data.cell.styles.lineColor = [180, 180, 180];
      }
    }
  });

  // ============ FOOTER ============
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(SYSTEM_CONFIG.DEFAULT_REPORT_TITLE, margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    const confText = 'Confidential';
    const confWidth = pdf.getTextWidth(confText);
    pdf.text(confText, pageWidth - margin - confWidth, pageHeight - 10);
  }

  const fileName = `Daily_Credit_Debit_Report_${dateRange.from}_to_${dateRange.to}.pdf`;
  pdf.save(fileName);
};

export const exportDailyCreditDebitToExcel = async (
  dailyBalances: DailyBalance[],
  reportTitle: string,
  dateRange: { from: string; to: string },
  summary: DailyCreditDebitSummary
): Promise<void> => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary section
  const summaryData = [
    [reportTitle],
    [`Period: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`],
    [''],
    ['Summary'],
    ['Opening Balance', summary.openingBalance, formatDate(dateRange.from)],
    ['Total Credits (IN)', summary.totalCredits, 'Money Received'],
    ['Total Debits (OUT)', summary.totalDebits, 'Money Paid'],
    ['Closing Balance', summary.finalBalance, formatDate(dateRange.to)],
    [''],
    ['Daily Breakdown'],
    ['Date', 'Opening Balance', 'Credits', '# Credit Txns', 'Debits', '# Debit Txns', 'Closing Balance']
  ];

  // Daily data
  const dailyData = dailyBalances.map(day => [
    formatDate(day.date),
    day.openingBalance,
    day.credits,
    day.creditTransactions,
    day.debits,
    day.debitTransactions,
    day.closingBalance
  ]);

  // Totals row
  const totalCreditTxns = dailyBalances.reduce((sum, d) => sum + d.creditTransactions, 0);
  const totalDebitTxns = dailyBalances.reduce((sum, d) => sum + d.debitTransactions, 0);

  dailyData.push([
    'TOTALS',
    '',
    summary.totalCredits,
    totalCreditTxns,
    summary.totalDebits,
    totalDebitTxns,
    summary.finalBalance
  ]);

  // Combine all data
  const wsData = [...summaryData, ...dailyData];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Date
    { wch: 18 }, // Opening Balance
    { wch: 15 }, // Credits
    { wch: 15 }, // # Credit Txns
    { wch: 15 }, // Debits
    { wch: 15 }, // # Debit Txns
    { wch: 18 }  // Closing Balance
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Credit-Debit');

  // Generate filename
  const fileName = `Daily_Credit_Debit_Report_${dateRange.from}_to_${dateRange.to}.xlsx`;

  // Save file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
};

export const formatCurrency = (amount: number): string => {
  return `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;
};