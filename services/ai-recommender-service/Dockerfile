FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 1. Update pip first
RUN pip install --no-cache-dir --upgrade pip

# 2. Force install numpy 1.x and cython (needed for surprise compilation)
RUN pip install --no-cache-dir "numpy<2.0.0" cython

# 3. Install Torch (CPU only)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 4. Install everything else from requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port
EXPOSE 8008

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]
