import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError, catchError, timeout } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly baseUrl = 'http://localhost:8084/api/auth';
  private readonly tokenKey = 'auth_token';
  private readonly userEmailKey = 'user_email';
  
  // BehaviorSubject to track authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is already logged in on service initialization
    this.checkAuthenticationStatus();
  }

  /**
   * Login user with email and password
   */
  login(loginData: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('🔄 LoginService: Making login request for:', loginData.email);

    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      loginData,
      { 
        headers,
        observe: 'body',
        responseType: 'json'
      }
    ).pipe(
      timeout(15000), // 15 second timeout
      tap((response: LoginResponse) => {
        if (response.success && response.token) {
          // Store the token and user info
          this.storeAuthData(response.token, loginData.email);
          console.log('✅ Login successful, token stored');
        }
      }),
      catchError((error) => {
        console.error('🚨 LoginService: Login request failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Store authentication data in localStorage
   */
  private storeAuthData(token: string, email: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userEmailKey, email);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get stored user email
   */
  getUserEmail(): string | null {
    return localStorage.getItem(this.userEmailKey);
  }

  /**
   * Check if user has a valid token
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Basic token existence check
    // You can add JWT expiration validation here if needed
    return true;
  }

  /**
   * Check current authentication status
   */
  private checkAuthenticationStatus(): void {
    const hasToken = this.hasValidToken();
    this.isAuthenticatedSubject.next(hasToken);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userEmailKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
    console.log('🔓 User logged out successfully');
  }

  /**
   * Get authorization headers with token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Clear authentication state (useful for testing or manual cleanup)
   */
  clearAuthState(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userEmailKey);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get current authentication state
   */
  getAuthState(): { isAuthenticated: boolean; email: string | null; hasToken: boolean } {
    return {
      isAuthenticated: this.isAuthenticated(),
      email: this.getUserEmail(),
      hasToken: !!this.getToken()
    };
  }
}