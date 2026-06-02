import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

const RestaurantContext = createContext<{ restaurantId: string | null }>({ restaurantId: null });

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const restaurantId = user?.restaurant_id ?? null;

  return (
    <RestaurantContext.Provider value={{ restaurantId }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => useContext(RestaurantContext);