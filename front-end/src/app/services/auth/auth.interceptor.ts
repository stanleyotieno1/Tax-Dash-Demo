import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginService } from './login-service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    const authToken = this.loginService.getToken();
    
    // Clone the request and add the authorization header if token exists
    let authReq = request;
    
    if (authToken && !this.isAuthRequest(request.url)) {
      authReq = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${authToken}`)
      });
    }

    // Handle the request and catch any authentication errors
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && !this.isAuthRequest(request.url)) {
          console.warn('🔒 Unauthorized request detected. Logging out user.');
          this.loginService.logout();
        }
        
        // Handle 403 Forbidden errors (optional)
        if (error.status === 403) {
          console.warn('🚫 Access forbidden.');
          // You could redirect to a "no access" page here
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Check if the request is to an authentication endpoint
   * We don't want to add auth headers to login/signup requests
   */
  private isAuthRequest(url: string): boolean {
    const authEndpoints = ['/api/auth/login', '/api/auth/signup', '/api/auth/verify'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}