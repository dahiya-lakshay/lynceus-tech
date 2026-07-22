"""
Serves the "Live Feed" section of the frontend.

Two data sources, seamlessly merged:

1. If the Kafka streaming stack (docker-compose --profile streaming) is
   running, `streaming/consumer.py` is continuously scoring transactions
   from the `lynceus.transactions.raw` topic and appending results to
   outputs/live_stream.jsonl. This endpoint tails that file.
2. If it isn't running, there's nothing to tail — so this endpoint scores a
   random real transaction from the dataset on demand instead. The Live
   Feed section works either way; running the actual Kafka stack just makes
   the feed reflect a genuine event-driven pipeline instead of scoring
   on-request.
"""
import json
import random
from datetime import datetime, timezone

import pandas as pd
from fastapi import APIRouter

from app.config import LIVE_STREAM_PATH, DATA_PATH
from app.ml.pipeline import score_transaction


router = APIRouter(prefix="/api/stream", tags=["stream"])

_sample_cache = {}

_stream_state = {"index": 0}

def _get_sample_pool():
    if "df" not in _sample_cache:
        _sample_cache["df"] = pd.read_csv(DATA_PATH)
    return _sample_cache["df"]


def _simulate_one():
    df = _get_sample_pool()
    row = df.sample(1).iloc[0].to_dict()
    result = score_transaction(row)
    return {
        "transaction": row,
        "result": result,
        "scored_at": datetime.now(timezone.utc).isoformat(),
        "source": "on_demand",
    }


@router.get("/recent")
def recent(limit: int = 15):
    try:
        with open(LIVE_STREAM_PATH) as f:
            lines = f.readlines()[-limit:]
        records = [json.loads(line) for line in lines]
        records.reverse()
        if records:
            for r in records:
                r["source"] = "kafka"
            return {"items": records, "mode": "kafka"}
    except FileNotFoundError:
        pass

    # Fallback: no Kafka consumer output yet — simulate on demand so the
    # frontend still has something to show.
    items = [_simulate_one() for _ in range(min(limit, 6))]
    return {"items": items, "mode": "simulated"}


@router.get("/next")
def next_transaction():
    print(">>>>>>>>>>>> USING KAFKA STREAM ENDPOINT <<<<<<<<<<<<")
    try:
        with open(LIVE_STREAM_PATH) as f:
            lines = f.readlines()

        if lines:
            idx = _stream_state["index"]

            if idx < len(lines):
                record = json.loads(lines[idx])
                _stream_state["index"] += 1
                record["source"] = "kafka"
                return record

            # no new Kafka events yet
            record = json.loads(lines[-1])
            record["source"] = "kafka"
            return record

    except FileNotFoundError:
        pass

    return _simulate_one()
