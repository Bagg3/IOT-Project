import type { PoolClient, QueryResultRow } from "pg";

type SpeciesSeedConfig = {
  id: string;
  species_name: string;
  scientific_name: string;
  optimal_moisture_min: number;
  optimal_moisture_max: number;
  optimal_light_intensity_min: number;
  optimal_light_intensity_max: number;
  optimal_color_index: number;
  growth_duration_days: number;
};

type PlantSlot = {
  species: string;
  nickname?: string;
};

function createSpecies(
  id: string,
  species_name: string,
  scientific_name: string,
  moistureRange: [number, number],
  lightRange: [number, number],
  colorIndex: number,
  growthDurationDays: number
): SpeciesSeedConfig {
  return {
    id,
    species_name,
    scientific_name,
    optimal_moisture_min: moistureRange[0],
    optimal_moisture_max: moistureRange[1],
    optimal_light_intensity_min: lightRange[0],
    optimal_light_intensity_max: lightRange[1],
    optimal_color_index: colorIndex,
    growth_duration_days: growthDurationDays
  } satisfies SpeciesSeedConfig;
}

function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

const SPECIES_SEED_DATA: SpeciesSeedConfig[] = [
  createSpecies("00000000-0000-0000-0000-000000000201", "Butterhead Lettuce", "Lactuca sativa", [45, 65], [55, 75], 85, 28),
  createSpecies("00000000-0000-0000-0000-000000000202", "Genovese Basil", "Ocimum basilicum", [45, 60], [55, 75], 82, 45),
  createSpecies("00000000-0000-0000-0000-000000000203", "Thai Basil", "Ocimum basilicum var. thyrsiflora", [45, 60], [55, 75], 82, 45),
  createSpecies("00000000-0000-0000-0000-000000000204", "Lemon Balm", "Melissa officinalis", [50, 65], [50, 70], 80, 40),
  createSpecies("00000000-0000-0000-0000-000000000205", "Sage", "Salvia officinalis", [45, 60], [55, 75], 82, 50),
  createSpecies("00000000-0000-0000-0000-000000000206", "Curly Parsley", "Petroselinum crispum", [50, 65], [55, 75], 82, 50),
  createSpecies("00000000-0000-0000-0000-000000000207", "Baby Spinach", "Spinacia oleracea", [50, 70], [55, 75], 84, 30),
  createSpecies("00000000-0000-0000-0000-000000000208", "Red Russian Kale", "Brassica napus", [50, 70], [55, 75], 84, 40),
  createSpecies("00000000-0000-0000-0000-000000000209", "Wild Arugula", "Diplotaxis tenuifolia", [50, 70], [55, 75], 84, 28),
  createSpecies("00000000-0000-0000-0000-000000000210", "Swiss Chard", "Beta vulgaris", [50, 70], [55, 75], 84, 42),
  createSpecies("00000000-0000-0000-0000-000000000211", "Cilantro", "Coriandrum sativum", [50, 65], [50, 70], 80, 35),
  createSpecies("00000000-0000-0000-0000-000000000212", "Spearmint", "Mentha spicata", [55, 70], [50, 70], 80, 35),
  createSpecies("00000000-0000-0000-0000-000000000213", "Lovage", "Levisticum officinale", [55, 70], [55, 75], 82, 50),
  createSpecies("00000000-0000-0000-0000-000000000214", "Chervil", "Anthriscus cerefolium", [55, 70], [50, 70], 80, 35),
  createSpecies("00000000-0000-0000-0000-000000000215", "Sorrel", "Rumex acetosa", [55, 70], [55, 75], 82, 32),
  createSpecies("00000000-0000-0000-0000-000000000216", "Watercress", "Nasturtium officinale", [60, 80], [50, 70], 80, 30),
  createSpecies("00000000-0000-0000-0000-000000000217", "Collard Greens", "Brassica oleracea", [55, 70], [55, 75], 84, 45),
  createSpecies("00000000-0000-0000-0000-000000000218", "Rainbow Chard", "Beta vulgaris", [50, 70], [55, 75], 84, 40),
  createSpecies("00000000-0000-0000-0000-000000000219", "Pak Choy", "Brassica rapa subsp. chinensis", [55, 70], [55, 75], 84, 35),
  createSpecies("00000000-0000-0000-0000-000000000220", "Tat Soi", "Brassica rapa var. rosularis", [55, 70], [55, 75], 84, 30),
  createSpecies("00000000-0000-0000-0000-000000000221", "English Thyme", "Thymus vulgaris", [45, 60], [55, 75], 82, 50),
  createSpecies("00000000-0000-0000-0000-000000000222", "Greek Oregano", "Origanum vulgare", [45, 60], [55, 75], 82, 50),
  createSpecies("00000000-0000-0000-0000-000000000223", "Tuscan Rosemary", "Salvia rosmarinus", [45, 60], [55, 75], 82, 55),
  createSpecies("00000000-0000-0000-0000-000000000224", "Cherry Tomato", "Solanum lycopersicum", [55, 70], [65, 85], 88, 65),
  createSpecies("00000000-0000-0000-0000-000000000225", "Bell Pepper", "Capsicum annuum", [55, 70], [65, 85], 88, 60),
  createSpecies("00000000-0000-0000-0000-000000000226", "Japanese Eggplant", "Solanum melongena", [55, 70], [65, 85], 88, 65),
  createSpecies("00000000-0000-0000-0000-000000000227", "English Cucumber", "Cucumis sativus", [55, 70], [60, 80], 86, 50),
  createSpecies("00000000-0000-0000-0000-000000000228", "Romanesco Zucchini", "Cucurbita pepo", [55, 70], [60, 80], 86, 55),
  createSpecies("00000000-0000-0000-0000-000000000229", "Sugar Snap Pea", "Pisum sativum", [55, 75], [60, 80], 86, 55),
  createSpecies("00000000-0000-0000-0000-000000000230", "Golden Beet", "Beta vulgaris", [50, 65], [55, 75], 80, 60),
  createSpecies("00000000-0000-0000-0000-000000000231", "French Radish", "Raphanus sativus", [50, 65], [55, 75], 80, 35),
  createSpecies("00000000-0000-0000-0000-000000000232", "Broccolini", "Brassica oleracea", [55, 70], [60, 80], 82, 55),
  createSpecies("00000000-0000-0000-0000-000000000233", "Cauliflower", "Brassica oleracea", [55, 70], [60, 80], 82, 60),
  createSpecies("00000000-0000-0000-0000-000000000234", "Bok Choy", "Brassica rapa", [55, 70], [55, 75], 84, 35),
  createSpecies("00000000-0000-0000-0000-000000000235", "Brussels Sprout", "Brassica oleracea", [55, 70], [60, 80], 82, 75),
  createSpecies("00000000-0000-0000-0000-000000000236", "Strawberry", "Fragaria x ananassa", [60, 75], [60, 85], 90, 80),
  createSpecies("00000000-0000-0000-0000-000000000237", "Blueberry", "Vaccinium corymbosum", [60, 75], [60, 85], 90, 90),
  createSpecies("00000000-0000-0000-0000-000000000238", "Raspberry", "Rubus idaeus", [60, 75], [60, 85], 90, 85),
  createSpecies("00000000-0000-0000-0000-000000000239", "Blackberry", "Rubus fruticosus", [60, 75], [60, 85], 90, 85),
  createSpecies("00000000-0000-0000-0000-000000000240", "Gooseberry", "Ribes uva-crispa", [60, 75], [60, 85], 90, 85)
];

const SPECIES_LOOKUP = new Map(SPECIES_SEED_DATA.map((species) => [species.species_name.toLowerCase(), species]));

const PLANT_LAYOUT: Record<number, PlantSlot[][]> = {
  1: [
    [
      { species: "Genovese Basil" },
      { species: "Thai Basil" },
      { species: "Lemon Balm" },
      { species: "Sage" },
      { species: "Curly Parsley" }
    ],
    [
      { species: "Butterhead Lettuce" },
      { species: "Baby Spinach" },
      { species: "Red Russian Kale" },
      { species: "Wild Arugula" },
      { species: "Swiss Chard" }
    ],
    [
      { species: "Cilantro" },
      { species: "Spearmint" },
      { species: "Lovage" },
      { species: "Chervil" },
      { species: "Sorrel" }
    ],
    [
      { species: "Watercress" },
      { species: "Collard Greens" },
      { species: "Rainbow Chard" },
      { species: "Pak Choy" },
      { species: "Tat Soi" }
    ],
    [
      { species: "English Thyme" },
      { species: "Greek Oregano" },
      { species: "Tuscan Rosemary" },
      { species: "Genovese Basil" },
      { species: "Sage" }
    ]
  ],
  2: [
    [
      { species: "Cherry Tomato" },
      { species: "Bell Pepper" },
      { species: "Japanese Eggplant" },
      { species: "English Cucumber" },
      { species: "Romanesco Zucchini" }
    ],
    [
      { species: "Sugar Snap Pea" },
      { species: "Golden Beet" },
      { species: "French Radish" },
      { species: "Broccolini" },
      { species: "Cauliflower" }
    ],
    [
      { species: "Bok Choy" },
      { species: "Collard Greens" },
      { species: "Swiss Chard" },
      { species: "Brussels Sprout" },
      { species: "Pak Choy" }
    ],
    [
      { species: "Strawberry" },
      { species: "Blueberry" },
      { species: "Raspberry" },
      { species: "Blackberry" },
      { species: "Gooseberry" }
    ],
    [
      { species: "Butterhead Lettuce" },
      { species: "Baby Spinach" },
      { species: "Wild Arugula" },
      { species: "Rainbow Chard" },
      { species: "Cilantro" }
    ]
  ],
  3: [
    [
      { species: "Butterhead Lettuce" },
      { species: "Red Russian Kale" },
      { species: "Wild Arugula" },
      { species: "Swiss Chard" },
      { species: "Collard Greens" }
    ],
    [
      { species: "Cherry Tomato" },
      { species: "Bell Pepper" },
      { species: "English Cucumber" },
      { species: "Romanesco Zucchini" },
      { species: "Sugar Snap Pea" }
    ],
    [
      { species: "Cilantro" },
      { species: "Spearmint" },
      { species: "Genovese Basil" },
      { species: "Thai Basil" },
      { species: "Lemon Balm" }
    ],
    [
      { species: "Golden Beet" },
      { species: "French Radish" },
      { species: "Broccolini" },
      { species: "Cauliflower" },
      { species: "Brussels Sprout" }
    ],
    [
      { species: "Strawberry" },
      { species: "Blueberry" },
      { species: "Raspberry" },
      { species: "Blackberry" },
      { species: "Gooseberry" }
    ]
  ]
};

const FALLBACK_ROTATION: PlantSlot[] = [
  { species: "Butterhead Lettuce" },
  { species: "Genovese Basil" },
  { species: "Baby Spinach" },
  { species: "Red Russian Kale" },
  { species: "Wild Arugula" },
  { species: "Swiss Chard" },
  { species: "Cherry Tomato" },
  { species: "Bell Pepper" },
  { species: "English Cucumber" },
  { species: "Romanesco Zucchini" }
];

function formatLocationLabel(rackName: string | null, rackNumber: number, row: number, column: number): string {
  const rackLabel = rackName?.trim().length ? rackName.trim() : `Rack ${rackNumber}`;
  return `${rackLabel} Row ${row} Column ${column}`;
}

function pickPlantSlot(rackNumber: number, row: number, column: number): PlantSlot {
  const rackPlan = PLANT_LAYOUT[rackNumber];
  const slot = rackPlan?.[row - 1]?.[column - 1];
  if (slot) {
    return slot;
  }

  const index = Math.abs((rackNumber * 31 + row * 17 + column * 13) % FALLBACK_ROTATION.length);
  return FALLBACK_ROTATION[index];
}

function getPlantProfile(
  rackNumber: number,
  row: number,
  column: number,
  rackName: string | null
): { speciesId: string; displayName: string; notes: string; locationLabel: string } {
  const locationLabel = formatLocationLabel(rackName, rackNumber, row, column);
  const slot = pickPlantSlot(rackNumber, row, column);
  const speciesRecord = SPECIES_LOOKUP.get(slot.species.toLowerCase()) ?? SPECIES_SEED_DATA[0];
  const commonName = slot.nickname ?? speciesRecord.species_name;

  return {
    speciesId: speciesRecord.id,
    displayName: `${commonName} - ${locationLabel}`,
    notes: `Demo seed for ${commonName} at ${locationLabel}.`,
    locationLabel
  };
}

/**
 * Seeds the database with initial development data
 * This includes farms, racks, sensor/actuator types, species, and plant locations
 */
export async function seedDatabase(client: PoolClient): Promise<void> {
  console.log("🌱 Seeding database...");

  try {
    // Seed farm
    await client.query(`
      INSERT INTO farms (id, farm_name, address)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Demo Farm',
        NULL
      )
      ON CONFLICT (id) DO UPDATE
      SET farm_name = EXCLUDED.farm_name,
          address = EXCLUDED.address
    `);
    console.log("  ✓ Farm seeded");

    // Seed racks
    await client.query(`
      INSERT INTO racks (
        id,
        farm_id,
        rack_number,
        rack_name,
        rows,
        columns,
        max_rows,
        max_columns
      )
      VALUES
        (
          '00000000-0000-0000-0000-000000000101',
          '00000000-0000-0000-0000-000000000001',
          1,
          'Rack 1',
          5,
          5,
          5,
          5
        ),
        (
          '00000000-0000-0000-0000-000000000102',
          '00000000-0000-0000-0000-000000000001',
          2,
          'Rack 2',
          5,
          5,
          5,
          5
        ),
        (
          '00000000-0000-0000-0000-000000000103',
          '00000000-0000-0000-0000-000000000001',
          3,
          'Rack 3',
          5,
          5,
          5,
          5
        )
      ON CONFLICT (id) DO UPDATE
    SET rack_number = EXCLUDED.rack_number,
      rack_name = EXCLUDED.rack_name,
          rows = EXCLUDED.rows,
          columns = EXCLUDED.columns,
          max_rows = EXCLUDED.max_rows,
      max_columns = EXCLUDED.max_columns
    `);
    console.log("  ✓ Racks seeded");

    // Seed sensor types
    await client.query(`
      INSERT INTO sensor_types (type_name, description, unit_of_measurement)
      VALUES
        ('moisture_sensor', 'Captures substrate moisture level', 'percent'),
        ('light_sensor', 'Measures light intensity for a plant location', 'percent'),
        ('color_camera', 'Estimates plant health via colour index', 'health_score')
      ON CONFLICT (type_name) DO UPDATE
      SET description = EXCLUDED.description,
          unit_of_measurement = EXCLUDED.unit_of_measurement
    `);
    console.log("  ✓ Sensor types seeded");

    // Seed actuator types
    await client.query(`
      INSERT INTO actuator_types (type_name, description, control_unit)
      VALUES
        ('water_pump', 'Delivers precise irrigation', 'duration_seconds'),
        ('lamp', 'Controls artificial lighting for a cell', 'percent')
      ON CONFLICT (type_name) DO UPDATE
      SET description = EXCLUDED.description,
          control_unit = EXCLUDED.control_unit
    `);
    console.log("  ✓ Actuator types seeded");

    // Seed species
    for (const species of SPECIES_SEED_DATA) {
      await client.query(
        `
        INSERT INTO species (
          id,
          species_name,
          scientific_name,
          optimal_moisture_min,
          optimal_moisture_max,
          optimal_light_intensity_min,
          optimal_light_intensity_max,
          optimal_color_index,
          growth_duration_days
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE
        SET
          species_name = EXCLUDED.species_name,
          scientific_name = EXCLUDED.scientific_name,
          optimal_moisture_min = EXCLUDED.optimal_moisture_min,
          optimal_moisture_max = EXCLUDED.optimal_moisture_max,
          optimal_light_intensity_min = EXCLUDED.optimal_light_intensity_min,
          optimal_light_intensity_max = EXCLUDED.optimal_light_intensity_max,
          optimal_color_index = EXCLUDED.optimal_color_index,
          growth_duration_days = EXCLUDED.growth_duration_days
      `,
        [
          species.id,
          species.species_name,
          species.scientific_name,
          species.optimal_moisture_min,
          species.optimal_moisture_max,
          species.optimal_light_intensity_min,
          species.optimal_light_intensity_max,
          species.optimal_color_index,
          species.growth_duration_days
        ]
      );
    }
    console.log("  ✓ Species seeded");

    // Generate plant locations for all racks
    await client.query(`
      DO $$
      DECLARE
        rack_record RECORD;
        row_idx INTEGER;
        col_idx INTEGER;
      BEGIN
        FOR rack_record IN SELECT id, rows, columns FROM racks LOOP
          FOR row_idx IN 1..COALESCE(rack_record.rows, 1) LOOP
            FOR col_idx IN 1..COALESCE(rack_record.columns, 1) LOOP
              INSERT INTO plant_locations (rack_id, "row", "column")
              VALUES (rack_record.id, row_idx, col_idx)
              ON CONFLICT (rack_id, "row", "column") DO NOTHING;
            END LOOP;
          END LOOP;
        END LOOP;
      END
      $$;
    `);
    console.log("  ✓ Plant locations generated");

    const sensorTypes = await client.query<{ id: string; type_name: string } & QueryResultRow>(
      `SELECT id::text AS id, type_name FROM sensor_types`
    );

    const actuatorTypes = await client.query<{ id: string; type_name: string } & QueryResultRow>(
      `SELECT id::text AS id, type_name FROM actuator_types`
    );

    const plantLocations = await client.query<
      { id: string; rack_id: string; row: number; column: number; rack_number: number; rack_name: string | null } &
        QueryResultRow
    >(`
      SELECT
        pl.id::text AS id,
        pl.rack_id::text AS rack_id,
        pl.row,
        pl.column,
        r.rack_number,
        r.rack_name
      FROM plant_locations pl
      JOIN racks r ON r.id = pl.rack_id
      ORDER BY r.rack_number, pl.row, pl.column
    `);

    for (const location of plantLocations.rows) {
      const plantedOn = new Date();
      plantedOn.setDate(plantedOn.getDate() - ((location.row + location.column) % 7));
      const plantedOnDate = plantedOn.toISOString().slice(0, 10);
      const profile = getPlantProfile(location.rack_number, location.row, location.column, location.rack_name);
      const { speciesId, displayName, notes: note, locationLabel } = profile;

      const existingPlant = await client.query<{ id: string } & QueryResultRow>(
        `SELECT id::text AS id
         FROM plants
         WHERE plant_location_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [location.id]
      );

      if (existingPlant.rowCount === 0) {
        await client.query(
          `INSERT INTO plants (
             plant_location_id,
             species_id,
             display_name,
             status,
             planted_on,
             notes
           )
           VALUES ($1, $2, $3, 'growing', $4, $5)`,
          [location.id, speciesId, displayName, plantedOnDate, note]
        );
      } else {
        await client.query(
          `UPDATE plants
           SET species_id = $2,
               display_name = $3,
               status = 'growing',
               planted_on = $4,
               harvested_on = NULL,
               notes = $5,
               updated_at = NOW()
           WHERE id = $1`,
          [existingPlant.rows[0].id, speciesId, displayName, plantedOnDate, note]
        );
      }

      await client.query(
        `UPDATE plant_locations
         SET is_occupied = TRUE, updated_at = NOW()
         WHERE id = $1`,
        [location.id]
      );

      for (const sensorType of sensorTypes.rows) {
        const sensorName = `${toTitleCase(sensorType.type_name)} - ${locationLabel}`;
        await client.query(
          `INSERT INTO sensors (plant_location_id, sensor_type_id, sensor_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (plant_location_id, sensor_type_id)
           DO UPDATE SET sensor_name = EXCLUDED.sensor_name, updated_at = NOW()`,
          [location.id, sensorType.id, sensorName]
        );
      }

      for (const actuatorType of actuatorTypes.rows) {
        const actuatorName = `${toTitleCase(actuatorType.type_name)} - ${locationLabel}`;
        await client.query(
          `INSERT INTO actuators (plant_location_id, actuator_type_id, actuator_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (plant_location_id, actuator_type_id)
           DO UPDATE SET actuator_name = EXCLUDED.actuator_name, updated_at = NOW()`,
          [location.id, actuatorType.id, actuatorName]
        );
      }
    }

    console.log("  ✓ Plants, sensors, and actuators seeded for every rack position");

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
