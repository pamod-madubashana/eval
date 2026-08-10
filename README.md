<p align="center">
  <img src="Zelosify-Frontend/public/assets/logos/main-logo.png" alt="Zelosify" width="300">
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
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License">
</p>

<p align="center">Multi-tenant contract hiring backend with AI candidate recommendation, strict RBAC, tenant isolation, and performance SLAs.</p>

## Storage

- **Primary**: AWS S3 (production)
- **Fallback**: MinIO (local development, S3-compatible)

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

# Start both frontend and backend (auto-starts Docker services)
npm run dev
```

### Manual Steps (first time only)

```bash
# Start Docker services (PostgreSQL, Keycloak, MinIO)
cd Zelosify-Backend/Server
docker compose up -d
cd ../..

# Run database migrations and seed
cd Zelosify-Backend/Server
npx prisma migrate dev
npx prisma db seed
cd ../..

# Start frontend only
cd Zelosify-Frontend
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

MIT - see [LICENSE](LICENSE) for details.
