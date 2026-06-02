import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyDataPoint, GroupBy } from '../../../types';
import { formatPeriod } from '../../../utils/formatting';

interface Props {
  data: DailyDataPoint[];
  groupBy: GroupBy;
}

export default function RevenueChart({ data, groupBy }: Props) {
  const formatted = data.map(d => ({ ...d, label: formatPeriod(d.period, groupBy) }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          formatter={(value: number) => `₦${value.toLocaleString()}`}
        />
        <Legend iconType="circle" />
        <Line type="monotone" dataKey="revenue" stroke="#800020" strokeWidth={3} dot={false} name="Revenue" />
        <Line type="monotone" dataKey="expenses" stroke="#d32f2f" strokeWidth={3} dot={false} name="Expenses" />
        <Line type="monotone" dataKey="profit" stroke="#388e3c" strokeWidth={3} dot={false} name="Profit" />
      </LineChart>
    </ResponsiveContainer>
  );
}