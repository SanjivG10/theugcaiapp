import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin, supabaseClient } from "../config/supabase";
import {
  AuthenticationError,
  ValidationError,
} from "../middleware/errorHandler";
import {
  JWTPayload,
  LoginRequest,
  SignupRequest,
} from "../types/auth";
import { User, UserInsert, UserUpdate } from "../types/database";

export class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "";

    if (!this.jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
  }

  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtSecret as string);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async signup(
    signupData: SignupRequest
  ): Promise<{ user: User; token: string }> {
    const { email, password, first_name, last_name } = signupData;

    // Validate input
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    try {
      // Use Supabase Auth to create user
      const { data: authData, error: authError } =
        await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name,
              last_name,
            },
          },
        });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new ValidationError("Email already registered");
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Create user profile in our users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          first_name,
          last_name,
          email_verified: authData.user.email_confirmed_at ? true : false,
          role: "user",
          subscription_status: "trial",
        })
        .select()
        .single();

      if (userError) {
        // If user profile creation fails, clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      });

      return {
        user: userData as User,
        token,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Signup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async login(
    loginData: LoginRequest
  ): Promise<{ user: User; token: string }> {
    const { email, password } = loginData;

    // Validate input
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    try {
      // Use Supabase Auth for login
      const { data: authData, error: authError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.log({
          authError: authError.message,
        });
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new AuthenticationError("Login failed");
      }

      // Get user profile from our users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        throw new AuthenticationError("User profile not found");
      }

      // Update last sign in
      await supabaseAdmin
        .from("users")
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq("id", userData.id);

      // Generate JWT token
      const token = this.generateToken({
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      });

      return {
        user: userData as User,
        token,
      };
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    if (!email) {
      throw new ValidationError("Email is required");
    }

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
      });

      if (error) {
        // Don't reveal if email exists or not for security
        console.error("Forgot password error:", error);
      }

      // Always return success to prevent email enumeration
    } catch (error) {
      console.error("Forgot password error:", error);
      // Always return success to prevent email enumeration
    }
  }

  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
    if (!accessToken || !newPassword) {
      throw new ValidationError("Access token and new password are required");
    }

    if (newPassword.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    try {
      // Set the session with the access token
      const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: "", // Will be set by Supabase
        });

      if (sessionError) {
        throw new AuthenticationError("Invalid or expired reset token");
      }

      // Update the password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`);
      }
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new Error(
        `Password reset failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as User;
    } catch (error) {
      console.error("Get user by ID error:", error);
      return null;
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<UserUpdate>
  ): Promise<User> {
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data as User;
    } catch (error) {
      throw new Error(
        `Update user failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
