from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create session
db = SessionLocal()

try:
    # Query all users
    users = db.query(models.User).all()
    print(f"Total Users: {len(users)}")
    for user in users:
        print(f"User: {user.email}, ID: {user.id}")

    # Query all analyses
    analyses = db.query(models.Analysis).all()
    print(f"\nTotal Analyses: {len(analyses)}")
    for analysis in analyses:
        print(f"Analysis ID: {analysis.id}, Asset: {analysis.asset}, Created At: {analysis.created_at}")

finally:
    db.close()
