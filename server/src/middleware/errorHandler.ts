import { Request, Response, NextFunction } from "express";
import winston from "winston";

// Configure Winston logger
const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "ai-ugc-platform" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.isOperational = true;
  }
}

export class AuthenticationError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
    this.isOperational = true;
  }
}

export class AuthorizationError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
    this.isOperational = true;
  }
}

export class NotFoundError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
    this.isOperational = true;
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Handle Supabase errors
  if (
    error.message?.includes("duplicate key value violates unique constraint")
  ) {
    statusCode = 409;
    message = "Resource already exists";
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Handle Joi validation errors
  if (
    error.name === "ValidationError" ||
    error.message?.includes("validation")
  ) {
    statusCode = 400;
    message = error.message || "Validation failed";
  }

  // Log error details
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== "GET" ? req.body : undefined,
    },
    timestamp: new Date().toISOString(),
  });

  // Send error response
  const response: {
    success: boolean;
    error: string;
    timestamp: string;
    stack?: string;
  } = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
