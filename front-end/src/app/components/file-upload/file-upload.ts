import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FileUploadService, ExtractedData } from '../../services/file-upload/file-upload.service';
import { Subscription } from 'rxjs';

interface UploadedFile {
  id?: number;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'pending' | 'analyzing' | 'completed' | 'failed';
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
export class FileUpLoad implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  uploadedFiles: UploadedFile[] = [];
  isDragging = false;
  allowedFormats = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
  maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  
  isAnalyzing = false;
  showAnalysisCard = false;
  analysisComplete = false;
  analysisMessage = '';
  
  // Custom dialog states
  showDialog = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogType: 'info' | 'success' | 'error' | 'confirm' = 'info';
  dialogCallback: (() => void) | null = null;
  
  private wsSubscription?: Subscription;

  constructor(
    private fileUploadService: FileUploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 Component initialized');
    
    // Load files first
    this.loadUploadedFiles();
    
    // THEN subscribe to WebSocket after a short delay
    setTimeout(() => {
      this.wsSubscription = this.fileUploadService.messages$.subscribe(message => {
        this.handleWebSocketMessage(message);
      });
      console.log('✅ WebSocket subscription active');
    }, 500);
  }

  ngOnDestroy(): void {
    // Disconnect WebSocket
    this.fileUploadService.disconnectWebSocket();
    
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadUploadedFiles(): void {
    console.log('📂 Fetching files from database...');
    this.fileUploadService.getAllFiles().subscribe({
      next: (response) => {
        console.log('✅ Files received:', response.files.length);
        this.uploadedFiles = response.files.map(f => ({
          id: f.id,
          name: f.filename,
          size: f.file_size,
          type: f.file_type,
          status: f.status as any,
          progress: f.status === 'completed' ? 100 : f.status === 'analyzing' ? 50 : 0,
          uploadTime: new Date(f.upload_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          extractedData: f.extracted_data || undefined,
          errorMessage: f.error_message || undefined
        }));
        console.log('📊 Files loaded successfully:', this.uploadedFiles);
      },
      error: (error) => {
        console.error('❌ Error loading files:', error);
        this.showDialogBox(
          'error',
          'Error Loading Files',
          `Failed to load files from database: ${error.message || 'Unknown error'}`,
          null
        );
      }
    });
  }

  handleWebSocketMessage(message: any): void {
    console.log('📨 WebSocket message received:', message);
    
    if (message.type === 'file_status') {
      const fileIndex = this.uploadedFiles.findIndex(f => f.id === message.file_id);
      
      if (fileIndex !== -1) {
        // Update existing file
        this.uploadedFiles[fileIndex].status = message.status;
        
        if (message.status === 'completed' && message.data?.extracted_data) {
          this.uploadedFiles[fileIndex].extractedData = message.data.extracted_data;
          this.uploadedFiles[fileIndex].progress = 100;
          console.log(`✅ File ${message.file_id} completed with data`);
        } else if (message.status === 'failed') {
          this.uploadedFiles[fileIndex].errorMessage = message.data?.error;
          this.uploadedFiles[fileIndex].progress = 0;
          console.log(`❌ File ${message.file_id} failed`);
        } else if (message.status === 'analyzing') {
          this.uploadedFiles[fileIndex].progress = 30;
          console.log(`🔍 File ${message.file_id} analyzing`);
        }
        
        // Force UI update
        this.uploadedFiles = [...this.uploadedFiles];
        
        // Check if all analysis is complete
        const analyzingCount = this.getAnalyzingCount();
        const pendingCount = this.getPendingCount();
        
        console.log(`📊 Status check: ${analyzingCount} analyzing, ${pendingCount} pending`);
        
        if (this.isAnalyzing && analyzingCount === 0 && pendingCount === 0) {
          console.log('✅ All files processed, finishing analysis...');
          this.finishAnalysis();
        }
      } else {
        console.warn(`⚠️ File ${message.file_id} not found in list`);
      }
    } else if (message.type === 'analysis_progress') {
      const fileIndex = this.uploadedFiles.findIndex(f => f.id === message.file_id);
      
      if (fileIndex !== -1) {
        this.uploadedFiles[fileIndex].progress = message.progress || 50;
        this.uploadedFiles = [...this.uploadedFiles];
        console.log(`📊 Progress update for file ${message.file_id}: ${message.progress}%`);
      }
    }
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
      this.showDialogBox(
        'error',
        'File Too Large',
        `File "${file.name}" exceeds maximum size of 10MB`,
        null
      );
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedFormats.includes(fileExtension)) {
      this.showDialogBox(
        'error',
        'Invalid File Format',
        `File format "${fileExtension}" is not allowed. Please upload: ${this.allowedFormats.join(', ')}`,
        null
      );
      return false;
    }

    return true;
  }

  uploadToBackend(uploadedFile: UploadedFile): void {
    if (!uploadedFile.file) return;

    console.log('📤 Starting upload for:', uploadedFile.name);

    this.fileUploadService.uploadFile(uploadedFile.file).subscribe({
      next: (event) => {
        if (event.progress !== undefined) {
          uploadedFile.progress = event.progress;
          console.log(`Upload progress: ${event.progress}%`);
        }

        if (event.response) {
          console.log('✅ Upload complete:', event.response);
          uploadedFile.id = event.response.id;
          uploadedFile.status = 'pending';
          uploadedFile.uploadTime = new Date(event.response.upload_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
          uploadedFile.progress = 0;
          
          // Force UI update
          this.uploadedFiles = [...this.uploadedFiles];
        }
      },
      error: (error) => {
        console.error('❌ Upload failed:', error);
        uploadedFile.status = 'failed';
        uploadedFile.errorMessage = error.message || 'Upload failed';
        this.uploadedFiles = [...this.uploadedFiles];
      }
    });
  }

  analyzeAllFiles(): void {
    const pendingCount = this.getPendingCount();
    
    if (pendingCount === 0) {
      this.showDialogBox(
        'info',
        'No Files to Analyze',
        'Please upload files first before analyzing.',
        null
      );
      return;
    }

    this.showDialogBox(
      'confirm',
      'Confirm Analysis',
      `Analyze ${pendingCount} pending file(s)?`,
      () => this.startAnalysis()
    );
  }

  private startAnalysis(): void {
    console.log('🔍 Starting analysis...');
    this.isAnalyzing = true;
    this.showAnalysisCard = false;
    this.analysisComplete = false;

    // Update UI to show analyzing status
    this.uploadedFiles
      .filter(f => f.status === 'pending')
      .forEach(f => {
        f.status = 'analyzing';
        f.progress = 10;
      });

    // Force UI update
    this.uploadedFiles = [...this.uploadedFiles];

    // Call backend - WebSocket will handle all updates!
    this.fileUploadService.analyzeAllFiles().subscribe({
      next: (response) => {
        console.log('✅ Analysis started:', response);
        this.analysisMessage = response.message || 'Analysis in progress...';
        // WebSocket will handle progress updates!
      },
      error: (error) => {
        console.error('❌ Analysis failed:', error);
        this.isAnalyzing = false;
        
        this.showDialogBox(
          'error',
          'Analysis Failed',
          error.message || 'Unknown error occurred during analysis',
          null
        );
        
        // Reset analyzing files to pending
        this.uploadedFiles
          .filter(f => f.status === 'analyzing')
          .forEach(f => {
            f.status = 'pending';
            f.progress = 0;
          });
        
        this.uploadedFiles = [...this.uploadedFiles];
      }
    });
  }

  private finishAnalysis(): void {
    this.isAnalyzing = false;
    this.analysisComplete = true;
    this.showAnalysisCard = true;

    const completedCount = this.getCompletedCount();
    const failedCount = this.getFailedCount();

    this.showDialogBox(
      'success',
      'Analysis Complete!',
      `${completedCount} document(s) analyzed successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
      null
    );
  }

  goToRiskAnalysis(): void {
    this.router.navigate(['/risk-analysis']);
  }

  closeAnalysisCard(): void {
    this.showAnalysisCard = false;
  }

  retryUpload(file: UploadedFile): void {
    if (!file.file) {
      this.showDialogBox(
        'error',
        'Cannot Retry',
        'Original file not available for retry',
        null
      );
      return;
    }
    
    file.status = 'uploading';
    file.progress = 0;
    file.errorMessage = undefined;
    this.uploadToBackend(file);
  }

  deleteFile(index: number): void {
    const file = this.uploadedFiles[index];
    
    this.showDialogBox(
      'confirm',
      'Confirm Delete',
      `Are you sure you want to delete "${file.name}"?`,
      () => {
        if (file.id) {
          this.fileUploadService.deleteFile(file.id).subscribe({
            next: () => {
              this.uploadedFiles.splice(index, 1);
              this.uploadedFiles = [...this.uploadedFiles];
            },
            error: (error) => {
              console.error('Delete failed:', error);
              this.showDialogBox(
                'error',
                'Delete Failed',
                'Failed to delete file from server',
                null
              );
            }
          });
        } else {
          this.uploadedFiles.splice(index, 1);
          this.uploadedFiles = [...this.uploadedFiles];
        }
      }
    );
  }

  viewFile(file: UploadedFile): void {
    if (file.extractedData) {
      const data = JSON.stringify(file.extractedData, null, 2);
      this.showDialogBox(
        'info',
        'Extracted Data',
        `<pre>${data}</pre>`,
        null
      );
    } else {
      this.showDialogBox(
        'info',
        'No Data',
        'No extracted data available. Please analyze the file first.',
        null
      );
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
      this.showDialogBox(
        'error',
        'Cannot Download',
        'File not available for download',
        null
      );
    }
  }

  // Custom Dialog Methods
  showDialogBox(
    type: 'info' | 'success' | 'error' | 'confirm',
    title: string,
    message: string,
    callback: (() => void) | null
  ): void {
    this.dialogType = type;
    this.dialogTitle = title;
    this.dialogMessage = message;
    this.dialogCallback = callback;
    this.showDialog = true;
  }

  handleDialogConfirm(): void {
    if (this.dialogCallback) {
      this.dialogCallback();
    }
    this.closeDialog();
  }

  handleDialogCancel(): void {
    this.closeDialog();
  }

  closeDialog(): void {
    this.showDialog = false;
    this.dialogCallback = null;
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

  getPendingCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'pending').length;
  }

  getAnalyzingCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'analyzing').length;
  }

  getFailedCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'failed').length;
  }
}