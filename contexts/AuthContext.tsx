"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { User, AuthContextType } from "@/types/auth";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.login({ email, password });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        toast.success("Login successful!");
      } else {
        const errorMessage = response.message || "Login failed";
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      let errorMessage = "Login failed";

      if (err instanceof AxiosError) {
        // Handle specific backend errors
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (err.response?.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (err.response && err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (data: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.signup(data);
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          toast.success("Account created successfully!");
        } else {
          const errorMessage = response.message || "Signup failed";
          setError(errorMessage);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (err: unknown) {
        let errorMessage = "Signup failed";

        if (err instanceof AxiosError) {
          // Handle specific backend errors
          if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err.response?.status === 409) {
            errorMessage = "An account with this email already exists";
          } else if (err.response?.status === 422) {
            // Handle validation errors
            if (err.response.data?.errors) {
              const validationErrors = err.response.data.errors;
              if (validationErrors.email) {
                errorMessage = `Email: ${validationErrors.email[0]}`;
              } else if (validationErrors.password) {
                errorMessage = `Password: ${validationErrors.password[0]}`;
              } else {
                errorMessage = "Please check your input and try again";
              }
            } else {
              errorMessage = "Please check your input and try again";
            }
          } else if (err.response && err.response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      const response = await api.forgotPassword(email);
      if (response.success) {
        toast.success("Password reset email sent! Check your inbox.");
      } else {
        const errorMessage = response.message || "Failed to send reset email";
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      let errorMessage = "Failed to send reset email";

      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 404) {
          errorMessage = "No account found with this email address";
        } else if (err.response?.status === 429) {
          errorMessage = "Too many requests. Please try again later.";
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      const response = await api.resetPassword({
        access_token: token,
        password,
      });
      if (response.success) {
        toast.success("Password reset successfully!");
      } else {
        const errorMessage = response.message || "Failed to reset password";
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      let errorMessage = "Failed to reset password";

      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 400) {
          errorMessage = "Invalid or expired reset token";
        } else if (err.response?.status === 422) {
          errorMessage = "Password does not meet requirements";
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      const response = await api.updateProfile(data);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        toast.success("Profile updated successfully!");
      } else {
        const errorMessage = response.message || "Failed to update profile";
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: unknown) {
      let errorMessage = "Failed to update profile";

      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 422) {
          errorMessage = "Please check your input and try again";
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      if (token) {
        try {
          await refreshUser();
        } catch (err) {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem("auth_token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

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
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
