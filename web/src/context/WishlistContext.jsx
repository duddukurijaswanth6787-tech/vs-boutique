import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/api';
import { useCustomerAuth } from './CustomerAuthContext';

export const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { token, isAuthenticated } = useCustomerAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) { setItems([]); setWishlistIds(new Set()); return; }
    setLoading(true);
    try {
      const res = await getWishlist();
      const data = res.data || [];
      setItems(data);
      setWishlistIds(new Set(data.map(i => i.productId)));
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const add = async (productId) => {
    if (!isAuthenticated) return false;
    try {
      await addToWishlist(productId);
      await fetchWishlist();
      return true;
    } catch (err) {
      if (err.response?.status === 409) return false;
      console.error('Failed to add wishlist:', err);
      return false;
    }
  };

  const remove = async (productId) => {
    if (!isAuthenticated) return false;
    try {
      await removeFromWishlist(productId);
      await fetchWishlist();
      return true;
    } catch (err) {
      console.error('Failed to remove wishlist:', err);
      return false;
    }
  };

  const isWishlisted = (productId) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider value={{ items, loading, add, remove, isWishlisted, refresh: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
