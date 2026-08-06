'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { loginSales, logout as logoutService } from '../services/salesAuthService';

const SalesAuthContext = createContext();

export const useSalesAuth = () => useContext(SalesAuthContext);

export const SalesAuthProvider = ({ children }) => {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const stored = localStorage.getItem('solscapeSales');
      if (stored) {
        try {
          setSales(JSON.parse(stored));
        } catch { localStorage.removeItem('solscapeSales'); }
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const login = async (email, password) => {
    const data = await loginSales(email, password);
    setSales(data);
    return data;
  };

  const logout = () => {
    logoutService();
    setSales(null);
  };

  return (
    <SalesAuthContext.Provider value={{ sales, loading, login, logout, setSales }}>
      {children}
    </SalesAuthContext.Provider>
  );
};