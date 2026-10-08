import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('uptown_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('uptown_token'))
      .finally(() => setLoading(false));
  }, []);

  // LoginPage calls login({ phone, password }). Positional (phone, password)
  // is also accepted so either calling style works.
  async function login(arg1, arg2) {
    const credentials =
      typeof arg1 === 'object' && arg1 !== null ? arg1 : { phone: arg1, password: arg2 };
    const data = await api.login(credentials);
    localStorage.setItem('uptown_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    localStorage.setItem('uptown_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('uptown_token');
    setUser(null);
  }

  async function refreshProfile() {
    const data = await api.me();
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}