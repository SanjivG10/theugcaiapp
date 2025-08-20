'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in on component mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Invalid token, remove it
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Remove invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.login({ email, password });
      
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.signup(data);
      
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      const response = await api.forgotPassword(email);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      const response = await api.resetPassword({ access_token: token, password });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      const response = await api.updateCurrentUser(data);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}