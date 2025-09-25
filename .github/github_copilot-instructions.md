# Copilot Repository Instructions

Você está trabalhando neste monorepo Angular 19 com SSR (Node/Express).  
NUNCA adicionar novas dependências sem autorização.  
Node: 20. Gestor: npm.

## Objetivo Macro
Reestruturar a landing em um scrollytelling de 5 atos (#hero, #filosofia, #servicos, #trabalhos, #cta) com GSAP/ScrollTrigger + Three.js + Tailwind já existentes, preservando SSR funcional (servido em http://localhost:4000), entregando PRs pequenos e testáveis, acompanhados de testes Playwright e auditoria Gemini.

## Regras Invioláveis
1. Sem novas dependências.
2. SSR deve buildar gerando também `dist/frontend/server/server.mjs` (entrada server/`main.server.ts`).
3. Respeitar `prefers-reduced-motion`: desabilitar pin/scrub/snap (fallback discreto).
4. Testes E2E Playwright são fonte de verdade de regressão visual (`toHaveScreenshot`).
5. Auditoria via Action `google-github-actions/run-gemini-cli@v0` usando `GEMINI_API_KEY`.

## Fluxo de Trabalho
1. Abrir issue(s) para até 1–3 micro-tarefas (A1…J1).
2. Criar branch curta a partir de `main`.
3. Implementar e adicionar/atualizar testes Playwright (se UI mudou).
4. Garantir build SSR ok (`npm run build:ssr:frontend`).
5. Garantir servidor: `npm run serve:ssr:frontend` expõe :4000.
6. Gerar/atualizar baseline de screenshots se novas superfícies visuais (se não existir, primeiro gerar com `--update-snapshots`).
7. Abrir PR descrevendo micro-tarefas cobertas.
8. Se workflows não rodarem (fork), solicitar ao mantenedor “Approve and run workflows”.

## Micro-tarefas (Resumo)
A1–A3: Orquestrador de scroll (GSAP/ScrollTrigger), progresso global/seções, velocity, prefers-reduced-motion fallback.  
B1–B3: Estrutura DOM seções, timelines por ato, pin/snap (#hero, #trabalhos).  
C1–C2: Propagar progresso/velocity ao componente de partículas (sem alterar física).  
D1–D5: Narrativa 5 atos (tipografia, sequências, ring, parallax, CTA).  
E1–E2: Modulação por velocity (magnetismo suave), debounce em repouso.  
F1–F2: Guardas SSR (acesso a window/document apenas em browser; fora da zona Angular nas animações).  
G1–G3: Testes E2E e visuais (baseline, atos, cenário motion-reduced).  
H1: Auditoria Gemini no PR (Sumário, Achados Críticos, Melhorias Rápidas, Sugestões).  
I1: Ring com ganho não linear (p.ex. ease custom em torno de 0.5).  
J1: Polimento (sem jank perceptível; observar CLS/LCP básicos via auditoria).

## Boas Práticas Técnicas
- Timelines com `ease: 'none'` para trechos scrubbables.
- Snap suave: tolerância configurada evitando jitter.
- Velocity: só aplicar ganhos ao aproximar-se de pontos de snap; evitar overshoot.
- Preferir `requestAnimationFrame` fora da zona Angular (`ngZone.runOutsideAngular`) para animações.
- Proteger APIs do browser: checar `isPlatformBrowser`.
- Atualizações de estado via RxJS (Subjects/BehaviorSubjects) com teardown claro.

## Scripts Esperados
- `build:ssr:frontend` → Gera browser + server bundles.
- `serve:ssr:frontend` → `node dist/frontend/server/server.mjs`.
- (Se necessário) `dev:ssr:frontend` para uso local combinado (opcional).

## Testes Playwright
- Agrupar por ato.
- Cada ato: pelo menos 1 screenshot de estado inicial coerente.
- Cenário extra com `prefers-reduced-motion` (usar contexto com emulação).
- Usar thresholds estritos; se flake, avaliar estabilidade (não afrouxar sem justificativa).

## Mensagens de Commit
- `feat(scroll): ...`
- `feat(ssr): ...`
- `fix(animation): ...`
- `test(e2e): ...`
- `chore(audit): ...`
- `refactor(core): ...`

## Quando Pedir Ajuda
- Falta bundle SSR: revisar configuração Angular server builder.
- Falha Playwright por baseline inexistente: gerar baseline.
- Gemini ausente: confirmar secret.
- Jank visível: investigar heavy reflows/layout thrashing (usar DevTools Performance local).

## Critérios de Aceite de PR
- SSR funcional em :4000.
- Timelines reversíveis.
- Fallback motion-reduced correto.
- Partículas reativas a progresso/velocity.
- Testes E2E/visuais verdes.
- Auditoria Gemini comentada (quando secret disponível).
