'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin, logout as logoutService } from '../services/adminAuthService';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('solscapeAdmin');
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch { localStorage.removeItem('solscapeAdmin'); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginAdmin(email, password);
    setAdmin(data);
    return data;
  };

  const logout = () => {
    logoutService();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
