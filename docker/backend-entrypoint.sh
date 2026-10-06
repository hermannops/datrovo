#!/bin/sh
# Applique les migrations avant toute commande (serveur API, ou run ponctuel
# du parseur XML déclenché par un CRON externe) : idempotent, sans risque à
# rejouer à chaque invocation.
set -e

alembic upgrade head

exec "$@"
