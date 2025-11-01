import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Report {
  id: string;
  name: string;
  type: string;
  period: string;
  riskLevel: 'high' | 'medium' | 'low' | 'pending';
  dateGenerated: string;
  status: 'completed' | 'pending' | 'in-progress';
  selected?: boolean;
}

interface NewReport {
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  name: string;
  notes: string;
  includeCharts: boolean;
  includeAI: boolean;
  emailCopy: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class Reports implements OnInit {
  Math = Math;
  
  // View state
  viewMode: 'table' | 'grid' = 'table';
  showGenerateModal = false;
  showViewModal = false;
  showDownloadProgress = false;
  isGenerating = false;
  downloadProgress = 0;
  
  // Filters
  filters = {
    startDate: '',
    endDate: '',
    reportType: 'all',
    status: 'all'
  };
  
  searchQuery = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  
  // Summary stats
  totalReports = 14;
  reportsThisMonth = 3;
  
  // Selected report for viewing
  selectedReport: Report | null = null;
  
  // New report data
  newReport: NewReport = {
    type: '',
    period: '',
    startDate: '',
    endDate: '',
    name: '',
    notes: '',
    includeCharts: true,
    includeAI: true,
    emailCopy: false
  };
  
  // Sample data
  reports: Report[] = [
    {
      id: '1',
      name: 'Q3_2025_Risk_Summary.pdf',
      type: 'Tax Risk Summary',
      period: 'Q3 2025',
      riskLevel: 'medium',
      dateGenerated: 'Oct 21, 2025',
      status: 'completed'
    },
    {
      id: '2',
      name: 'VAT_Analysis_September.pdf',
      type: 'VAT',
      period: 'Sep 2025',
      riskLevel: 'high',
      dateGenerated: 'Oct 15, 2025',
      status: 'completed'
    },
    {
      id: '3',
      name: 'Payroll_Compliance_Q3.pdf',
      type: 'Payroll',
      period: 'Q3 2025',
      riskLevel: 'low',
      dateGenerated: 'Oct 10, 2025',
      status: 'completed'
    },
    {
      id: '4',
      name: 'Comprehensive_Tax_Report_2025.pdf',
      type: 'Tax Risk Summary',
      period: 'Year 2025',
      riskLevel: 'medium',
      dateGenerated: 'Oct 5, 2025',
      status: 'completed'
    },
    {
      id: '5',
      name: 'Q2_Risk_Analysis.pdf',
      type: 'Tax Risk Summary',
      period: 'Q2 2025',
      riskLevel: 'low',
      dateGenerated: 'Jul 20, 2025',
      status: 'completed'
    },
    {
      id: '6',
      name: 'VAT_Returns_Q2.pdf',
      type: 'VAT',
      period: 'Q2 2025',
      riskLevel: 'medium',
      dateGenerated: 'Jul 15, 2025',
      status: 'completed'
    },
    {
      id: '7',
      name: 'Monthly_Report_August.pdf',
      type: 'Tax Risk Summary',
      period: 'Aug 2025',
      riskLevel: 'low',
      dateGenerated: 'Sep 1, 2025',
      status: 'completed'
    },
    {
      id: '8',
      name: 'Annual_Compliance_2024.pdf',
      type: 'Payroll',
      period: 'Year 2024',
      riskLevel: 'low',
      dateGenerated: 'Jan 15, 2025',
      status: 'completed'
    },
    {
      id: '9',
      name: 'Q4_2024_Summary.pdf',
      type: 'Tax Risk Summary',
      period: 'Q4 2024',
      riskLevel: 'medium',
      dateGenerated: 'Jan 10, 2025',
      status: 'completed'
    },
    {
      id: '10',
      name: 'Pending_VAT_Analysis.pdf',
      type: 'VAT',
      period: 'Oct 2025',
      riskLevel: 'pending',
      dateGenerated: 'Oct 22, 2025',
      status: 'in-progress'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialize date filters to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.filters.startDate = firstDay.toISOString().split('T')[0];
    this.filters.endDate = lastDay.toISOString().split('T')[0];
  }

  get filteredReports(): Report[] {
    return this.reports.filter(report => {
      const matchesType = this.filters.reportType === 'all' || report.type.toLowerCase().includes(this.filters.reportType);
      const matchesStatus = this.filters.status === 'all' || report.status === this.filters.status;
      const matchesSearch = this.searchQuery === '' || 
        report.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesType && matchesStatus && matchesSearch;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReports.length / this.pageSize);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'fa-solid fa-circle-check';
      case 'pending': return 'fa-solid fa-clock';
      case 'in-progress': return 'fa-solid fa-spinner fa-spin';
      default: return 'fa-solid fa-circle';
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filteredReports.forEach(report => report.selected = checked);
  }

  openGenerateModal(): void {
    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
    this.resetNewReport();
  }

  generateReport(): void {
    if (!this.newReport.type || !this.newReport.period || !this.newReport.startDate || !this.newReport.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    this.isGenerating = true;
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: (this.reports.length + 1).toString(),
        name: this.newReport.name || `Report_${new Date().getTime()}.pdf`,
        type: this.formatReportType(this.newReport.type),
        period: this.formatPeriod(this.newReport.period, this.newReport.startDate, this.newReport.endDate),
        riskLevel: 'pending',
        dateGenerated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'in-progress'
      };
      
      this.reports.unshift(newReport);
      this.totalReports++;
      this.reportsThisMonth++;
      
      this.isGenerating = false;
      this.closeGenerateModal();
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        newReport.status = 'completed';
        newReport.riskLevel = 'low';
      }, 3000);
    }, 2000);
  }

  formatReportType(type: string): string {
    const types: { [key: string]: string } = {
      'tax-risk': 'Tax Risk Summary',
      'vat': 'VAT',
      'payroll': 'Payroll',
      'comprehensive': 'Comprehensive'
    };
    return types[type] || type;
  }

  formatPeriod(period: string, start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (period === 'month') {
      return startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (period === 'quarter') {
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter} ${startDate.getFullYear()}`;
    } else if (period === 'year') {
      return `Year ${startDate.getFullYear()}`;
    }
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  resetNewReport(): void {
    this.newReport = {
      type: '',
      period: '',
      startDate: '',
      endDate: '',
      name: '',
      notes: '',
      includeCharts: true,
      includeAI: true,
      emailCopy: false
    };
  }

  viewReport(report: Report): void {
    this.selectedReport = report;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedReport = null;
  }

  downloadReport(report: Report): void {
    this.showDownloadProgress = true;
    this.downloadProgress = 0;
    
    const interval = setInterval(() => {
      this.downloadProgress += 10;
      
      if (this.downloadProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.showDownloadProgress = false;
          this.downloadProgress = 0;
          alert(`Downloaded: ${report.name}`);
        }, 500);
      }
    }, 200);
  }

  deleteReport(report: Report): void {
    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      const index = this.reports.findIndex(r => r.id === report.id);
      if (index > -1) {
        this.reports.splice(index, 1);
        this.totalReports--;
        if (this.isCurrentMonth(report.dateGenerated)) {
          this.reportsThisMonth--;
        }
      }
    }
  }

  regenerateReport(report: Report | null): void {
    if (!report) return;
    
    if (confirm(`Re-generate "${report.name}"?`)) {
      report.status = 'in-progress';
      report.riskLevel = 'pending';
      
      setTimeout(() => {
        report.status = 'completed';
        report.riskLevel = 'low';
        report.dateGenerated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        alert(`Report "${report.name}" has been regenerated successfully.`);
      }, 3000);
      this.closeViewModal();
    }
  }

  exportAll(): void {
    const selectedReports = this.reports.filter(r => r.selected);
    
    if (selectedReports.length === 0) {
      alert('Please select at least one report to export');
      return;
    }
    
    this.showDownloadProgress = true;
    this.downloadProgress = 0;
    
    const interval = setInterval(() => {
      this.downloadProgress += 5;
      
      if (this.downloadProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.showDownloadProgress = false;
          this.downloadProgress = 0;
          alert(`Successfully exported ${selectedReports.length} report(s)`);
        }, 500);
      }
    }, 150);
  }

  refreshReports(): void {
    alert('Refreshing reports...');
    // In real app, this would fetch latest data from backend
  }

  isCurrentMonth(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}