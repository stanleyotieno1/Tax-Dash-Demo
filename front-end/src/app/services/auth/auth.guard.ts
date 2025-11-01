import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  CanActivateChild
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { LoginService } from './login-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.loginService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }
        
        // Store the attempted URL for redirecting after login
        localStorage.setItem('redirectUrl', url);
        
        // Navigate to login page
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}

// Alternative guard to prevent authenticated users from accessing login/signup pages
@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.loginService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          return true;
        }
        
        // User is authenticated, redirect to dashboard
        this.router.navigate(['/dashboard']);
        return false;
      })
    );
  }
}