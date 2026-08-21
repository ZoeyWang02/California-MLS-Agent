"""Week 8 RAG (retrieval-augmented generation) over the knowledge/ docs
(matches the handbook's chunk/index/retrieve/generate pipeline).

Usage: python rag.py "<question>"
Prints {"answer": str, "sources": list[str]} as JSON to stdout.

NOTE: building the index makes real, billed OpenAI embedding calls (once
per chunk); answering a question makes one more embedding call (the query)
plus one gpt-4o-mini chat completion call. The index is cached to disk so
repeated questions don't re-embed the whole knowledge base every time.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from embeddings import get_client, get_embedding, load_dotenv

load_dotenv()

KNOWLEDGE_DIR = Path("knowledge")
INDEX_CACHE_PATH = Path("knowledge/.index_cache.json")


def chunk_text(text: str, chunk_size: int = 6000, overlap: int = 300) -> list[str]:
    # The handbook's example defaults are 600/100. Tested against this
    # project's actual knowledge/*.md files, 600 split a single reference
    # table across multiple chunks, so retrieve(top_k=4) often missed part
    # of the table and produced incomplete answers. Raised progressively
    # (2500, then 6000 once the real Trestle-sourced field table grew past
    # 5000 chars) so each reference table fits in a single chunk; verified
    # live that this produces the complete column list.
    chunks, start = [], 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def index_documents(docs: list[dict]) -> list[dict]:
    indexed = []
    for doc in docs:
        for chunk in chunk_text(doc["content"]):
            indexed.append({
                "source": doc["title"],
                "chunk": chunk,
                "embedding": get_embedding(chunk),
            })
    return indexed


def retrieve(query: str, index: list[dict], top_k: int = 4) -> list[dict]:
    q_emb = np.array(get_embedding(query)).reshape(1, -1)
    scored = [
        (doc, cosine_similarity(q_emb, np.array(doc["embedding"]).reshape(1, -1))[0][0])
        for doc in index
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in scored[:top_k]]


def rag_answer(query: str, index: list[dict]) -> str:
    chunks = retrieve(query, index)
    # Labeling each chunk with its source doc, and telling the model not to
    # merge different sources, fixed a real bug found while testing: with
    # this project's small, topically-similar knowledge base (two reference
    # tables both formatted as "Column | Type | Description"), retrieve()
    # sometimes pulls chunks from two different docs, and an unlabeled
    # prompt let the model silently merge rets_property's columns into a
    # "california_sold columns" answer.
    context = "\n\n".join(f"[Source: {c['source']}]\n{c['chunk']}" for c in chunks)
    prompt = (
        "Answer using only the context below. The context may include multiple different "
        "sources/tables - keep them separate and do not merge or combine fields from "
        f"different sources into one list.\n\n{context}\n\nQuestion: {query}"
    )
    resp = get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content


def load_knowledge_documents(directory: Path = KNOWLEDGE_DIR) -> list[dict]:
    """Not in the handbook (it assumes docs are already loaded) - reads the
    project's knowledge/*.md files into {"title", "content"} docs."""
    docs = []
    for path in sorted(directory.glob("*.md")):
        docs.append({"title": path.stem, "content": path.read_text(encoding="utf-8")})
    return docs


def build_index(force: bool = False) -> list[dict]:
    """Load the cached index if present, otherwise build (and cache) it.

    Caching avoids re-embedding every chunk of every document on every
    question - the handbook's pipeline doesn't address this, but repeatedly
    paying to re-embed a static knowledge base on every query would be
    wasteful.
    """
    if not force and INDEX_CACHE_PATH.exists():
        return json.loads(INDEX_CACHE_PATH.read_text(encoding="utf-8"))

    docs = load_knowledge_documents()
    index = index_documents(docs)
    INDEX_CACHE_PATH.write_text(json.dumps(index), encoding="utf-8")
    return index


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: rag.py <question>", file=sys.stderr)
        return 1
    query = sys.argv[1]
    index = build_index()
    answer = rag_answer(query, index)
    sources = sorted({c["source"] for c in retrieve(query, index)})
    print(json.dumps({"answer": answer, "sources": sources}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
