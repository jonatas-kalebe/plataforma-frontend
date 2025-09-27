// src/app/services/athena-chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';

export interface AthenaMessage {
  role: 'user' | 'athena';
  text: string;
  timestamp: number;
}

export interface AthenaReply {
  text: string;
  quickReplies?: string[];
}

@Injectable({ providedIn: 'root' })
export class AthenaChatService {
  constructor(private http: HttpClient) {}
  sendMessage(sessionId: string, text: string, context?: any): Observable<AthenaReply> {
    return this.http.post<AthenaReply>('/api/chat/message', { sessionId, text, context }).pipe(
      catchError(() => of({ text: 'Estou com dificuldades para responder agora. Pode tentar novamente em instantes?' }))
    );
  }
  schedule(sessionId: string, payload: { name: string; email: string; datetime: string }): Observable<AthenaReply> {
    return this.http.post<AthenaReply>('/api/chat/schedule', { sessionId, ...payload }).pipe(
      catchError(() => of({ text: 'Não consegui agendar. Verifique os dados e tente novamente.' }))
    );
  }
}
