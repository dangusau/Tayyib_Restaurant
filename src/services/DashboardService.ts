import { supabase } from './supabase';
import type { DashboardMetrics, DailyDataPoint, CategoryBreakdown, CumulativeDataPoint, DashboardFilters } from '../types';
import { subDays, format } from 'date-fns';

export const dashboardService = {
  async getMetrics(filters: DashboardFilters): Promise<DashboardMetrics> {
    const { data, error } = await supabase.rpc('calculate_dashboard_metrics', {
      p_restaurant_id: filters.restaurantId,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
    });
    if (error) throw error;

    const d = data as any;
    return {
      totalRevenue: Number(d.totalRevenue ?? 0),
      totalExpenses: Number(d.totalExpenses ?? 0),
      netProfit: Number(d.netProfit ?? 0),
      profitMargin: Number(d.profitMargin ?? 0),
      totalTransactions: Number(d.totalTransactions ?? 0),
      daysCount: Number(d.daysCount ?? 0),
      averageDailyRevenue: Number(d.averageDailyRevenue ?? 0),
      averageDailyExpenses: Number(d.averageDailyExpenses ?? 0),
      averageDailyProfit: Number(d.averageDailyProfit ?? 0),
      totalMealTickets: Number(d.totalMealTickets ?? 0),
      averageDailyTickets: Number(d.averageDailyTickets ?? 0),
      totalCashReceived: Number(d.totalCashReceived ?? 0),
      currentCashBalance: Number(d.currentCashBalance ?? 0),
      revenueChange: Number(d.revenueChange ?? 0),
      expenseChange: Number(d.expenseChange ?? 0),
      profitChange: Number(d.profitChange ?? 0),
      averageMealTicketPrice: 1200, // constant, kept for backward compatibility
      totalPOS: Number(d.totalpos ?? d.totalPOS ?? 0),
    };
  },

  async getDailyData(filters: DashboardFilters): Promise<DailyDataPoint[]> {
    const { data, error } = await supabase.rpc('get_daily_data', {
      p_restaurant_id: filters.restaurantId,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
      p_group_by: filters.groupBy,
    });
    if (error) throw error;

    return (data || []).map((d: any) => ({
      period: d.period,
      revenue: Number(d.revenue),
      expenses: Number(d.expenses),
      profit: Number(d.profit),
      tickets: Number(d.tickets),
      cashBalance: Number(d.closing_balance ?? 0),
    }));
  },

  async getCumulativeData(filters: DashboardFilters): Promise<CumulativeDataPoint[]> {
    const { data, error } = await supabase.rpc('get_cumulative_data', {
      p_restaurant_id: filters.restaurantId,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
      p_group_by: filters.groupBy,
    });
    if (error) throw error;

    return (data || []).map((d: any) => ({
      period: d.period,
      cumulativeRevenue: Number(d.cumulative_revenue),
      cumulativeExpenses: Number(d.cumulative_expenses),
      cumulativeProfit: Number(d.cumulative_profit),
    }));
  },

  async getCategoryBreakdown(filters: DashboardFilters): Promise<CategoryBreakdown[]> {
    const { data: txns } = await supabase
      .from('transactions')
      .select('id')
      .eq('restaurant_id', filters.restaurantId)
      .gte('transaction_date', filters.startDate)
      .lte('transaction_date', filters.endDate);

    const txnIds = (txns as any[] | null)?.map((t: any) => t.id) ?? [];
    if (txnIds.length === 0) return [];

    const { data: expenses } = await supabase
      .from('expenses')
      .select('category, amount')
      .in('transaction_id', txnIds);

    const totals: Record<string, number> = {};
    let grandTotal = 0;
    (expenses as any[] | null)?.forEach((e: any) => {
      const cat = e.category || 'other';
      totals[cat] = (totals[cat] || 0) + Number(e.amount);
      grandTotal += Number(e.amount);
    });

    return Object.entries(totals).map(([category, amount]) => ({
      category,
      amount,
      percentage: grandTotal ? (amount / grandTotal) * 100 : 0,
      count: expenses?.filter((e: any) => (e.category || 'other') === category).length || 0,
    }));
  },

  getPreviousPeriodDates(filters: DashboardFilters): { start: string; end: string } {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevStart = subDays(start, days);
    const prevEnd = subDays(start, 1);
    return {
      start: format(prevStart, 'yyyy-MM-dd'),
      end: format(prevEnd, 'yyyy-MM-dd'),
    };
  },
};