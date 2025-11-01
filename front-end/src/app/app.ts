import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], //universal navbar should imported and used here
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'tax-dash';
}
