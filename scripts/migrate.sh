#!/usr/bin/env sh
set -eu

CONTAINER="${DB_CONTAINER:-initmedia_db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-initmedia}"

echo "Applying migrations to ${CONTAINER} (${DB_NAME})..."

for f in backend/migrations/*.up.sql; do
  echo "-> $(basename "$f")"
  docker exec -i "$CONTAINER" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f /dev/stdin <"$f" || {
    echo "Warning: $(basename "$f") failed (maybe already applied). Continuing..."
  }
done

echo "Done."
