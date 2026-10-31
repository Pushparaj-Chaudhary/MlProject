# Multi-stage lightweight Python runtime for Crop Intelligence API
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy dataset, ml, and backend code
COPY dataset/ dataset/
COPY ml/ ml/
COPY backend/ backend/

# Pre-train models and generate evaluation metrics inside container
RUN python ml/train.py

# Expose default port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Start uvicorn with dynamic PORT support
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
