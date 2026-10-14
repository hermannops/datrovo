#!/bin/sh
# Applique les migrations avant toute commande (serveur API, ou run ponctuel
# du parseur XML déclenché par un CRON externe) : idempotent, sans risque à
# rejouer à chaque invocation.
set -e

# Quelques tentatives avec backoff court : au tout premier démarrage du
# conteneur, le DNS interne de Docker (127.0.0.11) peut ne pas encore
# répondre à la milliseconde où cette commande s'exécute (race connue au
# boot), ce qui fait échouer la résolution du host "db" alors que tout est
# par ailleurs correctement configuré.
attempt=1
max_attempts=10
until alembic upgrade head; do
    if [ "$attempt" -ge "$max_attempts" ]; then
        echo "alembic upgrade head a échoué après $max_attempts tentatives" >&2
        exit 1
    fi
    echo "alembic upgrade head a échoué (tentative $attempt/$max_attempts), nouvel essai dans 3s..." >&2
    attempt=$((attempt + 1))
    sleep 3
done

exec "$@"
