import { Component, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SignupService, SignupRequest } from '../../services/auth/signup-service';

// Custom validator for KRA PIN with specific messages
export function kraPinValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return { kraPin: { message: 'KRA PIN is required.' } };
    }

    const errors: any = {};
    if (value.length < 8) {
      errors.minLength = { message: 'KRA PIN must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(value)) {
      errors.hasLetter = { message: 'KRA PIN must include at least one letter.' };
    }
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value)) {
      errors.hasSymbol = { message: 'KRA PIN cannot contain symbols.' };
    }

    return Object.keys(errors).length ? { kraPin: errors } : null;
  };
}

// Custom validator for Phone Number
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return { phone: { message: 'Phone number is required!' } };
    }
    const kenyanPhonePattern = /^7\d{8}$/;
    if (!kenyanPhonePattern.test(value)) {
      return { phone: { message: 'Please enter a valid 9-digit phone number!' } };
    }
    return null;
  };
}

// Custom validator for Email
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return { email: { message: 'Email address is required!' } };
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(value)) {
      return { email: { message: 'Please enter a valid email address.' } };
    }
    return null;
  };
}

// Custom validator for Password
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return { password: { message: 'Password is required!' } };
    }

    const errors: any = {};
    if (value.length < 8) {
      errors.minLength = { message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(value)) {
      errors.hasCapital = { message: 'Password must have at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(value)) {
      errors.hasLowercase = { message: 'Password must have at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(value)) {
      errors.hasNumber = { message: 'Password must have at least one number.' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value)) {
      errors.hasSymbol = { message: 'Password must have at least one special character.' };
    }

    return Object.keys(errors).length ? { password: errors } : null;
  };
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink, NgIf, NgClass],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss'
})
export class SignUp {
  step = 1;
  submitted = false;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  companyForm: FormGroup;
  credentialsForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private signupService: SignupService,
    private cd: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      kraPin: ['', Validators.compose([Validators.required, kraPinValidator()])],
      phone: ['', Validators.compose([Validators.required, phoneValidator()])]
    });

    this.credentialsForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, emailValidator()])],
      password: ['', Validators.compose([Validators.required, passwordValidator()])]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get kraPin() {
    return this.companyForm.get('kraPin');
  }

  get phone() {
    return this.companyForm.get('phone');
  }

  get email() {
    return this.credentialsForm.get('email');
  }

  get password() {
    return this.credentialsForm.get('password');
  }

  goToCredentials() {
    if (this.companyForm.valid) {
      this.step = 2;
    } else {
      this.companyForm.markAllAsTouched();
    }
  }

  backToCompany() {
    this.step = 1;
    this.errorMessage = '';
  }

  submitAll() {
    if (this.credentialsForm.invalid) {
      this.credentialsForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const signupData: SignupRequest = {
      company: this.companyForm.value.companyName,
      kraPin: this.companyForm.value.kraPin,
      phone: `+254${this.companyForm.value.phone}`,
      email: this.credentialsForm.value.email,
      password: this.credentialsForm.value.password
    };

    console.log('🚀 Starting signup process...');
    console.log('📤 Sending signup data:', signupData);
    console.log('🔗 API endpoint:', 'http://localhost:8084/api/auth/signup');

    this.signupService.signup(signupData).subscribe({
      next: (response) => {
        console.log('✅ Signup API response received:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response success property:', response?.success);
        
        // Check if the response indicates success
        if (response && response.success === true) {
          console.log('🎉 Registration successful - moving to step 3');
          this.step = 3;
          this.submitted = true;
        } else {
          console.log('❌ Registration failed according to response');
          this.errorMessage = response?.message || 'Registration failed. Please try again.';
        }
        this.isLoading = false;
        this.cd.detectChanges(); // Manually trigger change detection
      },
      error: (error) => {
        console.error('❌ Signup API error:', error);
        console.error('🔍 Error status:', error.status);
        console.error('🔍 Error message:', error.message);
        console.error('🔍 Error body:', error.error);
        this.isLoading = false;
        
        // Handle the specific case where registration succeeds but there's a parsing error
        if (error.status === 201) {
          console.log('✅ Registration successful despite parsing error (status 201)');
          this.step = 3;
          this.submitted = true;
          this.cd.detectChanges(); // Manually trigger change detection for success
          return;
        }
        
        // Handle other error cases
        if (error.error && error.error.success === false) {
          this.errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check if the backend server is running on port 8084.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid information provided. Please check your details.';
        } else if (error.status === 409) {
          this.errorMessage = 'An account with this information already exists.';
        } else if (error.name === 'TimeoutError') {
          this.errorMessage = 'Request timed out. Please try again.';
        } else {
          this.errorMessage = `An unexpected error occurred (${error.status}). Please try again.`;
        }
        this.cd.detectChanges(); // Manually trigger change detection for error
      }
    });
  }

  get progressWidth(): string {
    if (this.step === 1) return '0%';
    if (this.step === 2) return '50%';
    if (this.step === 3) return '100%';
    return '0%';
  }
}
