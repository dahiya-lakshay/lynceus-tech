"""
Simulates a live transaction stream by publishing rows from transactions.csv
to a Kafka topic at a configurable interval — standing in for whatever
upstream system (a payments gateway, a core banking event bus) would
publish real transaction events in production.

Run:  python -m streaming.producer
Env:  KAFKA_BOOTSTRAP_SERVERS (default localhost:9092)
      PRODUCE_INTERVAL_SECONDS (default 2.0)
      RAW_TOPIC (default lynceus.transactions.raw)
"""
import json
import os
import time

import pandas as pd
from kafka import KafkaProducer

from app.config import DATA_PATH

BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
RAW_TOPIC = os.environ.get("RAW_TOPIC", "lynceus.transactions.raw")
INTERVAL = float(os.environ.get("PRODUCE_INTERVAL_SECONDS", "2.0"))


def main():
    print(f"[producer] Connecting to Kafka at {BOOTSTRAP_SERVERS}...")
    producer = KafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        retries=5,
    )

    df = pd.read_csv(DATA_PATH)
    print(f"[producer] Loaded {len(df)} candidate transactions. "
          f"Publishing to '{RAW_TOPIC}' every {INTERVAL}s.")

    i = 0
    while True:
        row = df.sample(1).iloc[0].to_dict()
        producer.send(RAW_TOPIC, value=row)
        producer.flush()
        i += 1
        print(f"[producer] #{i} published {row.get('TransactionID')} "
              f"(${row.get('TransactionAmount')}, {row.get('Location')})")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
