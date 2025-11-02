from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy import select, delete, text
from database import engine, UploadedFile as DBUploadedFile
from services import extract_from_pdf
from websocket_manager import manager
from datetime import datetime
import json
import asyncio
from typing import List

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates
    """
    await manager.connect(websocket)
    try:
        # Keep connection alive and listen for messages
        while True:
            # Wait for any message from client (ping/pong to keep alive)
            data = await websocket.receive_text()
            
            # Optional: Handle client messages
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file WITHOUT extracting data (for demo purposes)
    """
    try:
        # Read file content
        pdf_bytes = await file.read()
        
        # Insert into database with 'pending' status
        with engine.connect() as conn:
            result = conn.execute(
                DBUploadedFile.__table__.insert().values(
                    filename=file.filename,
                    file_size=len(pdf_bytes),
                    file_type=file.content_type or "application/pdf",
                    status="pending",
                    upload_time=datetime.utcnow(),
                    file_content=pdf_bytes
                )
            )
            conn.commit()
            file_id = result.inserted_primary_key[0]
        
        # Get the created record
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()
            
            if result:
                # Notify via WebSocket
                await manager.send_file_status(
                    file_id=result.id,
                    status="pending",
                    data={
                        "filename": result.filename,
                        "file_size": result.file_size,
                        "upload_time": result.upload_time.isoformat()
                    }
                )
                
                return {
                    "id": result.id,
                    "filename": result.filename,
                    "file_size": result.file_size,
                    "status": result.status,
                    "upload_time": result.upload_time.isoformat(),
                    "message": "File uploaded successfully"
                }
    
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_single_file(file_id: int, file_content: bytes, filename: str):
    """
    Background task to process a single file with WebSocket updates
    """
    try:
        print(f"🔍 Starting extraction for file {file_id}: {filename}")
        
        # Update to analyzing
        with engine.connect() as conn:
            conn.execute(
                DBUploadedFile.__table__.update()
                .where(DBUploadedFile.__table__.c.id == file_id)
                .values(status="analyzing")
            )
            conn.commit()
        
        # Notify WebSocket
        await manager.send_file_status(
            file_id=file_id,
            status="analyzing",
            data={"filename": filename, "message": "Starting analysis..."}
        )
        await manager.send_analysis_progress(file_id, 10, "Initializing...")
        
        # Extract data with timeout
        try:
            await manager.send_analysis_progress(file_id, 30, "Extracting text from PDF...")
            
            extracted = await asyncio.wait_for(
                asyncio.to_thread(extract_from_pdf, file_content),
                timeout=120.0  # 2 minutes max
            )
            
            await manager.send_analysis_progress(file_id, 80, "Processing with AI...")
            
        except asyncio.TimeoutError:
            print(f"⏱️ Timeout for file {file_id}")
            extracted = {
                "success": False,
                "error": "Processing timeout (exceeded 2 minutes)"
            }
        
        # Update database with results
        with engine.connect() as conn:
            if extracted.get("success", False):
                print(f"✅ Successfully extracted data for file {file_id}")
                
                await manager.send_analysis_progress(file_id, 100, "Analysis complete!")
                
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(
                        status="completed",
                        extracted_data=json.dumps(extracted.get("data", {}))
                    )
                )
                
                # Notify completion
                await manager.send_file_status(
                    file_id=file_id,
                    status="completed",
                    data={
                        "filename": filename,
                        "extracted_data": extracted.get("data", {}),
                        "message": "Analysis completed successfully!"
                    }
                )
            else:
                print(f"❌ Failed to extract data for file {file_id}: {extracted.get('error')}")
                
                conn.execute(
                    DBUploadedFile.__table__.update()
                    .where(DBUploadedFile.__table__.c.id == file_id)
                    .values(
                        status="failed",
                        error_message=extracted.get("error", "Analysis failed")
                    )
                )
                
                # Notify failure
                await manager.send_file_status(
                    file_id=file_id,
                    status="failed",
                    data={
                        "filename": filename,
                        "error": extracted.get("error", "Analysis failed")
                    }
                )
            
            conn.commit()
        
        print(f"✅ Finished processing file {file_id}")
        
    except Exception as e:
        print(f"❌ Error processing file {file_id}: {e}")
        
        with engine.connect() as conn:
            conn.execute(
                DBUploadedFile.__table__.update()
                .where(DBUploadedFile.__table__.c.id == file_id)
                .values(status="failed", error_message=str(e))
            )
            conn.commit()
        
        # Notify error
        await manager.send_file_status(
            file_id=file_id,
            status="failed",
            data={"filename": filename, "error": str(e)}
        )


@router.post("/analyze-all")
async def analyze_all_pending(background_tasks: BackgroundTasks):
    """
    Start analyzing all pending files in background
    Returns immediately with file IDs being processed
    """
    try:
        # Get all pending files
        with engine.connect() as conn:
            pending_files = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.status == "pending")
            ).fetchall()
        
        if not pending_files:
            return {
                "success": False,
                "message": "No pending files to analyze",
                "processing_count": 0,
                "file_ids": []
            }
        
        # Add all files to background processing
        file_ids = []
        for file in pending_files:
            file_ids.append(file.id)
            # Add to background tasks (non-blocking)
            background_tasks.add_task(
                process_single_file,
                file.id,
                file.file_content,
                file.filename
            )
        
        print(f"🚀 Started background processing for {len(file_ids)} files")
        
        return {
            "success": True,
            "message": f"Started processing {len(file_ids)} file(s). Check status for updates.",
            "processing_count": len(file_ids),
            "file_ids": file_ids,
            "estimated_time_seconds": len(file_ids) * 30
        }
    
    except Exception as e:
        print(f"Analyze all error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def get_all_files():
    """Get all uploaded files"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).order_by(DBUploadedFile.upload_time.desc())
            ).fetchall()
            
            files = []
            for row in result:
                extracted_data = None
                if row.extracted_data:
                    try:
                        extracted_data = json.loads(row.extracted_data)
                    except:
                        extracted_data = None
                
                files.append({
                    "id": row.id,
                    "filename": row.filename,
                    "file_size": row.file_size,
                    "file_type": row.file_type,
                    "status": row.status,
                    "upload_time": row.upload_time.isoformat() if row.upload_time else None,
                    "extracted_data": extracted_data,
                    "error_message": row.error_message
                })
            
            return {"files": files}
    
    except Exception as e:
        print(f"Get files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_id}")
async def delete_file(file_id: int):
    """Delete file from database"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                select(DBUploadedFile).where(DBUploadedFile.id == file_id)
            ).first()
            
            if not result:
                raise HTTPException(status_code=404, detail="File not found")
            
            conn.execute(
                delete(DBUploadedFile).where(DBUploadedFile.id == file_id)
            )
            conn.commit()
            
            # Notify deletion
            await manager.send_file_status(
                file_id=file_id,
                status="deleted",
                data={"filename": result.filename}
            )
            
            return {"message": "File deleted successfully", "id": file_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete file error: {e}")
        raise HTTPException(status_code=500, detail=str(e))