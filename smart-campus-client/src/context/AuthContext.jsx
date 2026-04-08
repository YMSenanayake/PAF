import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('campus_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('campus_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('campus_user');
    setUser(null);
  };

  const isAuthenticated = !!user && !!localStorage.getItem('jwt_token');

  // Role helpers
  const isAdmin      = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isUser       = user?.role === 'USER';
  const canManageResources = isAdmin;
  const canApproveBookings = isAdmin;
  const canResolveTickets  = isAdmin || isTechnician;
  const canDeleteTickets   = isAdmin;
  const canManageUsers     = isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isTechnician,
      isUser,
      canManageResources,
      canApproveBookings,
      canResolveTickets,
      canDeleteTickets,
      canManageUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
