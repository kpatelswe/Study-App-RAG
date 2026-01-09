# RAG Study Tool - AI-Powered Learning Assistant

An interactive study platform that combines digital whiteboarding with Retrieval-Augmented Generation (RAG) AI to create an intelligent learning companion.

## 🎯 What It Does

Transform your study sessions with an AI assistant that actually understands your course materials. Upload your PDFs, draw diagrams while you study, and ask questions to an AI that knows the exact approaches, methods, and concepts from your specific coursework.

**Key Features:**
- **🎨 Interactive Whiteboarding** - Draw diagrams and visual concepts with Excalidraw
- **🤖 Intelligent Q&A** - Ask questions about your uploaded course materials
- **📄 PDF Processing** - Automatic document chunking and embedding for accurate retrieval
- **🔍 Semantic Search** - Find relevant information using vector similarity
- **💾 Auto-Save** - Never lose your work with automatic cloud persistence

## 🏗️ Architecture
- **Authentication**: Supabase Auth with JWT tokens
- **API Framework**: FastAPI for high-performance REST endpoints
- **AI/ML Stack**:
  - **Embeddings**: Cohere `embed-english-v3.0` (1024-dimensional vectors)
  - **LLM**: Groq API with Llama 3.1 8B Instant
  - **Vector Database**: Qdrant for semantic similarity search
  - **Document Processing**: LlamaIndex for intelligent PDF chunking

### Data Layer
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Vector Storage**: Qdrant for high-dimensional similarity search
- **File Storage**: Local filesystem for uploaded PDFs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL (via Supabase)
- Cohere API key
- Groq API key

### 1. Clone and Setup Frontend
```bash
cd whiteboard-app
npm install
```

### 2. Setup Backend
```bash
cd whiteboard-app/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create `.env` file in `whiteboard-app/`:
```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI APIs
COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

Create `.env` file in `whiteboard-app/backend/`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
INNGEST_API_BASE=http://127.0.0.1:8288/api/v1
```

### 4. Setup Vector Database
```bash
# Extract Qdrant
tar -xzf qdrant.tar.gz
chmod +x qdrant

# Start Qdrant
./qdrant &
```

### 5. Run the Application
```bash
# Terminal 1: Backend
cd whiteboard-app/backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd whiteboard-app
npm run dev
```

Visit `http://localhost:3000` to start studying!

## 📚 How to Study with AI

### 1. Upload Your Course Materials
- Click the upload area in the chat sidebar
- Drag & drop your PDF lecture notes, textbooks, or course materials
- The system automatically processes and indexes your documents

### 2. Start Drawing & Learning
- Create diagrams, flowcharts, or visual notes on the whiteboard
- The infinite canvas gives you unlimited space for your ideas

### 3. Ask Intelligent Questions
- Use the study assistant chat to ask questions like:
  - *"Explain the concept of X from the lecture"*
  - *"What are the key approaches for solving Y?"*
  - *"How does method Z work according to our textbook?"*
- The AI has read your exact course materials and can reference specific pages, examples, and approaches

Once running, visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc


## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for students who want AI that actually understands their coursework.**
