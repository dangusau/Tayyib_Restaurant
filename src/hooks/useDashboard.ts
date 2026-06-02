import { useState, useEffect } from 'react';
import { dashboardService } from '../services/DashboardService';
import type { DashboardMetrics, DailyDataPoint, CategoryBreakdown, CumulativeDataPoint, DashboardFilters } from '../types';

export function useDashboardData(filters: DashboardFilters) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<DashboardMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [m, d, c, cum] = await Promise.all([
          dashboardService.getMetrics(filters),
          dashboardService.getDailyData(filters),
          dashboardService.getCategoryBreakdown(filters),
          dashboardService.getCumulativeData(filters),
        ]);
        setMetrics(m);
        setDailyData(d);
        setCategories(c);
        setCumulativeData(cum);

        // Always fetch previous period for % change
        const { start, end } = dashboardService.getPreviousPeriodDates(filters);
        const prev = await dashboardService.getMetrics({ ...filters, startDate: start, endDate: end });
        setPrevMetrics(prev);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [filters.restaurantId, filters.startDate, filters.endDate, filters.groupBy]);

  return { metrics, prevMetrics, dailyData, categories, cumulativeData, loading };
}