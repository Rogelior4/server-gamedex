# Gamedex Server

A NestJS REST API for managing a personal video game collection. Features full CRUD operations, PostgreSQL persistence via Prisma ORM, and Multi-Platform API integration (Steam, Epic Games, Nintendo, Riot Games, Battle.net, EA App, Ubisoft Connect, Xbox, PlayStation) for dynamically fetching cover art and live game search.

## Tech Stack

- **Core:** NestJS 11, TypeScript
- **Database & ORM:** Prisma ORM, PostgreSQL (via Docker)
- **Utilities:** Axios, Class Validator, Class Transformer
- **Metadata Providers:** Steam Store API, Epic Games GraphQL, Nintendo eShop Algolia, Curated Launcher Catalog (Riot, Battle.net, EA, Ubisoft, Xbox, PlayStation), and optional RAWG API.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL container)

## Quick Start

### 1. Installation

```bash
git clone https://github.com/Rogelior4/server-gamedex.git
cd server-gamedex
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
# Windows PowerShell / CMD
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Default variables in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gamedex?schema=public"
PORT=3000
# Optional: Universal RAWG game database key (https://rawg.io/apidocs)
RAWG_API_KEY=""
```

### 3. Database Setup (Docker)

Start the PostgreSQL container:

```bash
docker compose up -d
```

Push the Prisma schema to the database:

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/games` | Retrieve all games in the collection |
| `POST` | `/games` | Create a new game (`{ "title": string, "platform": string }`) |
| `GET` | `/games/:id` | Retrieve a single game by numeric ID |
| `PATCH` | `/games/:id` | Update game fields (`{ "title"?: string, "platform"?: string }`) |
| `DELETE` | `/games/:id` | Remove a game by ID |
| `GET` | `/games/search?term=...&platform=...` | Live multi-platform search across Steam, Epic, Nintendo, Riot, BNet, EA, Ubisoft, Xbox |
| `GET` | `/games/search-steam?term=...` | Legacy/specific Steam search |
| `GET` | `/games/cover/:title?platform=...` | Cascade fetch best vertical cover art across platforms |
| `POST` | `/games/sync-covers` | Auto-sync missing covers for library games across their matching platform |
| `POST` | `/games/import` | Bulk import an array of games |
