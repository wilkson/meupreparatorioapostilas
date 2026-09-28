/** Quiz content and diagnosis logic for the Meu Preparatório funnel. */

export type Subject = "portugues" | "matematica" | "informatica";
export type SubjectStatus = "atencao" | "revisar" | "boa";

export interface QuizOption {
  readonly label: string;
  /** Weight 0 (strong) → 3 (needs attention). */
  readonly weight: number;
}

export interface QuizQuestionData {
  readonly id: string;
  readonly question: string;
  readonly options: readonly QuizOption[];
}

export const QUESTIONS: readonly QuizQuestionData[] = [
  {
    id: "p1",
    question: "Como você avalia hoje sua preparação para concursos?",
    options: [
      { label: "Estou começando agora", weight: 3 },
      { label: "Já estudo, mas sem muita organização", weight: 2 },
      { label: "Estudo com frequência", weight: 1 },
      { label: "Já me sinto bem preparado(a)", weight: 0 },
    ],
  },
  {
    id: "p2",
    question: "Quando você começa a estudar para um concurso, como decide o que estudar primeiro?",
    options: [
      { label: "Vou estudando o que acho mais importante", weight: 2 },
      { label: "Procuro conteúdos na internet", weight: 2 },
      { label: "Sigo uma ordem de estudos", weight: 0 },
      { label: "Ainda não tenho uma estratégia definida", weight: 3 },
    ],
  },
  {
    id: "p3",
    question: "Em Língua Portuguesa, qual situação mais representa sua dificuldade?",
    options: [
      { label: "Interpretação de textos", weight: 2 },
      { label: "Gramática", weight: 2 },
      { label: "Ortografia e pontuação", weight: 1 },
      { label: "Tenho dificuldade em vários assuntos", weight: 3 },
    ],
  },
  {
    id: "p4",
    question: "Quais assuntos de Matemática mais costumam te travar?",
    options: [
      { label: "Porcentagem e regra de três", weight: 2 },
      { label: "Razão, proporção e problemas", weight: 2 },
      { label: "Operações e cálculos", weight: 1 },
      { label: "Tenho dificuldade em vários assuntos", weight: 3 },
    ],
  },
  {
    id: "p5",
    question: "Qual é o seu nível de conhecimento em Informática?",
    options: [
      { label: "Tenho muita dificuldade", weight: 3 },
      { label: "Sei o básico, mas preciso revisar", weight: 2 },
      { label: "Tenho um conhecimento razoável", weight: 1 },
      { label: "Me sinto preparado(a)", weight: 0 },
    ],
  },
  {
    id: "p6",
    question: "Você costuma estudar todos os dias?",
    options: [
      { label: "Sim, todos os dias", weight: 0 },
      { label: "Quase todos os dias", weight: 1 },
      { label: "Alguns dias da semana", weight: 2 },
      { label: "Estudo quando consigo", weight: 3 },
    ],
  },
  {
    id: "p7",
    question:
      "Se você tivesse um material organizado para revisar as matérias básicas, o que seria mais importante para você?",
    options: [
      { label: "Conteúdo direto e fácil de entender", weight: 0 },
      { label: "Resumo dos principais assuntos", weight: 0 },
      { label: "Material para revisar rapidamente", weight: 0 },
      { label: "Exercícios para praticar", weight: 0 },
      { label: "Ter tudo organizado em um só lugar", weight: 0 },
    ],
  },
];

/** answers[i] = selected option index for question i (or undefined). */
export type Answers = ReadonlyArray<number | undefined>;

const weightOf = (answers: Answers, q: number): number => {
  const idx = answers[q];
  if (idx === undefined) return 2;
  return QUESTIONS[q]?.options[idx]?.weight ?? 2;
};

/**
 * Subject score = 70% subject-specific answer + 30% general habits (P1, P2, P6).
 * Higher score → more attention needed.
 */
export function computeDiagnosis(answers: Answers): Record<Subject, SubjectStatus> {
  const general = (weightOf(answers, 0) + weightOf(answers, 1) + weightOf(answers, 5)) / 3;
  const toStatus = (specific: number): SubjectStatus => {
    const score = specific * 0.7 + general * 0.3;
    if (score >= 2.2) return "atencao";
    if (score >= 1.2) return "revisar";
    return "boa";
  };
  return {
    portugues: toStatus(weightOf(answers, 2)),
    matematica: toStatus(weightOf(answers, 3)),
    informatica: toStatus(weightOf(answers, 4)),
  };
}

export const STATUS_LABEL: Record<SubjectStatus, string> = {
  atencao: "Precisa de atenção",
  revisar: "Vale revisar",
  boa: "Boa base",
};

/** Checkout do pacote de apostilas (site principal — Pagar.me PIX/cartão). */
export const CHECKOUT_BASE_URL = "https://www.meupreparatorio.com.br/checkout-apostila";
