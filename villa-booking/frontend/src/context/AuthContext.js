import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logout as logoutService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('villaUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { localStorage.removeItem('villaUser'); }
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
