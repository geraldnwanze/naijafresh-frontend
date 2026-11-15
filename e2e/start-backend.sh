#!/usr/bin/env bash
# Starts a throwaway API for the end-to-end tests: its own Postgres (on a spare
# port, in a temp folder) migrated and seeded with the sample catalogue and demo
# logins, plus `php artisan serve`. Nothing here touches your normal database.
# Everything is torn down when this process stops.
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-$(cd "$(dirname "$0")/../../../laravel/naijafresh-backend" && pwd)}"
PG_PORT="${E2E_PG_PORT:-54329}"
API_PORT="${E2E_API_PORT:-8010}"
WORK_DIR="${E2E_WORK_DIR:-${TMPDIR:-/tmp}/naijafresh-e2e}"
PG_DIR="$WORK_DIR/pgdata"

export LC_ALL="${LC_ALL:-en_US.UTF-8}"

cleanup() {
  pg_ctl -D "$PG_DIR" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT INT TERM

cleanup
mkdir -p "$WORK_DIR"
initdb -D "$PG_DIR" -U e2e --auth=trust >/dev/null
pg_ctl -D "$PG_DIR" -o "-p $PG_PORT -k $WORK_DIR -c listen_addresses=127.0.0.1" -l "$WORK_DIR/pg.log" -w start >/dev/null
createdb -h 127.0.0.1 -p "$PG_PORT" -U e2e naijafresh_e2e

# Real environment variables win over the backend's .env file.
export APP_ENV=local APP_DEBUG=false
export DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT="$PG_PORT" DB_DATABASE=naijafresh_e2e DB_USERNAME=e2e DB_PASSWORD=
export CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync LOG_CHANNEL=stderr
# Mail and payments default to fakes; set these (and the provider keys) to try the real services.
export MAIL_MAILER="${E2E_MAIL_MAILER:-array}"
export PAYMENT_PROVIDER="${E2E_PAYMENT_PROVIDER:-mock}"

cd "$BACKEND_DIR"
php artisan migrate:fresh --force --no-interaction >/dev/null
php artisan db:seed --force --no-interaction --class='Database\Seeders\CategorySeeder' >/dev/null
for seeder in DeliveryWindowSeeder SettingSeeder ProductSeeder DemoAccountSeeder; do
  php artisan db:seed --force --no-interaction --class="Database\\Seeders\\$seeder" >/dev/null
done

php artisan serve --host=127.0.0.1 --port="$API_PORT" --no-reload
