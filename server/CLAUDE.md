# AI UGC Video Platform - Backend Server

## Overview

Node.js + Express + TypeScript backend server for the AI UGC video platform. This server handles API requests, manages business logic, integrates with external AI video generation APIs, and communicates with Supabase database.

## Tech Stack

- **Runtime**: Node.js (latest LTS)
- **Framework**: Express.js (latest)
- **Language**: TypeScript (latest)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Environment**: dotenv for config management

## Development Guidelines

### General Rules

- Always use latest versions of dependencies
- No test case implementation required
- Use TypeScript strict mode
- Implement proper error handling and logging
- Follow RESTful API design principles
- Use async/await for all asynchronous operations

### Project Structure

```
server/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration files
│   └── app.ts           # Express app setup
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md
```

### Key Dependencies to Install

```bash
# Core dependencies
npm init -y
npm install express cors helmet morgan dotenv
npm install @supabase/supabase-js

# TypeScript and dev dependencies
npm install -D typescript @types/node @types/express @types/cors
npm install -D ts-node nodemon concurrently

# Additional utilities
npm install axios joi bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# Logging and monitoring
npm install winston

# File upload handling
npm install multer
npm install -D @types/multer
```

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# External AI APIs
OPENAI_API_KEY=your_openai_api_key
RUNWAY_API_KEY=your_runway_api_key
STABLE_VIDEO_API_KEY=your_stable_video_api_key

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Scripts Configuration (package.json)

```json
{
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist"
  }
}
```

### Core Features to Implement

#### 1. Authentication & Authorization

- JWT-based authentication with Supabase
- User registration and login endpoints
- Protected route middleware
- Role-based access control (admin, business, user)
- Password reset functionality

#### 2. User Management

- User profile CRUD operations
- Business account management
- Subscription status tracking
- Usage quota management

#### 3. Video Generation API Integration

- Multiple AI video provider integrations
- Video generation request handling
- Status tracking and webhooks
- Template management
- Custom prompt processing

#### 4. Asset Management

- Video file upload and storage
- Metadata management
- Video processing status tracking
- Download and sharing capabilities
- Thumbnail generation

#### 5. Billing & Subscription Management

- Usage tracking and metering
- Subscription plan management
- Payment webhook handling
- Credit system implementation
- Billing history

#### 6. Analytics & Reporting

- Video generation analytics
- User engagement metrics
- Business performance tracking
- Usage reports generation

### API Endpoints Structure

#### Authentication Routes

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### User Routes

```
GET /api/users/profile
PUT /api/users/profile
GET /api/users/subscription
PUT /api/users/subscription
```

#### Video Generation Routes

```
POST /api/videos/generate
GET /api/videos/:id/status
GET /api/videos
GET /api/videos/:id
DELETE /api/videos/:id
POST /api/videos/:id/download
```

#### Template Routes

```
GET /api/templates
GET /api/templates/:id
POST /api/templates (admin only)
PUT /api/templates/:id (admin only)
DELETE /api/templates/:id (admin only)
```

#### Analytics Routes

```
GET /api/analytics/dashboard
GET /api/analytics/usage
GET /api/analytics/videos
```

### Database Schema Considerations

Use Supabase's built-in features:

- Row Level Security (RLS) for data protection
- Real-time subscriptions for status updates
- Built-in authentication system
- Automatic API generation

### Key Supabase Tables

- users (extends auth.users)
- businesses
- subscriptions
- videos
- templates
- usage_logs
- analytics_events

### Error Handling

- Standardized error response format
- Proper HTTP status codes
- Detailed error logging
- Rate limiting implementation
- Input validation using Joi

### Security Best Practices

- CORS configuration
- Helmet.js for security headers
- Input sanitization
- SQL injection prevention
- Rate limiting
- API key rotation strategy

### Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run clean        # Clean build directory
```

### External API Integration Guidelines

- Implement retry logic with exponential backoff
- Proper error handling for API failures
- Rate limiting compliance
- Webhook handling for async operations
- API key rotation and management

### Logging Strategy

- Use Winston for structured logging
- Log levels: error, warn, info, debug
- Separate log files for different components
- Include correlation IDs for request tracking

### Deployment Considerations

- Environment-specific configurations
- Health check endpoints
- Graceful shutdown handling
- Process management with PM2
- Container-ready configuration

## Database info

We have our database on database.types.ts reference that if you have to.
In order to download latest database schema, use yarn types inside server folder
Do not use path import like @/**.ts, you have to use relative path import like "../../**"
No need to declare user object in request, as we have that declared in auth middleware like this.
declare module "express" {
interface Request {
user?: {
id: string;
email: string;
role: string;
};
}
}
