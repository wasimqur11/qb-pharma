import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  pdf.text('QB Pharmacy Management', margin, 25);
  
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
    pdf.text('QB Pharmacy Management System', 20, pageHeight - 12);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 12);
    pdf.text('Confidential Business Report', pageWidth / 2 - 40, pageHeight - 12);
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
        ? `₹${item.value.toLocaleString()}` 
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
    
    pdf.setTextColor(item.value >= 0 ? [34, 197, 94] : [239, 68, 68]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`₹${item.value.toLocaleString()}`, xPos + 100, yPos);
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
      `₹${t.amount.toLocaleString()}`
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
    [`QB Pharmacy Management - ${data.title}`],
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

export const exportTransactionsToExcel = (transactions: any[], title: string = 'Transactions'): void => {
  const workbook = XLSX.utils.book_new();
  
  const headers = ['Date', 'Description', 'Category', 'Stakeholder', 'Amount', 'Bill No', 'Created By'];
  const data = transactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.description || 'N/A',
    t.category?.replace('_', ' ').toUpperCase() || 'N/A',
    t.stakeholderId || 'N/A',
    t.amount,
    t.billNo || 'N/A',
    t.createdBy || 'N/A'
  ]);
  
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const summary = [
    ['Total Transactions', transactions.length],
    ['Total Amount', `₹${totalAmount.toLocaleString()}`],
    ['Period', `${new Date().toLocaleDateString()}`]
  ];
  
  const worksheetData = [
    [`QB Pharmacy Management - ${title}`],
    [`Generated on: ${new Date().toLocaleDateString()}`],
    [''],
    ['Summary'],
    ...summary,
    [''],
    headers,
    ...data
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  worksheet['!cols'] = [
    { width: 15 },  // Date
    { width: 30 },  // Description
    { width: 20 },  // Category
    { width: 20 },  // Stakeholder
    { width: 15 },  // Amount
    { width: 15 },  // Bill No
    { width: 20 }   // Created By
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
  const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString()}`;
};