FROM python:3.11-slim

# Set timezone & prevent bytecode / unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Jakarta

# Install LibreOffice & standard fonts for native 1:1 headless page layout computation
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements from backend and install
COPY webapp/backend/requirements.txt /app/webapp/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/webapp/backend/requirements.txt

# Copy scripts, references, and examples from root
COPY scripts /app/scripts
COPY references /app/references
COPY examples /app/examples

# Copy all backend application code
COPY webapp/backend /app/webapp/backend

# Ensure uploads and output directories exist
RUN mkdir -p /app/webapp/uploads /app/webapp/output

WORKDIR /app/webapp/backend

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
