#!/bin/bash
set -e

DB_HOST="db"
DB_PORT="5432"

echo "Checking database connection on ${DB_HOST}:${DB_PORT}..."

# Loop until a connection to the port is successful
until nc -z "$DB_HOST" "$DB_PORT"; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 30
done

# Migrate tables
python3 manage.py migrate &

# Seed Database
python3 manage.py seed &

# Start Celery Workers
celery -A HashCashApp worker -E -B --loglevel=INFO --concurrency 1 &> ./log/celery.log &

# Start Celery Beat
celery -A HashCashApp beat -S django -s ./log/ &> ./log/celery_beat.log &

python3 manage.py seed_users &

# Start Django server using env vars
echo "Starting Django on HOST=${HOST:-0.0.0.0} PORT=${PORT:-8000}"
python3 manage.py runserver ${HOST:-0.0.0.0}:${PORT:-8000}