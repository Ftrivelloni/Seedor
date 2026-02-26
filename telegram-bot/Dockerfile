FROM python:3.11-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiar e instalar dependencias primero (para aprovechar la cache de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY bot.py .
COPY mock_data.py .
COPY sync_service.py .

# Crear la carpeta data (donde el bot guarda JSON temporales)
RUN mkdir -p data

# Comando que arranca el bot
CMD ["python", "bot.py"]
