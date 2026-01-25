import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  TruckIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Phase 2 Types
interface DistributorBreakdown {
  distributorId: string;
  distributorName: string;
  currentCreditBalance: number;
  percentageOfTotal: number;
  last4WeeksPayments: number[];
  creditGrowthTrend: number;
  creditGrowthAmount: number;
  recommendedReturn: number;
  weeklyAvgPayment: number;
}

interface TrendDataPoint {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  creditBalance: number;
  salesCoverageRatio: number;
  paymentCapacity: number;
  targetPayment: number;
  creditToSalesRatio: number;
  sales: number;
  payments: number;
}

interface ProjectionScenario {
  scenario: 'continue_trend' | 'take_action' | 'optimal';
  weeks: number[];
  creditBalances: number[];
  description: string;
}

interface CreditProjection {
  currentCredit: number;
  sustainableCredit: number;
  scenarios: ProjectionScenario[];
}

interface WeekComparison {
  metric: string;
  current: number;
  lastWeek: number;
  fourWeeksAgo: number;
  change: number;
  changePercentage: number;
}

interface SeasonalPattern {
  month: number;
  monthName: string;
  avgSales: number;
  avgCredit: number;
  isLowSeason: boolean;
  isHighSeason: boolean;
  adjustment: number;
}

// Types
interface SalesCoverageAnalysis {
  targetWeeklyPayment: number;
  targetPaymentPercentage: number;
  previousWeekSales: number;
  salesAllocationPercentage: number;
  actualPaymentCapacity: number;
  salesCoverageRatio: number;
  requiredWeeklySales: number;
  paymentShortfall: number;
  creditToSalesRatio: number;
  // Credit Stability Metrics
  sustainableCreditLevel: number;
  currentCreditLevel: number;
  creditOverage: number;
  creditGrowthTrend: number;
  creditGrowthAmount: number;
  creditStabilityStatus: 'growing' | 'stable' | 'declining';
}

interface BusinessHealthScore {
  status: 'healthy' | 'cautionary' | 'warning' | 'critical';
  score: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
}

interface ActionRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  impact?: string;
  specificActions?: string[];
}

interface WeeklyInsightsReport {
  weekInfo: {
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    year: number;
  };
  openingSnapshot: {
    distributorCreditBalance: number;
    pharmacyCashPosition: number;
  };
  businessHealthScore: BusinessHealthScore;
  salesCoverageAnalysis: SalesCoverageAnalysis;
  actionRecommendations: ActionRecommendation[];
  distributorActivity: {
    creditPurchases: { count: number; amount: number };
    creditNotes: { count: number; amount: number };
    payments: { count: number; amount: number };
    netCreditChange: number;
  };
  revenueActivity: {
    pharmacySales: { count: number; amount: number };
    patientPayments: { count: number; amount: number };
    otherIncome: { count: number; amount: number };
    totalRevenue: number;
  };
  expenseActivity: {
    employeeSalaries: { count: number; amount: number };
    partnerDistributions: { count: number; amount: number };
    otherExpenses: { count: number; amount: number };
    totalExpenses: number;
  };
  paymentAnalysis: {
    estimatedPayments: number;
    actualPayments: number;
    variance: number;
    variancePercentage: number;
    adherenceScore: number;
  };
  profitability: {
    grossRevenue: number;
    totalOutflows: number;
    netCashFlow: number;
    profitAllocationRealized: number;
    profitPercentage: number;
  };
  closingSnapshot: {
    distributorCreditBalance: number;
    pharmacyCashPosition: number;
    netPositionChange: number;
  };
  insights: string[];
}

const WeeklyBusinessInsights: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<WeeklyInsightsReport | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historicalData, setHistoricalData] = useState<WeeklyInsightsReport[]>([]);

  // Phase 2 State
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [distributorBreakdown, setDistributorBreakdown] = useState<DistributorBreakdown[]>([]);
  const [creditProjection, setCreditProjection] = useState<CreditProjection | null>(null);
  const [weekComparisons, setWeekComparisons] = useState<WeekComparison[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPattern[]>([]);
  const [stockReturnTarget, setStockReturnTarget] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'distributors' | 'projection' | 'seasonal'>('overview');

  // Get Friday of the current week (week runs Friday to Thursday)
  const getFridayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    // Calculate days back to most recent Friday
    // Friday=5: (5+2)%7=0, Saturday=6: (6+2)%7=1, Sunday=0: (0+2)%7=2, etc.
    const daysBack = (day + 2) % 7;
    const diff = d.getDate() - daysBack;
    const friday = new Date(d.setDate(diff));
    friday.setHours(0, 0, 0, 0);
    return friday;
  };

  // Alias for consistency with code
  const getMondayOfWeek = getFridayOfWeek;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateWithDay = (dateStr: string): { dateText: string; dayName: string } => {
    const date = new Date(dateStr);
    return {
      dateText: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      dayName: date.toLocaleDateString('en-IN', { weekday: 'long' })
    };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatLakh = (amount: number): string => {
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  // Fetch weekly insights
  const fetchWeeklyInsights = async (date: Date) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        date: date.toISOString(),
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights`
        : `${apiBase}/api/reports/weekly-insights`;

      const response = await fetch(
        `${apiUrl}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weekly insights');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Error fetching weekly insights:', err);
      setError('Failed to load weekly insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data for charts
  const fetchHistoricalData = async (weeksBack: number = 8) => {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        weeksBack: weeksBack.toString(),
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights/historical`
        : `${apiBase}/api/reports/weekly-insights/historical`;

      const response = await fetch(
        `${apiUrl}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();
      setHistoricalData(data.reports || []);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  };

  // Fetch Phase 2 data
  const fetchTrendData = async (weeksBack: number = 12) => {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        weeksBack: weeksBack.toString(),
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights/trends`
        : `${apiBase}/api/reports/weekly-insights/trends`;

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrendData(data);
      }
    } catch (err) {
      console.error('Error fetching trend data:', err);
    }
  };

  const fetchDistributorBreakdown = async (date: Date) => {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        date: date.toISOString(),
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights/distributor-breakdown`
        : `${apiBase}/api/reports/weekly-insights/distributor-breakdown`;

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDistributorBreakdown(data);
      }
    } catch (err) {
      console.error('Error fetching distributor breakdown:', err);
    }
  };

  const fetchCreditProjection = async (date: Date) => {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        date: date.toISOString(),
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights/projection`
        : `${apiBase}/api/reports/weekly-insights/projection`;

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCreditProjection(data);
        setStockReturnTarget(data.sustainableCredit);
      }
    } catch (err) {
      console.error('Error fetching credit projection:', err);
    }
  };

  const fetchWeekComparisons = async (date: Date) => {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        date: date.toISOString(),
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights/comparisons`
        : `${apiBase}/api/reports/weekly-insights/comparisons`;

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWeekComparisons(data);
      }
    } catch (err) {
      console.error('Error fetching week comparisons:', err);
    }
  };

  const fetchSeasonalPatterns = async () => {
    try {
      const token = localStorage.getItem('qb_pharma_token');
      const pharmaUnitId = user?.pharmaUnitId || '';

      const queryParams = new URLSearchParams({
        monthsBack: '12',
        ...(user?.role === 'super_admin' && pharmaUnitId && { pharmaUnitId })
      });

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiUrl = apiBase.endsWith('/api')
        ? `${apiBase}/reports/weekly-insights/seasonal`
        : `${apiBase}/api/reports/weekly-insights/seasonal`;

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSeasonalPatterns(data);
      }
    } catch (err) {
      console.error('Error fetching seasonal patterns:', err);
    }
  };

  useEffect(() => {
    fetchWeeklyInsights(selectedDate);
    fetchHistoricalData(8);
    fetchTrendData(12);
    fetchDistributorBreakdown(selectedDate);
    fetchCreditProjection(selectedDate);
    fetchWeekComparisons(selectedDate);
    fetchSeasonalPatterns();
  }, [selectedDate]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  // Navigate to current week
  const goToCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Business Insights Report', 14, 20);

    // Week info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Week ${report.weekInfo.weekNumber}, ${report.weekInfo.year} (${formatDate(report.weekInfo.weekStart)} - ${formatDate(report.weekInfo.weekEnd)})`,
      14,
      28
    );

    let yPos = 38;

    // Opening Snapshot
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Opening Position', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Amount']],
      body: [
        ['Distributor Credit Balance', formatCurrency(report.openingSnapshot.distributorCreditBalance)],
        ['Pharmacy Cash Position', formatCurrency(report.openingSnapshot.pharmacyCashPosition)]
      ],
      theme: 'striped'
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Revenue Activity
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Activity', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Count', 'Amount']],
      body: [
        ['Pharmacy Sales', report.revenueActivity.pharmacySales.count, formatCurrency(report.revenueActivity.pharmacySales.amount)],
        ['Patient Payments', report.revenueActivity.patientPayments.count, formatCurrency(report.revenueActivity.patientPayments.amount)],
        ['Other Income', report.revenueActivity.otherIncome.count, formatCurrency(report.revenueActivity.otherIncome.amount)],
        ['Total Revenue', '-', formatCurrency(report.revenueActivity.totalRevenue)]
      ],
      theme: 'striped'
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Expenses
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Activity', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Count', 'Amount']],
      body: [
        ['Distributor Payments', report.distributorActivity.payments.count, formatCurrency(report.distributorActivity.payments.amount)],
        ['Employee Salaries', report.expenseActivity.employeeSalaries.count, formatCurrency(report.expenseActivity.employeeSalaries.amount)],
        ['Partner Distributions', report.expenseActivity.partnerDistributions.count, formatCurrency(report.expenseActivity.partnerDistributions.amount)],
        ['Other Expenses', report.expenseActivity.otherExpenses.count, formatCurrency(report.expenseActivity.otherExpenses.amount)],
        ['Total Expenses', '-', formatCurrency(report.expenseActivity.totalExpenses)]
      ],
      theme: 'striped'
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Profitability
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Profitability Summary', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Amount']],
      body: [
        ['Gross Revenue', formatCurrency(report.profitability.grossRevenue)],
        ['Total Outflows', formatCurrency(report.profitability.totalOutflows)],
        ['Net Cash Flow', formatCurrency(report.profitability.netCashFlow)],
        ['Profit Percentage', `${report.profitability.profitPercentage.toFixed(2)}%`]
      ],
      theme: 'striped'
    });

    // Save PDF
    doc.save(`Weekly_Insights_Week${report.weekInfo.weekNumber}_${report.weekInfo.year}.pdf`);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Weekly Business Insights Report'],
      [`Week ${report.weekInfo.weekNumber}, ${report.weekInfo.year}`],
      [`Period: ${formatDate(report.weekInfo.weekStart)} - ${formatDate(report.weekInfo.weekEnd)}`],
      [],
      ['Opening Position'],
      ['Distributor Credit Balance', report.openingSnapshot.distributorCreditBalance],
      ['Pharmacy Cash Position', report.openingSnapshot.pharmacyCashPosition],
      [],
      ['Revenue Activity'],
      ['Category', 'Count', 'Amount'],
      ['Pharmacy Sales', report.revenueActivity.pharmacySales.count, report.revenueActivity.pharmacySales.amount],
      ['Patient Payments', report.revenueActivity.patientPayments.count, report.revenueActivity.patientPayments.amount],
      ['Other Income', report.revenueActivity.otherIncome.count, report.revenueActivity.otherIncome.amount],
      ['Total Revenue', '', report.revenueActivity.totalRevenue],
      [],
      ['Expense Activity'],
      ['Category', 'Count', 'Amount'],
      ['Distributor Payments', report.distributorActivity.payments.count, report.distributorActivity.payments.amount],
      ['Employee Salaries', report.expenseActivity.employeeSalaries.count, report.expenseActivity.employeeSalaries.amount],
      ['Partner Distributions', report.expenseActivity.partnerDistributions.count, report.expenseActivity.partnerDistributions.amount],
      ['Other Expenses', report.expenseActivity.otherExpenses.count, report.expenseActivity.otherExpenses.amount],
      ['Total Expenses', '', report.expenseActivity.totalExpenses],
      [],
      ['Profitability'],
      ['Gross Revenue', report.profitability.grossRevenue],
      ['Total Outflows', report.profitability.totalOutflows],
      ['Net Cash Flow', report.profitability.netCashFlow],
      ['Profit Percentage', report.profitability.profitPercentage / 100]
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Save Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `Weekly_Insights_Week${report.weekInfo.weekNumber}_${report.weekInfo.year}.xlsx`);
  };

  // Render metric card
  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
  }> = ({ title, value, icon: Icon, color, trend, subtitle }) => {
    return (
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
              ) : trend === 'down' ? (
                <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          )}
        </div>
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    );
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading weekly insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchWeeklyInsights(selectedDate)}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center text-gray-400 py-12">
        No data available
      </div>
    );
  }

  // Prepare chart data
  const revenueExpenseChartData = [
    { name: 'Pharmacy Sales', value: report.revenueActivity.pharmacySales.amount, fill: '#10b981' },
    { name: 'Patient Payments', value: report.revenueActivity.patientPayments.amount, fill: '#3b82f6' },
    { name: 'Other Income', value: report.revenueActivity.otherIncome.amount, fill: '#8b5cf6' }
  ];

  const expenseChartData = [
    { name: 'Distributor Payments', value: report.distributorActivity.payments.amount, fill: '#ef4444' },
    { name: 'Employee Salaries', value: report.expenseActivity.employeeSalaries.amount, fill: '#f59e0b' },
    { name: 'Partner Distributions', value: report.expenseActivity.partnerDistributions.amount, fill: '#6366f1' },
    { name: 'Other Expenses', value: report.expenseActivity.otherExpenses.amount, fill: '#94a3b8' }
  ];

  // Historical trend data for 8-week chart
  const historicalTrendData = historicalData
    .slice()
    .reverse()
    .map((r) => ({
      week: `W${r.weekInfo.weekNumber}`,
      revenue: r.revenueActivity.totalRevenue / 100000,
      expenses: r.expenseActivity.totalExpenses / 100000,
      cashFlow: r.profitability.netCashFlow / 100000,
      distributorCredit: r.closingSnapshot.distributorCreditBalance / 100000
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Weekly Business Insights</h1>
          <p className="text-gray-400 mt-1">
            Comprehensive weekly analysis of business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Excel
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </button>

          <div className="flex items-center gap-4">
            <CalendarIcon className="h-6 w-6 text-blue-500" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                Week {report.weekInfo.weekNumber}, {report.weekInfo.year}
              </h2>
              <p className="text-sm text-gray-400">
                {formatDateWithDay(report.weekInfo.weekStart).dateText} ({formatDateWithDay(report.weekInfo.weekStart).dayName}) - {formatDateWithDay(report.weekInfo.weekEnd).dateText} ({formatDateWithDay(report.weekInfo.weekEnd).dayName})
              </p>
            </div>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Current Week
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            disabled={getMondayOfWeek(selectedDate) >= getMondayOfWeek(new Date())}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Business Health Score Card */}
      <div className={`rounded-lg border-2 p-6 ${
        report.businessHealthScore.color === 'green' ? 'bg-green-900/20 border-green-600' :
        report.businessHealthScore.color === 'yellow' ? 'bg-yellow-900/20 border-yellow-600' :
        report.businessHealthScore.color === 'orange' ? 'bg-orange-900/20 border-orange-600' :
        'bg-red-900/20 border-red-600'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              report.businessHealthScore.color === 'green' ? 'bg-green-600' :
              report.businessHealthScore.color === 'yellow' ? 'bg-yellow-600' :
              report.businessHealthScore.color === 'orange' ? 'bg-orange-600' :
              'bg-red-600'
            }`}>
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Business Health Status</h2>
              <p className={`text-sm font-medium ${
                report.businessHealthScore.color === 'green' ? 'text-green-400' :
                report.businessHealthScore.color === 'yellow' ? 'text-yellow-400' :
                report.businessHealthScore.color === 'orange' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {report.businessHealthScore.status.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Sales Coverage Ratio</p>
            <p className={`text-4xl font-bold ${
              report.businessHealthScore.color === 'green' ? 'text-green-400' :
              report.businessHealthScore.color === 'yellow' ? 'text-yellow-400' :
              report.businessHealthScore.color === 'orange' ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {report.salesCoverageAnalysis.salesCoverageRatio.toFixed(0)}%
            </p>
          </div>
        </div>
        <p className="text-gray-300 text-base">{report.businessHealthScore.message}</p>
      </div>

      {/* Sales Coverage Analysis */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
          Sales Coverage Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Distributor Credit</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(report.openingSnapshot.distributorCreditBalance)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Target Weekly Payment ({report.salesCoverageAnalysis.targetPaymentPercentage}%)</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{formatCurrency(report.salesCoverageAnalysis.targetWeeklyPayment)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Previous Week Sales</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(report.salesCoverageAnalysis.previousWeekSales)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Payment Capacity ({report.salesCoverageAnalysis.salesAllocationPercentage}% of sales)</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(report.salesCoverageAnalysis.actualPaymentCapacity)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Required Weekly Sales</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{formatCurrency(report.salesCoverageAnalysis.requiredWeeklySales)}</p>
            <p className="text-xs text-gray-500 mt-1">To meet {report.salesCoverageAnalysis.targetPaymentPercentage}% target</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Payment Shortfall/Surplus</p>
            <p className={`text-2xl font-bold mt-1 ${report.salesCoverageAnalysis.paymentShortfall > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {report.salesCoverageAnalysis.paymentShortfall > 0 ? '-' : '+'}{formatCurrency(Math.abs(report.salesCoverageAnalysis.paymentShortfall))}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Credit Stability Status</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-bold ${
                report.salesCoverageAnalysis.creditStabilityStatus === 'stable' ? 'text-green-400' :
                report.salesCoverageAnalysis.creditStabilityStatus === 'growing' ? 'text-orange-400' :
                'text-blue-400'
              }`}>
                {report.salesCoverageAnalysis.creditStabilityStatus.toUpperCase()}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {report.salesCoverageAnalysis.creditGrowthTrend > 0 ? '+' : ''}{report.salesCoverageAnalysis.creditGrowthTrend.toFixed(1)}% over 4 weeks
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Sustainable Credit Level</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {formatCurrency(report.salesCoverageAnalysis.sustainableCreditLevel)}
            </p>
            <p className="text-xs text-gray-500 mt-1">7 weeks optimal inventory</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Credit Overage/Underage</p>
            <p className={`text-2xl font-bold mt-1 ${
              Math.abs(report.salesCoverageAnalysis.creditOverage) < report.salesCoverageAnalysis.sustainableCreditLevel * 0.1 ? 'text-green-400' :
              report.salesCoverageAnalysis.creditOverage > 0 ? 'text-orange-400' :
              'text-yellow-400'
            }`}>
              {report.salesCoverageAnalysis.creditOverage > 0 ? '+' : ''}{formatCurrency(report.salesCoverageAnalysis.creditOverage)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.abs(report.salesCoverageAnalysis.creditOverage) < report.salesCoverageAnalysis.sustainableCreditLevel * 0.1 ? 'Within optimal range' :
               report.salesCoverageAnalysis.creditOverage > 0 ? 'Above sustainable level' : 'Below sustainable level'}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Credit-to-Sales Ratio</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {report.salesCoverageAnalysis.creditToSalesRatio > 100 ? '100+' : report.salesCoverageAnalysis.creditToSalesRatio.toFixed(1)} weeks
            </p>
            <p className="text-xs text-gray-500 mt-1">Target: 6-8 weeks</p>
          </div>
        </div>
      </div>

      {/* Action Recommendations */}
      {report.actionRecommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <LightBulbIcon className="h-7 w-7 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Action Recommendations</h3>
          </div>
          <div className="space-y-4">
            {report.actionRecommendations.map((recommendation, index) => (
              <div key={index} className={`bg-gray-900/50 rounded-lg p-4 border-l-4 ${
                recommendation.priority === 'high' ? 'border-red-500' :
                recommendation.priority === 'medium' ? 'border-yellow-500' :
                'border-blue-500'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${
                    recommendation.priority === 'high' ? 'bg-red-500/20' :
                    recommendation.priority === 'medium' ? 'bg-yellow-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {recommendation.priority === 'high' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    ) : recommendation.priority === 'medium' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        recommendation.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        recommendation.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                      <h4 className="text-base font-semibold text-white">{recommendation.action}</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{recommendation.reason}</p>
                    {recommendation.impact && (
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="font-medium text-blue-400">Impact:</span> {recommendation.impact}
                      </p>
                    )}
                    {recommendation.specificActions && recommendation.specificActions.length > 0 && (
                      <ul className="ml-4 mt-2 space-y-1">
                        {recommendation.specificActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights & Alerts */}
      {report.insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <LightBulbIcon className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Insights & Alerts</h3>
          </div>
          <div className="space-y-2">
            {report.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-gray-300">
                {insight.includes('✅') ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : insight.includes('⚠️') ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <LightBulbIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{insight.replace(/[✅⚠️💡]/g, '').trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opening Snapshot */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Opening Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Distributor Credit Balance"
            value={report.openingSnapshot.distributorCreditBalance}
            icon={TruckIcon}
            color="bg-orange-600"
            subtitle="Amount owed to distributors"
          />
          <MetricCard
            title="Pharmacy Cash Position"
            value={report.openingSnapshot.pharmacyCashPosition}
            icon={BanknotesIcon}
            color="bg-green-600"
            subtitle="Available cash at week start"
          />
        </div>
      </div>

      {/* Revenue & Expense Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Revenue"
          value={report.revenueActivity.totalRevenue}
          icon={ArrowTrendingUpIcon}
          color="bg-green-600"
          trend="up"
          subtitle={`${report.revenueActivity.pharmacySales.count + report.revenueActivity.patientPayments.count + report.revenueActivity.otherIncome.count} transactions`}
        />
        <MetricCard
          title="Total Expenses"
          value={report.expenseActivity.totalExpenses}
          icon={ArrowTrendingDownIcon}
          color="bg-red-600"
          trend="down"
          subtitle="All outflows for the week"
        />
        <MetricCard
          title="Net Cash Flow"
          value={report.profitability.netCashFlow}
          icon={CurrencyDollarIcon}
          color={report.profitability.netCashFlow >= 0 ? 'bg-blue-600' : 'bg-red-600'}
          trend={report.profitability.netCashFlow >= 0 ? 'up' : 'down'}
          subtitle={`${report.profitability.profitPercentage.toFixed(1)}% profit margin`}
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Activity</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 pb-2">Category</th>
                  <th className="text-right text-sm font-medium text-gray-400 pb-2">Count</th>
                  <th className="text-right text-sm font-medium text-gray-400 pb-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="py-3 text-sm text-gray-300">Pharmacy Sales</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.revenueActivity.pharmacySales.count}</td>
                  <td className="py-3 text-sm font-medium text-green-400 text-right">{formatCurrency(report.revenueActivity.pharmacySales.amount)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-300">Patient Payments</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.revenueActivity.patientPayments.count}</td>
                  <td className="py-3 text-sm font-medium text-green-400 text-right">{formatCurrency(report.revenueActivity.patientPayments.amount)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-300">Other Income</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.revenueActivity.otherIncome.count}</td>
                  <td className="py-3 text-sm font-medium text-green-400 text-right">{formatCurrency(report.revenueActivity.otherIncome.amount)}</td>
                </tr>
                <tr className="border-t-2 border-gray-600">
                  <td className="py-3 text-sm font-semibold text-white">Total Revenue</td>
                  <td className="py-3 text-sm text-gray-300 text-right">-</td>
                  <td className="py-3 text-sm font-bold text-green-500 text-right">{formatCurrency(report.revenueActivity.totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={revenueExpenseChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {revenueExpenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distributor Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Distributor Activity</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-sm font-medium text-gray-400 pb-2">Activity</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-2">Count</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-2">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <tr>
              <td className="py-3 text-sm text-gray-300">New Stock Purchased (Credit)</td>
              <td className="py-3 text-sm text-gray-300 text-right">{report.distributorActivity.creditPurchases.count}</td>
              <td className="py-3 text-sm font-medium text-orange-400 text-right">{formatCurrency(report.distributorActivity.creditPurchases.amount)}</td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-gray-300">Stock Returns (Credit Notes)</td>
              <td className="py-3 text-sm text-gray-300 text-right">{report.distributorActivity.creditNotes.count}</td>
              <td className="py-3 text-sm font-medium text-blue-400 text-right">{formatCurrency(report.distributorActivity.creditNotes.amount)}</td>
            </tr>
            <tr>
              <td className="py-3 text-sm text-gray-300">Payments Made to Distributors</td>
              <td className="py-3 text-sm text-gray-300 text-right">{report.distributorActivity.payments.count}</td>
              <td className="py-3 text-sm font-medium text-red-400 text-right">{formatCurrency(report.distributorActivity.payments.amount)}</td>
            </tr>
            <tr className="border-t-2 border-gray-600">
              <td className="py-3 text-sm font-semibold text-white">Net Credit Change</td>
              <td className="py-3 text-sm text-gray-300 text-right">-</td>
              <td className={`py-3 text-sm font-bold text-right ${report.distributorActivity.netCreditChange >= 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {report.distributorActivity.netCreditChange >= 0 ? '+' : ''}{formatCurrency(report.distributorActivity.netCreditChange)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Expense Activity</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 pb-2">Category</th>
                  <th className="text-right text-sm font-medium text-gray-400 pb-2">Count</th>
                  <th className="text-right text-sm font-medium text-gray-400 pb-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="py-3 text-sm text-gray-300">Distributor Payments</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.distributorActivity.payments.count}</td>
                  <td className="py-3 text-sm font-medium text-red-400 text-right">{formatCurrency(report.distributorActivity.payments.amount)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-300">Employee Salaries</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.expenseActivity.employeeSalaries.count}</td>
                  <td className="py-3 text-sm font-medium text-red-400 text-right">{formatCurrency(report.expenseActivity.employeeSalaries.amount)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-300">Partner Distributions</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.expenseActivity.partnerDistributions.count}</td>
                  <td className="py-3 text-sm font-medium text-red-400 text-right">{formatCurrency(report.expenseActivity.partnerDistributions.amount)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-300">Other Expenses</td>
                  <td className="py-3 text-sm text-gray-300 text-right">{report.expenseActivity.otherExpenses.count}</td>
                  <td className="py-3 text-sm font-medium text-red-400 text-right">{formatCurrency(report.expenseActivity.otherExpenses.amount)}</td>
                </tr>
                <tr className="border-t-2 border-gray-600">
                  <td className="py-3 text-sm font-semibold text-white">Total Expenses</td>
                  <td className="py-3 text-sm text-gray-300 text-right">-</td>
                  <td className="py-3 text-sm font-bold text-red-500 text-right">{formatCurrency(report.expenseActivity.totalExpenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseChartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Analysis */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Estimated Payments</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(report.paymentAnalysis.estimatedPayments)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Actual Payments</p>
            <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(report.paymentAnalysis.actualPayments)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Variance</p>
            <p className={`text-xl font-bold mt-1 ${report.paymentAnalysis.variance >= 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {report.paymentAnalysis.variance >= 0 ? '+' : ''}{formatCurrency(report.paymentAnalysis.variance)}
              <span className="text-sm ml-2">({report.paymentAnalysis.variancePercentage.toFixed(1)}%)</span>
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Adherence Score</p>
            <p className={`text-xl font-bold mt-1 ${report.paymentAnalysis.adherenceScore >= 90 && report.paymentAnalysis.adherenceScore <= 110 ? 'text-green-400' : 'text-yellow-400'}`}>
              {report.paymentAnalysis.adherenceScore.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Historical Trends */}
      {historicalTrendData.length > 1 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Historical Trends (Last 8 Weeks)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" label={{ value: 'Amount (Lakhs)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                formatter={(value: number) => formatLakh(value * 100000)}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
              <Line type="monotone" dataKey="cashFlow" stroke="#3b82f6" name="Cash Flow" strokeWidth={2} />
              <Line type="monotone" dataKey="distributorCredit" stroke="#f59e0b" name="Distributor Credit" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Closing Snapshot */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Closing Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Distributor Credit Balance"
            value={report.closingSnapshot.distributorCreditBalance}
            icon={TruckIcon}
            color="bg-orange-600"
            subtitle={`${report.distributorActivity.netCreditChange >= 0 ? '+' : ''}${formatCurrency(report.distributorActivity.netCreditChange)} change`}
          />
          <MetricCard
            title="Pharmacy Cash Position"
            value={report.closingSnapshot.pharmacyCashPosition}
            icon={BanknotesIcon}
            color="bg-green-600"
            subtitle={`${report.closingSnapshot.netPositionChange >= 0 ? '+' : ''}${formatCurrency(report.closingSnapshot.netPositionChange)} change`}
          />
          <MetricCard
            title="Net Position Change"
            value={report.closingSnapshot.netPositionChange}
            icon={ChartBarIcon}
            color={report.closingSnapshot.netPositionChange >= 0 ? 'bg-blue-600' : 'bg-red-600'}
            trend={report.closingSnapshot.netPositionChange >= 0 ? 'up' : 'down'}
            subtitle="Overall week impact"
          />
        </div>
      </div>

      {/* Phase 2: Advanced Analytics Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-1 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Week-over-Week
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'trends'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              12-Week Trends
            </button>
            <button
              onClick={() => setActiveTab('distributors')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'distributors'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Distributor Breakdown
            </button>
            <button
              onClick={() => setActiveTab('projection')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'projection'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Credit Projection
            </button>
            <button
              onClick={() => setActiveTab('seasonal')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'seasonal'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Seasonal Patterns
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Week-over-Week Comparison */}
          {activeTab === 'overview' && weekComparisons.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Week-over-Week Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekComparisons.map((comparison, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-2">{comparison.metric}</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Current Week</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(comparison.current)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">vs Last Week</p>
                          <p className={`text-sm font-medium ${comparison.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {comparison.change >= 0 ? '+' : ''}{formatCurrency(comparison.change)}
                            {' '}({comparison.changePercentage >= 0 ? '+' : ''}{comparison.changePercentage.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">4 Weeks Ago</p>
                          <p className="text-sm text-gray-400">{formatCurrency(comparison.fourWeeksAgo)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12-Week Trends */}
          {activeTab === 'trends' && trendData.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">12-Week Trend Analysis</h3>

              {/* Credit Balance Trend */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">Credit Balance Evolution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="weekNumber" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" label={{ value: 'Amount (Lakhs)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: number) => formatLakh(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="creditBalance" name="Credit Balance" stroke="#f59e0b" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Sales Coverage Ratio Trend */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">Sales Coverage Ratio Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="weekNumber" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" label={{ value: 'Ratio (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="salesCoverageRatio" name="Coverage Ratio" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Capacity vs Target */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">Payment Capacity vs Target</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="weekNumber" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" label={{ value: 'Amount (Lakhs)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: number) => formatLakh(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="paymentCapacity" name="Payment Capacity" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="targetPayment" name="Target Payment" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Credit-to-Sales Ratio */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">Credit-to-Sales Ratio (Weeks of Inventory)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="weekNumber" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" label={{ value: 'Weeks', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: number) => `${value.toFixed(1)} weeks`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="creditToSalesRatio" name="Credit-to-Sales Ratio" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-400 mt-2 text-center">Optimal range: 6-8 weeks</p>
              </div>
            </div>
          )}

          {/* Distributor Breakdown & Stock Return Calculator */}
          {activeTab === 'distributors' && distributorBreakdown.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Distributor-Level Breakdown</h3>

              {/* Stock Return Calculator */}
              {creditProjection && creditProjection.currentCredit > creditProjection.sustainableCredit && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Stock Return Calculator</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Target Credit Level (₹ Lakhs)
                      </label>
                      <input
                        type="number"
                        value={(stockReturnTarget / 100000).toFixed(2)}
                        onChange={(e) => setStockReturnTarget(parseFloat(e.target.value) * 100000)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        step="0.5"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Sustainable level: ₹{(creditProjection.sustainableCredit / 100000).toFixed(2)}L
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Impact Analysis</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Credit:</span>
                          <span className="text-white font-medium">₹{(creditProjection.currentCredit / 100000).toFixed(2)}L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Target Credit:</span>
                          <span className="text-white font-medium">₹{(stockReturnTarget / 100000).toFixed(2)}L</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-700 pt-2">
                          <span className="text-gray-400">Total Returns Needed:</span>
                          <span className="text-orange-400 font-bold">
                            ₹{((creditProjection.currentCredit - stockReturnTarget) / 100000).toFixed(2)}L
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">New Weekly Payment Target:</span>
                          <span className="text-green-400 font-medium">
                            ₹{(stockReturnTarget * 0.1 / 100000).toFixed(2)}L
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Distributor Table */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Distributor
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Current Credit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          % of Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Growth Trend
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Avg Weekly Payment
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Recommended Return
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {distributorBreakdown.map((dist) => (
                        <tr key={dist.distributorId} className="hover:bg-gray-800/50">
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-white">{dist.distributorName}</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="text-sm text-white">{formatCurrency(dist.currentCreditBalance)}</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="text-sm text-gray-400">{dist.percentageOfTotal.toFixed(1)}%</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className={`text-sm font-medium ${
                              dist.creditGrowthTrend > 0 ? 'text-orange-400' :
                              dist.creditGrowthTrend < -5 ? 'text-green-400' :
                              'text-gray-400'
                            }`}>
                              {dist.creditGrowthTrend > 0 ? '+' : ''}{dist.creditGrowthTrend.toFixed(1)}%
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="text-sm text-gray-400">{formatCurrency(dist.weeklyAvgPayment)}</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {dist.recommendedReturn > 0 ? (
                              <p className="text-sm font-medium text-orange-400">
                                {formatCurrency(dist.recommendedReturn)}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">-</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Credit Projection */}
          {activeTab === 'projection' && creditProjection && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Credit Stability Projection (Next 12 Weeks)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Current Credit Level</p>
                  <p className="text-2xl font-bold text-orange-400">
                    ₹{(creditProjection.currentCredit / 100000).toFixed(2)}L
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Sustainable Level (7 weeks)</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{(creditProjection.sustainableCredit / 100000).toFixed(2)}L
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="week"
                      type="number"
                      domain={[0, 12]}
                      stroke="#9ca3af"
                      label={{ value: 'Weeks from Now', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis stroke="#9ca3af" label={{ value: 'Credit (Lakhs)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: number) => `₹${(value / 100000).toFixed(2)}L`}
                    />
                    <Legend />
                    {creditProjection.scenarios.map((scenario, idx) => {
                      const data = scenario.weeks.map((week, i) => ({
                        week,
                        value: scenario.creditBalances[i]
                      }));

                      return (
                        <Line
                          key={idx}
                          data={data}
                          type="monotone"
                          dataKey="value"
                          name={scenario.scenario === 'continue_trend' ? 'Current Trend' :
                                scenario.scenario === 'take_action' ? 'Take Action' :
                                'Optimal Level'}
                          stroke={scenario.scenario === 'continue_trend' ? '#ef4444' :
                                  scenario.scenario === 'take_action' ? '#3b82f6' :
                                  '#10b981'}
                          strokeWidth={scenario.scenario === 'optimal' ? 2 : 3}
                          strokeDasharray={scenario.scenario === 'optimal' ? '5 5' : '0'}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {creditProjection.scenarios.map((scenario, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        scenario.scenario === 'continue_trend' ? 'bg-red-500' :
                        scenario.scenario === 'take_action' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-1">
                          {scenario.scenario === 'continue_trend' ? 'Continue Current Trend' :
                           scenario.scenario === 'take_action' ? 'Take Corrective Action' :
                           'Optimal Sustainable Level'}
                        </h4>
                        <p className="text-sm text-gray-400">{scenario.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          12-week projection: ₹{(scenario.creditBalances[scenario.creditBalances.length - 1] / 100000).toFixed(2)}L
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seasonal Patterns */}
          {activeTab === 'seasonal' && seasonalPatterns.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Seasonal Pattern Analysis (12 Months)</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seasonalPatterns.map((pattern) => (
                  <div
                    key={pattern.month}
                    className={`rounded-lg p-4 border-2 ${
                      pattern.isHighSeason
                        ? 'bg-green-900/20 border-green-600'
                        : pattern.isLowSeason
                        ? 'bg-red-900/20 border-red-600'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <h4 className="text-sm font-semibold text-white mb-2">{pattern.monthName}</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-400">Avg Sales</p>
                        <p className="text-sm font-medium text-white">
                          ₹{(pattern.avgSales / 100000).toFixed(2)}L
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Season Type</p>
                        <p className={`text-xs font-medium ${
                          pattern.isHighSeason ? 'text-green-400' :
                          pattern.isLowSeason ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {pattern.isHighSeason ? 'High Season' :
                           pattern.isLowSeason ? 'Low Season' :
                           'Normal'}
                        </p>
                      </div>
                      {(pattern.isHighSeason || pattern.isLowSeason) && (
                        <div>
                          <p className="text-xs text-gray-400">Adjustment</p>
                          <p className="text-xs font-medium text-blue-400">
                            {pattern.adjustment > 0 ? '+' : ''}{(pattern.adjustment * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">Seasonal Insights</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="text-green-400 font-medium">High Season Months:</span>{' '}
                    {seasonalPatterns.filter(p => p.isHighSeason).map(p => p.monthName).join(', ') || 'None detected'}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="text-red-400 font-medium">Low Season Months:</span>{' '}
                    {seasonalPatterns.filter(p => p.isLowSeason).map(p => p.monthName).join(', ') || 'None detected'}
                  </p>
                  <p className="text-sm text-gray-400 mt-4">
                    During low seasons, credit requirements and payment targets should be adjusted down by the indicated percentage.
                    During high seasons, expect higher sales and inventory turnover.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyBusinessInsights;
