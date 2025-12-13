# GreenGrow MVP

IoT-powered vertical farming demo consisting of a Bun/TypeScript backend, MQTT gateway, device simulator, and React dashboard.

## Prerequisites

- Docker (for PostgreSQL and Mosquitto)
- Bun >= 1.1.0
- Node.js 18+ (for tooling around Vite/Tailwind if needed)

## Quick Start

1. Build and start all services:
   ```pwsh
   docker compose up --build
   ```

2. Open http://localhost:8080 to access the dashboard.

> **Note:** The backend automatically runs database migrations and seeds data on startup.

## What Gets Started

- PostgreSQL database (port 5432)
- Mosquitto MQTT broker (port 1883)
- Backend API (port 3000) - auto-migrates & seeds database
- Frontend dashboard (port 8080)
- 5 Gateway instances (with integrated simulators) for racks 1-5

## Development Mode (Local)

If you want to develop locally without Docker:

1. Start only infrastructure:
   ```pwsh
   docker compose up -d postgres mosquitto
   ```

2. Install dependencies and run services:
   ```pwsh
   # In separate terminals
   bun run --cwd backend dev
   bun run --cwd gateway dev
   bun run --cwd simulator dev
   bun run --cwd frontend dev
   ```

3. Open http://localhost:5173 for local dev server.

## Testing The Flow

- Verify live readings populate in the dashboard (updates every 5 seconds).
- Issue water/light commands from a plant cell and confirm the simulator logs the action.
- Check `actuator_commands` table to see command status transitions.

## Project Structure

- `backend/` – REST API (Express + PostgreSQL)
- `gateway/` – MQTT bridge between sensors/actuators and backend
- `simulator/` – Virtual sensor/actuator publisher using MQTT
- `frontend/` – React dashboard (Vite + React Query + Tailwind)
- `docker-compose.yml` – PostgreSQL + Mosquitto broker
- `backend/migrations/schema.sql` – Database schema and seed data

## Useful Commands

- `docker compose ps` – Verify Postgres & Mosquitto containers
- `bunx psql -h localhost -U greengrow -d greengrow -c "SELECT COUNT(*) FROM sensor_readings;"` – Check ingested readings
- `bun test` (future) – Placeholder for automated tests

## Next Steps

- Add authentication and role-based access
- Persist actuator command acknowledgements from devices
- Add alerting/notification service for threshold breaches
- Implement automated CI and deployment scripts
