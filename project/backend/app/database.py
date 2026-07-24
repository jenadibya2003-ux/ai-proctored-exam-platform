"""
SQLAlchemy engine + session factory. Every request gets its own DB session
via the get_db dependency, which is closed automatically when the request
finishes (see FastAPI docs on 'Dependencies with yield').
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
