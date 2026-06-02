import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyDataPoint, GroupBy } from '../../../types';
import { formatPeriod } from '../../../utils/formatting';

interface Props { data: DailyDataPoint[]; groupBy: GroupBy }

export default function CashBalanceChart({ data, groupBy }: Props) {
  const formatted = data.map(d => ({ ...d, label: formatPeriod(d.period, groupBy) }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
        <Line type="monotone" dataKey="cashBalance" stroke="#1976d2" strokeWidth={2} name="Cash Balance" />
      </LineChart>
    </ResponsiveContainer>
  );
}