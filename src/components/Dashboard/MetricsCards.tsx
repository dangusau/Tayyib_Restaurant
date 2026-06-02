import { formatCurrency } from '../../utils/formatting';
import type { DashboardMetrics } from '../../types';

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function MetricsCards({
  metrics,
  previousMetrics,
}: {
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics | null;
}) {
  const items = [
    {
      label: 'Total Revenue',
      total: metrics.totalRevenue,
      dailyAvg: metrics.averageDailyRevenue,
      prevTotal: previousMetrics?.totalRevenue,
      format: formatCurrency,
    },
    {
      label: 'Total Expenses',
      total: metrics.totalExpenses,
      dailyAvg: metrics.averageDailyExpenses,
      prevTotal: previousMetrics?.totalExpenses,
      format: formatCurrency,
    },
    {
      label: 'Net Profit',
      total: metrics.netProfit,
      dailyAvg: metrics.averageDailyProfit,
      prevTotal: previousMetrics?.netProfit,
      format: formatCurrency,
    },
    {
      label: 'Cash Received',
      total: metrics.totalCashReceived,
      dailyAvg: metrics.daysCount > 0 ? metrics.totalCashReceived / metrics.daysCount : 0,
      prevTotal: previousMetrics?.totalCashReceived,
      format: formatCurrency,
    },
    {
      label: 'Total Meal Tickets',
      total: metrics.totalMealTickets,
      dailyAvg: metrics.averageDailyTickets,
      prevTotal: previousMetrics?.totalMealTickets,
      format: (val: number) => val.toLocaleString(),
    },
    {
      label: 'Card/Transfer Rev',
      total: metrics.totalPOS,
      dailyAvg: metrics.daysCount > 0 ? metrics.totalPOS / metrics.daysCount : 0,
      prevTotal: previousMetrics?.totalPOS,
      format: formatCurrency,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
      {items.map((item) => {
        const change = item.prevTotal != null ? pctChange(item.total, item.prevTotal) : 0;
        return (
          <div key={item.label} className="bg-white p-2 md:p-3 rounded-xl shadow-sm">
            <div className="text-xs text-gray-500 truncate">{item.label}</div>
            <div className="text-base md:text-lg font-bold text-gray-800 mt-1">
              {item.format(item.total)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Avg/day: {item.format(item.dailyAvg)}
            </div>
            {previousMetrics && (
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change > 0 ? '▲' : change < 0 ? '▼' : '•'} {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}