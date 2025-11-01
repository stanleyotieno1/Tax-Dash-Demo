import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CompanyData {
  name: string;
  sector: string;
  kraPin: string;
  regNumber: string;
  email: string;
  phone: string;
  address: string;
  incorporationDate: string;
  employees: number;
  logo: string;
  complianceCert: boolean;
  bankDetails: boolean;
}

interface FinancialData {
  turnover: string;
  netIncome: string;
  payroll: string;
  vat: string;
}

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-profile.html',
  styleUrls: ['./company-profile.scss']
})
export class CompanyProfile implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  showEditModal = false;
  selectedPeriod = '2025';
  periods = ['2023', '2024', '2025'];

  companyData: CompanyData = {
    name: 'Stan Technologies Ltd',
    sector: 'Technology & Software Development',
    kraPin: 'P051234567X',
    regNumber: 'CPR/2019/123456',
    email: 'info@stantech.co.ke',
    phone: '+254 712 345 678',
    address: 'Westlands, Nairobi, Kenya',
    incorporationDate: 'January 15, 2019',
    employees: 45,
    logo: '',
    complianceCert: false,
    bankDetails: true
  };

  financialData: FinancialData = {
    turnover: 'KSh 52.4M',
    netIncome: 'KSh 8.3M',
    payroll: 'KSh 12.1M',
    vat: 'KSh 4.9M'
  };

  editData: any = {};

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.editData = { ...this.companyData };
  }

  get profileCompletion(): number {
    let completion = 60; // Base completion
    
    if (this.companyData.logo) completion += 10;
    if (this.companyData.kraPin) completion += 10;
    if (this.companyData.complianceCert) completion += 10;
    if (this.companyData.bankDetails) completion += 10;
    
    return completion;
  }

  getCompletionHint(): string {
    if (!this.companyData.logo) {
      return 'Upload your company logo to personalize your profile.';
    }
    if (!this.companyData.complianceCert) {
      return 'Upload compliance certificate to reach 100% completion.';
    }
    if (!this.companyData.bankDetails) {
      return 'Add your bank details for seamless transactions.';
    }
    return 'Complete all remaining steps to unlock full features.';
  }

  uploadLogo(): void {
    this.logoInput.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.companyData.logo = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  editProfile(): void {
    this.editData = { ...this.companyData };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveProfile(): void {
    this.companyData = { ...this.editData };
    this.closeEditModal();
    alert('Profile updated successfully!');
  }

  completeProfile(): void {
    alert('Redirecting to profile completion wizard...');
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      // Perform logout logic
      this.router.navigate(['/login']);
    }
  }

  downloadCertificate(): void {
    alert('Downloading tax compliance certificate...');
  }

  updateBankDetails(): void {
    alert('Opening bank details form...');
  }

  viewAuditLogs(): void {
    alert('Opening audit logs...');
  }

  contactSupport(): void {
    alert('Opening support chat...');
  }
}