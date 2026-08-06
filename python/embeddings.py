"""Week 6 embeddings & semantic property search (matches the handbook's
OpenAI + scikit-learn example).

Usage: python embeddings.py <query> [city] [candidate_limit]
Prints a JSON array of the top 5 most similar active listings to stdout.

NOTE: get_embedding() makes real, billed calls to the OpenAI embeddings API.
This module is intentionally not exercised end-to-end in this session -
only the free parts (imports, DB fetch) were verified.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL


def load_dotenv(path: str = ".env") -> None:
    env_path = Path(path)
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv()

_client: OpenAI | None = None
_engine = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def get_engine():
    global _engine
    if _engine is None:
        url = URL.create(
            "mysql+mysqlconnector",
            username=os.environ["MYSQL_USER"],
            password=os.environ.get("MYSQL_PASSWORD", ""),
            host=os.environ.get("MYSQL_HOST", "localhost"),
            database=os.environ.get("MYSQL_DATABASE", "idx_exchange"),
        )
        _engine = create_engine(url)
    return _engine


def get_embedding(text_input: str, model: str = "text-embedding-3-small") -> list[float]:
    text_input = text_input.replace("\n", " ").strip()[:8000]  # max token safety
    response = get_client().embeddings.create(model=model, input=text_input)
    return response.data[0].embedding


def build_listing_embedding(row: dict) -> list[float]:
    text_blob = f"""
        {row["L_Type_"]} in {row["L_City"]}, CA.
        {row["L_Keyword2"]} beds, {row["LM_Dec_3"]} baths.
        {row["LM_Int2_3"]} sq ft. Built {row["YearBuilt"]}.
        Price: ${row["L_SystemPrice"]:,}.
        {row.get("L_Remarks", "")}
    """.strip()
    return get_embedding(text_blob)


def find_similar_listings(
    query: str,
    listing_embeddings: list[tuple[str, list[float]]],
    top_k: int = 5,
) -> list[str]:
    """Return top_k listing IDs most similar to the query."""
    query_vec = np.array(get_embedding(query)).reshape(1, -1)
    scores = []
    for listing_id, emb in listing_embeddings:
        sim = cosine_similarity(query_vec, np.array(emb).reshape(1, -1))[0][0]
        scores.append((listing_id, float(sim)))
    scores.sort(key=lambda x: x[1], reverse=True)
    return [lid for lid, _ in scores[:top_k]]


def fetch_candidate_listings(city: str | None = None, limit: int = 50) -> list[dict]:
    """Pull a bounded set of active listings with remarks to embed against.

    Not shown in the handbook (it assumes listing_embeddings already exist) -
    needed to actually satisfy "returns the top 5 most similar active
    listings from rets_property". Bounded by `limit` rather than embedding
    the whole active table, since every row costs a real, billed API call.
    """
    clauses = ["L_Status = 'Active'", "L_Remarks IS NOT NULL", "L_Remarks != ''"]
    params: dict[str, object] = {"limit": limit}
    if city:
        clauses.append("L_City = :city")
        params["city"] = city
    sql = f"""
        SELECT
            L_ListingID, L_Type_, L_City, L_Keyword2, LM_Dec_3,
            LM_Int2_3, YearBuilt, L_SystemPrice, L_Remarks
        FROM rets_property
        WHERE {" AND ".join(clauses)}
        LIMIT :limit
    """
    with get_engine().connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()
    return [dict(row) for row in rows]


def semantic_property_search(
    query: str,
    city: str | None = None,
    candidate_limit: int = 50,
    top_k: int = 5,
) -> list[dict]:
    """Week 6 deliverable: free-text description -> top_k similar active listings."""
    candidates = fetch_candidate_listings(city=city, limit=candidate_limit)
    listing_embeddings = [
        (str(row["L_ListingID"]), build_listing_embedding(row)) for row in candidates
    ]
    top_ids = find_similar_listings(query, listing_embeddings, top_k=top_k)
    by_id = {str(row["L_ListingID"]): row for row in candidates}
    return [by_id[lid] for lid in top_ids if lid in by_id]


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: embeddings.py <query> [city] [candidate_limit]", file=sys.stderr)
        return 1
    query = sys.argv[1]
    city = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
    candidate_limit = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    results = semantic_property_search(query, city=city, candidate_limit=candidate_limit)
    print(json.dumps(results, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
