# GreenGrow MVP - Implementation Guide

IoT-based vertical farming system with simulated sensors/actuators, MQTT broker, backend API, and React dashboard.

**Stack**: Bun + TypeScript + PostgreSQL + HiveMQ + React + shadcn/ui

---

## Project Setup

```bash
mkdir greengrow && cd greengrow
mkdir backend frontend simulator gateway
```

---

## Phase 1: Infrastructure

### Docker Compose Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: greengrow
      POSTGRES_USER: greengrow
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  hivemq:
    image: hivemq/hivemq4
    ports:
      - "1883:1883"
      - "8080:8080"

volumes:
  postgres_data:
```

**Todo:**
- [x] Create `docker-compose.yml`
- [ ] Run `docker-compose up -d`
- [ ] Verify services running

---

## Phase 2: Database

### Schema

Create `backend/migrations/schema.sql`:
```sql
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL
);

CREATE TABLE racks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  rack_number INTEGER NOT NULL,
  rows INTEGER DEFAULT 5,
  columns INTEGER DEFAULT 5
);

CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id UUID REFERENCES racks(id),
  row INTEGER NOT NULL,
  column INTEGER NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  value JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_readings_rack_time ON sensor_readings(rack_id, timestamp DESC);

CREATE TABLE actuator_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id UUID REFERENCES racks(id),
  row INTEGER NOT NULL,
  column INTEGER NOT NULL,
  actuator_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  parameters JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO farms (id, name) VALUES ('farm_001', 'Demo Farm');
INSERT INTO racks (farm_id, rack_number) 
VALUES 
  ('farm_001', 1),
  ('farm_001', 2),
  ('farm_001', 3);
```

**Todo:**
- [x] Create `backend/migrations/schema.sql`
- [ ] Run migrations: `psql -U greengrow -d greengrow -f backend/migrations/schema.sql`

---

## Phase 3: Backend API

### Setup
```bash
cd backend
bun init -y
bun add express cors pg mqtt
bun add -d @types/express @types/cors @types/pg
```

### Structure
```
backend/
├── src/
│   ├── db.ts
│   ├── routes/
│   │   ├── sensors.ts
│   │   ├── actuators.ts
│   │   └── dashboard.ts
│   └── index.ts
└── package.json
```

### Implementation

**`src/db.ts`**
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'greengrow',
  user: 'greengrow',
  password: 'password',
});
```

**`src/routes/sensors.ts`**
```typescript
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Ingest sensor data
router.post('/sensor-readings', async (req, res) => {
  const { rack_id, row, column, sensor_type, value } = req.body;
  await pool.query(
    'INSERT INTO sensor_readings (rack_id, row, column, sensor_type, value) VALUES ($1, $2, $3, $4, $5)',
    [rack_id, row, column, sensor_type, JSON.stringify(value)]
  );
  res.json({ success: true });
});

// Get latest readings for a rack
router.get('/sensor-readings/latest/:rack_id', async (req, res) => {
  const { rack_id } = req.params;
  const result = await pool.query(
    `SELECT DISTINCT ON (row, column, sensor_type) *
     FROM sensor_readings
     WHERE rack_id = $1
     ORDER BY row, column, sensor_type, timestamp DESC`,
    [rack_id]
  );
  res.json(result.rows);
});

// Get historical data
router.get('/sensor-readings/history', async (req, res) => {
  const { rack_id, row, column, sensor_type, hours = 24 } = req.query;
  const result = await pool.query(
    `SELECT * FROM sensor_readings
     WHERE rack_id = $1 AND row = $2 AND column = $3 AND sensor_type = $4
     AND timestamp > NOW() - INTERVAL '${hours} hours'
     ORDER BY timestamp DESC`,
    [rack_id, row, column, sensor_type]
  );
  res.json(result.rows);
});

export default router;
```

**`src/routes/actuators.ts`**
```typescript
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Send actuator command
router.post('/actuator-commands', async (req, res) => {
  const { rack_id, row, column, actuator_type, action, parameters } = req.body;
  const result = await pool.query(
    `INSERT INTO actuator_commands (rack_id, row, column, actuator_type, action, parameters)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [rack_id, row, column, actuator_type, action, JSON.stringify(parameters)]
  );
  res.json({ id: result.rows[0].id });
});

// Get pending commands
router.get('/actuator-commands/pending', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM actuator_commands WHERE status = 'pending' ORDER BY created_at`
  );
  res.json(result.rows);
});

export default router;
```

**`src/routes/dashboard.ts`**
```typescript
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/dashboard/racks', async (req, res) => {
  const result = await pool.query('SELECT * FROM racks ORDER BY rack_number');
  res.json(result.rows);
});

export default router;
```

**`src/index.ts`**
```typescript
import express from 'express';
import cors from 'cors';
import sensorRoutes from './routes/sensors';
import actuatorRoutes from './routes/actuators';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', sensorRoutes);
app.use('/api', actuatorRoutes);
app.use('/api', dashboardRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
```

**Todo:**
- [x] Create all backend files
- [ ] Run: `bun run src/index.ts`
- [ ] Test: `curl http://localhost:3000/api/dashboard/racks`

---

## Phase 4: IoT Gateway

### Setup
```bash
cd gateway
bun init -y
bun add mqtt
```

### Implementation

**`src/gateway.ts`**
```typescript
import mqtt from 'mqtt';

const mqttClient = mqtt.connect('mqtt://localhost:1883');
const API_URL = 'http://localhost:3000/api';

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('greengrow/+/+/+/+/+/+');
});

mqttClient.on('message', async (topic, message) => {
  const parts = topic.split('/');
  if (parts.length !== 7) return;

  const [, farm_id, rack_id, row, column, device, type] = parts;
  const value = JSON.parse(message.toString());

  // Forward sensor data to backend
  if (['light_sensor', 'moisture_sensor', 'color_camera'].includes(device)) {
    await fetch(`${API_URL}/sensor-readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rack_id,
        row: parseInt(row),
        column: parseInt(column),
        sensor_type: device,
        value,
      }),
    });
    console.log(`Forwarded ${device} data from ${rack_id}/${row}/${column}`);
  }
});

// Poll for actuator commands and publish to MQTT
setInterval(async () => {
  const res = await fetch(`${API_URL}/actuator-commands/pending`);
  const commands = await res.json();

  for (const cmd of commands) {
    const topic = `greengrow/farm_001/${cmd.rack_id}/${cmd.row}/${cmd.column}/${cmd.actuator_type}/${cmd.action}`;
    mqttClient.publish(topic, JSON.stringify(cmd.parameters));
    
    // Update command status
    await fetch(`${API_URL}/actuator-commands/${cmd.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    });
  }
}, 2000);
```

**Todo:**
- [x] Create `gateway/src/gateway.ts`
- [ ] Run: `bun run src/gateway.ts`

---

## Phase 5: Device Simulator

### Setup
```bash
cd simulator
bun init -y
bun add mqtt
```

### Implementation

**`src/simulator.ts`**
```typescript
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

const RACKS = [
  { rack_id: 'rack_001', rows: 5, columns: 5 },
  { rack_id: 'rack_002', rows: 5, columns: 5 },
  { rack_id: 'rack_003', rows: 5, columns: 5 },
];

interface Position {
  rack_id: string;
  row: number;
  column: number;
  moisture: number;
  lightLevel: number;
}

const positions: Position[] = [];

// Initialize positions
RACKS.forEach(rack => {
  for (let row = 1; row <= rack.rows; row++) {
    for (let col = 1; col <= rack.columns; col++) {
      positions.push({
        rack_id: rack.rack_id,
        row,
        column: col,
        moisture: 50 + Math.random() * 30,
        lightLevel: 60 + Math.random() * 20,
      });
    }
  }
});

client.on('connect', () => {
  console.log(`Simulator connected - ${positions.length} positions`);

  // Subscribe to actuator commands
  client.subscribe('greengrow/+/+/+/+/water_pump/spray_water');
  client.subscribe('greengrow/+/+/+/+/lamp/set_light_level');

  // Start publishing sensor data
  startSensors();
});

// Handle actuator commands
client.on('message', (topic, message) => {
  const parts = topic.split('/');
  const [, , rack_id, row, column, actuator, action] = parts;
  
  const pos = positions.find(p => 
    p.rack_id === rack_id && p.row === parseInt(row) && p.column === parseInt(column)
  );
  
  if (!pos) return;

  if (actuator === 'water_pump') {
    pos.moisture = Math.min(100, pos.moisture + 20);
    console.log(`💧 Watered ${rack_id}/${row}/${column} - moisture now ${pos.moisture.toFixed(1)}%`);
  } else if (actuator === 'lamp') {
    const params = JSON.parse(message.toString());
    pos.lightLevel = params.intensity || 80;
    console.log(`💡 Light adjusted ${rack_id}/${row}/${column} - level ${pos.lightLevel}%`);
  }
});

function startSensors() {
  // Publish sensor data every 10 seconds
  setInterval(() => {
    positions.forEach(pos => {
      // Moisture decreases over time
      pos.moisture = Math.max(0, pos.moisture - Math.random() * 2);

      // Light sensor
      const lightTopic = `greengrow/farm_001/${pos.rack_id}/${pos.row}/${pos.column}/light_sensor/light_level`;
      client.publish(lightTopic, JSON.stringify({ value: pos.lightLevel, unit: 'percent' }));

      // Moisture sensor
      const moistureTopic = `greengrow/farm_001/${pos.rack_id}/${pos.row}/${pos.column}/moisture_sensor/moisture_level`;
      client.publish(moistureTopic, JSON.stringify({ value: pos.moisture, unit: 'percent' }));

      // Color camera (health score based on moisture)
      const health = pos.moisture > 30 ? 80 + Math.random() * 20 : 40 + Math.random() * 20;
      const colorTopic = `greengrow/farm_001/${pos.rack_id}/${pos.row}/${pos.column}/color_camera/plant_color`;
      client.publish(colorTopic, JSON.stringify({ value: health, unit: 'health_score' }));
    });
  }, 10000);

  console.log('📡 Sensors publishing every 10 seconds');
}
```

**Todo:**
- [x] Create `simulator/src/simulator.ts`
- [ ] Run: `bun run src/simulator.ts`
- [ ] Verify data in database: `SELECT * FROM sensor_readings LIMIT 10;`

---

## Phase 6: Frontend Dashboard

### Setup
```bash
cd frontend
bun create vite . --template react-ts
bun install
bun add @tanstack/react-query axios recharts lucide-react
bunx shadcn@latest init -d
bunx shadcn@latest add button card select slider table badge
```

### Structure
```
frontend/src/
├── components/
│   ├── RackGrid.tsx
│   ├── PlantCell.tsx
│   ├── SensorChart.tsx
│   └── ActuatorControls.tsx
├── lib/
│   └── api.ts
└── App.tsx
```

### Implementation

**`src/lib/api.ts`**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const getRacks = () => api.get('/dashboard/racks');
export const getLatestReadings = (rackId: string) => api.get(`/sensor-readings/latest/${rackId}`);
export const getHistory = (params: any) => api.get('/sensor-readings/history', { params });
export const sendCommand = (data: any) => api.post('/actuator-commands', data);
```

**`src/components/RackGrid.tsx`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { getLatestReadings } from '../lib/api';
import PlantCell from './PlantCell';
import { Card } from '@/components/ui/card';

interface Props {
  rackId: string;
}

export default function RackGrid({ rackId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['readings', rackId],
    queryFn: () => getLatestReadings(rackId),
    refetchInterval: 5000,
  });

  if (isLoading) return <div>Loading...</div>;

  const readings = data?.data || [];
  const grid = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      row: row + 1,
      column: col + 1,
      readings: readings.filter((r: any) => r.row === row + 1 && r.column === col + 1),
    }))
  );

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Rack {rackId}</h2>
      <div className="grid grid-cols-5 gap-2">
        {grid.flat().map((cell) => (
          <PlantCell
            key={`${cell.row}-${cell.column}`}
            rackId={rackId}
            row={cell.row}
            column={cell.column}
            readings={cell.readings}
          />
        ))}
      </div>
    </Card>
  );
}
```

**`src/components/PlantCell.tsx`**
```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ActuatorControls from './ActuatorControls';

interface Props {
  rackId: string;
  row: number;
  column: number;
  readings: any[];
}

export default function PlantCell({ rackId, row, column, readings }: Props) {
  const [showControls, setShowControls] = useState(false);

  const moisture = readings.find(r => r.sensor_type === 'moisture_sensor')?.value?.value || 0;
  const light = readings.find(r => r.sensor_type === 'light_sensor')?.value?.value || 0;
  const health = readings.find(r => r.sensor_type === 'color_camera')?.value?.value || 0;

  const getStatus = () => {
    if (moisture < 30) return 'bg-red-500';
    if (moisture < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <Card
        className={`p-3 cursor-pointer hover:shadow-lg transition ${getStatus()}`}
        onClick={() => setShowControls(true)}
      >
        <div className="text-xs font-mono text-white">
          <div>Pos: {row},{column}</div>
          <div>💧 {moisture.toFixed(0)}%</div>
          <div>💡 {light.toFixed(0)}%</div>
          <div>🌱 {health.toFixed(0)}</div>
        </div>
      </Card>

      {showControls && (
        <ActuatorControls
          rackId={rackId}
          row={row}
          column={column}
          onClose={() => setShowControls(false)}
        />
      )}
    </>
  );
}
```

**`src/components/ActuatorControls.tsx`**
```typescript
import { useState } from 'react';
import { sendCommand } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface Props {
  rackId: string;
  row: number;
  column: number;
  onClose: () => void;
}

export default function ActuatorControls({ rackId, row, column, onClose }: Props) {
  const [lightLevel, setLightLevel] = useState(80);

  const handleWater = async () => {
    await sendCommand({
      rack_id: rackId,
      row,
      column,
      actuator_type: 'water_pump',
      action: 'spray_water',
      parameters: { duration: 5 },
    });
    alert('Water command sent!');
  };

  const handleLight = async () => {
    await sendCommand({
      rack_id: rackId,
      row,
      column,
      actuator_type: 'lamp',
      action: 'set_light_level',
      parameters: { intensity: lightLevel },
    });
    alert('Light command sent!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Controls - Position {row},{column}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Button onClick={handleWater} className="w-full">
              💧 Water Plant
            </Button>
          </div>

          <div>
            <label className="text-sm">Light Level: {lightLevel}%</label>
            <Slider
              value={[lightLevel]}
              onValueChange={([v]) => setLightLevel(v)}
              max={100}
              step={1}
            />
            <Button onClick={handleLight} className="w-full mt-2">
              💡 Set Light Level
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

**`src/App.tsx`**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import RackGrid from './components/RackGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRacks } from './lib/api';

const queryClient = new QueryClient();

function Dashboard() {
  const [racks, setRacks] = useState<any[]>([]);
  const [selectedRack, setSelectedRack] = useState('');

  useEffect(() => {
    getRacks().then(res => {
      setRacks(res.data);
      if (res.data.length > 0) setSelectedRack(res.data[0].id);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-green-700">🌱 GreenGrow Dashboard</h1>
        
        <div className="mb-6">
          <Select value={selectedRack} onValueChange={setSelectedRack}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select rack" />
            </SelectTrigger>
            <SelectContent>
              {racks.map(rack => (
                <SelectItem key={rack.id} value={rack.id}>
                  Rack {rack.rack_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRack && <RackGrid rackId={selectedRack} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
```

**Todo:**
- [x] Create all frontend files
- [ ] Run: `bun run dev`
- [ ] Open http://localhost:5173

---

## Verification Checklist

- [ ] Docker services running (PostgreSQL + HiveMQ)
- [ ] Database has schema and seed data
- [ ] Backend API responds to requests
- [ ] Gateway forwards MQTT messages to backend
- [ ] Simulator publishes sensor data (75 positions total)
- [ ] Frontend displays 5×5 grid with real-time data
- [ ] Clicking plant cell opens control dialog
- [ ] Water/light commands execute and affect sensor readings

---

## Running the Complete System

```bash
# Terminal 1: Start infrastructure
docker-compose up

# Terminal 2: Start backend
cd backend && bun run src/index.ts

# Terminal 3: Start gateway
cd gateway && bun run src/gateway.ts

# Terminal 4: Start simulator
cd simulator && bun run src/simulator.ts

# Terminal 5: Start frontend
cd frontend && bun run dev
```

Open http://localhost:5173 and verify the system works!