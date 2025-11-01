from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio

class ConnectionManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        # Store active connections
        self.active_connections: Set[WebSocket] = set()
        
    async def connect(self, websocket: WebSocket):
        """Accept and store new connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"✅ New WebSocket connection. Total: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        """Remove connection"""
        self.active_connections.discard(websocket)
        print(f"❌ WebSocket disconnected. Total: {len(self.active_connections)}")
        
    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        if not self.active_connections:
            return
            
        message_str = json.dumps(message)
        
        # Send to all connections, remove dead ones
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                print(f"⚠️ Failed to send to connection: {e}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        for dead in dead_connections:
            self.active_connections.discard(dead)
    
    async def send_file_status(self, file_id: int, status: str, data: dict = None):
        """Send file status update"""
        message = {
            "type": "file_status",
            "file_id": file_id,
            "status": status,
            "data": data or {},
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.broadcast(message)
    
    async def send_analysis_progress(self, file_id: int, progress: int, message: str = ""):
        """Send analysis progress update"""
        message_data = {
            "type": "analysis_progress",
            "file_id": file_id,
            "progress": progress,
            "message": message,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.broadcast(message_data)

# Global instance
manager = ConnectionManager()