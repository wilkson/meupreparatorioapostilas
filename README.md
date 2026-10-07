# Meu Preparatório

Landing page de funil (quiz de diagnóstico) para venda de apostilas de preparação para concursos públicos — Português, Matemática e Informática.

O visitante informa o nome, responde 7 perguntas, recebe um diagnóstico por matéria e é levado à oferta do pacote de apostilas.

## Stack

- TanStack Start (SSR) + React 19 + TypeScript
- Vite 7, Tailwind CSS 4, shadcn/ui, lucide-react
- Bun como gerenciador de pacotes

## Desenvolvimento

```sh
bun install
bun run dev
```

## Build de produção

```sh
bun run build
bun run preview
```

## Estrutura

- `src/routes/` — rotas file-based: `index.tsx` concentra o funil completo
- `src/components/quiz/` — telas do quiz e primitivos visuais
- `src/lib/quiz-data.ts` — perguntas, pesos e lógica de diagnóstico
- `src/lib/tracking.ts` — eventos de funil (GTM/GA4/Meta Pixel, quando presentes)

## Analytics do funil (`/admin`)

Cada etapa do quiz gera um evento first-party gravado no servidor (arquivo
`events.jsonl` em `DATA_DIR`, default `/data` no Docker) — nada depende de
pixel externo. Abra `/admin` para ver o funil completo: entradas, onde os
alunos abandonam (por pergunta), cadastros, quem terminou, quem clicou no
checkout, origem por UTM e a lista de leads.

Configuração:

1. Defina a env `ADMIN_TOKEN` (senha de acesso ao `/admin`).
2. Monte um volume em `/data` para os eventos sobreviverem a redeploys:

   ```bash
   docker run -e ADMIN_TOKEN=um-segredo-forte -v mp-quiz-data:/data -p 3000:3000 <imagem>
   ```

Os eventos da Meta (pixel) continuam disparando exatamente como antes; o
dashboard é uma camada adicional, com dados próprios e em tempo quase real
(auto-refresh de 30s).
