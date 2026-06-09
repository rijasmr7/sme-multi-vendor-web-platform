FROM python:3.9-slim

WORKDIR /app

# Install system dependencies needed for some Python packages like numpy/faiss
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
# Install dependencies from requirements.txt
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Install scikit-surprise without build isolation so it compiles with numpy < 2.0 (1.26.4)
RUN pip install --default-timeout=1000 --no-cache-dir --no-build-isolation scikit-surprise==1.1.3



# Copy application code
COPY . .

# Expose port
EXPOSE 8009

# Start command
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8009"]
