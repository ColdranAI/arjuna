# Arjuna Analytics

A minimal, privacy-focused web analytics platform built with modern technologies.

## Features

- 🚀 **Fast & Lightweight**: Minimal tracking script with sub-millisecond response times
- 🔒 **Privacy-First**: No cookies, IP hashing, GDPR compliant
- 📊 **Real-time Analytics**: Live visitor tracking and instant insights
- 🎨 **Minimal Dashboard**: Clean, monochrome interface focused on essential metrics
- 🐳 **Docker Ready**: One-command setup with Docker Compose
- 🌍 **Geolocation**: Built-in IP geolocation with multiple fallback options

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arjuna
   ```

2. **Create environment file**
   ```bash
   cp env.example .env
   ```

3. **Edit your credentials in `.env`**
   ```bash
   # Required: Set your admin credentials
   ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=your-secure-password
   JWT_SECRET=your-random-jwt-secret-key
   ```

4. **Start the application**
   ```bash
   # Production mode
   docker-compose up -d

   # Development mode (with hot reload)
   docker-compose --profile dev up -d dev
   ```

5. **Access the dashboard**
   - Dashboard: http://localhost:3000
   - API: http://localhost:3001

### Option 2: Manual Setup

1. **Prerequisites**
   - Node.js 18+
   - pnpm 10+
   - PostgreSQL 15+
   - Redis 7+

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup database**
   ```bash
   # Start PostgreSQL and Redis (or use Docker)
   pnpm db:up

   # Run migrations
   pnpm db:migrate
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

## Usage

### Adding Analytics to Your Website

Add this script to your website's HTML:

```html
<script src="http://localhost:3001/tracker.js" defer></script>
```

Replace `localhost:3001` with your production domain.

### Dashboard Login

1. Go to http://localhost:3000/login
2. Use the credentials from your `.env` file
3. Add your website domain to start tracking

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://arjuna:arjuna_dev_password@localhost:5432/arjuna` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `ADMIN_EMAIL` | Dashboard admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Dashboard admin password | `your_secure_password_here` |
| `JWT_SECRET` | JWT signing secret | `your_jwt_secret_key_here_change_in_production` |
| `PORT` | Collector API port | `3001` |
| `VITE_API_URL` | Dashboard API URL | `http://localhost:3001` |
| `IPINFO_TOKEN` | IPinfo.io API token (optional) | - |

### Geolocation

Arjuna uses a hybrid approach for IP geolocation:

1. **IPinfo.io API** (if token provided) - High accuracy, rate limited
2. **Local Database** - Always available fallback using ip-location-api

To get better geolocation accuracy, sign up for a free IPinfo.io token at https://ipinfo.io/signup and add it to your `.env`:

```bash
IPINFO_TOKEN=your_ipinfo_token_here
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Website       │    │   Collector     │    │   Dashboard     │
│   (tracker.js)  │───▶│   (API)         │◀───│   (Svelte)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   + Redis       │
                       └─────────────────┘
```

### Components

- **Collector** (`apps/collector`): Elysia.js API for collecting analytics events
- **Dashboard** (`apps/dashboard`): SvelteKit web interface for viewing analytics
- **Database Package** (`packages/db`): Drizzle ORM schema and utilities
- **Geo Package** (`packages/geo`): IP geolocation resolvers

## Development

### Project Structure

```
arjuna/
├── apps/
│   ├── collector/          # Analytics API (Elysia.js)
│   └── dashboard/          # Web dashboard (SvelteKit)
├── packages/
│   ├── db/                 # Database schema (Drizzle ORM)
│   └── geo/                # Geolocation utilities
├── docker-compose.yml      # Docker services
├── Dockerfile             # Multi-stage build
└── turbo.json             # Monorepo configuration
```

### Available Scripts

```bash
# Development
pnpm dev                    # Start all services in development mode
pnpm build                  # Build all packages and apps
pnpm lint                   # Lint all code
pnpm format                 # Format code with Prettier

# Database
pnpm db:up                  # Start PostgreSQL and Redis
pnpm db:down                # Stop database services
pnpm db:migrate             # Run database migrations
pnpm db:studio              # Open Drizzle Studio
```

### Docker Commands

```bash
# Production
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services

# Development
docker-compose --profile dev up -d dev  # Start development mode
docker-compose logs -f                  # View logs

# Individual services
docker-compose up -d postgres redis     # Database only
docker-compose up -d collector          # API only
docker-compose up -d dashboard          # Dashboard only
```

## Privacy & Security

- **No Cookies**: Uses session hashing instead of persistent cookies
- **IP Hashing**: Client IPs are hashed with user agent for privacy
- **No Personal Data**: Only collects anonymous usage statistics
- **GDPR Compliant**: No personal identifiable information stored
- **Secure by Default**: Environment-based configuration

## Performance

- **Sub-millisecond Tracking**: Optimized collection endpoint
- **Redis Caching**: Fast lookups for websites, sessions, and geolocation
- **Local Geolocation**: In-memory IP database for instant lookups
- **Minimal Footprint**: Lightweight tracking script (~2KB)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
