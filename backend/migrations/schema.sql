CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE
    IF NOT EXISTS farms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        farm_name TEXT NOT NULL,
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS racks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        farm_id UUID NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
        rack_name TEXT,
        rack_number INTEGER NOT NULL,
        rows INTEGER NOT NULL DEFAULT 5,
        columns INTEGER NOT NULL DEFAULT 5,
        max_rows INTEGER,
        max_columns INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (farm_id, rack_number)
    );

CREATE TABLE
    IF NOT EXISTS plant_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        rack_id UUID NOT NULL REFERENCES racks (id) ON DELETE CASCADE,
        "row" INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (rack_id, "row", "column")
    );

CREATE TABLE
    IF NOT EXISTS species (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        species_name TEXT NOT NULL,
        scientific_name TEXT,
        optimal_moisture_min DOUBLE PRECISION,
        optimal_moisture_max DOUBLE PRECISION,
        optimal_temperature_min DOUBLE PRECISION,
        optimal_temperature_max DOUBLE PRECISION,
        optimal_light_intensity_min DOUBLE PRECISION,
        optimal_light_intensity_max DOUBLE PRECISION,
        optimal_color_index DOUBLE PRECISION,
        growth_duration_days INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS plants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        plant_location_id UUID NOT NULL REFERENCES plant_locations (id) ON DELETE CASCADE,
        species_id UUID NOT NULL REFERENCES species (id),
        display_name TEXT,
        planted_on DATE NOT NULL DEFAULT CURRENT_DATE,
        harvested_on DATE,
        status TEXT NOT NULL DEFAULT 'growing',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS sensor_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        type_name TEXT NOT NULL UNIQUE,
        description TEXT,
        unit_of_measurement TEXT
    );

CREATE TABLE
    IF NOT EXISTS sensors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        plant_location_id UUID NOT NULL REFERENCES plant_locations (id) ON DELETE CASCADE,
        sensor_type_id UUID NOT NULL REFERENCES sensor_types (id),
        sensor_name TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        installed_on DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (plant_location_id, sensor_type_id)
    );

CREATE TABLE
    IF NOT EXISTS sensor_readings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        sensor_id UUID REFERENCES sensors (id) ON DELETE SET NULL,
        rack_id UUID NOT NULL REFERENCES racks (id) ON DELETE CASCADE,
        "row" INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        sensor_type TEXT NOT NULL,
        value JSONB NOT NULL,
        reading_value DOUBLE PRECISION,
        quality_flag TEXT,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_sensor_readings_rack_time ON sensor_readings (rack_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_position_type ON sensor_readings (rack_id, "row", "column", sensor_type);

CREATE TABLE
    IF NOT EXISTS actuator_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        type_name TEXT NOT NULL UNIQUE,
        description TEXT,
        control_unit TEXT
    );

CREATE TABLE
    IF NOT EXISTS actuators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        plant_location_id UUID NOT NULL REFERENCES plant_locations (id) ON DELETE CASCADE,
        actuator_type_id UUID NOT NULL REFERENCES actuator_types (id),
        actuator_name TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        installed_on DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (plant_location_id, actuator_type_id)
    );

CREATE TABLE
    IF NOT EXISTS actuator_commands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        actuator_id UUID REFERENCES actuators (id) ON DELETE SET NULL,
        plant_location_id UUID REFERENCES plant_locations (id) ON DELETE SET NULL,
        rack_id UUID NOT NULL REFERENCES racks (id) ON DELETE CASCADE,
        "row" INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        actuator_type TEXT NOT NULL,
        action TEXT NOT NULL,
        parameters JSONB,
        command_type TEXT,
        command_value DOUBLE PRECISION,
        triggered_by TEXT,
        success BOOLEAN,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMPTZ
    );

CREATE INDEX IF NOT EXISTS idx_actuator_commands_status ON actuator_commands (status);