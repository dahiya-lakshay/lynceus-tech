"""
Consumes raw transaction events from Kafka, scores each one through the same
pipeline the REST API uses (app.ml.pipeline.score_transaction — one scoring
code path for both request/response and streaming, so the two can never
silently diverge), and:

  1. Publishes the scored result to a "scored" topic (for downstream
     consumers — alerting, a data warehouse sink, another dashboard).
  2. Appends it to outputs/live_stream.jsonl, which routes_stream.py tails
     for the frontend's Live Feed. A real deployment would use a proper
     store for this (Redis stream, a database table); a rolling JSONL file
     keeps this project runnable without another moving piece.

Run:  python -m streaming.consumer
Env:  KAFKA_BOOTSTRAP_SERVERS (default localhost:9092)
      RAW_TOPIC (default lynceus.transactions.raw)
      SCORED_TOPIC (default lynceus.transactions.scored)
"""

import json
import os
from collections import deque
from datetime import datetime, timezone

from kafka import KafkaConsumer, KafkaProducer

from app.config import LIVE_STREAM_PATH, OUTPUTS_DIR
from app.ml.pipeline import score_transaction

BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
RAW_TOPIC = os.environ.get("RAW_TOPIC", "lynceus.transactions.raw")
SCORED_TOPIC = os.environ.get("SCORED_TOPIC", "lynceus.transactions.scored")
MAX_ROLLING_LINES = 200


def _append_rolling(record: dict):
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    lines = deque(maxlen=MAX_ROLLING_LINES)
    if os.path.exists(LIVE_STREAM_PATH):
        with open(LIVE_STREAM_PATH) as f:
            lines.extend(f.readlines())
    lines.append(json.dumps(record) + "\n")
    with open(LIVE_STREAM_PATH, "w") as f:
        f.writelines(lines)


def main():
    print(f"[consumer] Connecting to Kafka at {BOOTSTRAP_SERVERS}...")
    consumer = KafkaConsumer(
        RAW_TOPIC,
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
        group_id="lynceus-scorer",
    )
    producer = KafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )

    print(
        f"[consumer] Listening on '{RAW_TOPIC}', scoring, publishing to '{SCORED_TOPIC}'."
    )
    for message in consumer:
        transaction = message.value
        try:
            result = score_transaction(transaction)
        except Exception as exc:
            print(
                f"[consumer] Failed to score {transaction.get('TransactionID')}: {exc}"
            )
            continue

        record = {
            "transaction": transaction,
            "result": result,
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }

        producer.send(SCORED_TOPIC, value=record)
        producer.flush()
        _append_rolling(record)

        verdict = "FRAUD" if result["is_fraud"] else "clear"
        print(
            f"[consumer] {transaction.get('TransactionID')} -> {verdict} "
            f"(p={result['fraud_probability']:.3f})"
        )


if __name__ == "__main__":
    main()
