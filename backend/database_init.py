from sqlalchemy import text
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import logging

# Configure Logger
logger = logging.getLogger(__name__)

def init_db():
    """
    Initializes the database:
    1. Creates tables if they don't exist.
    2. Runs migrations (adds missing columns).
    """
    logger.info("Initializing Database...")
    
    # Create Tables
    models.Base.metadata.create_all(bind=engine)
    
    # Run Migrations
    db = SessionLocal()
    try:
        # Check/Add columns to 'analyses' table (Auto-Migration)
        analysis_migrations = [
            ("result", "VARCHAR"),
            ("risk_reward", "VARCHAR"),
            ("sentiment", "VARCHAR"),
            ("processing_time_ms", "INTEGER"),
            ("entry", "FLOAT"),
            ("sl", "FLOAT"),
            ("tp1", "FLOAT"),
            ("tp2", "FLOAT"),
            ("recommendation", "VARCHAR"),
            ("meta_data", "JSON")
        ]

        for col_name, col_type in analysis_migrations:
            try:
                db.execute(text(f"ALTER TABLE analyses ADD COLUMN {col_name} {col_type}"))
                db.commit()
                logger.info(f"Migrated: Added {col_name} to analyses")
            except Exception as e:
                db.rollback()

        # Optimize: Ensure Index on created_at
        try:
            logger.info("Checking/Creating Index on analyses.created_at...")
            db.execute(text("CREATE INDEX IF NOT EXISTS ix_analyses_created_at ON analyses (created_at)"))
            db.commit()
        except Exception as e:
            logger.warning(f"Index Creation Failed (might already exist): {e}")
            db.rollback()

        # Optimize: Check/Add columns to 'users' table (Auto-Migration)
        column_migrations = [
            ("plan_tier", "VARCHAR DEFAULT 'trial'"),
            ("credits_balance", "INTEGER DEFAULT 3"),
            ("daily_usage_count", "INTEGER DEFAULT 0"),
            ("last_usage_date", "TIMESTAMP"),
            ("subscription_ends_at", "TIMESTAMP")
        ]
        
        for col_name, col_type in column_migrations:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                db.commit()
                logger.info(f"Migrated: Added {col_name} to users")
            except Exception as e:
                db.rollback()

        # Optimize: Check/Add Profile columns to 'users' table
        profile_migrations = [
            ("mobile", "VARCHAR"),
            ("country", "VARCHAR"),
            ("gender", "VARCHAR"),
            ("age_group", "VARCHAR"),
            ("is_admin", "BOOLEAN DEFAULT FALSE")
        ]
        
        for col_name, col_type in profile_migrations:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                db.commit()
                logger.info(f"Migrated: Added {col_name} to users")
            except Exception as e:
                db.rollback()

        # Double check analyses table again (Redundant but safe)
        # (Skipping redundant block from original main.py lines 116-135 as it's identical to 47-57)
        
    except Exception as e:
        logger.error(f"Startup Check Failed: {e}")
    finally:
        db.close()
