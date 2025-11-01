import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ExtractedData {
  invoice_number: string | null;
  date: string | null;
  vendor: string | null;
  total_amount: string | null;
  currency: string | null;
}

export interface WebSocketMessage {
  type: 'file_status' | 'analysis_progress' | 'pong';
  file_id?: number;
  status?: string;
  progress?: number;
  message?: string;
  data?: any;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:8000/api';
  private wsUrl = 'ws://localhost:8000/api/ws';
  
  private websocket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  public messages$ = this.messageSubject.asObservable();
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(private http: HttpClient) {
    this.connectWebSocket();
  }

  /**
   * Connect to WebSocket
   */
  connectWebSocket(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket...');
    this.websocket = new WebSocket(this.wsUrl);

    this.websocket.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send ping every 30 seconds to keep connection alive
      setInterval(() => {
        if (this.websocket?.readyState === WebSocket.OPEN) {
          this.websocket.send('ping');
        }
      }, 30000);
    };

    this.websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message:', message);
        this.messageSubject.next(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.websocket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.attemptReconnect();
    };
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // ... (keep all existing HTTP methods: uploadFile, analyzeAllFiles, getAllFiles, etc.)
  
  uploadFile(file: File): Observable<{progress: number, response?: any}> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total 
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
          return { progress };
        } else if (event.type === HttpEventType.Response) {
          return { progress: 100, response: event.body };
        }
        return { progress: 0 };
      })
    );
  }

  analyzeAllFiles(): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze-all`, {});
  }

  getAllFiles(): Observable<{ files: any[] }> {
    return this.http.get<{ files: any[] }>(`${this.apiUrl}/files`);
  }

  deleteFile(fileId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/files/${fileId}`);
  }
}