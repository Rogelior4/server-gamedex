# Gamedex Server

A NestJS REST API for managing a personal video game collection. Features full CRUD operations and Steam API integration for fetching cover art.

## Tech Stack

- **Core:** NestJS, TypeScript
- **Data:** Prisma ORM, PostgreSQL
- **Utils:** Axios, Class Validator

## Quick Start

1. Installation
   git clone [https://github.com/Rogelior4/gamedex-server.git](https://github.com/Rogelior4/gamedex-server.git)
   cd gamedex-server
   npm install

2. Database SetupCreate a .env file in the root with your connection string:
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   Then sync the schema:Bashnpx prisma db push

3. Run ServerBashnpm run start:dev
