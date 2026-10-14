# syntax=docker/dockerfile:1

# --- builder : compile les deps qui ont besoin de headers C (lxml, asyncpg) ---
# bookworm figé explicitement : playwright==1.49.1 ne connaît pas encore les
# paquets apt de Debian trixie (vers laquelle le tag flottant "slim" a glissé),
# ce qui faisait échouer `playwright install --with-deps` (ttf-unifont introuvable).
FROM python:3.11-slim-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libxml2-dev libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- runtime : image finale, juste les libs partagées nécessaires à l'exécution ---
FROM python:3.11-slim-bookworm AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2 libxslt1.1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 datrovo

COPY --from=builder /install /usr/local
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod +x /usr/local/bin/backend-entrypoint

# app/tasks/sniper.py pilote un vrai Chromium (sites JS/anti-bot) : installé
# ici, en root, car --with-deps installe des paquets système via apt (alourdit
# l'image d'environ 300 Mo — accepté sciemment maintenant que ce code existe).
# PLAYWRIGHT_BROWSERS_PATH fixe un emplacement partagé : sans ça, `playwright
# install` lancé en root écrirait dans /root/.cache (invisible pour
# l'utilisateur `datrovo` qui exécute le conteneur ensuite).
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN playwright install --with-deps chromium && chown -R datrovo:datrovo /ms-playwright

USER datrovo

EXPOSE 8000

ENTRYPOINT ["backend-entrypoint"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
