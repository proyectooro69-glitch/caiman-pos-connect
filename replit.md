# Caiman POS Connect

## Overview

Caiman POS Connect is a full-stack Point of Sale (POS) system designed for restaurants and retail stores. It provides inventory management, sales processing, table management for restaurants, customer tracking, and subscription-based access control. The application supports multi-tenant architecture where each store (punto de venta) operates independently with role-based access control for administrators, supervisors, and sales staff.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Routing**: React Router v6 for client-side navigation
- **State Management**: TanStack Query (React Query) for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark theme with green accents)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions using Drizzle's pgTable
- **Scheduled Tasks**: node-cron for subscription expiration checks and email reminders

### Authentication & Authorization
- **Auth Provider**: Supabase Auth for user authentication
- **Session Management**: Supabase handles JWT tokens client-side
- **Role System**: Three-tier roles (administrador, supervisor, vendedor) stored in `user_roles` table
- **Route Protection**: `ProtectedRoute` component wraps authenticated pages
- **Subscription Blocking**: `SubscriptionBlocker` component prevents access when subscription expires

### Data Storage
- **Primary Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM for type-safe queries
- **Schema Design**: Multi-tenant with `punto_venta_id` foreign keys linking most tables to stores
- **Key Tables**: 
  - `puntos_venta` - Store/business entities
  - `profiles` - User profiles linked to Supabase auth
  - `user_roles` - Role assignments per user/store
  - `inventario` - Products and inventory items
  - `mesas` - Restaurant tables
  - `clientes` - Customer records
  - `ventas` - Sales transactions

### File Structure
```
client/           # Frontend React application
  components/     # Reusable UI components
  pages/          # Route page components
  contexts/       # React context providers
  hooks/          # Custom React hooks
  lib/            # Utility functions
  integrations/   # External service clients (Supabase)
server/           # Backend Express application
  routes.ts       # API endpoint definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
  email.ts        # Email service (Resend)
shared/           # Shared between client and server
  schema.ts       # Drizzle database schema
migrations/       # Drizzle migration files
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema management

### Authentication & Backend Services
- **Supabase**: Authentication, real-time subscriptions, and database hosting
  - Client configured in `client/integrations/supabase/client.ts`
  - Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables

### Email Service
- **Resend**: Transactional emails for subscription reminders and payment confirmations
  - Requires `RESEND_API_KEY` environment variable
  - Sender email: `info@caimanpos.com`

### PDF Generation
- **jsPDF**: Client-side PDF generation for receipts and reports

### Charts & Data Visualization
- **Recharts**: React charting library for dashboard analytics

### Date Handling
- **date-fns**: Date manipulation and formatting with Spanish locale support