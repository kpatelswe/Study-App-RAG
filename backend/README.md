# Whiteboard API - FastAPI Backend

## Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file with your Supabase credentials:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/api/whiteboards` | Get all whiteboards for user |
| POST | `/api/whiteboards` | Create a new whiteboard |
| GET | `/api/whiteboards/{id}` | Get a specific whiteboard |
| PUT | `/api/whiteboards/{id}` | Update a whiteboard |
| DELETE | `/api/whiteboards/{id}` | Delete a whiteboard |

## Authentication

All `/api/whiteboards` endpoints require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

The frontend automatically includes this token from the Supabase session.

## Interactive Docs

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

