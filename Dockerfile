# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch && \
    pip install --no-cache-dir -r requirements.txt && \
    # Clean up pip cache
    rm -rf /root/.cache/pip && \
    # Remove unnecessary files
    find /usr/local/lib/python3.12 -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.12 -type d -name "test" -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.12 -type f -name "*.pyc" -delete && \
    find /usr/local/lib/python3.12 -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Copy backend application
COPY backend/ .

# Expose port
EXPOSE 8000

# Health check - use 127.0.0.1 instead of localhost for Docker
HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/ || exit 1

# Set Qdrant environment variables as fallback
ENV QDRANT_URL="https://55260239-2c43-43de-a248-3a2022d4a051.us-west-1-0.aws.cloud.qdrant.io"
ENV QDRANT_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.SICxL74P0MK_0U5zYPiCY2ZE8JQ19sxOvSKO743Ta9g"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
