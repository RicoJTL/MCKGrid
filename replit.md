# MCK Grid - Go-Karting League Management Platform

## Overview

MCK Grid is a web application for managing and tracking go-karting leagues, competitions, and individual races. The platform provides tools for organizers, racers, teams, and fans to manage racing events, track results, and view championship standings.

The application follows a full-stack TypeScript architecture with a React frontend, Express backend, and PostgreSQL database. It uses Replit Auth for authentication and Google Cloud Storage for file uploads.

## User Preferences

Preferred communication style: Simple, everyday language.

**CRITICAL UI Requirement**: All UI changes must appear immediately without requiring a page refresh. Every mutation hook must invalidate all related query keys in its `onSuccess` handler to ensure real-time UI updates. This includes:
- Enrollment mutations must invalidate enrolled-competitions queries
- Result submissions must invalidate standings and dashboard queries
- Any data change must invalidate all queries that display that data

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions and UI effects
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a mobile-first responsive design with a collapsible sidebar layout. All icons use Lucide React.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect with Passport.js)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Presigned URL flow with Google Cloud Storage

The backend uses a storage pattern where `server/storage.ts` provides a data access layer implementing the `IStorage` interface for all database operations.

### API Structure
- Routes defined in `server/routes.ts`
- Shared route definitions with Zod schemas in `shared/routes.ts`
- Type-safe API contracts between frontend and backend
- RESTful endpoints under `/api/` prefix

### Database Schema
Located in `shared/schema.ts`, the main entities are:
- **users/sessions**: Replit Auth managed tables (required for auth)
- **profiles**: User profiles with roles (admin, racer, spectator)
- **teams**: Racing teams with codes and logos
- **leagues**: Championship seasons with date ranges
- **competitions**: Events within leagues (series, head-to-head, time attack)
- **races**: Individual race events with dates and locations
- **results**: Race results with positions, times, and points

### Authentication Flow
Authentication is handled entirely through Replit Auth:
- Login redirects to `/api/login`
- Session management via PostgreSQL-stored sessions
- Protected routes use the `isAuthenticated` middleware
- User data synced to local `users` table on login

### Role-Based Access
The system uses a two-tier permission model:

**Admin Levels** (permanent permissions, controlled by super admins):
- **super_admin**: Can grant/revoke admin access to others, full edit access
- **admin**: Full edit access (create/manage leagues, competitions, races, results)
- **none**: Standard user (no admin privileges)

**Account Types** (user-selectable via profile):
- **racer** (Driver): Can participate in races, view race history
- **spectator**: View-only access to public data

Admin level badges (purple for Super Admin, yellow for Admin) are permanently displayed on profiles. Users with admin privileges can still choose their account type (Driver or Spectator).

Special user: `ibzmebude@gmail.com` is auto-promoted to super_admin on login.

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema defined in `shared/schema.ts`, migrations in `/migrations`

### Authentication
- **Replit Auth**: OIDC-based authentication
- Required environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### File Storage
- **Google Cloud Storage**: Used for profile images and team logos
- Accessed via `@google-cloud/storage` SDK
- Upload flow uses presigned URLs through `/api/uploads/request-url`
- Optional: `PUBLIC_OBJECT_SEARCH_PATHS` for public file access

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `@uppy/core` + `@uppy/dashboard`: File upload UI
- `framer-motion`: Animations
- `date-fns`: Date formatting
- `zod`: Runtime type validation
- `drizzle-kit`: Database migrations (`npm run db:push`)