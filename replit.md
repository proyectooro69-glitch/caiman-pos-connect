# Caiman POS Connect

A Point of Sale (POS) system for managing stores, inventory, sales, tables, and customers.

## Overview

Caiman POS is a Spanish-language POS application built with React frontend and Express backend, using PostgreSQL (Neon) for data storage and Supabase for authentication.

## Tech Stack

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, Radix UI components
- **Backend**: Express.js with TypeScript running via tsx
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Supabase Auth (client-side)
- **Email**: Resend for transactional emails (subscription reminders, payment confirmations)

## Project Structure

```
├── client/                 # React frontend
│   ├── components/         # UI components (Radix-based)
│   ├── contexts/           # React contexts (AuthContext)
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # Supabase client configuration
│   ├── pages/              # Route pages
│   └── main.tsx            # App entry point
├── server/                 # Express backend
│   ├── index.ts            # Server entry with Vite middleware
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database storage layer (Drizzle)
│   ├── db.ts               # Database connection
│   └── email.ts            # Email functionality (replaces Supabase Edge Functions)
├── shared/                 # Shared code
│   └── schema.ts           # Drizzle database schema
├── supabase/               # Supabase configuration (migrations, edge functions - legacy)
├── vite.config.ts          # Vite configuration
├── drizzle.config.ts       # Drizzle configuration
└── package.json            # Dependencies and scripts
```

## Database Schema

Main tables:
- `puntos_venta` - Stores/Point of Sale locations
- `profiles` - User profiles
- `user_roles` - User roles (administrador, supervisor, vendedor)
- `inventario` - Products and supplies
- `clientes` - Customers
- `mesas` - Tables
- `cuentas_mesa` - Table accounts/orders
- `detalle_cuenta` - Order line items
- `ventas` - Sales
- `venta_items` - Sale line items
- `recetas` - Recipes (product -> ingredients)
- `agregos` - Add-ons/extras
- `configuracion_tienda` - Store configuration
- `global_settings` - Global settings
- `movimientos_caja` - Cash register movements

## Development Commands

```bash
npm run dev       # Start development server (tsx + Vite)
npm run build     # Build for production
npm run start     # Start production server
npm run db:push   # Push schema changes to database
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

Optional:
- `RESEND_API_KEY` - For email functionality
- `PORT` - Server port (defaults to 5000)

## API Routes

All API routes are prefixed with `/api/`:

- `/api/health` - Health check
- `/api/puntos-venta` - Store CRUD
- `/api/profiles` - User profiles CRUD
- `/api/user-roles` - User roles
- `/api/inventario` - Inventory CRUD
- `/api/clientes` - Customers CRUD
- `/api/mesas` - Tables CRUD
- `/api/cuentas-mesa` - Table accounts
- `/api/detalle-cuenta` - Order details
- `/api/ventas` - Sales
- `/api/venta-items` - Sale items
- `/api/configuracion-tienda` - Store config
- `/api/settings` - Global settings
- `/api/caja` - Cash register movements
- `/api/email/send` - Send emails
- `/api/email/check-expiring` - Check expiring subscriptions

## Notes

- The app uses Supabase for authentication on the client side
- Database operations go through the Express server using Drizzle ORM
- Email functionality (formerly Supabase Edge Functions) is now handled by server/email.ts
- The frontend runs on port 5000 with Vite middleware in development
