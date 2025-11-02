import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

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
    console.log('🔧 FileUploadService initialized');
    console.log('📍 API URL:', this.apiUrl);
    console.log('📍 WebSocket URL:', this.wsUrl);
    this.connectWebSocket();
  }

  /**
   * Connect to WebSocket
   */
  connectWebSocket(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket:', this.wsUrl);
    
    try {
      this.websocket = new WebSocket(this.wsUrl);

      this.websocket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        // Send ping every 30 seconds to keep connection alive
        setInterval(() => {
          if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send('ping');
            console.log('📤 Sent ping to keep connection alive');
          }
        }, 30000);
      };

      this.websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
    }
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
      console.log('🔌 Closing WebSocket connection');
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Upload file with progress tracking
   */
  uploadFile(file: File): Observable<{progress: number, response?: any}> {
    console.log('📤 Uploading file:', file.name);
    
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
          console.log(`📊 Upload progress: ${progress}%`);
          return { progress };
        } else if (event.type === HttpEventType.Response) {
          console.log('✅ Upload complete:', event.body);
          return { progress: 100, response: event.body };
        }
        return { progress: 0 };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Upload failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Analyze all pending files
   */
  analyzeAllFiles(): Observable<any> {
    console.log('🔍 Requesting analysis for all pending files');
    
    return this.http.post(`${this.apiUrl}/analyze-all`, {}).pipe(
      tap(response => console.log('✅ Analysis request sent:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Analysis request failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all files from database
   */
  getAllFiles(): Observable<{ files: any[] }> {
    console.log('📂 Fetching all files from:', `${this.apiUrl}/files`);
    
    return this.http.get<{ files: any[] }>(`${this.apiUrl}/files`).pipe(
      tap(response => console.log('✅ Files fetched:', response.files?.length || 0)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to fetch files:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a file
   */
  deleteFile(fileId: number): Observable<any> {
    console.log('🗑️ Deleting file:', fileId);
    
    return this.http.delete(`${this.apiUrl}/files/${fileId}`).pipe(
      tap(response => console.log('✅ File deleted:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Delete failed:', error);
        return throwError(() => error);
      })
    );
  }
}