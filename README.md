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
