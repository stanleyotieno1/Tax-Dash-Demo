import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  navItems = [
    { path: '/main-page', icon: 'fa-solid fa-home', label: 'Dashboard' },
    { path: '/file-upload', icon: 'fa-solid fa-upload', label: 'Upload Documents' },
    { path: '/risk-analysis', icon: 'fa-solid fa-chart-line', label: 'Risk analysis' },
    { path: '/reports', icon: 'fa-solid fa-file-alt', label: 'Reports' },
    { path: '/profile', icon: 'fa-solid fa-building', label: 'Company Profile' }
  ];
}