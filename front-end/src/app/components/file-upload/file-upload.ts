import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
// import { FileUploadService, ExtractedData } from ''
import { FileUploadService, ExtractedData } from '../../services/file-upload/file-upload.service';

interface UploadedFile {
  id?: number;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
  uploadTime?: string;
  file?: File;
  extractedData?: ExtractedData;
  errorMessage?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [FileUploadService],
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.scss']
})
export class FileUpLoad implements OnInit {
  uploadedFiles: UploadedFile[] = [];
  isDragging = false;
  allowedFormats = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
  maxFileSize = 10 * 1024 * 1024; // 10MB in bytes

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit(): void {
    // Load previously uploaded files from backend
    this.loadUploadedFiles();
  }

  loadUploadedFiles(): void {
    this.fileUploadService.getAllFiles().subscribe({
      next: (response) => {
        this.uploadedFiles = response.files.map(f => ({
          id: f.id,
          name: f.filename,
          size: f.file_size,
          type: f.file_type,
          status: f.status as 'uploading' | 'completed' | 'failed',
          progress: f.status === 'completed' ? 100 : 0,
          uploadTime: new Date(f.upload_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          extractedData: f.extracted_data || undefined,
          errorMessage: f.error_message || undefined
        }));
      },
      error: (error) => {
        console.error('Error loading files:', error);
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
      input.value = '';
    }
  }

  handleFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      if (!this.validateFile(file)) {
        return;
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        file: file
      };

      this.uploadedFiles.unshift(uploadedFile);
      this.uploadToBackend(uploadedFile);
    });
  }

  validateFile(file: File): boolean {
    if (file.size > this.maxFileSize) {
      alert(`File "${file.name}" exceeds maximum size of 10MB`);
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedFormats.includes(fileExtension)) {
      alert(`File format "${fileExtension}" is not allowed. Please upload: ${this.allowedFormats.join(', ')}`);
      return false;
    }

    return true;
  }

  uploadToBackend(uploadedFile: UploadedFile): void {
    if (!uploadedFile.file) return;

    this.fileUploadService.uploadFile(uploadedFile.file).subscribe({
      next: (event) => {
        if (event.progress !== undefined) {
          uploadedFile.progress = event.progress;
        }

        if (event.response) {
          uploadedFile.id = event.response.id;
          uploadedFile.status = event.response.status as 'completed' | 'failed';
          uploadedFile.uploadTime = new Date(event.response.upload_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });

          if (event.response.extracted.success) {
            uploadedFile.extractedData = event.response.extracted.data;
          } else {
            uploadedFile.errorMessage = event.response.extracted.error;
          }
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        uploadedFile.status = 'failed';
        uploadedFile.errorMessage = error.message || 'Upload failed';
      }
    });
  }

  retryUpload(file: UploadedFile): void {
    if (!file.file) {
      alert('Original file not available for retry');
      return;
    }
    
    file.status = 'uploading';
    file.progress = 0;
    file.errorMessage = undefined;
    this.uploadToBackend(file);
  }

  deleteFile(index: number): void {
    const file = this.uploadedFiles[index];
    
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    if (file.id) {
      this.fileUploadService.deleteFile(file.id).subscribe({
        next: () => {
          this.uploadedFiles.splice(index, 1);
        },
        error: (error) => {
          console.error('Delete failed:', error);
          alert('Failed to delete file from server');
        }
      });
    } else {
      this.uploadedFiles.splice(index, 1);
    }
  }

  viewFile(file: UploadedFile): void {
    if (file.extractedData) {
      const data = JSON.stringify(file.extractedData, null, 2);
      alert(`Extracted Data:\n\n${data}`);
    } else {
      alert('No extracted data available');
    }
  }

  downloadFile(file: UploadedFile): void {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert('File not available for download');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'fa-solid fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-solid fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-solid fa-file-excel';
      case 'csv':
        return 'fa-solid fa-file-csv';
      default:
        return 'fa-solid fa-file';
    }
  }

  getFileIconClass(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf-icon';
      case 'doc':
      case 'docx':
        return 'word-icon';
      case 'xls':
      case 'xlsx':
        return 'excel-icon';
      case 'csv':
        return 'csv-icon';
      default:
        return 'default-icon';
    }
  }

  getCompletedCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'completed').length;
  }

  getUploadingCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'uploading').length;
  }

  getFailedCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'failed').length;
  }
}