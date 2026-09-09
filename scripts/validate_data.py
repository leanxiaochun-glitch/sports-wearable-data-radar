#!/usr/bin/env python3
import json
from pathlib import Path
data = json.loads((Path(__file__).resolve().parents[1] / "data/metrics.json").read_text())
required = {"id","category","title","value","source_name","source_url","article_title","published_date","retrieved_at","method"}
assert data["metrics"], "Dataset is empty"
ids = [row["id"] for row in data["metrics"]]
assert len(ids) == len(set(ids)), "Duplicate metric IDs"
for row in data["metrics"]:
    assert not (required - row.keys()), f"{row.get('id')} lacks required fields"
    assert row["source_url"].startswith("https://"), f"Unsafe source URL for {row['id']}"
print(f"Validated {len(ids)} metrics")

