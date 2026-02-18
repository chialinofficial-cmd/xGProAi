from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Import Routers
from routers import auth, users, admin, analysis, admin_auth

# Import Database Init
from database_init import init_db

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="xGProAi Backend", version="2.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://xgproai.vercel.app",
        "https://xgpro-ai.vercel.app",
        "https://xgproai-git-main-chialins-projects-4dd07a5e.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event
@app.on_event("startup")
def startup_event():
    init_db()

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(analysis.router)
app.include_router(admin_auth.router)

@app.get("/")
def read_root():
    return {"message": "xGProAi Backend v2.0 is Running", "docs_url": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "xGProAi Backend (Online)"}

@app.get("/force-migrate")
def force_migration():
    """
    Manually trigger database schema migration.
    """
    try:
        init_db()
        return {"status": "success", "message": "Migration run successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Custom Image Serving
@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    # Check /tmp first for production (Render/Vercel)
    tmp_path = os.path.join("/tmp", filename)
    if os.path.exists(tmp_path):
        return FileResponse(tmp_path)
    
    # Fallback to local uploads/ directory
    local_path = os.path.join("uploads", filename)
    if os.path.exists(local_path):
        return FileResponse(local_path)
        
    raise HTTPException(status_code=404, detail="File not found")
