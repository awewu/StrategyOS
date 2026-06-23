-- Run this as a PostgreSQL superuser if the application database/user do not exist.
-- Replace passwords before running.

CREATE USER stratos_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE stratos OWNER stratos_user ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE stratos TO stratos_user;

