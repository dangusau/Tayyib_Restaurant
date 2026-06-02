import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuthStore } from '../../store/authStore';
import { useDashboardData } from '../../hooks/useDashboard';
import DashboardFilters from './DashboardFilters';
import MetricsCards from './MetricsCards';
import RevenueChart from './Charts/RevenueChart';
import CategoryChart from './Charts/CategoryChart';
import RevenueExpenseBarChart from './Charts/BarChart';
import CashBalanceChart from './Charts/CashBalanceChart';
import CumulativeChart from './Charts/CumulativeChart';
import type { DashboardFilters as FilterType, GroupBy } from '../../types';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { restaurantId } = useRestaurant();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState<FilterType>({
    startDate: '2000-01-01',
    endDate: today,
    groupBy: 'day' as GroupBy,
    restaurantId: restaurantId!,
    compareWith: undefined,
    excludeWeekends: false,
    categoryFilter: [],
    createdBy: undefined,
  });

  const [showFilters, setShowFilters] = useState(false);
  const { metrics, prevMetrics, dailyData, categories, cumulativeData, loading } = useDashboardData(filters);

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-lg md:text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="text-sm px-3 py-1.5 bg-white rounded-lg shadow text-gray-600 hover:bg-gray-50"
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </button>
      </div>

      {showFilters && <DashboardFilters filters={filters} onFiltersChange={setFilters} />}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full"></div>
        </div>
      ) : (
        <>
          {metrics && <MetricsCards metrics={metrics} previousMetrics={prevMetrics} />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Revenue & Profit Trend */}
            <div className="bg-white p-3 md:p-5 rounded-xl shadow">
              <h3 className="text-sm md:text-lg font-semibold mb-2">Revenue & Profit</h3>
              <RevenueChart data={dailyData} groupBy={filters.groupBy} />
            </div>

            {/* Expense Categories */}
            <div className="bg-white p-3 md:p-5 rounded-xl shadow">
              <h3 className="text-sm md:text-lg font-semibold mb-2">Expense Categories</h3>
              <CategoryChart data={categories} />
            </div>

            {/* Revenue vs Expenses Bar Chart */}
            <div className="bg-white p-3 md:p-5 rounded-xl shadow">
              <h3 className="text-sm md:text-lg font-semibold mb-2">Revenue vs Expenses</h3>
              <RevenueExpenseBarChart data={dailyData} groupBy={filters.groupBy} />
            </div>

            {/* Cash Balance Trend */}
            <div className="bg-white p-3 md:p-5 rounded-xl shadow">
              <h3 className="text-sm md:text-lg font-semibold mb-2">Cash Balance</h3>
              <CashBalanceChart data={dailyData} groupBy={filters.groupBy} />
            </div>

            {/* Cumulative Totals – NEW */}
            <div className="bg-white p-3 md:p-5 rounded-xl shadow lg:col-span-2">
              <h3 className="text-sm md:text-lg font-semibold mb-2">Cumulative Totals</h3>
              <CumulativeChart data={cumulativeData} groupBy={filters.groupBy} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}