import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ExtractedData {
  invoice_number: string | null;
  date: string | null;
  vendor: string | null;
  total_amount: string | null;
  currency: string | null;
}

export interface UploadResponse {
  id: number;
  filename: string;
  status: string;
  extracted: {
    success: boolean;
    data?: ExtractedData;
    error?: string;
    raw_text_preview?: string;
  };
  upload_time: string;
}

export interface FileRecord {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  upload_time: string;
  extracted_data: ExtractedData | null;
  error_message: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Upload file and extract data
   */
  uploadFile(file: File): Observable<{progress: number, response?: UploadResponse}> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.apiUrl}/extract`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
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

  /**
   * Get all uploaded files
   */
  getAllFiles(): Observable<{ files: FileRecord[] }> {
    return this.http.get<{ files: FileRecord[] }>(`${this.apiUrl}/files`);
  }

  /**
   * Get specific file by ID
   */
  getFile(fileId: number): Observable<FileRecord> {
    return this.http.get<FileRecord>(`${this.apiUrl}/files/${fileId}`);
  }

  /**
   * Delete file
   */
  deleteFile(fileId: number): Observable<{ message: string, id: number }> {
    return this.http.delete<{ message: string, id: number }>(
      `${this.apiUrl}/files/${fileId}`
    );
  }
}