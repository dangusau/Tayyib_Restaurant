export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'MD' | 'Manager' | 'NMD';
          restaurant_id: string | null;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role: 'MD' | 'Manager' | 'NMD';
          restaurant_id?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          full_name?: string;
          role?: 'MD' | 'Manager' | 'NMD';
          is_active?: boolean;
          phone?: string | null;
          avatar_url?: string | null;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          location: string | null;
          phone: string | null;
          email: string | null;
          established_date: string | null;
          currency: string;
          timezone: string;
          settings: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      transactions: {
        Row: {
          id: string;
          restaurant_id: string;
          transaction_date: string;
          pos_total: number;
          meal_tickets: number;
          cash_received: number;
          previous_balance: number;
          total_spent: number;
          cash_balance: number;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      purchase_items: {
        Row: {
          id: string;
          transaction_id: string;
          item_name: string;
          quantity: number;
          unit: string;
          unit_price: number;
          total_price: number;
          supplier: string | null;
          category: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      expenses: {
        Row: {
          id: string;
          transaction_id: string;
          description: string;
          amount: number;
          category: string;
          payment_method: string | null;
          vendor: string | null;
          receipt_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      audit_logs: { Row: any; Insert: any; Update: any };
    };
    Views: {};
    Functions: {
      get_user_profile: {
        Args: { user_id: string };
        Returns: Database['public']['Tables']['users']['Row'][];
      };
      get_daily_data: {
        Args: {
          p_restaurant_id: string;
          p_start_date: string;
          p_end_date: string;
          p_group_by?: string;
        };
        Returns: {
          period: string;
          revenue: number;
          expenses: number;
          profit: number;
          tickets: number;
        }[];
      };

      get_cumulative_data: {
  Args: {
    p_restaurant_id: string;
    p_start_date: string;
    p_end_date: string;
    p_group_by?: string;
  };
  Returns: {
    period: string;
    cumulative_revenue: number;
    cumulative_expenses: number;
    cumulative_profit: number;
  }[];
};
      calculate_dashboard_metrics: {
        Args: {
          p_restaurant_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          totalRevenue: number;
          totalExpenses: number;
          netProfit: number;
          profitMargin: number;
          totalTransactions: number;
          averageDailyRevenue: number;
          averageDailyExpenses: number;
          totalMealTickets: number;
          averageMealTicketPrice: number;
          currentCashBalance: number;
          revenueChange: number;
          expenseChange: number;
          profitChange: number;
        };
      };
    };
  };
}