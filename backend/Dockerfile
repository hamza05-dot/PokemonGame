FROM python:3.11-slim

# Install Oracle Instant Client dependencies
# libaio1 was renamed to libaio1t64 in newer Debian versions
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libaio1t64 \
    && ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 \
    && rm -rf /var/lib/apt/lists/*

# Download and install Oracle Instant Client Basic Lite
RUN wget https://download.oracle.com/otn_software/linux/instantclient/2340000/instantclient-basiclite-linux.x64-23.4.0.24.05.zip \
    && mkdir -p /opt/oracle \
    && unzip instantclient-basiclite-linux.x64-23.4.0.24.05.zip -d /opt/oracle \
    && rm instantclient-basiclite-linux.x64-23.4.0.24.05.zip \
    && sh -c "echo /opt/oracle/instantclient_23_4 > /etc/ld.so.conf.d/oracle-instantclient.conf" \
    && ldconfig

# Set Oracle environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_4:$LD_LIBRARY_PATH

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose Flask port
EXPOSE 5000

# Set environment variable for Flask
ENV FLASK_APP=app.py

# Run Flask
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]