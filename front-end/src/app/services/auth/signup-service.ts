import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timeout, catchError, throwError } from 'rxjs';

export interface SignupRequest {
  company: string;
  kraPin: string;
  phone: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  requiresVerification?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private readonly baseUrl = 'http://localhost:8084/api/auth';

  constructor(private http: HttpClient) {}

  signup(signupData: SignupRequest): Observable<SignupResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('🔄 SignupService: Making HTTP POST request...');

    return this.http.post<SignupResponse>(
      `${this.baseUrl}/signup`,
      signupData,
      { 
        headers,
        // Add these options for better debugging
        observe: 'body',
        responseType: 'json'
      }
    ).pipe(
      timeout(25000), // 25 second timeout
      catchError((error) => {
        console.error('🚨 SignupService: HTTP request failed:', error);
        return throwError(() => error);
      })
    );
  }
}
