FROM oven/bun:latest
WORKDIR /app

# Copy both gateway and simulator folders
COPY gateway ./gateway
COPY simulator ./simulator

# Install dependencies for both (if separate package.json files)
COPY gateway/package.json gateway/bun.lockb* ./gateway/
COPY simulator/package.json simulator/bun.lockb* ./simulator/
RUN bun install --cwd ./gateway
RUN bun install --cwd ./simulator

# Set environment variable for SENSOR_SCRIPT_PATH
ENV SENSOR_SCRIPT_PATH=/app/simulator/src/

# Default command runs gateway
WORKDIR /app/gateway
CMD ["bun", "run", "src/mqtt_client.ts"]
