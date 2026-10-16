import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';
import { tokenStore } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // The access token lives only in memory, so a full page reload loses it. On mount, try a
  // silent refresh against the httpOnly refresh-token cookie to restore the session without
  // forcing the user to log in again on every reload.
  useEffect(() => {
    authApi.refresh()
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const loginWithHandoff = useCallback(async (token) => {
    const data = await authApi.exchangeHandoff(token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fullName, email) => {
    const updated = await authApi.updateProfile(fullName, email);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await authApi.changePassword(currentPassword, newPassword);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        bootstrapping,
        login,
        loginWithHandoff,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
