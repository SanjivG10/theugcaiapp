import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { LoginRequest, SignupRequest, AuthResponse } from "../types/auth";
import { asyncHandler, ValidationError } from "../middleware/errorHandler";

const authService = new AuthService();

export const signup = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const signupData: SignupRequest = req.body;

    const result = await authService.signup(signupData);

    const response: AuthResponse = {
      success: true,
      message:
        "Account created successfully. Please check your email for verification.",
      data: {
        user: result.user,
        token: result.token,
      },
    };

    res.status(201).json(response);
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const loginData: LoginRequest = req.body;

    try {
      const result = await authService.login(loginData);

      const response: AuthResponse = {
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          token: result.token,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const response: AuthResponse = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error occured during login. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(400).json(response);
    }
  }
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email is required");
    }

    await authService.forgotPassword(email);

    const response: AuthResponse = {
      success: true,
      message:
        "If an account with that email exists, we have sent a password reset link.",
    };

    res.status(200).json(response);
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { access_token, password } = req.body;

    if (!access_token || !password) {
      throw new ValidationError("Access token and new password are required");
    }

    await authService.resetPassword(access_token, password);

    const response: AuthResponse = {
      success: true,
      message: "Password reset successful",
    };

    res.status(200).json(response);
  }
);

export const getProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      throw new ValidationError("User not found");
    }

    const response: AuthResponse = {
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user,
      },
    };

    res.status(200).json(response);
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.id;
    delete updates.email;
    delete updates.role;
    delete updates.created_at;
    delete updates.updated_at;

    const user = await authService.updateUser(userId, updates);

    const response: AuthResponse = {
      success: true,
      message: "Profile updated successfully",
      data: {
        user,
      },
    };

    res.status(200).json(response);
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      throw new ValidationError("User not found");
    }

    // Generate new token
    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      success: true,
      message: "Token refreshed successfully",
      data: {
        user,
        token,
      },
    };

    res.status(200).json(response);
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const response: AuthResponse = {
      success: true,
      message: "Logout successful",
    };

    res.status(200).json(response);
  }
);
