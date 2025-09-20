import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="text-align: center; margin-top: 5rem; font-family: sans-serif;">
      <h1 style="font-size: 3rem; color: #333;">Athenity</h1>
      <p style="font-size: 1.2rem; color: #666;">A revolução na validação de talentos.</p>

      <div style="margin-top: 3rem; padding: 2rem; border: 1px solid #ccc; border-radius: 8px; max-width: 600px; margin-left: auto; margin-right: auto; background-color: #f9f9f9;">
        <p>Verificando status da comunicação com a API...</p>
        <p [ngClass]="{
            'loading': apiStatus === 'loading',
            'online': apiStatus === 'online',
            'offline': apiStatus === 'offline'
           }"
           style="font-weight: bold; font-size: 1.1rem;">
          {{ apiMessage }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .loading { color: #f0ad4e; }
    .online { color: #5cb85c; }
    .offline { color: #d9534f; }
  `]
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);

  apiStatus: 'loading' | 'online' | 'offline' = 'loading';
  apiMessage: string = 'Conectando...';

  ngOnInit() {
    const apiUrl = 'https://plataforma-api-kwf8.onrender.com/api/health';
    this.http.get<{ status: string }>(apiUrl).subscribe({
      next: (response) => {
        this.apiStatus = 'online';
        this.apiMessage = `Status: Conectado! Mensagem da API: "${response.status}"`;
      },
      error: (err) => {
        this.apiStatus = 'offline';
        this.apiMessage = 'Status: Offline. Não foi possível conectar à API. Verifique os logs do Docker.';
        console.error('API connection error:', err);
      }
    });
  }
}
