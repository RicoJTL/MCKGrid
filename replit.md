# MCK Grid - Go-Karting League Management Platform

## Overview

MCK Grid is a web application for managing and tracking go-karting leagues, competitions, and individual races. The platform provides tools for organizers, racers, teams, and fans to manage racing events, track results, and view championship standings.

The application follows a full-stack TypeScript architecture with a React frontend, Express backend, and PostgreSQL database. It uses Replit Auth for authentication and Google Cloud Storage for file uploads.

## User Preferences

Preferred communication style: Simple, everyday language.

**CRITICAL UI Requirement**: All UI changes must appear immediately without requiring a page refresh. Every mutation hook must invalidate all related query keys in its `onSuccess` handler to ensure real-time UI updates. This includes:
- Tier assignment mutations must invalidate tier-related queries
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
- **leagues**: Championship seasons with date ranges, customizable iconName and iconColor
- **competitions**: Events within leagues (series, head-to-head, time attack), customizable iconName and iconColor
- **races**: Individual race events with dates and locations
- **results**: Race results with positions, times, and points
- **tieredLeagues**: Tiered league configurations linked to competitions
- **tierNames**: Tier names (S, A, B, C, etc.) for each tiered league
- **tierAssignments**: Tracks which drivers are assigned to which tiers
- **tierMovements**: Records promotion/relegation history
- **tierMovementNotifications**: Stores notifications about tier changes

### Tiered League System
The tiered league system allows competitions to organize drivers into tiers (e.g., S, A, B, C) with promotion/relegation mechanics:

**Configuration** (stored in `tieredLeagues` table):
- Linked to a parent competition
- Configurable number of tiers with custom names
- Rules for promotion/relegation (spots, races before shuffle)

**Race Check-in Logic**:
- For leagues WITH tiered leagues configured: drivers must be assigned to a tier to check in
- For leagues WITHOUT tiered leagues: all racers can check in freely
- Error messages display inline while keeping retry buttons visible

**Frontend Hooks** (`client/src/hooks/use-tiered-leagues.ts`):
- 15+ hooks for managing tiered leagues, tier names, assignments, and notifications
- All mutations invalidate related queries for real-time UI updates

**Dashboard Integration**:
- Shows "My Tier" section for drivers with tier assignments
- Gracefully handles drivers without tier assignments

### Customizable Icons and Colors
Admins can customize the icon and color for leagues and competitions:
- **IconPicker component**: `client/src/components/icon-picker.tsx` - provides 48 Lucide icons organized by category (racing, speed, shapes, navigation, nature, animals) and color selection with 10 preset colors plus custom hex input
- **Defaults**: Trophy icon with blue (#3b82f6) for leagues, Flag icon with red (#ef4444) for competitions
- **Storage**: `iconName` and `iconColor` fields in leagues and competitions tables
- The IconPicker uses controlled state with useEffect to sync internal state with props
- Both LeaguesPage.tsx and LeagueDetails.tsx include IconPicker in their edit dialogs

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

### Public Profiles
Authenticated users can view any driver's public profile at `/profiles/:id`:
- **Publicly visible**: Stats (races, points, wins, podiums), Personal Bests, Badges, Race History
- **Private (own profile only)**: Goals, Head-to-Head comparisons, Settings
- **API endpoint**: `GET /api/profiles/public/:id` returns only safe fields (id, driverName, fullName, profileImage, role)
- **Clickable links**: Driver names in standings, race results, and driver lists link to public profiles
- **Component**: `client/src/pages/PublicProfilePage.tsx`

### Badge Automation System
The system automatically awards badges based on driver performance:

**Auto-awarded after race results (server/badge-automation.ts):**
- Race milestones: first_race, first_podium, first_win, late_bloomer
- Streaks: back_to_back, podium_run, top_5_regular
- Season stats: points_scorer, top_half_hero, plum_tomato_champion, the_yo_yo
- Qualifying (when data entered): pole_position, grid_climber, perfect_weekend, quali_specialist

**Auto-awarded when league marked "completed":**
- Attendance: season_complete, iron_driver, never_quit, last_but_loyal, league_laughs_never_quit
- Championship positions: mck_champion, runner_up, third_overall, best_of_rest
- Special awards: dominator (most wins), podium_king (most podiums)
- Qualifying awards: the_flash (most poles), quali_merchant (most times quali > finish), most_dramatic_swing (biggest grid climb)

**Cannot be automated (require data not currently tracked):**
- Tier changes: first_promotion, relegation_fodder
- Multi-season: league_legend, hall_of_fame, most_improved

**Notifications:** When badges are awarded, notifications appear on the dashboard and can be dismissed by the user.

**Multi-league badge support:** Season-end badges are tracked with a `leagueId` in the `profileBadges` table. This allows:
- Drivers to earn the same badge (e.g., "mck_champion") from multiple leagues
- Badge revocation to be scoped to specific leagues (syncing League A won't affect badges from League B)
- Each badge instance tracks which league awarded it

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