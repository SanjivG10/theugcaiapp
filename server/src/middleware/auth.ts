import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/supabase";
import { AuthenticationError, AuthorizationError } from "./errorHandler";
import { JWTPayload } from "../types/auth";

// Extend Request interface to include user
import "express";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError("Access token is required");
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from Supabase to ensure they still exist and are active
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, email_verified")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      throw new AuthenticationError("Invalid token or user not found");
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError("Token expired"));
    } else {
      next(error);
    }
  }
};

export const authMiddleware = authenticateToken;

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError("Authentication required");
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError("Authentication required");
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("email_verified")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.email_verified) {
      throw new AuthorizationError("Email verification required");
    }

    next();
  } catch (error) {
    next(error);
  }
};
