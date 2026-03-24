import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.ok) {
          setIsAuthenticated(true);
          setUser(res.data.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.ok) {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        setUser(res.data.user);
        return res.data;
      }
      return res.data;
    } catch (error) {
      return error.response?.data || { ok: false, msg: 'Error de conexión' };
    }
  };

  const register = async (email, password, role) => {
    try {
      const res = await axios.post('/api/auth/register', { email, password, role });
      if (res.data.ok) {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        setUser(res.data.user);
        return res.data;
      }
      return res.data;
    } catch (error) {
      return error.response?.data || { ok: false, msg: 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
