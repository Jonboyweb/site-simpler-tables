# Local Development Setup Guide

This guide covers setting up the local development environment for The Backroom Leeds website project.

## Prerequisites

- Node.js 18+ installed
- Docker Desktop running
- Supabase CLI installed globally (`npm install -g supabase`)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Supabase Local Development

```bash
# Start all Supabase services locally
npm run supabase:start

# Check service status
npm run supabase:status

# Open Supabase Studio (database GUI)
npm run supabase:studio
```

### 3. Environment Variables

Environment variables are automatically configured in `.env.local` for local development:

```bash
# Local Supabase URLs
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_STUDIO_URL=http://127.0.0.1:54323

# Local database connection
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Development flags
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS=true
```

### 4. Start Next.js Development Server

```bash
npm run dev
```

Your application will be available at:
- **Frontend**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323
- **API Endpoint**: http://127.0.0.1:54321
- **Email Testing**: http://127.0.0.1:54324

## Development Workflow Commands

### Supabase Management

```bash
# Core operations
npm run supabase:start       # Start local Supabase
npm run supabase:stop        # Stop local Supabase
npm run supabase:restart     # Restart all services
npm run supabase:status      # Check service status

# Database operations
npm run supabase:reset       # Reset database to initial state
npm run supabase:seed        # Seed database with sample data
npm run db:push             # Push local changes to database

# Development tools
npm run supabase:studio      # Open database management interface
npm run supabase:test        # Test database connection
npm run supabase:generate-types  # Generate TypeScript types
```

### Testing

```bash
npm run test                 # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate test coverage report
npm run test:e2e            # Run end-to-end tests
npm run test:all            # Run all tests
```

### Code Quality

```bash
npm run lint                # Run ESLint
npm run build               # Build for production
```

## Local Services

### Supabase Services Overview

| Service | URL | Description |
|---------|-----|-------------|
| API | http://127.0.0.1:54321 | Main Supabase API endpoint |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct PostgreSQL connection |
| Studio | http://127.0.0.1:54323 | Database management interface |
| Inbucket | http://127.0.0.1:54324 | Email testing interface |
| Storage | http://127.0.0.1:54321/storage/v1/s3 | File storage endpoint |

### Database Schema

The local database includes:
- **Tables**: `venue_tables`, `bookings`, `events`, `admin_users`, `waitlist`, `audit_log`
- **Views**: `available_tables`
- **Functions**: `check_table_availability`, `generate_booking_ref`, `get_booking_stats`
- **Enums**: `booking_status`, `floor_type`, `user_role`

## Troubleshooting

### Database Version Issues

If you encounter PostgreSQL version conflicts:

```bash
# Stop Supabase
npm run supabase:stop

# Remove containers
docker stop $(docker ps -aq --filter label=com.supabase.cli.project=backroom-leeds-website)
docker rm $(docker ps -aq --filter label=com.supabase.cli.project=backroom-leeds-website)

# Start fresh
npm run supabase:start
```

### Port Conflicts

Default ports used:
- 3000: Next.js development server
- 54321: Supabase API
- 54322: PostgreSQL database
- 54323: Supabase Studio
- 54324: Inbucket email testing

### Connection Testing

Test your setup with:

```bash
npm run supabase:test
```

This will verify:
- Environment variables are correctly loaded
- Database connection is working
- Sample data is accessible

## Development Tips

1. **Database Changes**: Use migrations for schema changes:
   ```bash
   # Create migration after making changes in Studio
   supabase db diff --use-migra --file new_migration
   ```

2. **TypeScript Types**: Regenerate types after schema changes:
   ```bash
   npm run supabase:generate-types
   ```

3. **Seed Data**: The database includes sample venue tables and events for development.

4. **Environment Isolation**: Local development uses completely separate services from production.

5. **Real-time Features**: WebSocket connections work locally for testing real-time booking updates.

## Next Steps

After completing local setup:
1. Explore the database schema in Supabase Studio
2. Run the test suite to verify everything works
3. Start developing features using the established patterns
4. Use the booking system with sample data to understand the workflow

For production deployment, see the deployment documentation.