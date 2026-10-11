# Gamedex Server

A NestJS REST API for managing a personal video game collection. Features full CRUD operations, PostgreSQL persistence via Prisma ORM, and Steam API integration for dynamically fetching cover art.

## Tech Stack

- **Core:** NestJS 11, TypeScript
- **Database & ORM:** Prisma ORM, PostgreSQL (via Docker)
- **Utilities:** Axios, Class Validator, Class Transformer

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
| `GET` | `/games/cover/:title` | Fetch Steam library 600x900 cover URL by title |
