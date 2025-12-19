import logging
import os
import datetime
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from groq import Groq
import inngest
import inngest.fast_api
import requests

from config import SUPABASE_URL, SUPABASE_ANON_KEY, CORS_ORIGINS
from data_loader import load_and_chunk_pdf, embed_texts
from vector_db import QdrantStorage
from custom_types import RAGSearchResult, RAGUpsertResult, RAGChunkAndSrc

load_dotenv()

# Groq client reads GROQ_API_KEY from environment
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Inngest client setup
inngest_client = inngest.Inngest(
    app_id="whiteboard-rag",
    logger=logging.getLogger("uvicorn"),
    is_production=False,
    serializer=inngest.PydanticSerializer(),
)

# Global results cache for local development/sync-over-async
run_results = {}

app = FastAPI(title="Whiteboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ INNGEST FUNCTIONS ============

@inngest_client.create_function(
    fn_id="RAG: Ingest PDF",
    trigger=inngest.TriggerEvent(event="rag/ingest_pdf"),
    throttle=inngest.Throttle(limit=2, period=datetime.timedelta(minutes=1)),
    rate_limit=inngest.RateLimit(
        limit=1,
        period=datetime.timedelta(hours=4),
        key="event.data.source_id",
    ),
)
async def rag_ingest_pdf(ctx: inngest.Context):
    def _load(ctx: inngest.Context) -> RAGChunkAndSrc:
        pdf_path = ctx.event.data["pdf_path"]
        source_id = ctx.event.data.get("source_id", pdf_path)
        chunks = load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunks=chunks, source_id=source_id)

    def _upsert(chunks_and_src: RAGChunkAndSrc) -> RAGUpsertResult:
        chunks = chunks_and_src.chunks
        source_id = chunks_and_src.source_id

        vecs = embed_texts(chunks)
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads = [{"source": source_id, "text": chunks[i]} for i in range(len(chunks))]

        QdrantStorage().upsert(ids, vecs, payloads)
        return RAGUpsertResult(ingested=len(chunks))

    chunks_and_src = await ctx.step.run("load-and-chunk", lambda: _load(ctx), output_type=RAGChunkAndSrc)
    ingested = await ctx.step.run("embed-and-upsert", lambda: _upsert(chunks_and_src), output_type=RAGUpsertResult)
    result = ingested.model_dump()
    # Store in local cache for synchronous polling
    run_results[ctx.event.id] = result
    return result


@inngest_client.create_function(
    fn_id="query-pdf",
    trigger=inngest.TriggerEvent(event="rag/query_pdf_ai"),
)
async def rag_query_pdf_ai(ctx: inngest.Context):
    print(f"DEBUG: rag_query_pdf_ai STARTED. event_id={ctx.event.id}")
    try:
        def _search(question: str, top_k: int = 3) -> RAGSearchResult:
            try:
                query_vec = embed_texts([question])[0]
                store = QdrantStorage()
                found = store.search(query_vec, top_k)
                return RAGSearchResult(contexts=found["contexts"], sources=found["sources"])
            except Exception as e:
                # If collection doesn't exist or search fails, return empty results
                print(f"Search failed: {e}")
                return RAGSearchResult(contexts=[], sources=[])

        def _llm_answer(user_content: str) -> str:
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant. Answer questions using the provided context when relevant. If the answer IS found in the context, cite it. If the answer is NOT in the context, you may still answer using your general knowledge but clearly warn the user with: '⚠️ Note: This answer is from my general knowledge, not from your uploaded documents.'"
                    },
                    {
                        "role": "user",
                        "content": user_content
                    }
                ],
                temperature=0.2,
                max_tokens=1024,
            )
            text = response.choices[0].message.content
            if not text:
                raise RuntimeError("Groq returned no text.")
            return text.strip()

        question = ctx.event.data["question"]
        top_k = int(ctx.event.data.get("top_k", 3))

        found = await ctx.step.run("embed-and-search", lambda: _search(question, top_k), output_type=RAGSearchResult)

        # Handle case where no PDFs are uploaded or no relevant contexts found
        contexts = found.contexts
        sources = found.sources

        if not contexts or len(contexts) == 0:
            print(f"No relevant contexts found for question: {question}")
            user_content = (
                f"Question: {question}\n\n"
                "Note: No PDF documents have been uploaded yet, or the question is not related to any uploaded documents. "
                "Please answer the question using your general knowledge, and clearly state that this information is not from uploaded documents."
            )
        else:
            print(f"Found {len(contexts)} contexts for question: {question}")
            context_block = "\n\n".join(f"- {c}" for c in contexts)
            user_content = (
                "Use the following context to answer the question.\n\n"
                f"Context:\n{context_block}\n\n"
                f"Question: {question}\n"
                "Answer concisely using the context above. If the answer is not contained in the context, answer the question, but specify that it is not from the sources given."
            )

        answer = await ctx.step.run("llm-answer", lambda: _llm_answer(user_content))

        result = {"answer": answer, "sources": sources, "num_contexts": len(contexts)}
        # Store in local cache for synchronous polling
        run_results[ctx.event.id] = result
        return result
    except Exception as e:
        print(f"ERROR in rag_query_pdf_ai: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise


# Serve Inngest functions
inngest.fast_api.serve(app, inngest_client, [rag_ingest_pdf, rag_query_pdf_ai])


# ============ PYDANTIC MODELS ============

class WhiteboardCreate(BaseModel):
    title: str = "Untitled Whiteboard"
    excalidraw_data: Optional[dict] = None


class WhiteboardUpdate(BaseModel):
    title: Optional[str] = None
    excalidraw_data: Optional[dict] = None


class WhiteboardResponse(BaseModel):
    id: str
    user_id: str
    title: str
    excalidraw_data: dict
    created_at: str
    updated_at: str


class RAGQueryRequest(BaseModel):
    question: str
    top_k: int = 5


# ============ DEPENDENCIES ============

async def get_supabase_client(authorization: str = Header(...)) -> tuple[Client, dict]:
    """
    Creates a Supabase client with the user's JWT token for RLS.
    Returns the client and the authenticated user.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        supabase.postgrest.auth(token)
        
        return supabase, user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# ============ HELPER FUNCTIONS ============

def _inngest_api_base() -> str:
    return os.getenv("INNGEST_API_BASE", "http://127.0.0.1:8288/api/v1")


def fetch_runs(event_id: str) -> list[dict]:
    url = f"{_inngest_api_base()}/events/{event_id}/runs"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", [])


async def wait_for_run_output(event_id: str, timeout_s: float = 60.0, poll_interval_s: float = 0.5) -> dict:
    import asyncio
    import time
    start = time.time()
    while True:
        if event_id in run_results:
            return run_results[event_id]
        
        # In local dev, we primarily trust our in-memory cache
        # because the Dev Server API can be inconsistent or return HTML errors
        
        if time.time() - start > timeout_s:
            raise TimeoutError(f"Timed out waiting for run output in local cache for event_id {event_id}")
        await asyncio.sleep(poll_interval_s)


def save_uploaded_pdf(file: UploadFile) -> Path:
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    file_path = uploads_dir / file.filename
    file_bytes = file.file.read()
    file_path.write_bytes(file_bytes)
    return file_path


# ============ ROOT ENDPOINTS ============

@app.get("/")
async def root():
    return {"message": "Whiteboard API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ============ WHITEBOARD ENDPOINTS ============

@app.get("/api/whiteboards")
async def get_whiteboards(auth: tuple = Depends(get_supabase_client)):
    """Get all whiteboards for the authenticated user."""
    supabase, user = auth
    
    try:
        response = supabase.table("whiteboards") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("updated_at", desc=True) \
            .execute()
        
        return {"whiteboards": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/whiteboards", status_code=201)
async def create_whiteboard(
    whiteboard: WhiteboardCreate,
    auth: tuple = Depends(get_supabase_client)
):
    """Create a new whiteboard."""
    supabase, user = auth
    
    try:
        data = {
            "user_id": user.id,
            "title": whiteboard.title,
            "excalidraw_data": whiteboard.excalidraw_data or {
                "elements": [],
                "appState": {},
                "files": {}
            }
        }
        
        response = supabase.table("whiteboards") \
            .insert(data) \
            .execute()
        
        if response.data:
            return {"whiteboard": response.data[0]}
        
        raise HTTPException(status_code=500, detail="Failed to create whiteboard")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whiteboards/{whiteboard_id}")
async def get_whiteboard(
    whiteboard_id: str,
    auth: tuple = Depends(get_supabase_client)
):
    """Get a specific whiteboard by ID."""
    supabase, user = auth
    
    try:
        response = supabase.table("whiteboards") \
            .select("*") \
            .eq("id", whiteboard_id) \
            .single() \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Whiteboard not found")
        
        return {"whiteboard": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail="Whiteboard not found")


@app.put("/api/whiteboards/{whiteboard_id}")
async def update_whiteboard(
    whiteboard_id: str,
    whiteboard: WhiteboardUpdate,
    auth: tuple = Depends(get_supabase_client)
):
    """Update a whiteboard."""
    supabase, user = auth
    
    try:
        update_data = {}
        if whiteboard.title is not None:
            update_data["title"] = whiteboard.title
        if whiteboard.excalidraw_data is not None:
            update_data["excalidraw_data"] = whiteboard.excalidraw_data
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("whiteboards") \
            .update(update_data) \
            .eq("id", whiteboard_id) \
            .eq("user_id", user.id) \
            .execute()
        
        if response.data:
            return {"whiteboard": response.data[0]}
        
        raise HTTPException(status_code=404, detail="Whiteboard not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/whiteboards/{whiteboard_id}")
async def delete_whiteboard(
    whiteboard_id: str,
    auth: tuple = Depends(get_supabase_client)
):
    """Delete a whiteboard."""
    supabase, user = auth
    
    try:
        response = supabase.table("whiteboards") \
            .delete() \
            .eq("id", whiteboard_id) \
            .eq("user_id", user.id) \
            .execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ RAG ENDPOINTS ============

@app.post("/api/rag/upload")
async def rag_upload_pdf(
    file: UploadFile = File(...),
    auth: tuple = Depends(get_supabase_client)
):
    """Upload a PDF and trigger RAG ingestion."""
    supabase, user = auth
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save the uploaded file
        path = save_uploaded_pdf(file)
        
        # Send event to Inngest for async processing
        event_id = await inngest_client.send(
            inngest.Event(
                name="rag/ingest_pdf",
                data={
                    "pdf_path": str(path.resolve()),
                    "source_id": file.filename,
                    "user_id": user.id,
                },
            )
        )
        
        return {
            "event_id": event_id[0],
            "filename": file.filename,
            "message": "PDF upload triggered for ingestion"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rag/query")
async def rag_query(
    request: RAGQueryRequest,
    auth: tuple = Depends(get_supabase_client)
):
    """Query the RAG system and get an AI-generated answer."""
    supabase, user = auth
    print(f"DEBUG: rag_query hit with question: {request.question}")

    try:
        # Send event to Inngest
        print("DEBUG: Sending event rag/query_pdf_ai to Inngest...")
        event_id = await inngest_client.send(
            inngest.Event(
                name="rag/query_pdf_ai",
                data={
                    "question": request.question,
                    "top_k": request.top_k,
                    "user_id": user.id,
                },
            )
        )
        print(f"DEBUG: Event sent, event_id: {event_id}")

        # Wait for the result
        print(f"DEBUG: Waiting for run output for event_id: {event_id[0]}...")
        output = await wait_for_run_output(event_id[0])
        print(f"DEBUG: Output received: {output}")

        return {
            "answer": output.get("answer", ""),
            "sources": output.get("sources", []),
            "num_contexts": output.get("num_contexts", 0)
        }
    except TimeoutError as e:
        print(f"ERROR in rag_query: TimeoutError: {e}")
        raise HTTPException(status_code=504, detail=str(e))
    except RuntimeError as e:
        print(f"ERROR in rag_query: RuntimeError: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"ERROR in rag_query: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rag/status/{event_id}")
async def rag_status(
    event_id: str,
    auth: tuple = Depends(get_supabase_client)
):
    """Check the status of a RAG operation."""
    # Check local cache first
    if event_id in run_results:
        return {"status": "Completed", "output": run_results[event_id]}

    try:
        runs = fetch_runs(event_id)
        if not runs:
            return {"status": "pending", "output": None}
        
        run = runs[0]
        status = run.get("status", "unknown")
        return {"status": status, "output": run.get("output")}
    except Exception:
        # If API fails but we didn't time out, assume pending
        return {"status": "pending", "output": None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
