from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY, CORS_ORIGINS

app = FastAPI(title="Whiteboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
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


# Dependency to get authenticated Supabase client
async def get_supabase_client(authorization: str = Header(...)) -> tuple[Client, dict]:
    """
    Creates a Supabase client with the user's JWT token for RLS.
    Returns the client and the authenticated user.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    # Create client with user's token for RLS
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Verify the token and get user
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Set the auth token for subsequent requests (enables RLS)
        supabase.postgrest.auth(token)
        
        return supabase, user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

