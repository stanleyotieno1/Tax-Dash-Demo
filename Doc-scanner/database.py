from sqlalchemy import create_engine, Column, Integer, String, DateTime, LargeBinary, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import json

# Get PostgreSQL URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:stan@localhost:5432/fastapi_db")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

if "sqlite" in DATABASE_URL.lower():
    raise ValueError("SQLite is not supported! Please use PostgreSQL.")

# Create PostgreSQL engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to True to see SQL queries (helpful for debugging)
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,
    max_overflow=20
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pending")
    extracted_data = Column(Text, nullable=True)  # Store JSON as text
    file_content = Column(LargeBinary, nullable=True)
    error_message = Column(Text, nullable=True)
    
    def to_dict(self):
        """Convert model to dictionary"""
        extracted_data_dict = None
        if self.extracted_data:
            try:
                extracted_data_dict = json.loads(self.extracted_data)
            except Exception as e:
                print(f"Error parsing extracted_data: {e}")
                extracted_data_dict = None
        
        return {
            "id": self.id,
            "filename": self.filename,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "status": self.status,
            "upload_time": self.upload_time.isoformat() if self.upload_time else None,
            "extracted_data": extracted_data_dict,
            "error_message": self.error_message
        }


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully in PostgreSQL")
        
        # Test connection using text() for raw SQL
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection verified")
            
        # Verify table exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'uploaded_files'
            """))
            table_exists = result.fetchone()
            if table_exists:
                print(f"✅ Table 'uploaded_files' exists")
            else:
                print("⚠️ Table 'uploaded_files' not found")
                
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise


def test_db_connection():
    """Test database connection and operations"""
    try:
        db = SessionLocal()
        
        # Test query
        result = db.execute(text("SELECT 1"))
        print("✅ Database query test successful")
        
        # Count files
        count = db.query(UploadedFile).count()
        print(f"✅ Current file count: {count}")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False