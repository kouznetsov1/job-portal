# PostgreSQL with backup support
FROM postgres:17.0-bookworm

# Add extensions and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-contrib \
    postgresql-17-postgis \
    postgresql-17-pgvector \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install gomplate for config templating
RUN wget -O /usr/local/bin/gomplate https://github.com/hairyhenderson/gomplate/releases/download/v3.11.7/gomplate_linux-$(dpkg --print-architecture)
RUN chmod +x /usr/local/bin/gomplate

# Determine architecture for WAL-G
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "arm64" ]; then \
        echo "aarch64" > /tmp/walg_arch; \
    else \
        echo "amd64" > /tmp/walg_arch; \
    fi

# Install WAL-G for backups
RUN WALG_ARCH=$(cat /tmp/walg_arch) && \
    wget https://github.com/wal-g/wal-g/releases/download/v3.0.7/wal-g-pg-ubuntu-20.04-${WALG_ARCH}.tar.gz
RUN WALG_ARCH=$(cat /tmp/walg_arch) && \
    tar -xzf wal-g-pg-ubuntu-20.04-${WALG_ARCH}.tar.gz
RUN WALG_ARCH=$(cat /tmp/walg_arch) && \
    mv wal-g-pg-ubuntu-20.04-${WALG_ARCH} /usr/local/bin/wal-g
RUN chmod +x /usr/local/bin/wal-g
RUN rm wal-g-pg-ubuntu-20.04-*.tar.gz
RUN rm /tmp/walg_arch
RUN wal-g --version

# Prepare PostgreSQL configuration directory
RUN mkdir -p /etc/postgresql/

# Create PostgreSQL configuration template for WAL archiving
RUN cp /usr/share/postgresql/postgresql.conf.sample /etc/postgresql/postgresql.conf.template

# Configure WAL settings in template
RUN sed -ri "s/^#wal_level = replica/wal_level = replica/" /etc/postgresql/postgresql.conf.template
RUN sed -ri "s/^#archive_mode = off/archive_mode = {{.Env.ARCHIVE_MODE}}/" /etc/postgresql/postgresql.conf.template
RUN sed -ri "s/^#archive_timeout = 0/archive_timeout = {{.Env.ARCHIVE_TIMEOUT}}/" /etc/postgresql/postgresql.conf.template
RUN sed -ri "s/^#archive_command = ''/archive_command = '\/usr\/local\/bin\/wal-g wal-push %p'/" /etc/postgresql/postgresql.conf.template
RUN sed -ri "s/^#max_wal_size = 1GB/max_wal_size = 2GB/" /etc/postgresql/postgresql.conf.template
RUN sed -ri "s/^#wal_keep_size = 0/wal_keep_size = 1GB/" /etc/postgresql/postgresql.conf.template

# Copy our entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5432

# Use our entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["postgres"]
