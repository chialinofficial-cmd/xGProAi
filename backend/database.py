from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Use /tmp for SQLite on Vercel (read-only file system workaround)
# Note: This is ephemeral and resets on deployment/cold start.
# For production, use a hosted Postgres URL via env var.
if os.path.exists("/tmp"):
    SQLALCHEMY_DATABASE_URL = "sqlite:////tmp/xgproai.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./xgproai.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
