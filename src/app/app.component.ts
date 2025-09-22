import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import {LoadingScreenComponent} from './components/loading-screen/loading-screen.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingScreenComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showOverlay = signal(true);

  onOverlayDone(): void {
    this.showOverlay.set(false);
  }
}
