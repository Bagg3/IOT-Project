import type { PoolClient, QueryResultRow } from "pg";

const DEMO_SPECIES_ID = "00000000-0000-0000-0000-000000000201";

function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
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
    await client.query(`
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
      VALUES (
        '00000000-0000-0000-0000-000000000201',
        'Butterhead Lettuce',
        'Lactuca sativa',
        45,
        65,
        55,
        75,
        85,
        28
      )
      ON CONFLICT (id) DO UPDATE
    SET species_name = EXCLUDED.species_name,
          scientific_name = EXCLUDED.scientific_name,
          optimal_moisture_min = EXCLUDED.optimal_moisture_min,
          optimal_moisture_max = EXCLUDED.optimal_moisture_max,
          optimal_light_intensity_min = EXCLUDED.optimal_light_intensity_min,
          optimal_light_intensity_max = EXCLUDED.optimal_light_intensity_max,
          optimal_color_index = EXCLUDED.optimal_color_index,
          growth_duration_days = EXCLUDED.growth_duration_days
    `);
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
      const displayName = `Rack ${location.rack_number} (${location.row},${location.column}) Lettuce`;
      const note = `Seed data for rack ${location.rack_number} position (${location.row},${location.column}).`;

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
          [location.id, DEMO_SPECIES_ID, displayName, plantedOnDate, note]
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
          [existingPlant.rows[0].id, DEMO_SPECIES_ID, displayName, plantedOnDate, note]
        );
      }

      await client.query(
        `UPDATE plant_locations
         SET is_occupied = TRUE, updated_at = NOW()
         WHERE id = $1`,
        [location.id]
      );

      for (const sensorType of sensorTypes.rows) {
        const sensorName = `${toTitleCase(sensorType.type_name)} - Rack ${location.rack_number} (${location.row},${location.column})`;
        await client.query(
          `INSERT INTO sensors (plant_location_id, sensor_type_id, sensor_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (plant_location_id, sensor_type_id)
           DO UPDATE SET sensor_name = EXCLUDED.sensor_name, updated_at = NOW()`,
          [location.id, sensorType.id, sensorName]
        );
      }

      for (const actuatorType of actuatorTypes.rows) {
        const actuatorName = `${toTitleCase(actuatorType.type_name)} - Rack ${location.rack_number} (${location.row},${location.column})`;
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
