// src/app/components/athena-chat-widget/athena-chat-widget.component.ts
import { Component, Input, OnChanges, SimpleChanges, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AthenaChatService, AthenaMessage } from '../../services/athena-chat.service';

@Component({
  selector: 'app-athena-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './athena-chat-widget.component.html',
  styleUrls: ['./athena-chat-widget.component.css']
})
export class AthenaChatWidgetComponent implements OnChanges {
  @Input() visible = false;
  @ViewChild('scrollBox') scrollBox!: ElementRef<HTMLDivElement>;
  sessionId = crypto.randomUUID();
  isOpen = signal(false);
  teaserVisible = signal(false);
  initialized = signal(false);
  inputValue = signal('');
  mode = signal<'idle' | 'budget' | 'faq' | 'schedule'>('idle');
  quick = signal<string[]>(['Orçamento', 'Dúvidas', 'Agendar reunião']);
  messages = signal<AthenaMessage[]>([
    { role: 'athena', text: 'Olá, sou Athena. Quer um orçamento, tirar dúvidas ou agendar reunião?', timestamp: Date.now() }
  ]);
  formName = signal('');
  formEmail = signal('');
  formDate = signal('');
  formTime = signal('');
  canSend = computed(() => this.inputValue().trim().length > 0);
  canSchedule = computed(() => this.formName().trim().length > 1 && /\S+@\S+\.\S+/.test(this.formEmail()) && this.formDate() !== '' && this.formTime() !== '');
  constructor(private api: AthenaChatService) {
    effect(() => {
      if (this.isOpen()) setTimeout(() => this.scrollBottom(), 0);
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && !this.initialized()) {
      this.initialized.set(true);
      this.showTeaser();
    }
  }
  showTeaser(): void {
    this.teaserVisible.set(true);
    setTimeout(() => this.teaserVisible.set(false), 5000);
  }
  toggle(): void {
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (next) this.teaserVisible.set(false);
  }
  setModeFromQuick(choice: string): void {
    if (choice.toLowerCase().includes('orçament')) {
      this.mode.set('budget');
      this.pushAthena('Vamos simular um orçamento. Quantas páginas você precisa? Escolha: 1-3, 4-8, 9-15, 16+.');
      this.quick.set(['1-3 páginas', '4-8 páginas', '9-15 páginas', '16+ páginas']);
    } else if (choice.toLowerCase().includes('agendar')) {
      this.mode.set('schedule');
      this.pushAthena('Vamos agendar. Preencha nome, e-mail, data e hora e clique em Agendar.');
    } else {
      this.mode.set('faq');
      this.pushAthena('Envie sua dúvida. Posso explicar SEO, performance, prazos e demais serviços.');
      this.quick.set(['O que é SEO?', 'Prazo médio', 'Manutenção', 'Formas de pagamento']);
    }
  }
  handleQuick(q: string): void {
    if (this.mode() === 'budget') {
      this.pushUser(q);
      if (q.includes('1-3')) this.pushAthena('Ótimo. Precisa de blog, loja, área logada ou integrações?');
      else if (q.includes('4-8')) this.pushAthena('Certo. Precisa de blog, loja, área logada ou integrações?');
      else if (q.includes('9-15')) this.pushAthena('Entendido. Precisa de blog, loja, área logada ou integrações?');
      else this.pushAthena('Vamos escalar isso. Precisa de blog, loja, área logada ou integrações?');
      this.quick.set(['Blog', 'Loja', 'Área logada', 'Sem extras']);
      return;
    }
    if (this.mode() === 'faq') {
      this.pushUser(q);
      const localResponse = this.getFaqResponse(q);
      if (localResponse) {
        this.pushAthena(localResponse);
        this.quick.set(['Outra dúvida?', 'Fazer orçamento', 'Agendar reunião']);
      } else {
        this.sendToApi(q);
      }
      return;
    }
    if (this.mode() === 'idle') {
      this.setModeFromQuick(q);
      return;
    }
    if (this.mode() === 'schedule') return;
  }
  send(): void {
    const text = this.inputValue().trim();
    if (!text) return;
    this.pushUser(text);
    this.inputValue.set('');
    if (this.mode() === 'budget') {
      if (/blog|loja|logad|sem extras/i.test(text)) {
        const extra = /sem extras/i.test(text) ? [] : text.toLowerCase().split(',').map(s => s.trim());
        const estimate = this.estimateBudget(extra);
        this.pushAthena(`Estimativa inicial: ${estimate.valor}. Prazo aproximado: ${estimate.prazo}. Deseja agendar uma reunião para detalhar?`);
        this.quick.set(['Agendar reunião', 'Refazer orçamento', 'Falar com humano']);
        this.mode.set('idle');
      } else {
        this.pushAthena('Anotei. Deseja adicionar Blog, Loja, Área logada ou Sem extras?');
        this.quick.set(['Blog', 'Loja', 'Área logada', 'Sem extras']);
      }
      return;
    }
    if (this.mode() === 'faq') {
      const localResponse = this.getFaqResponse(text);
      if (localResponse) {
        this.pushAthena(localResponse);
        this.quick.set(['Outra dúvida?', 'Fazer orçamento', 'Agendar reunião']);
      } else {
        this.sendToApi(text);
      }
      return;
    }
    if (this.mode() === 'schedule') {
      this.sendToApi(text);
      return;
    }
    this.sendToApi(text);
  }
  estimateBudget(extras: string[]): { valor: string; prazo: string } {
    let base = 2000;
    let prazo = 10;
    if (this.messages().some(m => m.text.includes('1-3'))) base += 0;
    else if (this.messages().some(m => m.text.includes('4-8'))) {
      base += 1500;
      prazo += 5;
    } else if (this.messages().some(m => m.text.includes('9-15'))) {
      base += 3500;
      prazo += 10;
    } else {
      base += 6000;
      prazo += 15;
    }
    extras.forEach(e => {
      if (e.includes('blog')) {
        base += 800;
        prazo += 2;
      }
      if (e.includes('loja')) {
        base += 3000;
        prazo += 7;
      }
      if (e.includes('logad')) {
        base += 2800;
        prazo += 6;
      }
    });
    return { valor: `R$ ${base.toLocaleString('pt-BR')}`, prazo: `${prazo} a ${prazo + 7} dias úteis` };
  }
  pushUser(text: string): void {
    this.messages.update(list => [...list, { role: 'user', text, timestamp: Date.now() }]);
    this.scrollBottom();
  }
  pushAthena(text: string): void {
    this.messages.update(list => [...list, { role: 'athena', text, timestamp: Date.now() }]);
    this.scrollBottom();
  }
  sendToApi(text: string): void {
    this.api.sendMessage(this.sessionId, text, { mode: this.mode() }).subscribe(r => {
      this.pushAthena(r.text);
      if (r.quickReplies?.length) this.quick.set(r.quickReplies!);
    });
  }
  schedule(): void {
    const dt = `${this.formDate()}T${this.formTime()}:00`;
    this.api.schedule(this.sessionId, { name: this.formName(), email: this.formEmail(), datetime: dt }).subscribe(r => {
      this.pushAthena(r.text);
      this.mode.set('idle');
      this.quick.set(['Orçamento', 'Dúvidas', 'Agendar reunião']);
      this.formName.set('');
      this.formEmail.set('');
      this.formDate.set('');
      this.formTime.set('');
    });
  }
  trackByMessage(index: number, msg: AthenaMessage): string {
    return `${msg.timestamp}-${index}`;
  }
  private getFaqResponse(question: string): string | null {
    const q = question.toLowerCase();
    const faqResponses = {
      'seo': 'SEO (Search Engine Optimization) é o conjunto de técnicas para melhorar a visibilidade do seu site nos mecanismos de busca como Google. Inclui otimização de conteúdo, velocidade, estrutura e experiência do usuário. 📈',
      'prazo': 'Os prazos médios são: Sites simples (1-3 páginas): 5-10 dias úteis. Sites complexos (4-15 páginas): 15-30 dias úteis. E-commerce ou sistemas: 30-60 dias úteis. ⏰',
      'manutenção': 'Oferecemos planos de manutenção que incluem: atualizações de segurança, backup automático, monitoramento, pequenos ajustes de conteúdo e suporte técnico. Valores a partir de R$ 200/mês. 🔧',
      'pagamento': 'Aceitamos: PIX (5% desconto), cartão (até 12x), boleto (à vista) e depósito bancário. Para projetos acima de R$ 5.000, parcelamos em até 3x sem juros. 💳',
      'diferencial': 'Nosso diferencial está na abordagem: não criamos apenas sites, mas experiências digitais completas. Combinamos design moderno, performance técnica e estratégia de negócio. 🚀',
      'tecnologia': 'Usamos tecnologias modernas: Angular, React, Node.js, Python, bancos SQL/NoSQL, AWS/Azure para cloud, e sempre priorizamos performance e segurança. ⚡',
      'contato': 'Entre em contato por: E-mail: athenity@gmail.com, WhatsApp: (disponível no site), ou agende uma reunião aqui no chat para conversarmos sobre seu projeto! 📞'
    };
    
    for (const [key, response] of Object.entries(faqResponses)) {
      if (q.includes(key) || q.includes(key.replace('ç', 'c'))) {
        return response;
      }
    }
    
    return null;
  }
  scrollBottom(): void {
    if (!this.scrollBox) return;
    setTimeout(() => this.scrollBox.nativeElement.scrollTo({ top: this.scrollBox.nativeElement.scrollHeight, behavior: 'smooth' }), 0);
  }
}
