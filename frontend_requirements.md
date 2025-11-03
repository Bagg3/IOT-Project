# Frontend Requirements & Outline

> React + Vite dashboard for the GreenGrow MVP. Focus on clarity, real-time observability, and quick actuator actions.

## 1. Environment & Tooling

- **Runtime**: Bun (development commands), Node-compatible.
- **Framework**: React 18 with Vite (TypeScript template).
- **State/Data**: @tanstack/react-query for server state caching and polling.
- **Styling**: Tailwind CSS + shadcn/ui component primitives.
- **Icons & Charts**: lucide-react for icons, Recharts for time-series visualizations.
- **HTTP Client**: Axios with centralized base URL (`VITE_API_BASE_URL`).

## 2. Project Structure

```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── lib/
│   │   └── api.ts
│   ├── components/
│   │   ├── RackGrid.tsx
│   │   ├── PlantCell.tsx
│   │   ├── ActuatorControls.tsx
│   │   └── SensorChart.tsx
│   └── components/ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
└── public/
```

- Maintain strict TypeScript with shared domain types in `lib/api.ts`.
- `components/ui` holds lightweight wrappers using shadcn conventions (`cn` utility, forwardRef, variants).

## 3. Core User Flows

### 3.1 Rack Overview
- Fetch rack metadata (`GET /dashboard/racks`) on mount.
- Provide rack selector (default first rack).
- Show 5×5 grid of plant cells with color-coded health status.

### 3.2 Plant Cell Details
- For each cell display:
  - Moisture, light, and health values (`latest sensor readings`).
  - Color-coded background: red (<30% moisture), yellow (30–50%), green (>50%).
- Clicking opens modal with actuator controls and historical chart.

### 3.3 Actuator Controls Modal
- Water command button (`POST /actuator-commands`, water_pump).
- Light intensity slider (0–100) + command send (`lamp`).
- Show moisture trend chart (last 6h) via `SensorChart` (Recharts).
- Close button to dismiss modal without actions.

## 4. Data Fetching & Refresh

- Use React Query hooks.
- Poll latest sensor readings every 5 seconds per selected rack.
- Poll history data only while modal is open (managed by `SensorChart`).
- Handle loading/error states with friendly messages.

## 5. UI/UX Guidelines

- Consistent spacing via Tailwind utilities.
- Responsive layout: grid should wrap on narrow screens.
- Feedback on command submission (optimistic close + toast/alert fallback).
- Accessibility: semantic buttons, labels for sliders/select.

## 6. Configuration & Environment

- `.env` variable `VITE_API_BASE_URL` default `http://localhost:3000/api`.
- Ensure `import.meta.env` typings via `vite-env.d.ts`.
- Vite dev server on port 5173, accessible at 0.0.0.0 for container use.

## 7. Quality & Testing

- Type-check (`bunx tsc --noEmit`).
- Lint/format with Biome or equivalent.
- Manual verification steps:
  1. Start backend, gateway, simulator.
  2. Run `bun run dev` (frontend).
  3. Confirm rack list populates.
  4. Observe live sensor updates.
  5. Trigger actuator commands and ensure simulator logs expected changes.

## 8. Stretch Enhancements (Optional)

1. Persist command status updates visually (pending/sent/completed).
2. Add global notifications for API errors.
3. Implement authentication guard and role-based access.
4. Provide multi-rack overview dashboard (aggregate stats).
5. Integrate dark mode toggle leveraging Tailwind's class-based dark mode.
