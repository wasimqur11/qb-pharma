// Empty chart data arrays for fresh setup - populate from database
export const revenueData: Array<{ day: string; pharmacy: number; consultation: number; total: number }> = [];

export const expenseData: Array<{ name: string; value: number; color: string }> = [];

export const monthlyData: Array<{ month: string; revenue: number; expenses: number; profit: number }> = [];

export const cashFlowData: Array<{ date: string; inflow: number; outflow: number; balance: number }> = [];

export const doctorPerformance: Array<{ name: string; patients: number; revenue: number; efficiency: number }> = [];

export const kpiData: Array<{ metric: string; value: number; target: number; trend: string }> = [];