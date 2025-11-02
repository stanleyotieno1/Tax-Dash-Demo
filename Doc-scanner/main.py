from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from database import init_db, engine, UploadedFile
from sqlalchemy import text, select

app = FastAPI(title="PDF Extraction Service with Whisperer")

# Configure CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting application...")
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise

# Include API routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "PDF Extraction Service",
        "status": "running",
        "endpoints": {
            "extract": "POST /api/extract",
            "get_files": "GET /api/files",
            "get_file": "GET /api/files/{id}",
            "delete_file": "DELETE /api/files/{id}"
        }
    }

@app.get("/health")
async def health_check():
    """Database health check"""
    # from database import engine, UploadedFile
    # from sqlalchemy import text, select
    
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            
            result = conn.execute(select(UploadedFile)).fetchall()
            file_count = len(result)
        
        return {
            "status": "healthy",
            "database": "connected",
            "file_count": file_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level='info')