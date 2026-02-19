FROM php:8.2-fpm-bullseye

# Install Nginx and system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    libaio1 \
    libaio-dev \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Oracle Instant Client 19 (Better compatibility with 11g)
WORKDIR /opt/oracle

RUN curl -O https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip && \
    curl -O https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-sdk-linux.x64-19.25.0.0.0dbru.zip && \
    unzip -o instantclient-basic-linux.x64-19.25.0.0.0dbru.zip && \
    unzip -o instantclient-sdk-linux.x64-19.25.0.0.0dbru.zip && \
    rm -f *.zip

# Set Oracle environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_25

RUN echo "/opt/oracle/instantclient_19_25" > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig

# Install PHP OCI8 Extension
RUN echo "instantclient,/opt/oracle/instantclient_19_25" | pecl install oci8 \
    && docker-php-ext-enable oci8

# Remove default Nginx site and copy our config
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/sites-available/pokemon.conf
RUN ln -s /etc/nginx/sites-available/pokemon.conf /etc/nginx/sites-enabled/

# Copy all frontend files
WORKDIR /usr/share/nginx/html
COPY . .

# Expose port 80
EXPOSE 80

# Start PHP-FPM and Nginx
CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]