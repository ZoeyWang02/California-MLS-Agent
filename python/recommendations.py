"""Week 7 recommendation engine (matches the handbook's hybrid scoring +
comp validation example).

Usage: python recommendations.py <target_listing_id> [top_k]
Prints a JSON array of recommended listings, each with a hybrid score and
a comp-validated price assessment, to stdout.

NOTE: this embeds the target listing plus every candidate, so it makes
several real, billed OpenAI embedding calls per run.
"""

from __future__ import annotations

import json
import sys

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import text

from embeddings import build_listing_embedding, fetch_candidate_listings, get_engine, load_dotenv

load_dotenv()


def calculate_similarity_score(
    target: dict,
    candidate: dict,
    target_emb: list[float],
    candidate_emb: list[float],
) -> float:
    score = 0.0

    # Structured similarity (60% of total score)
    price_diff = abs(target["L_SystemPrice"] - candidate["L_SystemPrice"])
    if price_diff < 50_000:
        score += 20
    elif price_diff < 150_000:
        score += 12
    elif price_diff < 300_000:
        score += 5

    if target["L_Keyword2"] == candidate["L_Keyword2"]:
        score += 15
    if target["L_City"] == candidate["L_City"]:
        score += 15

    sqft_diff = abs(target["LM_Int2_3"] - candidate["LM_Int2_3"])
    if sqft_diff < 300:
        score += 10
    elif sqft_diff < 700:
        score += 5

    # Semantic similarity (40% of total score)
    sem_sim = cosine_similarity(
        np.array(target_emb).reshape(1, -1),
        np.array(candidate_emb).reshape(1, -1),
    )[0][0]
    score += sem_sim * 40

    return round(score, 2)


def validate_with_comps(city: str, sqft: int, price: int) -> dict:
    """Check if a recommended price is supported by recent comps."""
    sql = """
        SELECT
          AVG(ClosePrice / NULLIF(LivingArea,0)) AS avg_ppsf,
          COUNT(*) AS comp_count
        FROM california_sold
        WHERE City = :city AND PropertyType = 'Residential'
          AND LivingArea BETWEEN :low AND :high
          AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    """
    with get_engine().connect() as conn:
        row = conn.execute(
            text(sql), {"city": city, "low": sqft * 0.8, "high": sqft * 1.2}
        ).mappings().first()

    avg_ppsf = float(row["avg_ppsf"] or 0)
    comp_count = int(row["comp_count"] or 0)
    comp_price = avg_ppsf * sqft
    delta_pct = round((price - comp_price) / comp_price * 100, 1) if comp_price else None

    return {
        "comp_price": round(comp_price),
        "list_price": price,
        "comp_count": comp_count,
        "delta_pct": delta_pct,
    }


def fetch_listing_by_id(listing_id: str) -> dict | None:
    sql = """
        SELECT L_ListingID, L_Type_, L_City, L_Keyword2, LM_Dec_3,
               LM_Int2_3, YearBuilt, L_SystemPrice, L_Remarks
        FROM rets_property
        WHERE L_ListingID = :id AND L_Status = 'Active'
        LIMIT 1
    """
    with get_engine().connect() as conn:
        row = conn.execute(text(sql), {"id": listing_id}).mappings().first()
    return dict(row) if row else None


def recommend_similar_listings(
    target_listing_id: str,
    top_k: int = 5,
    candidate_limit: int = 20,
) -> list[dict]:
    """Week 7 deliverable: top_k similar active listings, each with a
    comp-validated price assessment sourced from california_sold."""
    target = fetch_listing_by_id(target_listing_id)
    if target is None:
        raise ValueError(f"Active listing {target_listing_id} not found")

    candidates = [
        c
        for c in fetch_candidate_listings(city=target["L_City"], limit=candidate_limit)
        if str(c["L_ListingID"]) != str(target["L_ListingID"])
    ]

    target_emb = build_listing_embedding(target)
    scored = []
    for candidate in candidates:
        candidate_emb = build_listing_embedding(candidate)
        score = calculate_similarity_score(target, candidate, target_emb, candidate_emb)
        scored.append((score, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, candidate in scored[:top_k]:
        comps = validate_with_comps(candidate["L_City"], candidate["LM_Int2_3"], candidate["L_SystemPrice"])
        results.append({**candidate, "score": score, "comp_validation": comps})
    return results


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: recommendations.py <target_listing_id> [top_k]", file=sys.stderr)
        return 1
    target_id = sys.argv[1]
    top_k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    results = recommend_similar_listings(target_id, top_k=top_k)
    print(json.dumps(results, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
