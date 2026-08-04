'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logout as logoutService } from '../services/userAuthService';

const UserAuthContext = createContext();

export const useUserAuth = () => useContext(UserAuthContext);

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('solscapeUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { localStorage.removeItem('solscapeUser'); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    setUser(data);
    return data;
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </UserAuthContext.Provider>
  );
};
