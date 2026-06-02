export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPeriod(period: string, groupBy: string): string {
  if (groupBy === 'day') return formatDate(period);
  if (groupBy === 'month') {
    const [year, month] = period.split('-');
    return new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  if (groupBy === 'quarter') {
    const d = new Date(period);
    const quarter = Math.floor(d.getMonth()/3)+1;
    return `Q${quarter} ${d.getFullYear()}`;
  }
  return period;
}
