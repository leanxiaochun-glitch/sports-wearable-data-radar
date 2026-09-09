#!/usr/bin/env python3
"""Build data/metrics.json from public APIs and editorially maintained signals."""
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = datetime.now(timezone.utc).date().isoformat()

def get_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "sports-wearable-data-radar/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)

def world_bank_metric():
    url = "https://api.worldbank.org/v2/country/WLD/indicator/SP.POP.TOTL?format=json&per_page=10"
    payload = get_json(url)
    row = next(item for item in payload[1] if item.get("value") is not None)
    return {
        "id": "world-bank-population", "category": "Population", "title": "World population (API)",
        "value": round(row["value"] / 1_000_000_000, 2), "unit": "billion people", "period": row["date"],
        "summary": "Latest non-null global population observation exposed by the World Bank API.",
        "source_name": "World Bank Open Data", "source_url": "https://data.worldbank.org/indicator/SP.POP.TOTL",
        "article_title": "Population, total", "published_date": None, "retrieved_at": TODAY,
        "method": "API · World Bank indicator SP.POP.TOTL"
    }

def main():
    manual = json.loads((ROOT / "data/manual.json").read_text())["metrics"]
    metrics = manual[:]
    try:
        metrics.append(world_bank_metric())
    except Exception as exc:
        print(f"Warning: World Bank update failed: {exc}")
        existing_path = ROOT / "data/metrics.json"
        if existing_path.exists():
            existing = json.loads(existing_path.read_text()).get("metrics", [])
            metrics.extend(x for x in existing if x.get("id") == "world-bank-population")
    required = {"source_name", "source_url", "article_title", "published_date", "retrieved_at", "method"}
    for item in metrics:
        missing = required - item.keys()
        if missing: raise ValueError(f"{item.get('id')} missing provenance fields: {sorted(missing)}")
    output = {"generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"), "metrics": metrics}
    (ROOT / "data/metrics.json").write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(metrics)} metrics")

if __name__ == "__main__": main()

