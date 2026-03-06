FROM python:3.11-slim

# Working directory
WORKDIR /app

# Install dependencies first (Docker cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all bot code
COPY bot.py .
COPY logger.py .
COPY retry.py .
COPY mock_data.py .
COPY sync_service.py .

# Create persistent data directory
RUN mkdir -p data

# Default: run the bot
CMD ["python", "bot.py"]
