CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE
    IF NOT EXISTS farms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name VARCHAR(255) NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS racks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        farm_id UUID NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
        rack_number INTEGER NOT NULL,
        rows INTEGER NOT NULL DEFAULT 5,
        columns INTEGER NOT NULL DEFAULT 5,
        UNIQUE (farm_id, rack_number)
    );

CREATE TABLE
    IF NOT EXISTS sensor_readings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        rack_id UUID NOT NULL REFERENCES racks (id) ON DELETE CASCADE,
        "row" INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        sensor_type VARCHAR(50) NOT NULL,
        value JSONB NOT NULL,
        timestamp TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_readings_rack_time ON sensor_readings (rack_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_readings_position_type ON sensor_readings (rack_id, "row", "column", sensor_type);

CREATE TABLE
    IF NOT EXISTS actuator_commands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        rack_id UUID NOT NULL REFERENCES racks (id) ON DELETE CASCADE,
        "row" INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        actuator_type VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        parameters JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_commands_status ON actuator_commands (status);

-- Seed data
WITH
    upsert_farm AS (
        INSERT INTO
            farms (id, name)
        VALUES
            (
                '00000000-0000-0000-0000-000000000001',
                'Demo Farm'
            ) ON CONFLICT (id) DO
        UPDATE
        SET
            name = EXCLUDED.name RETURNING id
    )
INSERT INTO
    racks (id, farm_id, rack_number)
VALUES
    (
        '00000000-0000-0000-0000-000000000101',
        (
            SELECT
                id
            FROM
                upsert_farm
        ),
        1
    ),
    (
        '00000000-0000-0000-0000-000000000102',
        (
            SELECT
                id
            FROM
                upsert_farm
        ),
        2
    ),
    (
        '00000000-0000-0000-0000-000000000103',
        (
            SELECT
                id
            FROM
                upsert_farm
        ),
        3
    ) ON CONFLICT (id) DO
UPDATE
SET
    rack_number = EXCLUDED.rack_number;