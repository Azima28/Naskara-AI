FROM python:3.11-slim

# Set timezone & prevent bytecode / unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Jakarta

# Install LibreOffice & Microsoft core fonts for native 1:1 headless page layout computation
RUN sed -i 's/Components: main/Components: main contrib/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true \
    && sed -i 's/main$/main contrib/g' /etc/apt/sources.list 2>/dev/null || true \
    && echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    fonts-liberation \
    ttf-mscorefonts-installer \
    fontconfig \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

WORKDIR /app

# Create non-root user early
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app appuser

# Copy requirements from backend and install
COPY webapp/backend/requirements.txt /app/webapp/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/webapp/backend/requirements.txt

# Copy scripts, references, and examples from root
COPY --chown=appuser:appgroup scripts /app/scripts
COPY --chown=appuser:appgroup references /app/references
COPY --chown=appuser:appgroup examples /app/examples

# Copy all backend application code
COPY --chown=appuser:appgroup webapp/backend /app/webapp/backend

# Ensure uploads and output directories exist with proper ownership
RUN mkdir -p /app/webapp/uploads /app/webapp/output \
    && chown -R appuser:appgroup /app/webapp/uploads /app/webapp/output

USER appuser

WORKDIR /app/webapp/backend

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
