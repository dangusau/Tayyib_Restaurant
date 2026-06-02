import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyDataPoint, GroupBy } from '../../../types';
import { formatPeriod } from '../../../utils/formatting';

interface Props { data: DailyDataPoint[]; groupBy: GroupBy }

export default function RevenueExpenseBarChart({ data, groupBy }: Props) {
  const formatted = data.map(d => ({ ...d, label: formatPeriod(d.period, groupBy) }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="revenue" fill="#800020" name="Revenue" />
        <Bar dataKey="expenses" fill="#d32f2f" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
}