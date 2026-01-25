import { prisma } from '../index';

export interface WeekInfo {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  year: number;
}

export interface DistributorActivity {
  distributorId: string;
  distributorName: string;
  amount: number;
  count: number;
}

export interface CategoryActivity {
  count: number;
  amount: number;
  byDistributor?: DistributorActivity[];
}

export interface DistributorActivitySummary {
  creditPurchases: CategoryActivity;
  creditNotes: CategoryActivity;
  payments: CategoryActivity;
  netCreditChange: number;
}

export interface RevenueActivity {
  pharmacySales: CategoryActivity;
  patientPayments: CategoryActivity;
  otherIncome: CategoryActivity;
  totalRevenue: number;
}

export interface ExpenseActivity {
  employeeSalaries: CategoryActivity;
  partnerDistributions: CategoryActivity;
  otherExpenses: CategoryActivity;
  totalExpenses: number;
}

export interface PaymentAnalysis {
  estimatedPayments: number;
  actualPayments: number;
  variance: number;
  variancePercentage: number;
  adherenceScore: number;
}

export interface Profitability {
  grossRevenue: number;
  totalOutflows: number;
  netCashFlow: number;
  profitAllocationRealized: number;
  profitPercentage: number;
}

export interface SalesCoverageAnalysis {
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

export interface BusinessHealthScore {
  status: 'healthy' | 'cautionary' | 'warning' | 'critical';
  score: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
}

export interface ActionRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  impact?: string;
  specificActions?: string[];
}

export interface DistributorBreakdown {
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

export interface TrendDataPoint {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  creditBalance: number;
  salesCoverageRatio: number;
  paymentCapacity: number;
  targetPayment: number;
  creditToSalesRatio: number;
  sales: number;
  payments: number;
}

export interface ProjectionScenario {
  scenario: 'continue_trend' | 'take_action' | 'optimal';
  weeks: number[];
  creditBalances: number[];
  description: string;
}

export interface CreditProjection {
  currentCredit: number;
  sustainableCredit: number;
  scenarios: ProjectionScenario[];
}

export interface WeekComparison {
  metric: string;
  current: number;
  lastWeek: number;
  fourWeeksAgo: number;
  change: number;
  changePercentage: number;
}

export interface SeasonalPattern {
  month: number;
  monthName: string;
  avgSales: number;
  avgCredit: number;
  isLowSeason: boolean;
  isHighSeason: boolean;
  adjustment: number;
}

export interface WeeklyInsightsReport {
  weekInfo: WeekInfo;
  openingSnapshot: {
    distributorCreditBalance: number;
    pharmacyCashPosition: number;
  };
  businessHealthScore: BusinessHealthScore;
  salesCoverageAnalysis: SalesCoverageAnalysis;
  actionRecommendations: ActionRecommendation[];
  distributorActivity: DistributorActivitySummary;
  revenueActivity: RevenueActivity;
  expenseActivity: ExpenseActivity;
  paymentAnalysis: PaymentAnalysis;
  profitability: Profitability;
  closingSnapshot: {
    distributorCreditBalance: number;
    pharmacyCashPosition: number;
    netPositionChange: number;
  };
  insights: string[];
}

/**
 * Get Friday of the week for a given date
 * Week runs from Friday to Thursday
 */
export function getFridayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days back to most recent Friday
  // Friday=5: (5+2)%7=0, Saturday=6: (6+2)%7=1, Sunday=0: (0+2)%7=2, etc.
  const daysBack = (day + 2) % 7;
  const diff = d.getDate() - daysBack;
  const friday = new Date(d.setDate(diff));
  friday.setHours(0, 0, 0, 0);
  return friday;
}

// Alias for backward compatibility
export function getMondayOfWeek(date: Date): Date {
  return getFridayOfWeek(date);
}

/**
 * Get Thursday of the week for a given date
 * Week runs from Friday to Thursday
 */
export function getThursdayOfWeek(date: Date): Date {
  const friday = getFridayOfWeek(date);
  const thursday = new Date(friday);
  thursday.setDate(friday.getDate() + 6);
  thursday.setHours(23, 59, 59, 999);
  return thursday;
}

// Alias for backward compatibility
export function getSundayOfWeek(date: Date): Date {
  return getThursdayOfWeek(date);
}

/**
 * Get week number (ISO 8601 week numbering)
 */
export function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

/**
 * Calculate distributor credit balance at a specific date
 */
async function calculateDistributorBalanceAtDate(
  pharmaUnitId: string,
  beforeDate: Date
): Promise<number> {
  // Get all distributors' opening balances
  const distributors = await prisma.distributor.findMany({
    where: { pharmaUnitId },
    select: { id: true, creditBalance: true }
  });

  let totalBalance = distributors.reduce((sum, d) => sum + d.creditBalance, 0);

  // Get all distributor transactions before the date
  const transactions = await prisma.transaction.findMany({
    where: {
      pharmaUnitId,
      stakeholderType: 'distributor',
      category: {
        in: ['distributor_credit_purchase', 'distributor_payment', 'distributor_credit_note']
      },
      date: { lt: beforeDate }
    },
    select: { category: true, amount: true }
  });

  // Apply transactions
  transactions.forEach(t => {
    if (t.category === 'distributor_credit_purchase') {
      totalBalance += t.amount;
    } else if (t.category === 'distributor_payment' || t.category === 'distributor_credit_note') {
      totalBalance -= t.amount;
    }
  });

  return Math.max(0, totalBalance);
}

/**
 * Calculate pharmacy cash position at a specific date
 */
async function calculatePharmacyCashAtDate(
  pharmaUnitId: string,
  beforeDate: Date
): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: {
      pharmaUnitId,
      date: { lt: beforeDate }
    },
    select: { category: true, amount: true }
  });

  let cashPosition = 0;

  // Revenue categories (increase cash)
  const revenueCategories = ['pharmacy_sale', 'patient_payment', 'consultation_fee'];

  // Expense categories (decrease cash)
  const expenseCategories = [
    'distributor_payment',
    'employee_salary',
    'doctor_commission',
    'partner_profit_distribution',
    'other_expense'
  ];

  transactions.forEach(t => {
    if (revenueCategories.includes(t.category)) {
      cashPosition += t.amount;
    } else if (expenseCategories.includes(t.category)) {
      cashPosition -= t.amount;
    }
    // Note: distributor_credit_purchase and distributor_credit_note don't affect cash
  });

  return cashPosition;
}

/**
 * Get distributor activity details for a specific category
 */
async function getDistributorActivityByCategory(
  pharmaUnitId: string,
  weekStart: Date,
  weekEnd: Date,
  category: string
): Promise<CategoryActivity> {
  const transactions = await prisma.transaction.findMany({
    where: {
      pharmaUnitId,
      stakeholderType: 'distributor',
      category,
      date: { gte: weekStart, lte: weekEnd }
    },
    select: {
      stakeholderId: true,
      amount: true
    }
  });

  // Group by distributor
  const distributorMap = new Map<string, { amount: number; count: number }>();
  let totalAmount = 0;

  transactions.forEach(t => {
    if (t.stakeholderId) {
      const current = distributorMap.get(t.stakeholderId) || { amount: 0, count: 0 };
      current.amount += t.amount;
      current.count += 1;
      distributorMap.set(t.stakeholderId, current);
      totalAmount += t.amount;
    }
  });

  // Get distributor names
  const distributorIds = Array.from(distributorMap.keys());
  const distributors = await prisma.distributor.findMany({
    where: { id: { in: distributorIds } },
    select: { id: true, name: true }
  });

  const distributorNameMap = new Map(distributors.map(d => [d.id, d.name]));

  const byDistributor: DistributorActivity[] = Array.from(distributorMap.entries()).map(
    ([id, data]) => ({
      distributorId: id,
      distributorName: distributorNameMap.get(id) || 'Unknown',
      amount: data.amount,
      count: data.count
    })
  );

  return {
    count: transactions.length,
    amount: totalAmount,
    byDistributor: byDistributor.sort((a, b) => b.amount - a.amount)
  };
}

/**
 * Get category activity (simple aggregation)
 */
async function getCategoryActivity(
  pharmaUnitId: string,
  weekStart: Date,
  weekEnd: Date,
  category: string
): Promise<CategoryActivity> {
  const result = await prisma.transaction.aggregate({
    where: {
      pharmaUnitId,
      category,
      date: { gte: weekStart, lte: weekEnd }
    },
    _sum: { amount: true },
    _count: true
  });

  return {
    count: result._count,
    amount: result._sum.amount || 0
  };
}

/**
 * Get configuration value with fallback
 */
async function getConfigValue(
  category: string,
  key: string,
  defaultValue: number
): Promise<number> {
  try {
    const config = await prisma.systemConfiguration.findUnique({
      where: {
        category_key: { category, key }
      }
    });
    return config ? parseFloat(config.value) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Get previous week's pharmacy revenue (sales + patient payments) for analysis
 * This represents actual cash inflow from pharmacy operations
 */
async function getPreviousWeekSales(
  pharmaUnitId: string,
  currentWeekStart: Date
): Promise<number> {
  // Previous week ends 1ms before current week starts
  const prevWeekEnd = new Date(currentWeekStart);
  prevWeekEnd.setMilliseconds(prevWeekEnd.getMilliseconds() - 1);

  // Get Friday of the previous week (not 2 weeks ago!)
  const prevWeekStart = getFridayOfWeek(prevWeekEnd);

  // Include all pharmacy revenue categories that increase cash:
  // - pharmacy_sale: Direct sales revenue
  // - patient_payment: Payments from patients who bought on credit
  const prevWeekRevenue = await prisma.transaction.aggregate({
    where: {
      pharmaUnitId,
      category: { in: ['pharmacy_sale', 'patient_payment'] },
      date: { gte: prevWeekStart, lte: prevWeekEnd }
    },
    _sum: { amount: true }
  });

  return prevWeekRevenue._sum.amount || 0;
}

/**
 * Calculate average weekly pharmacy revenue over a period
 * Includes both sales and patient payments (actual cash inflow)
 */
async function getAverageWeeklySales(
  pharmaUnitId: string,
  weeksBack: number,
  endDate: Date
): Promise<number> {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - weeksBack * 7);

  // Include all pharmacy revenue categories that increase cash
  const revenue = await prisma.transaction.aggregate({
    where: {
      pharmaUnitId,
      category: { in: ['pharmacy_sale', 'patient_payment'] },
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  const totalRevenue = revenue._sum.amount || 0;
  return totalRevenue / weeksBack;
}

/**
 * Calculate credit balance growth trend over past weeks
 */
async function calculateCreditGrowthTrend(
  pharmaUnitId: string,
  currentWeekStart: Date,
  weeksBack: number = 4
): Promise<{ growthAmount: number; growthPercentage: number; status: 'growing' | 'stable' | 'declining' }> {
  // Get credit balance 4 weeks ago
  const pastDate = new Date(currentWeekStart);
  pastDate.setDate(pastDate.getDate() - weeksBack * 7);

  const pastCreditBalance = await calculateDistributorBalanceAtDate(pharmaUnitId, pastDate);
  const currentCreditBalance = await calculateDistributorBalanceAtDate(pharmaUnitId, currentWeekStart);

  const growthAmount = currentCreditBalance - pastCreditBalance;
  const growthPercentage = pastCreditBalance > 0
    ? (growthAmount / pastCreditBalance) * 100
    : 0;

  // Determine status: within 5% is considered stable
  let status: 'growing' | 'stable' | 'declining';
  if (Math.abs(growthPercentage) <= 5) {
    status = 'stable';
  } else if (growthPercentage > 5) {
    status = 'growing';
  } else {
    status = 'declining';
  }

  return {
    growthAmount,
    growthPercentage,
    status
  };
}

/**
 * Calculate Sales Coverage Analysis
 */
async function calculateSalesCoverageAnalysis(
  pharmaUnitId: string,
  weekStart: Date,
  openingDistributorCredit: number
): Promise<SalesCoverageAnalysis> {
  // Get configuration values
  const targetPaymentPercentage = await getConfigValue('weekly_insights', 'target_payment_percentage', 10);
  const salesAllocationPercentage = await getConfigValue('weekly_insights', 'sales_allocation_percentage', 75);
  const optimalInventoryWeeksMin = await getConfigValue('weekly_insights', 'optimal_inventory_weeks_min', 6);
  const optimalInventoryWeeksMax = await getConfigValue('weekly_insights', 'optimal_inventory_weeks_max', 8);

  // Get previous week's sales
  const previousWeekSales = await getPreviousWeekSales(pharmaUnitId, weekStart);

  // Calculate key metrics
  const targetWeeklyPayment = openingDistributorCredit * (targetPaymentPercentage / 100);
  const actualPaymentCapacity = previousWeekSales * (salesAllocationPercentage / 100);
  const salesCoverageRatio = targetWeeklyPayment > 0
    ? (actualPaymentCapacity / targetWeeklyPayment) * 100
    : 100;
  const requiredWeeklySales = targetWeeklyPayment / (salesAllocationPercentage / 100);
  const paymentShortfall = targetWeeklyPayment - actualPaymentCapacity;

  // Calculate credit-to-sales ratio (in weeks)
  const avgWeeklySales = await getAverageWeeklySales(pharmaUnitId, 4, weekStart);
  const creditToSalesRatio = avgWeeklySales > 0
    ? openingDistributorCredit / avgWeeklySales
    : 999;

  // Calculate credit growth trend
  const creditGrowth = await calculateCreditGrowthTrend(pharmaUnitId, weekStart, 4);

  // Calculate sustainable credit level (midpoint of optimal range)
  const optimalWeeks = (optimalInventoryWeeksMin + optimalInventoryWeeksMax) / 2;
  const sustainableCreditLevel = avgWeeklySales * optimalWeeks;
  const creditOverage = openingDistributorCredit - sustainableCreditLevel;

  return {
    targetWeeklyPayment,
    targetPaymentPercentage,
    previousWeekSales,
    salesAllocationPercentage,
    actualPaymentCapacity,
    salesCoverageRatio,
    requiredWeeklySales,
    paymentShortfall,
    creditToSalesRatio,
    // Credit Stability Metrics
    sustainableCreditLevel,
    currentCreditLevel: openingDistributorCredit,
    creditOverage,
    creditGrowthTrend: creditGrowth.growthPercentage,
    creditGrowthAmount: creditGrowth.growthAmount,
    creditStabilityStatus: creditGrowth.status
  };
}

/**
 * Calculate Business Health Score
 */
function calculateBusinessHealthScore(
  salesCoverageAnalysis: SalesCoverageAnalysis,
  profitPercentage: number
): BusinessHealthScore {
  const ratio = salesCoverageAnalysis.salesCoverageRatio;
  const creditStatus = salesCoverageAnalysis.creditStabilityStatus;

  if (ratio >= 100 && (creditStatus === 'stable' || creditStatus === 'declining')) {
    return {
      status: 'healthy',
      score: ratio,
      color: 'green',
      message: `Healthy - Sales support ${salesCoverageAnalysis.targetPaymentPercentage}% payments and credit is ${creditStatus}. Optimal working capital.`
    };
  } else if (ratio >= 100 && creditStatus === 'growing') {
    return {
      status: 'cautionary',
      score: ratio,
      color: 'yellow',
      message: `Cautionary - Payment capacity is good but credit is growing. Monitor purchase levels.`
    };
  } else if (ratio >= 80) {
    return {
      status: 'cautionary',
      score: ratio,
      color: 'yellow',
      message: `Sustainable but tight - Payment capacity at ${ratio.toFixed(0)}% of target. Credit is ${creditStatus}.`
    };
  } else if (ratio >= 50) {
    return {
      status: 'warning',
      score: ratio,
      color: 'orange',
      message: `Warning - Sales insufficient to stabilize credit. Credit is ${creditStatus}. Action needed.`
    };
  } else {
    return {
      status: 'critical',
      score: ratio,
      color: 'red',
      message: `Critical - Credit growing unsustainably. Immediate action required to stabilize.`
    };
  }
}

/**
 * Generate action recommendations based on business health
 */
function generateActionRecommendations(
  healthScore: BusinessHealthScore,
  salesCoverageAnalysis: SalesCoverageAnalysis,
  profitPercentage: number,
  distributorActivity: DistributorActivitySummary
): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = [];
  const ratio = salesCoverageAnalysis.salesCoverageRatio;
  const creditStatus = salesCoverageAnalysis.creditStabilityStatus;
  const creditOverage = salesCoverageAnalysis.creditOverage;

  // Credit Stability Assessment
  if (creditStatus === 'growing') {
    if (healthScore.status === 'critical' || healthScore.status === 'warning') {
      // Growing credit + insufficient payments = critical
      const targetReduction = Math.abs(creditOverage);
      recommendations.push({
        priority: 'high',
        action: 'URGENT: Stabilize growing credit immediately',
        reason: `Credit growing ${salesCoverageAnalysis.creditGrowthTrend > 0 ? '+' : ''}${salesCoverageAnalysis.creditGrowthTrend.toFixed(1)}% (₹${(salesCoverageAnalysis.creditGrowthAmount / 100000).toFixed(2)}L) over 4 weeks. Sales cannot support ${salesCoverageAnalysis.targetPaymentPercentage}% payments.`,
        impact: `Return ₹${(targetReduction / 100000).toFixed(2)}L in stock to reach sustainable level`,
        specificActions: [
          `STOP new credit purchases immediately`,
          `Return ₹${(targetReduction / 100000).toFixed(2)}L to reach ${salesCoverageAnalysis.creditToSalesRatio.toFixed(0)} → 7 weeks inventory`,
          `Focus on slow-moving items and items near expiry`,
          `Prioritize distributors with highest balances`,
          `This will reduce weekly payment target by ₹${(targetReduction * 0.1 / 100000).toFixed(2)}L`
        ]
      });
    } else {
      // Growing credit but payments are okay
      recommendations.push({
        priority: 'medium',
        action: 'Control credit growth to maintain stability',
        reason: `Credit grew ${salesCoverageAnalysis.creditGrowthTrend > 0 ? '+' : ''}${salesCoverageAnalysis.creditGrowthTrend.toFixed(1)}% over 4 weeks. While payments are manageable now, continued growth will become unsustainable.`,
        impact: 'Reduce new purchases to match sales velocity',
        specificActions: [
          'Monitor weekly: New purchases should not exceed payments',
          `Target stable credit level around ₹${(salesCoverageAnalysis.sustainableCreditLevel / 100000).toFixed(2)}L`,
          'Review purchasing patterns - avoid over-stocking'
        ]
      });
    }
  } else if (creditStatus === 'stable') {
    // Stable credit - ideal state
    if (ratio >= 100) {
      recommendations.push({
        priority: 'low',
        action: 'Excellent - Credit is stable and sustainable',
        reason: `Credit stable (${salesCoverageAnalysis.creditGrowthTrend > 0 ? '+' : ''}${salesCoverageAnalysis.creditGrowthTrend.toFixed(1)}%) at ₹${(salesCoverageAnalysis.currentCreditLevel / 100000).toFixed(2)}L. Payments support ${salesCoverageAnalysis.targetPaymentPercentage}% target.`,
        impact: 'Continue current operations. Healthy working capital cycle.',
        specificActions: [
          'Maintain balance: Weekly purchases ≈ Weekly payments',
          'Current credit level is sustainable for your sales velocity',
          'Monitor to ensure stability continues'
        ]
      });
    } else {
      recommendations.push({
        priority: 'medium',
        action: 'Credit stable but payment capacity is tight',
        reason: `Credit is not growing (good), but sales only support ${ratio.toFixed(0)}% of ${salesCoverageAnalysis.targetPaymentPercentage}% target payments.`,
        impact: 'Need to improve sales or reduce payment target temporarily',
        specificActions: [
          'Option 1: Focus on increasing sales',
          `Option 2: Reduce weekly payment target to ${salesCoverageAnalysis.targetPaymentPercentage - 2}% temporarily`,
          'Keep purchases = payments to maintain stability'
        ]
      });
    }
  } else {
    // Declining credit
    if (creditOverage > 0) {
      recommendations.push({
        priority: 'low',
        action: 'Credit declining - Good progress toward optimal level',
        reason: `Credit decreased ${salesCoverageAnalysis.creditGrowthTrend.toFixed(1)}% over 4 weeks. Currently ₹${(creditOverage / 100000).toFixed(2)}L above sustainable level.`,
        impact: 'Continue current payment discipline until optimal level reached',
        specificActions: [
          `Continue reducing to target: ₹${(salesCoverageAnalysis.sustainableCreditLevel / 100000).toFixed(2)}L (7 weeks inventory)`,
          'Once optimal level reached, stabilize purchases = payments',
          'Good payment discipline - maintain current rate'
        ]
      });
    } else {
      recommendations.push({
        priority: 'medium',
        action: 'Credit declining below optimal level',
        reason: `Credit at ₹${(salesCoverageAnalysis.currentCreditLevel / 100000).toFixed(2)}L is ${Math.abs(creditOverage / 100000).toFixed(2)}L below sustainable level.`,
        impact: 'May need to increase inventory to avoid stockouts',
        specificActions: [
          `Consider increasing credit to ₹${(salesCoverageAnalysis.sustainableCreditLevel / 100000).toFixed(2)}L (7 weeks optimal)`,
          'Ensure adequate inventory for sales continuity',
          'Balance: Not too high (costly) nor too low (stockouts)'
        ]
      });
    }
  }

  // Credit Level vs Sustainable Level
  if (Math.abs(creditOverage) > salesCoverageAnalysis.sustainableCreditLevel * 0.2) {
    // More than 20% away from sustainable
    if (creditOverage > 0) {
      recommendations.push({
        priority: creditStatus === 'growing' ? 'high' : 'medium',
        action: 'Credit significantly above optimal working capital level',
        reason: `Current: ₹${(salesCoverageAnalysis.currentCreditLevel / 100000).toFixed(2)}L (${salesCoverageAnalysis.creditToSalesRatio.toFixed(1)} weeks). Optimal: ₹${(salesCoverageAnalysis.sustainableCreditLevel / 100000).toFixed(2)}L (7 weeks).`,
        impact: `Excess ₹${(creditOverage / 100000).toFixed(2)}L ties up working capital unnecessarily`,
        specificActions: [
          'Gradually reduce to optimal through stock returns',
          'Or maintain if planning business expansion',
          'High inventory increases carrying costs and expiry risk'
        ]
      });
    }
  }

  // Profit margin check
  if (profitPercentage > 0) {
    if (profitPercentage < 20) {
      recommendations.push({
        priority: 'medium',
        action: 'Profit margins below target',
        reason: `Current margin (${profitPercentage.toFixed(1)}%) is below target (20-25%)`,
        impact: 'Review pricing or reduce operational expenses'
      });
    } else if (profitPercentage > 25) {
      recommendations.push({
        priority: 'low',
        action: 'Excellent profit margins',
        reason: `Current margin (${profitPercentage.toFixed(1)}%) exceeds target`,
        impact: 'Strong operational efficiency'
      });
    }
  }

  // Overall credit stability summary
  recommendations.push({
    priority: 'low',
    action: 'Credit Stability Summary',
    reason: `Credit ${creditStatus} at ₹${(salesCoverageAnalysis.currentCreditLevel / 100000).toFixed(2)}L (${salesCoverageAnalysis.creditToSalesRatio.toFixed(1)} weeks of sales). Target: 6-8 weeks for optimal working capital.`,
    impact: creditStatus === 'stable'
      ? 'Healthy revolving credit cycle. This is ongoing working capital, not debt to eliminate.'
      : creditStatus === 'growing'
      ? 'Action needed to stabilize credit growth'
      : 'Trending toward optimal level'
  });

  return recommendations;
}

/**
 * Get estimated payments from payment estimation config
 */
async function getEstimatedPayments(
  pharmaUnitId: string,
  weekStart: Date
): Promise<number> {
  const previousWeekSales = await getPreviousWeekSales(pharmaUnitId, weekStart);
  const salesAllocationPercentage = await getConfigValue('weekly_insights', 'sales_allocation_percentage', 75);
  return previousWeekSales * (salesAllocationPercentage / 100);
}

/**
 * Generate insights based on the report data
 */
function generateInsights(report: Omit<WeeklyInsightsReport, 'insights'>): string[] {
  const insights: string[] = [];

  // Cash flow insight
  if (report.profitability.netCashFlow > 0) {
    insights.push(
      `✅ Strong cash flow week with ₹${(report.profitability.netCashFlow / 100000).toFixed(2)}L net positive`
    );
  } else if (report.profitability.netCashFlow < 0) {
    insights.push(
      `⚠️ Negative cash flow of ₹${Math.abs(report.profitability.netCashFlow / 100000).toFixed(2)}L - review expenses`
    );
  }

  // Distributor credit growth
  const creditGrowthPct =
    report.openingSnapshot.distributorCreditBalance > 0
      ? (report.distributorActivity.netCreditChange /
          report.openingSnapshot.distributorCreditBalance) *
        100
      : 0;

  if (creditGrowthPct > 20) {
    insights.push(
      `⚠️ Distributor credit grew by ${creditGrowthPct.toFixed(1)}% - monitor closely`
    );
  } else if (creditGrowthPct < -10) {
    insights.push(
      `✅ Distributor credit reduced by ${Math.abs(creditGrowthPct).toFixed(1)}% - good payment discipline`
    );
  }

  // Payment adherence
  if (
    report.paymentAnalysis.adherenceScore >= 90 &&
    report.paymentAnalysis.adherenceScore <= 110
  ) {
    insights.push(`✅ Payment adherence within acceptable range`);
  } else if (report.paymentAnalysis.adherenceScore < 70) {
    insights.push(
      `⚠️ Actual payments significantly lower than estimated (${report.paymentAnalysis.adherenceScore.toFixed(1)}%)`
    );
  }

  // Cash runway
  if (
    report.closingSnapshot.pharmacyCashPosition > 0 &&
    report.expenseActivity.totalExpenses > 0
  ) {
    const weeksOfCash =
      report.closingSnapshot.pharmacyCashPosition / report.expenseActivity.totalExpenses;
    insights.push(
      `💡 Current cash can cover ~${weeksOfCash.toFixed(1)} weeks of expenses at current rate`
    );
  }

  // Profit margin check
  if (report.profitability.profitPercentage < 10) {
    insights.push(
      `⚠️ Low profit margin (${report.profitability.profitPercentage.toFixed(1)}%) - review pricing or expenses`
    );
  } else if (report.profitability.profitPercentage > 25) {
    insights.push(
      `✅ Healthy profit margin of ${report.profitability.profitPercentage.toFixed(1)}%`
    );
  }

  return insights;
}

/**
 * Get distributor-level breakdown with payment history
 */
export async function getDistributorBreakdown(
  pharmaUnitId: string,
  targetDate: Date = new Date()
): Promise<DistributorBreakdown[]> {
  const weekStart = getMondayOfWeek(targetDate);

  // Get all distributors
  const distributors = await prisma.distributor.findMany({
    where: { pharmaUnitId },
    select: { id: true, name: true, creditBalance: true }
  });

  // Calculate current credit balance for each distributor at target date
  const distributorData: DistributorBreakdown[] = [];
  let totalCredit = 0;

  for (const distributor of distributors) {
    // Get transactions for this distributor up to target date
    const transactions = await prisma.transaction.findMany({
      where: {
        pharmaUnitId,
        stakeholderId: distributor.id,
        stakeholderType: 'distributor',
        date: { lt: weekStart }
      },
      select: { category: true, amount: true }
    });

    // Calculate current balance
    let currentBalance = distributor.creditBalance;
    transactions.forEach(t => {
      if (t.category === 'distributor_credit_purchase') {
        currentBalance += t.amount;
      } else if (t.category === 'distributor_payment' || t.category === 'distributor_credit_note') {
        currentBalance -= t.amount;
      }
    });

    // Get last 4 weeks payments
    const last4WeeksPayments: number[] = [];
    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() - i * 7);
      const weekStartPrev = new Date(weekEnd);
      weekStartPrev.setDate(weekEnd.getDate() - 7);

      const weekPayments = await prisma.transaction.aggregate({
        where: {
          pharmaUnitId,
          stakeholderId: distributor.id,
          stakeholderType: 'distributor',
          category: 'distributor_payment',
          date: { gte: weekStartPrev, lt: weekEnd }
        },
        _sum: { amount: true }
      });

      last4WeeksPayments.push(weekPayments._sum.amount || 0);
    }

    // Calculate credit growth over 4 weeks
    const fourWeeksAgo = new Date(weekStart);
    fourWeeksAgo.setDate(weekStart.getDate() - 28);

    let balanceFourWeeksAgo = distributor.creditBalance;
    const oldTransactions = await prisma.transaction.findMany({
      where: {
        pharmaUnitId,
        stakeholderId: distributor.id,
        stakeholderType: 'distributor',
        date: { lt: fourWeeksAgo }
      },
      select: { category: true, amount: true }
    });

    oldTransactions.forEach(t => {
      if (t.category === 'distributor_credit_purchase') {
        balanceFourWeeksAgo += t.amount;
      } else if (t.category === 'distributor_payment' || t.category === 'distributor_credit_note') {
        balanceFourWeeksAgo -= t.amount;
      }
    });

    const creditGrowthAmount = currentBalance - balanceFourWeeksAgo;
    const creditGrowthTrend = balanceFourWeeksAgo > 0
      ? (creditGrowthAmount / balanceFourWeeksAgo) * 100
      : 0;

    totalCredit += currentBalance;

    distributorData.push({
      distributorId: distributor.id,
      distributorName: distributor.name,
      currentCreditBalance: currentBalance,
      percentageOfTotal: 0, // Will calculate after we have total
      last4WeeksPayments,
      creditGrowthTrend,
      creditGrowthAmount,
      recommendedReturn: 0, // Will calculate after we have total
      weeklyAvgPayment: last4WeeksPayments.reduce((a, b) => a + b, 0) / 4
    });
  }

  // Calculate percentages and recommended returns
  const avgWeeklySales = await getAverageWeeklySales(pharmaUnitId, 4, weekStart);
  const sustainableTotal = avgWeeklySales * 7; // 7 weeks optimal

  distributorData.forEach(d => {
    d.percentageOfTotal = totalCredit > 0 ? (d.currentCreditBalance / totalCredit) * 100 : 0;

    // If total credit is above sustainable, recommend proportional returns
    if (totalCredit > sustainableTotal) {
      const excessCredit = totalCredit - sustainableTotal;
      d.recommendedReturn = (d.percentageOfTotal / 100) * excessCredit;
    }
  });

  return distributorData.sort((a, b) => b.currentCreditBalance - a.currentCreditBalance);
}

/**
 * Get multi-week trend data
 */
export async function getTrendData(
  pharmaUnitId: string,
  weeksBack: number = 12,
  endDate: Date = new Date()
): Promise<TrendDataPoint[]> {
  const trendData: TrendDataPoint[] = [];
  const targetPaymentPct = await getConfigValue('weekly_insights', 'target_payment_percentage', 10);
  const salesAllocationPct = await getConfigValue('weekly_insights', 'sales_allocation_percentage', 75);

  for (let i = 0; i < weeksBack; i++) {
    const weekDate = new Date(endDate);
    weekDate.setDate(endDate.getDate() - i * 7);

    const weekStart = getMondayOfWeek(weekDate);
    const weekEnd = getSundayOfWeek(weekDate);
    const { week } = getWeekNumber(weekDate);

    // Get credit balance at start of week
    const creditBalance = await calculateDistributorBalanceAtDate(pharmaUnitId, weekStart);

    // Get week's pharmacy revenue (sales + patient payments)
    const weekRevenue = await prisma.transaction.aggregate({
      where: {
        pharmaUnitId,
        category: { in: ['pharmacy_sale', 'patient_payment'] },
        date: { gte: weekStart, lte: weekEnd }
      },
      _sum: { amount: true }
    });

    const sales = weekRevenue._sum.amount || 0;

    // Get week's payments
    const weekPayments = await prisma.transaction.aggregate({
      where: {
        pharmaUnitId,
        stakeholderType: 'distributor',
        category: 'distributor_payment',
        date: { gte: weekStart, lte: weekEnd }
      },
      _sum: { amount: true }
    });

    const payments = weekPayments._sum.amount || 0;

    // Calculate metrics
    const targetPayment = creditBalance * (targetPaymentPct / 100);
    const paymentCapacity = sales * (salesAllocationPct / 100);
    const salesCoverageRatio = targetPayment > 0 ? (paymentCapacity / targetPayment) * 100 : 100;

    const avgSales = await getAverageWeeklySales(pharmaUnitId, 4, weekStart);
    const creditToSalesRatio = avgSales > 0 ? creditBalance / avgSales : 999;

    trendData.push({
      weekNumber: week,
      weekStart,
      weekEnd,
      creditBalance,
      salesCoverageRatio,
      paymentCapacity,
      targetPayment,
      creditToSalesRatio,
      sales,
      payments
    });
  }

  return trendData.reverse(); // Oldest to newest
}

/**
 * Get credit projection with scenarios
 */
export async function getCreditProjection(
  pharmaUnitId: string,
  targetDate: Date = new Date()
): Promise<CreditProjection> {
  const weekStart = getMondayOfWeek(targetDate);
  const currentCredit = await calculateDistributorBalanceAtDate(pharmaUnitId, weekStart);
  const avgWeeklySales = await getAverageWeeklySales(pharmaUnitId, 8, weekStart);
  const sustainableCredit = avgWeeklySales * 7;

  // Get credit growth trend
  const creditGrowth = await calculateCreditGrowthTrend(pharmaUnitId, weekStart, 4);
  const weeklyGrowthRate = creditGrowth.growthPercentage / 4 / 100; // Weekly growth rate

  const scenarios: ProjectionScenario[] = [];
  const weeks = [0, 4, 8, 12];

  // Scenario 1: Continue current trend
  const continueTrendBalances = weeks.map(w => {
    return currentCredit * Math.pow(1 + weeklyGrowthRate, w);
  });

  scenarios.push({
    scenario: 'continue_trend',
    weeks,
    creditBalances: continueTrendBalances,
    description: creditGrowth.status === 'growing'
      ? 'If credit continues growing at current rate'
      : creditGrowth.status === 'declining'
      ? 'If credit continues declining at current rate'
      : 'If credit remains stable'
  });

  // Scenario 2: Take action (stabilize at sustainable level)
  const targetPaymentPct = await getConfigValue('weekly_insights', 'target_payment_percentage', 10);
  const weeklyReduction = currentCredit > sustainableCredit
    ? (currentCredit - sustainableCredit) / 8 // Reduce over 8 weeks
    : 0;

  const actionBalances = weeks.map(w => {
    const projected = currentCredit - (weeklyReduction * w);
    return Math.max(projected, sustainableCredit);
  });

  scenarios.push({
    scenario: 'take_action',
    weeks,
    creditBalances: actionBalances,
    description: currentCredit > sustainableCredit
      ? `If you reduce credit by ₹${(weeklyReduction / 100000).toFixed(2)}L/week through stock returns`
      : 'If you maintain current level (already at or below sustainable)'
  });

  // Scenario 3: Optimal (maintain sustainable level)
  const optimalBalances = weeks.map(() => sustainableCredit);

  scenarios.push({
    scenario: 'optimal',
    weeks,
    creditBalances: optimalBalances,
    description: `Optimal level: ₹${(sustainableCredit / 100000).toFixed(2)}L (7 weeks of inventory)`
  });

  return {
    currentCredit,
    sustainableCredit,
    scenarios
  };
}

/**
 * Get week-over-week comparisons
 */
export async function getWeekComparisons(
  pharmaUnitId: string,
  targetDate: Date = new Date()
): Promise<WeekComparison[]> {
  const currentWeek = await generateWeeklyInsights(pharmaUnitId, targetDate);

  // Get last week
  const lastWeekDate = new Date(targetDate);
  lastWeekDate.setDate(targetDate.getDate() - 7);
  const lastWeek = await generateWeeklyInsights(pharmaUnitId, lastWeekDate);

  // Get 4 weeks ago
  const fourWeeksAgoDate = new Date(targetDate);
  fourWeeksAgoDate.setDate(targetDate.getDate() - 28);
  const fourWeeksAgo = await generateWeeklyInsights(pharmaUnitId, fourWeeksAgoDate);

  const comparisons: WeekComparison[] = [];

  // Helper function to create comparison
  const createComparison = (
    metric: string,
    current: number,
    last: number,
    fourWeeks: number
  ): WeekComparison => {
    const change = current - last;
    const changePercentage = last > 0 ? (change / last) * 100 : 0;
    return {
      metric,
      current,
      lastWeek: last,
      fourWeeksAgo: fourWeeks,
      change,
      changePercentage
    };
  };

  // Add key metrics
  comparisons.push(
    createComparison(
      'Total Revenue',
      currentWeek.revenueActivity.totalRevenue,
      lastWeek.revenueActivity.totalRevenue,
      fourWeeksAgo.revenueActivity.totalRevenue
    ),
    createComparison(
      'Distributor Credit',
      currentWeek.openingSnapshot.distributorCreditBalance,
      lastWeek.openingSnapshot.distributorCreditBalance,
      fourWeeksAgo.openingSnapshot.distributorCreditBalance
    ),
    createComparison(
      'Sales Coverage Ratio',
      currentWeek.salesCoverageAnalysis.salesCoverageRatio,
      lastWeek.salesCoverageAnalysis.salesCoverageRatio,
      fourWeeksAgo.salesCoverageAnalysis.salesCoverageRatio
    ),
    createComparison(
      'Net Cash Flow',
      currentWeek.profitability.netCashFlow,
      lastWeek.profitability.netCashFlow,
      fourWeeksAgo.profitability.netCashFlow
    ),
    createComparison(
      'Distributor Payments',
      currentWeek.distributorActivity.payments.amount,
      lastWeek.distributorActivity.payments.amount,
      fourWeeksAgo.distributorActivity.payments.amount
    )
  );

  return comparisons;
}

/**
 * Get seasonal patterns (6-12 months analysis)
 */
export async function getSeasonalPatterns(
  pharmaUnitId: string,
  monthsBack: number = 12
): Promise<SeasonalPattern[]> {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(endDate.getMonth() - monthsBack);

  // Group sales by month
  const monthlySales = new Map<number, number[]>();
  const monthlyCredit = new Map<number, number[]>();

  for (let i = 0; i < monthsBack; i++) {
    const monthDate = new Date(endDate);
    monthDate.setMonth(endDate.getMonth() - i);
    const month = monthDate.getMonth();

    const monthStart = new Date(monthDate.getFullYear(), month, 1);
    const monthEnd = new Date(monthDate.getFullYear(), month + 1, 0, 23, 59, 59, 999);

    // Get month's pharmacy revenue (sales + patient payments)
    const revenue = await prisma.transaction.aggregate({
      where: {
        pharmaUnitId,
        category: { in: ['pharmacy_sale', 'patient_payment'] },
        date: { gte: monthStart, lte: monthEnd }
      },
      _sum: { amount: true }
    });

    // Get month's avg credit
    const credit = await calculateDistributorBalanceAtDate(pharmaUnitId, monthStart);

    if (!monthlySales.has(month)) {
      monthlySales.set(month, []);
      monthlyCredit.set(month, []);
    }

    monthlySales.get(month)!.push(revenue._sum.amount || 0);
    monthlyCredit.get(month)!.push(credit);
  }

  // Calculate patterns
  const patterns: SeasonalPattern[] = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate overall average
  let allSales: number[] = [];
  monthlySales.forEach(sales => allSales = allSales.concat(sales));
  const overallAvg = allSales.length > 0
    ? allSales.reduce((a, b) => a + b, 0) / allSales.length
    : 0;

  for (let month = 0; month < 12; month++) {
    const salesData = monthlySales.get(month) || [];
    const creditData = monthlyCredit.get(month) || [];

    const avgSales = salesData.length > 0
      ? salesData.reduce((a, b) => a + b, 0) / salesData.length
      : 0;
    const avgCredit = creditData.length > 0
      ? creditData.reduce((a, b) => a + b, 0) / creditData.length
      : 0;

    // Determine if low/high season (20% threshold)
    const deviation = overallAvg > 0 ? ((avgSales - overallAvg) / overallAvg) * 100 : 0;
    const isLowSeason = deviation < -20;
    const isHighSeason = deviation > 20;

    // Adjustment factor for thresholds
    const adjustment = deviation / 100; // Convert percentage to factor

    patterns.push({
      month,
      monthName: monthNames[month],
      avgSales,
      avgCredit,
      isLowSeason,
      isHighSeason,
      adjustment
    });
  }

  return patterns;
}

/**
 * Generate weekly insights report
 */
export async function generateWeeklyInsights(
  pharmaUnitId: string,
  targetDate: Date = new Date()
): Promise<WeeklyInsightsReport> {
  const weekStart = getMondayOfWeek(targetDate);
  const weekEnd = getSundayOfWeek(targetDate);
  const { week, year } = getWeekNumber(targetDate);

  // Calculate opening balances (at start of week)
  const [openingDistributorCredit, openingPharmacyCash] = await Promise.all([
    calculateDistributorBalanceAtDate(pharmaUnitId, weekStart),
    calculatePharmacyCashAtDate(pharmaUnitId, weekStart)
  ]);

  // Get distributor activity
  const [creditPurchases, creditNotes, payments] = await Promise.all([
    getDistributorActivityByCategory(
      pharmaUnitId,
      weekStart,
      weekEnd,
      'distributor_credit_purchase'
    ),
    getDistributorActivityByCategory(
      pharmaUnitId,
      weekStart,
      weekEnd,
      'distributor_credit_note'
    ),
    getDistributorActivityByCategory(pharmaUnitId, weekStart, weekEnd, 'distributor_payment')
  ]);

  const netCreditChange =
    creditPurchases.amount - creditNotes.amount - payments.amount;

  // Get revenue activity
  const [pharmacySales, patientPayments] = await Promise.all([
    getCategoryActivity(pharmaUnitId, weekStart, weekEnd, 'pharmacy_sale'),
    getCategoryActivity(pharmaUnitId, weekStart, weekEnd, 'patient_payment')
  ]);

  // Other income (pharmacy-related only, excluding doctor transactions)
  const otherIncomeCategories = await prisma.transaction.aggregate({
    where: {
      pharmaUnitId,
      date: { gte: weekStart, lte: weekEnd },
      category: { in: [] } // No other income categories for pharmacy-only business
    },
    _sum: { amount: true },
    _count: true
  });

  const otherIncome: CategoryActivity = {
    count: otherIncomeCategories._count,
    amount: otherIncomeCategories._sum.amount || 0
  };

  const totalRevenue =
    pharmacySales.amount + patientPayments.amount + otherIncome.amount;

  // Get expense activity (pharmacy business only, excluding doctor-related expenses)
  const [employeeSalaries, partnerDistributions] = await Promise.all([
    getCategoryActivity(pharmaUnitId, weekStart, weekEnd, 'employee_salary'),
    getCategoryActivity(pharmaUnitId, weekStart, weekEnd, 'partner_profit_distribution')
  ]);

  const otherExpensesAgg = await prisma.transaction.aggregate({
    where: {
      pharmaUnitId,
      date: { gte: weekStart, lte: weekEnd },
      category: { in: ['other_expense', 'utilities', 'rent', 'supplies'] }
    },
    _sum: { amount: true },
    _count: true
  });

  const otherExpenses: CategoryActivity = {
    count: otherExpensesAgg._count,
    amount: otherExpensesAgg._sum.amount || 0
  };

  const totalExpenses =
    payments.amount +
    employeeSalaries.amount +
    partnerDistributions.amount +
    otherExpenses.amount;

  // Payment analysis
  const estimatedPayments = await getEstimatedPayments(pharmaUnitId, weekStart);
  const actualPayments = payments.amount;
  const variance = actualPayments - estimatedPayments;
  const variancePercentage =
    estimatedPayments > 0 ? (variance / estimatedPayments) * 100 : 0;
  const adherenceScore =
    estimatedPayments > 0 ? (actualPayments / estimatedPayments) * 100 : 100;

  // Profitability
  const grossRevenue = totalRevenue;
  const totalOutflows = totalExpenses;
  const netCashFlow = grossRevenue - totalOutflows;
  const profitAllocationRealized = netCashFlow;
  const profitPercentage =
    grossRevenue > 0 ? (netCashFlow / grossRevenue) * 100 : 0;

  // Calculate Sales Coverage Analysis
  const salesCoverageAnalysis = await calculateSalesCoverageAnalysis(
    pharmaUnitId,
    weekStart,
    openingDistributorCredit
  );

  // Calculate Business Health Score
  const businessHealthScore = calculateBusinessHealthScore(
    salesCoverageAnalysis,
    profitPercentage
  );

  // Calculate closing balances (at end of week - add 1ms to include the week)
  const closingDate = new Date(weekEnd.getTime() + 1);
  const [closingDistributorCredit, closingPharmacyCash] = await Promise.all([
    calculateDistributorBalanceAtDate(pharmaUnitId, closingDate),
    calculatePharmacyCashAtDate(pharmaUnitId, closingDate)
  ]);

  const netPositionChange =
    closingPharmacyCash - openingPharmacyCash;

  const distributorActivitySummary: DistributorActivitySummary = {
    creditPurchases,
    creditNotes,
    payments,
    netCreditChange
  };

  // Generate Action Recommendations
  const actionRecommendations = generateActionRecommendations(
    businessHealthScore,
    salesCoverageAnalysis,
    profitPercentage,
    distributorActivitySummary
  );

  const report: Omit<WeeklyInsightsReport, 'insights'> = {
    weekInfo: {
      weekNumber: week,
      weekStart,
      weekEnd,
      year
    },
    openingSnapshot: {
      distributorCreditBalance: openingDistributorCredit,
      pharmacyCashPosition: openingPharmacyCash
    },
    businessHealthScore,
    salesCoverageAnalysis,
    actionRecommendations,
    distributorActivity: distributorActivitySummary,
    revenueActivity: {
      pharmacySales,
      patientPayments,
      otherIncome,
      totalRevenue
    },
    expenseActivity: {
      employeeSalaries,
      partnerDistributions,
      otherExpenses,
      totalExpenses
    },
    paymentAnalysis: {
      estimatedPayments,
      actualPayments,
      variance,
      variancePercentage,
      adherenceScore
    },
    profitability: {
      grossRevenue,
      totalOutflows,
      netCashFlow,
      profitAllocationRealized,
      profitPercentage
    },
    closingSnapshot: {
      distributorCreditBalance: closingDistributorCredit,
      pharmacyCashPosition: closingPharmacyCash,
      netPositionChange
    }
  };

  return {
    ...report,
    insights: generateInsights(report)
  };
}
