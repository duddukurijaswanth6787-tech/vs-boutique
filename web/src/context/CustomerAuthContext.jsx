import React, { createContext, useState, useEffect, useContext } from 'react';

export const CustomerAuthContext = createContext();

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('customerToken');
    const storedUser = localStorage.getItem('customerUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCustomer(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setCustomer(userData);
    setToken(authToken);
    localStorage.setItem('customerToken', authToken);
    localStorage.setItem('customerUser', JSON.stringify(userData));
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
