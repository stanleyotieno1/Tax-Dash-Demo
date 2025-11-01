import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  notificationCount = 3;

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Search:', input.value);
  }

  onUpload() {
    console.log('Upload clicked');
  }

  onNotifications() {
    console.log('Notifications clicked');
  }

  onSettings() {
    console.log('Settings clicked');
  }

  onLogout() {
    console.log('Logout clicked');
  }
}