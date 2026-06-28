import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart as clearCartApi } from '../services/api';
import { useCustomerAuth } from './CustomerAuthContext';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCustomerAuth();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', isAuthenticated],
    queryFn: getCart,
    retry: false,
    enabled: isAuthenticated,
  });

  const cartItems = cart?.items || [];
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price || item.product?.basePrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const addItem = async (data) => {
    await addToCart(data);
    invalidate();
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeCartItem(itemId);
    } else {
      await updateCartItem(itemId, { quantity });
    }
    invalidate();
  };

  const removeItem = async (itemId) => {
    await removeCartItem(itemId);
    invalidate();
  };

  const clearAll = async () => {
    await clearCartApi();
    invalidate();
  };

  const refreshCart = () => invalidate();

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, subtotal, loading: isLoading,
      refreshCart, addItem, updateQuantity, removeItem, clearAll,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
