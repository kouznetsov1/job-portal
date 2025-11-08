-- Enable required PostgreSQL extensions
\c job_portal_db
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
