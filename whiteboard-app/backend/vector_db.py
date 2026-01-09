import logging
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

logger = logging.getLogger(__name__)


class QdrantStorage:
    def __init__(self, url="http://localhost:6333", collection="docs", dim=1024):
        self.client = QdrantClient(url=url, timeout=30)
        self.collection = collection
        self.dim = dim

        # Ensure collection exists with proper configuration
        if not self.client.collection_exists(self.collection):
            logger.info(f"Creating new collection '{self.collection}' with dimension {dim}")
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )
        else:
            logger.info(f"Using existing collection '{self.collection}'")

    def upsert(self, ids, vectors, payloads):
        """Upsert vectors with their payloads into the collection."""
        if len(ids) != len(vectors) or len(vectors) != len(payloads):
            raise ValueError("ids, vectors, and payloads must have the same length")

        try:
            points = [PointStruct(id=ids[i], vector=vectors[i], payload=payloads[i]) for i in range(len(ids))]
            self.client.upsert(self.collection, points=points)
            logger.info(f"Successfully upserted {len(points)} points to collection '{self.collection}'")
        except Exception as e:
            logger.error(f"Failed to upsert points to collection '{self.collection}': {e}")
            raise

    def search(self, query_vector, top_k: int = 3):
        """Search for similar vectors and return contexts and sources."""
        if not self.client.collection_exists(self.collection):
            logger.warning(f"Collection '{self.collection}' does not exist, returning empty results")
            return {"contexts": [], "sources": []}

        try:
            results = self.client.query_points(
                collection_name=self.collection,
                query=query_vector,
                with_payload=True,
                limit=top_k
            )

            contexts = []
            sources = set()

            for r in results.points:
                payload = getattr(r, "payload", None) or {}
                text = payload.get("text", "")
                source = payload.get("source", "")
                if text:
                    contexts.append(text)
                    sources.add(source)

            logger.debug(f"Found {len(contexts)} contexts from {len(sources)} sources")
            return {"contexts": contexts, "sources": list(sources)}

        except Exception as e:
            logger.error(f"Search failed in collection '{self.collection}': {e}")
            return {"contexts": [], "sources": []}

    def get_collection_info(self):
        """Get information about the collection."""
        try:
            info = self.client.get_collection(self.collection)
            return {
                "name": self.collection,
                "vectors_count": info.points_count,
                "vectors_config": info.config.params.vectors
            }
        except Exception as e:
            logger.error(f"Failed to get collection info for '{self.collection}': {e}")
            return None


