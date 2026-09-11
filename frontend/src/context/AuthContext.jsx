/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from 'react';
import { login as loginRequest } from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sbt_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    setUser(data.user);
    localStorage.setItem('sbt_token', data.token);
    localStorage.setItem('sbt_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sbt_token');
    localStorage.removeItem('sbt_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from './useAuth';