# Arjuna Analytics 🚀

A minimal, privacy-respecting web analytics platform built with modern tools.

## 🏗️ Architecture

```
├─ apps/
│  ├─ dashboard/         # SvelteKit frontend for viewing analytics
│  └─ collector/         # Bun + Elysia API to collect events
├─ packages/
│  ├─ geo/               # Shared geo resolver (using IP-API)
│  └─ db/                # Shared DB wrapper (PostgreSQL + Redis)
├─ docker-compose.yml
├─ turbo.json
└─ README.md
```

## ✨ Features

### 🧠 Core Analytics
- **✅ Pageviews** - Track page loads and SPA route changes
- **✅ Unique Visitors** - Based on hashed IP + user agent per day
- **✅ Country/Location** - IP geolocation using IP-API service
- **✅ Referrers** - Track traffic sources (Google, Twitter, direct, etc.)
- **✅ Top Pages** - Most visited URLs on your site
- **✅ UTM Tracking** - Campaign tracking with utm_source, utm_medium, utm_campaign

### 📊 Advanced Analytics
- **✅ Bounce Rate** - Sessions with only one pageview
- **✅ Visit Duration** - Time between first and last pageview
- **✅ Devices, OS, Browsers** - User-agent parsing
- **✅ Live Visitors** - Real-time active users (5-minute window)

### ⚙️ Technical Features
- **✅ No Cookies** - Fully privacy-respecting
- **✅ Tracking Script** - Lightweight JavaScript snippet
- **✅ SPA Support** - Hooks into pushState/popstate for single-page apps
- **✅ Bot Filtering** - Ignores crawlers and bots

### 🛡️ Admin Features
- **✅ Email/Password Auth** - Environment-based admin credentials
- **✅ Beautiful Dashboard** - Modern UI with Tailwind CSS
- **✅ Real-time Stats** - Live visitor count and activity

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Docker and Docker Compose
- Bun runtime (for the collector API)

### 1. Clone and Install
```bash
git clone <your-repo>
cd arjuna
pnpm install
```

### 2. Setup Environment
```bash
cp env.example .env
# Edit .env with your settings:
# - ADMIN_EMAIL and ADMIN_PASSWORD
# - JWT_SECRET (generate a secure random string)
```

### 3. Start Databases
```bash
pnpm db:up
```

### 4. Run Database Migrations
```bash
pnpm db:migrate
```

### 5. Start Development Servers
```bash
pnpm dev
```

This starts:
- **Collector API** at http://localhost:3001
- **Dashboard** at http://localhost:5173

### 6. Login to Dashboard
1. Open http://localhost:5173
2. Click "Login" 
3. Use the email/password from your `.env` file

## 📝 Adding Tracking to Your Website

Add this script tag to your website's `<head>`:

```html
<script src="http://localhost:3001/tracker.js" defer></script>
```

For production, replace `localhost:3001` with your collector domain.

### Alternative Path (Avoid Ad Blockers)
```html
<script src="http://localhost:3001/js/script.js" defer></script>
```

## 🗄️ Database Schema

- **websites** - Tracked domains
- **pageviews** - Individual page visits with metadata
- **sessions** - Visitor sessions for bounce rate and duration
- **users** - Admin users (currently environment-based)

## 🔧 Development

### Database Commands
```bash
pnpm db:up        # Start PostgreSQL and Redis
pnpm db:down      # Stop databases
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Drizzle Studio
```

### Project Commands
```bash
pnpm dev          # Start all development servers
pnpm build        # Build all apps
pnpm lint         # Lint all code
pnpm format       # Format code with Prettier
```

## 🏗️ Project Structure

### Apps
- **`apps/dashboard`** - SvelteKit app with Tailwind CSS for the analytics dashboard
- **`apps/collector`** - Bun + Elysia API server for collecting tracking events

### Packages
- **`packages/db`** - Shared database schema and utilities (Drizzle ORM + PostgreSQL + Redis)
- **`packages/geo`** - IP geolocation resolver using IP-API service

## 🔐 Authentication

Simple email/password authentication using environment variables:
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file
- JWT tokens for session management
- No user registration - admin-only access

## 🌍 Geolocation

Uses the free IP-API service (15,000 requests/hour limit):
- Automatic rate limiting
- In-memory caching
- Fallback to CloudFlare headers
- Privacy-focused IP hashing

## 🎨 Tech Stack

- **Frontend**: SvelteKit + Tailwind CSS + TypeScript
- **Backend**: Bun + Elysia + TypeScript  
- **Database**: PostgreSQL + Redis
- **ORM**: Drizzle ORM
- **Build**: Turbo + pnpm workspaces
- **Infrastructure**: Docker Compose

## 📈 Roadmap

### Optional Features (for later)
- [ ] Email Reports - Weekly traffic summaries
- [ ] Public Dashboards - Shareable analytics links  
- [ ] Data Export - CSV downloads
- [ ] Custom Events - Track button clicks, form submissions
- [ ] Real-time Charts - Time-series graphs with Chart.js
- [ ] Multiple Websites - Support for multiple domains
- [ ] User Management - Multi-user access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Inspiration

Inspired by privacy-focused analytics tools like Plausible and Simple Analytics, but built with modern JavaScript tools and designed to be easily self-hosted.
