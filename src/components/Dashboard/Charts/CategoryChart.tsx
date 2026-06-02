import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryBreakdown } from '../../../types';

const COLORS = ['#800020', '#a50026', '#d32f2f', '#f57c00', '#1976d2'];

export default function CategoryChart({ data }: { data: CategoryBreakdown[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          formatter={(value: number) => `₦${value.toLocaleString()}`}
        />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}