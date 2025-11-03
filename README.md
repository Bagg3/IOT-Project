# GreenGrow MVP

IoT-powered vertical farming demo consisting of a Bun/TypeScript backend, MQTT gateway, device simulator, and React dashboard.

## Prerequisites

- Docker (for PostgreSQL and HiveMQ)
- Bun >= 1.1.0
- Node.js 18+ (for tooling around Vite/Tailwind if needed)

## Quick Start

1. Copy `.env.example` to `.env` and tweak if needed.
2. Start infrastructure:
   ```pwsh
   docker compose up -d
   ```
3. Apply database schema:
   ```pwsh
   bunx psql -h localhost -U greengrow -d greengrow -f backend/migrations/schema.sql
   ```
4. Install dependencies (`bun install`) within each workspace (`backend`, `gateway`, `simulator`, `frontend`).
5. Run services (each in its own terminal):
   ```pwsh
   bun run --cwd backend dev
   bun run --cwd gateway dev
   bun run --cwd simulator dev
   bun run --cwd frontend dev
   ```
6. Open `http://localhost:5173` to access the dashboard.

## Testing The Flow

- Verify live readings populate in the dashboard (updates every 5 seconds).
- Issue water/light commands from a plant cell and confirm the simulator logs the action.
- Check `actuator_commands` table to see command status transitions.

## Project Structure

- `backend/` – REST API (Express + PostgreSQL)
- `gateway/` – MQTT bridge between sensors/actuators and backend
- `simulator/` – Virtual sensor/actuator publisher using MQTT
- `frontend/` – React dashboard (Vite + React Query + Tailwind)
- `docker-compose.yml` – PostgreSQL + HiveMQ broker
- `backend/migrations/schema.sql` – Database schema and seed data

## Useful Commands

- `docker compose ps` – Verify Postgres & HiveMQ containers
- `bunx psql -h localhost -U greengrow -d greengrow -c "SELECT COUNT(*) FROM sensor_readings;"` – Check ingested readings
- `bun test` (future) – Placeholder for automated tests

## Next Steps

- Add authentication and role-based access
- Persist actuator command acknowledgements from devices
- Add alerting/notification service for threshold breaches
- Implement automated CI and deployment scripts
