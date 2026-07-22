#!/bin/sh
set -e

echo "=========================================="
echo "         Starting Lynceus Backend"
echo "=========================================="

python -c "from app.bootstrap import bootstrap; bootstrap()"

echo "[BOOTSTRAP] Starting FastAPI..."

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000