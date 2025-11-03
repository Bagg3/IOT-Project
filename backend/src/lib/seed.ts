import type { PoolClient } from "pg";

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

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
