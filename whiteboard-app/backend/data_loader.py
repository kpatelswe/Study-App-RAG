import os
from dotenv import load_dotenv
from llama_index.readers.file import PDFReader
from llama_index.core.node_parser import SentenceSplitter
import cohere

load_dotenv()

# Cohere client for embeddings
client = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))

# Cohere embedding model - embed-english-v3.0 produces 1024 dimensions
EMBED_MODEL = "embed-english-v3.0"

splitter = SentenceSplitter(chunk_size=1000, chunk_overlap=200)

def load_and_chunk_pdf(path: str) -> list[str]:
    docs = PDFReader().load_data(file=path)
    texts = [d.text for d in docs if getattr(d, "text", None)]
    chunks: list[str] = []
    for t in texts:
        chunks.extend(splitter.split_text(t))
    return chunks

def embed_texts(texts: list[str]) -> list[list[float]]:
    response = client.embed(
        texts=texts,
        model=EMBED_MODEL,
        input_type="search_document",
    )
    return response.embeddings


