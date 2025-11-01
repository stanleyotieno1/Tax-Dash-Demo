import { Component, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginRequest, LoginService } from '../../services/auth/login-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login implements OnDestroy {
  loginForm: FormGroup;
  showPassword = false;
  loginFailed = false;
  isLoading = false;
  errorMessage = '';

  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Check if user is already authenticated
    if (this.loginService.isAuthenticated()) {
      this.router.navigate(['/main-page']); // Redirect to your main page
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submitLogin(): void {
    // Reset previous error states
    this.loginFailed = false;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      email: this.loginForm.value.email.trim(),
      password: this.loginForm.value.password
    };

    console.log('Attempting login for:', loginData.email);

    const loginSub = this.loginService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          console.log('Login successful!', response);
          
          // Optional: Show success message briefly before navigation
          // You can remove this if you want immediate navigation
          setTimeout(() => {
            this.router.navigate(['/main-page']); 
          }, 500);
          
        } else {
          // Backend returned success: false
          this.loginFailed = true;
          this.errorMessage = response.message || 'Login failed. Please try again.';
          console.error('Login failed:', response.message);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.loginFailed = true;
        
        console.error('Login error:', error);
        
        // Handle different types of errors
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Account not verified. Please check your email.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });

    this.subscription.add(loginSub);
  }

  // Helper method to check if form field has error
  hasFieldError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors?.[errorType] && (field?.touched || field?.dirty));
  }

  // Helper method to check if field is invalid and touched/dirty
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.invalid && (field?.touched || field?.dirty));
  }

  // Method to navigate to signup
  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }

  // Method to handle forgot password 
  forgotPassword(): void {
    // Implement forgot password logic
    console.log('Forgot password clicked');
  }
}