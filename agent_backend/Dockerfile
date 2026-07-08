# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — Python FastAPI Backend (OceanIA PeritajeVehiculo)
# Runs as non-root user for improved security.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim AS base

# Install system dependencies required by OpenCV and YOLO/Ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python dependencies ────────────────────────────────────────────────
# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies — no cache to keep image lean
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Copy application source ────────────────────────────────────────────────────
COPY . .

# ── Security: create and switch to a non-root user ────────────────────────────
RUN groupadd --system --gid 1001 appgroup && \
    useradd  --system --uid 1001 --gid appgroup appuser && \
    # Create writable tmp directories for uploads/crops with correct ownership
    mkdir -p /tmp/perito_uploads /tmp/vehicle_crops && \
    chown -R appuser:appgroup /tmp/perito_uploads /tmp/vehicle_crops /app

USER appuser

# Expose the FastAPI port
EXPOSE 8000

# Healthcheck — verifies the /health endpoint is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:8000/health || exit 1

# Start uvicorn with production settings
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
