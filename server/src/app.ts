import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { businessRoutes } from "./routes/business";
import creditRoutes from "./routes/credits";
import campaignRoutes from "./routes/campaigns";
import { feedbackRoutes } from "./routes/feedback";
import uploadRoutes from "./routes/upload";
import voicesRoutes from "./routes/voices";
import { assetLibraryRoutes } from "./routes/assetLibraryRoutes";
import { env } from "./config/env";

// Load environment variables

const app = express();
const PORT = env.APP.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.APP.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
// Note: Stripe webhooks need raw body, so we handle it separately in the route
app.use("/api/credits/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/voices", voicesRoutes);
app.use("/api/asset-library", assetLibraryRoutes);

// 404 handler
app.use("*everything", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
