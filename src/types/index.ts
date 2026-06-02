export type UserRole = 'MD' | 'Manager' | 'NMD';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  restaurant_id: string | null;   // <-- was `string`, now nullable
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Transaction {
  id: string;
  restaurant_id: string;
  transaction_date: string;
  pos_total: number;
  meal_tickets: number;
  cash_received: number;
  previous_balance: number;
  total_spent: number;
  cash_balance: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  purchase_items?: PurchaseItem[];
  expenses?: Expense[];
}

export type UnitType = 'pieces' | 'kg' | 'carton' | 'dozen' | 'pack';

export interface PurchaseItem {
  id?: string;
  transaction_id?: string;
  item_name: string;
  quantity: number;
  unit: UnitType;
  unit_price: number;
  total_price?: number;
  supplier?: string;
  category?: string;
  notes?: string;
  created_at?: string;
}

export interface Expense {
  id?: string;
  transaction_id?: string;
  description: string;
  amount: number;
  category: 'supplies' | 'utilities' | 'maintenance' | 'staff' | 'other';
  payment_method?: string;
  vendor?: string;
  receipt_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalTransactions: number;
  daysCount: number;
  averageDailyRevenue: number;
  averageDailyExpenses: number;
  averageDailyProfit: number;
  totalMealTickets: number;
  averageMealTicketPrice: number;
  currentCashBalance: number;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  averageDailyTickets: number;        // new
  totalCashReceived: number;          // new
  totalPOS: number;  
}

export interface DailyDataPoint {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  tickets: number;
  cashBalance: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export type GroupBy = 'day' | 'month' | 'quarter' | 'year';

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  groupBy: GroupBy;
  restaurantId: string;
  compareWith?: 'previous';
  excludeWeekends?: boolean;
  categoryFilter?: string[];
  createdBy?: string;
}

export interface CumulativeDataPoint {
  period: string;
  cumulativeRevenue: number;
  cumulativeExpenses: number;
  cumulativeProfit: number;
}
