<p align="center">
  <img src="Zelosify-Frontend/public/assets/logos/zelosify_Dark.png" alt="Zelosify" width="300">
</p>

<h1 align="center">Zelosify — AI-Powered Contract Hiring Platform</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-4.21-000000.svg" alt="Express">
  <img src="https://img.shields.io/badge/Next.js-15-000000.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-6.3-2D3748.svg" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1.svg" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/AI-Groq%20%7C%20Gemini-FF6D00.svg" alt="AI">
  <img src="https://img.shields.io/badge/license-ISC-yellow.svg" alt="License">
</p>

Multi-tenant contract hiring backend with AI candidate recommendation, strict RBAC, tenant isolation, and performance SLAs.

## Project Structure

```
zelosify/
├── Zelosify-Backend/    # Express + Prisma + AI agent
│   └── Server/
│       ├── prisma/      # Schema, migrations, seed
│       ├── src/         # Frameworks, services, repositories
│       └── tests/       # Unit, integration, performance
├── Zelosify-Frontend/   # Next.js application
├── docs/                # Setup guides, testing guide, roadmap
└── package.json         # Monorepo scripts
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start Docker services (PostgreSQL, Keycloak, MinIO)
docker compose up -d

# Run database migrations and seed
cd Zelosify-Backend/Server
npx prisma migrate dev
npx prisma db seed
cd ../..

# Start both frontend and backend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/v1 |
| Keycloak | http://localhost:8180 |
| MinIO Console | http://localhost:9001 |

## Documentation

- [Setup Guide](docs/Setup_Guide.md) — full environment setup
- [Testing Guide](docs/Testing_Guide.md) — manual testing walkthrough
- [Roadmap](docs/Roadmap.md) — project milestones
- [Backend README](Zelosify-Backend/README.md) — API reference and architecture

## License

ISC
