<p align="center">
  <img src="../Zelosify-Frontend/public/assets/logos/main-logo.png" alt="Zelosify" width="300">
</p>

<h1 align="center">Zelosify Backend</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-4.21-000000.svg" alt="Express">
  <img src="https://img.shields.io/badge/Prisma-6.3-2D3748.svg" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1.svg" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Keycloak-26-4D89C2.svg" alt="Keycloak">
  <img src="https://img.shields.io/badge/MinIO-S3-C72C48.svg" alt="MinIO">
  <img src="https://img.shields.io/badge/AI-Groq%20%7C%20Gemini-FF6D00.svg" alt="AI">
  <img src="https://img.shields.io/badge/Vitest-3.2-6E9F17.svg" alt="Vitest">
</p>

Multi-tenant contract hiring module with AI-powered candidate recommendation, RBAC, and tenant isolation.

## Features

- **Multi-tenant architecture** — strict tenant isolation on all data access
- **RBAC** — IT Vendor and Hiring Manager roles via Keycloak
- **AI recommendation agent** — Groq/Gemini LLM for resume parsing and candidate scoring
- **Prompt injection hardening** — sanitized LLM inputs, keyword blocklists
- **S3 storage** — AWS S3 primary, MinIO fallback for local development
- **Performance SLAs** — timeout middleware, rate limiting, per-profile scoring under 1.5s

## Prerequisites

- Docker (PostgreSQL, Keycloak, MinIO for fallback)
- Node.js v22+
- npm

## Storage Configuration

The backend uses **AWS S3** as the primary storage provider with automatic **MinIO fallback** for local development.

### Environment Variables

```bash
# Primary: AWS S3
STORAGE_PROVIDER=aws
S3_AWS_REGION=us-east-1
S3_ACCESS_KEY_ID=your_aws_access_key
S3_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your-bucket-name

# Fallback: MinIO (used if AWS S3 fails)
MINIO_ENDPOINT=http://localhost:9100
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=zelosify-uploads
```

### How It Works

1. On startup, the backend attempts to initialize AWS S3
2. If AWS S3 fails (invalid credentials, network issues), it automatically falls back to MinIO
3. MinIO is S3-compatible, so the same API works for both

## Installation

```bash
# Clone the repo
git clone https://github.com/pamod-madubashana/eval-3ee6ea906a5c.git
cd eval-3ee6ea906a5c/Zelosify-Backend/Server

# Install dependencies
npm ci

# Set up environment
cp .env.example .env   # edit with your values

# Start Docker services (from repo root)
docker compose up -d

# Run migrations and seed
npx prisma migrate dev
npx prisma db seed
```

## Usage

```bash
# Development
npm run dev

# Build
npm run build

# Start (production)
npm start
```

### API Endpoints

| Route | Role | Description |
|---|---|---|
| `POST /api/v1/auth/login` | All | Authenticate user |
| `GET /api/v1/vendor/openings` | Vendor | List all openings |
| `GET /api/v1/vendor/openings/:id` | Vendor | Opening details + HM name |
| `POST /api/v1/vendor/openings/:id/presign` | Vendor | Get S3 upload URL |
| `POST /api/v1/vendor/openings/:id/upload` | Vendor | Upload candidate resume |
| `POST /api/v1/vendor/openings/:id/recommend` | Vendor | Run AI agent on candidates |
| `GET /api/v1/hiring-manager/openings` | HM | List owned openings |
| `GET /api/v1/hiring-manager/openings/:id` | HM | Opening details |
| `POST /api/v1/hiring-manager/openings/:id/shortlist` | HM | Shortlist candidate |
| `POST /api/v1/hiring-manager/openings/:id/reject` | HM | Reject candidate |
| `PATCH /api/v1/hiring-manager/profiles/:id/status` | HM | Update candidate status |

## Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui
```

158 tests across unit, integration, and performance suites.

## Project Structure

```
Server/
├── prisma/           # Schema, migrations, seed
├── src/
│   ├── frameworks/   # Express app, middleware, routes (clean arch)
│   ├── routers/      # Route handlers (vendor, hiring-manager, auth)
│   ├── services/     # Business logic, AI agent, resume parsing
│   └── repositories/ # Prisma data access
└── tests/
    ├── unit/         # Scoring, auth, validation, prompt injection
    ├── integration/  # Full flow tests
    └── performance/  # Latency SLA tests
```

## Support

See `docs/Setup_Guide.md` and `docs/Testing_Guide.md` for detailed setup and manual testing instructions.

## Contributing

1. Run `npm test` before pushing
2. Follow existing code conventions
3. Add tests for new features

## Authors

Zelosify Team

## License

MIT - see [LICENSE](../LICENSE) for details.

## Project Status

Active — assessment and development in progress.
