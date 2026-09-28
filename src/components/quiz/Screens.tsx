import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnswerCard, CTAButton, Logo, ProgressBar } from "./Primitives";

import {
  STATUS_LABEL,
  type QuizQuestionData,
  type Subject,
  type SubjectStatus,
} from "@/lib/quiz-data";
import { track, trackMeta } from "@/lib/tracking";
import { buildCheckoutUrl } from "@/lib/utm";
import paginaApostila1 from "@/assets/uploads/3868.png";
import paginaApostila2 from "@/assets/uploads/3869.png";
import paginaApostila3 from "@/assets/uploads/3870.png";
import paginaApostila4 from "@/assets/uploads/3871.png";
import paginaApostila5 from "@/assets/uploads/3872.png";
import paginaApostila6 from "@/assets/uploads/3873.png";
import paginaApostila7 from "@/assets/uploads/3874.png";
import { cn } from "@/lib/utils";

const enter = "animate-in fade-in slide-in-from-bottom-4 duration-500";

export function Opening({ onStart }: { onStart: () => void }) {
  return (
    <div className={cn("flex min-h-[80vh] flex-col items-center justify-center text-center", enter)}>
      <Logo />
      <h1 className="mt-10 font-display text-3xl font-extrabold leading-tight text-brand-dark sm:text-5xl">
        Como está sua preparação para os concursos?
      </h1>
      <p className="mt-5 max-w-lg text-lg text-muted-foreground">
        Responda algumas perguntas rápidas e descubra como está sua base em Português, Matemática e Informática.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-primary">
        <Clock className="h-4 w-4" aria-hidden /> Leva menos de 2 minutos
      </div>
      <CTAButton className="mt-8 max-w-md" onClick={onStart}>COMEÇAR O QUIZ</CTAButton>
    </div>
  );
}

export function QuizQuestion({
  data,
  index,
  total,
  selected,
  onSelect,
  onBack,
}: {
  data: QuizQuestionData;
  index: number;
  total: number;
  selected: number | undefined;
  onSelect: (i: number) => void;
  onBack: () => void;
}) {
  const [locked, setLocked] = useState(false);
  useEffect(() => setLocked(false), [index]);

  return (
    <div key={data.id} className={enter}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
        </button>
        <Logo size="sm" />
      </div>
      <div className="mt-6">
        <ProgressBar current={index + 1} total={total} />
        <p className="mt-3 text-sm font-bold text-primary">Pergunta {index + 1} de {total}</p>
      </div>
      <h2 className="mt-4 font-display text-2xl font-extrabold leading-snug text-brand-dark sm:text-3xl">{data.question}</h2>
      <div className="mt-8 flex flex-col gap-3">
        {data.options.map((opt, i) => (
          <AnswerCard
            key={opt.label}
            label={opt.label}
            selected={selected === i}
            disabled={locked}
            onSelect={() => {
              setLocked(true);
              onSelect(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function NameStep({
  initial,
  onSubmit,
  onBack,
}: {
  initial: string;
  onSubmit: (nome: string) => void;
  onBack: () => void;
}) {
  const [nome, setNome] = useState(initial);
  const [error, setError] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = nome.trim().replace(/\s+/g, " ");
    if (clean.length < 2) return setError(true);
    onSubmit(clean.slice(0, 60));
  };
  return (
    <form onSubmit={submit} className={enter} noValidate>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
        </button>
        <Logo size="sm" />
      </div>
      <label htmlFor="nome_lead" className="mt-10 block font-display text-2xl font-extrabold text-brand-dark sm:text-3xl">
        Qual é o seu nome?
      </label>
      <input
        id="nome_lead"
        name="nome_lead"
        autoFocus
        required
        autoComplete="given-name"
        maxLength={60}
        value={nome}
        onChange={(e) => {
          setNome(e.target.value);
          setError(false);
        }}
        aria-invalid={error}
        aria-describedby={error ? "nome_erro" : undefined}
        placeholder="Digite seu nome"
        className="mt-6 w-full rounded-2xl border-2 border-border bg-card p-5 text-lg font-semibold text-foreground shadow-soft outline-none transition-colors focus:border-primary"
      />
      {error && (
        <p id="nome_erro" className="mt-2 text-sm font-semibold text-cta">
          Informe seu nome para continuar.
        </p>
      )}
      <CTAButton type="submit" className="mt-6">CONTINUAR</CTAButton>
    </form>
  );
}

export function ProcessingScreen({ nome }: { nome: string }) {
  return (
    <div className={cn("flex min-h-[70vh] flex-col items-center justify-center text-center", enter)} role="status">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" aria-hidden />
      <h2 className="mt-8 font-display text-2xl font-extrabold text-brand-dark">Perfeito, {nome}! Analisando suas respostas...</h2>
      <p className="mt-2 text-muted-foreground">Identificando seus principais pontos de atenção...</p>
    </div>
  );
}

const SUBJECT_LABEL: Record<Subject, string> = {
  portugues: "PORTUGUÊS",
  matematica: "MATEMÁTICA",
  informatica: "INFORMÁTICA",
};
const STATUS_STYLE: Record<SubjectStatus, { badge: string; bar: string; w: string }> = {
  atencao: { badge: "bg-cta/10 text-cta", bar: "bg-cta", w: "w-1/3" },
  revisar: { badge: "bg-warning/15 text-warning-foreground", bar: "bg-warning", w: "w-2/3" },
  boa: { badge: "bg-primary/10 text-primary", bar: "bg-primary", w: "w-full" },
};

export function DiagnosisResult({ diagnosis, nome }: { diagnosis: Record<Subject, SubjectStatus>; nome: string }) {
  useEffect(() => track("diagnosis_viewed"), []);

  const focusCopy: Record<Subject, string> = {
    portugues: "Português merece uma atenção especial na sua preparação.",
    matematica: "Matemática aparece como um dos seus principais pontos de atenção.",
    informatica: "Revisar os fundamentos de Informática pode fortalecer sua preparação.",
  };

  const strongestSubject = (Object.keys(diagnosis) as Subject[]).find((subject) => diagnosis[subject] === "atencao");

  return (
    <section className={enter}>
      <div className="text-center">
        <Logo size="sm" />
      </div>
      <h1 className="mt-8 text-center font-display text-3xl font-extrabold text-brand-dark sm:text-4xl">
        {nome}, seu diagnóstico está pronto
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted-foreground">
        Suas respostas mostram como está sua preparação nas principais matérias básicas para concursos.
      </p>
      {strongestSubject && (
        <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-primary">
          Com base nas suas respostas, {focusCopy[strongestSubject].toLowerCase()}
        </p>
      )}
      <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border sm:p-8">
        <p className="text-sm font-extrabold tracking-widest text-primary">SEU FOCO DE PREPARAÇÃO</p>
        <ul className="mt-5 space-y-5">
          {(Object.keys(diagnosis) as Subject[]).map((s) => {
            const st = STATUS_STYLE[diagnosis[s]];
            return (
              <li key={s}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display font-extrabold text-brand-dark">{SUBJECT_LABEL[s]}</span>
                  <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold", st.badge)}>
                    {STATUS_LABEL[diagnosis[s]]}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", st.bar, st.w)} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-6 rounded-3xl bg-secondary p-6 sm:p-8">
        <h2 className="font-display text-xl font-extrabold text-brand-dark">
          Uma base bem organizada facilita muito sua preparação.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Português, Matemática e Informática reúnem conteúdos fundamentais para quem está construindo ou revisando sua
          preparação para concursos.
        </p>
        <p className="mt-3 text-muted-foreground">
          Por isso, reunimos os principais conteúdos dessas três áreas em um único pacote de materiais.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Orientação de estudo baseada exclusivamente nas suas respostas. Este diagnóstico não substitui uma avaliação
          profissional.
        </p>
        <button
          type="button"
          onClick={() => document.getElementById("material")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-6 rounded-full border-2 border-primary px-5 py-3 text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          CONHECER O MATERIAL
        </button>
      </div>
    </section>
  );
}

const ITEMS = [
  "Apostila de Língua Portuguesa",
  "Apostila de Matemática",
  "Apostila de Informática",
  "Conteúdo organizado para estudo",
  "Material para revisão",
  "Questões presentes nos materiais",
] as const;

const CONTENTS: Record<Subject, { title: string; description: string; topics: string[] }> = {
  portugues: {
    title: "📘 LÍNGUA PORTUGUESA",
    description: "Da interpretação de textos à gramática, coesão, coerência, concordância e crase.",
    topics: [
      "Compreensão e interpretação de textos",
      "Funções da linguagem",
      "Gêneros textuais",
      "Coesão e coerência",
      "Classes das palavras",
      "Processos de formação das palavras",
      "Termos integrantes da oração",
      "Adjuntos",
      "Concordância verbal e nominal",
      "Homônimos e parônimos",
      "Sinônimos e antônimos",
      "Polissemia",
      "Crase",
      "Questões de interpretação",
      "Questões de gramática",
    ],
  },
  matematica: {
    title: "📐 MATEMÁTICA",
    description: "Dos fundamentos de conjuntos, razão e proporção até porcentagem, probabilidade, funções, geometria e raciocínio lógico.",
    topics: [
      "Conjuntos",
      "Relações de pertinência e inclusão",
      "Subconjuntos",
      "Operações entre conjuntos",
      "União e interseção",
      "Razão e proporção",
      "Divisão proporcional",
      "Regra de três simples e composta",
      "Porcentagem, aumentos e descontos",
      "Probabilidade",
      "Função do 1º e 2º grau",
      "Geometria plana",
      "Área, perímetro e figuras planas",
      "Circunferência, círculo e triângulos",
      "Raciocínio lógico proposicional",
      "Proposições, conectivos e negação",
      "Equivalências lógicas e tabela-verdade",
      "Questões de concursos",
    ],
  },
  informatica: {
    title: "💻 INFORMÁTICA",
    description: "Internet, redes, navegadores, ferramentas de busca, segurança da informação, malware, criptografia e muito mais.",
    topics: [
      "Internet, intranet e extranet",
      "Redes de computadores e topologias",
      "LAN, MAN, WAN e PAN",
      "Navegadores e ferramentas de busca",
      "URL, HTTP e HTTPS",
      "E-mail, POP3, IMAP e SMTP",
      "FTP, VPN e VoIP",
      "Hardware e dispositivos de rede",
      "Redes sociais",
      "Firewall e segurança da informação",
      "Malware, spyware, trojan, ransomware e rootkit",
      "Criptografia, backup e spam",
      "Confidencialidade, integridade e disponibilidade",
      "Questões de concursos",
    ],
  },
};

const CAROUSEL_IMAGES = [
  { src: paginaApostila1, label: "Página real da apostila (1 de 7)" },
  { src: paginaApostila2, label: "Página real da apostila (2 de 7)" },
  { src: paginaApostila3, label: "Página real da apostila (3 de 7)" },
  { src: paginaApostila4, label: "Página real da apostila (4 de 7)" },
  { src: paginaApostila5, label: "Página real da apostila (5 de 7)" },
  { src: paginaApostila6, label: "Página real da apostila (6 de 7)" },
  { src: paginaApostila7, label: "Página real da apostila (7 de 7)" },
];

function ApostilaCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % CAROUSEL_IMAGES.length), 3000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => {
    setActive((current) => (current + direction + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    track("carousel_interacted");
  };

  return (
    <div
      className="mt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        setPaused(true);
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current !== null) {
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
        }
        touchStart.current = null;
        setPaused(false);
      }}
    >
      <div className="relative mx-auto flex max-w-3xl items-center justify-center overflow-hidden px-10 sm:px-16">
        <button
          type="button"
          aria-label="Imagem anterior"
          onClick={() => move(-1)}
          className="absolute left-1 z-10 grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow-soft ring-1 ring-border"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex w-full justify-center">
          {CAROUSEL_IMAGES.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.label}
              className={cn(
                "max-h-[520px] w-full max-w-sm rounded-2xl object-contain shadow-soft transition-all duration-700",
                index === active ? "scale-100 opacity-100" : "hidden scale-95 opacity-0",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Próxima imagem"
          onClick={() => move(1)}
          className="absolute right-1 z-10 grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow-soft ring-1 ring-border"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {CAROUSEL_IMAGES.map((image, index) => (
          <button
            key={image.src}
            type="button"
            aria-label={`Ver imagem ${index + 1}`}
            onClick={() => {
              setActive(index);
              track("carousel_interacted");
            }}
            className={cn("h-2.5 rounded-full transition-all", index === active ? "w-8 bg-cta" : "w-2.5 bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}

function ContentAccordion({ subject }: { subject: Subject }) {
  const content = CONTENTS[subject];

  return (
    <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border bg-card px-4">
      <AccordionItem value={subject} className="border-0">
        <AccordionTrigger className="font-display text-base font-extrabold text-brand-dark">
          {content.title}
        </AccordionTrigger>
        <AccordionContent>
          <p className="mb-4 text-sm text-muted-foreground">{content.description}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {content.topics.map((topic) => (
              <li key={topic} className="flex gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cta" aria-hidden />
                {topic}
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ValueStack({ checkoutUrl, onCheckout }: { checkoutUrl: string; onCheckout: () => void }) {
  const items = ["Língua Portuguesa", "Matemática", "Informática", "Conteúdo organizado para estudo", "Material para revisão"];

  return (
    <div className="mt-10 rounded-3xl bg-secondary p-6 sm:p-8">
      <h2 className="font-display text-2xl font-extrabold text-brand-dark">Monte seu material completo pagando menos</h2>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between gap-4 border-b border-border pb-3 text-sm">
            <span className="font-semibold">{item}</span>
            <span className="shrink-0 font-bold text-muted-foreground line-through">R$ 29,90</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="font-bold text-muted-foreground">Valor total</span>
        <span className="font-display text-xl font-extrabold text-muted-foreground line-through">R$ 149,50</span>
      </div>
      <div className="mt-6 rounded-2xl bg-card p-5 text-center ring-1 ring-border">
        <p className="text-sm font-extrabold tracking-widest text-primary">PACOTE COMPLETO</p>
        <p className="mt-1 font-display text-4xl font-extrabold text-cta">R$ 37,90</p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">Economize R$ 111,60 · aproximadamente 74% de economia</p>
        <CTAButton
          className="mt-5 animate-pulse bg-success px-5 py-4 text-base text-success-foreground shadow-none hover:brightness-105 focus-visible:ring-success/40"
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onCheckout}
        >
          QUERO O PACOTE COMPLETO
        </CTAButton>
      </div>
    </div>
  );
}

export function ApostilaOffer({ nome }: { nome: string }) {
  useEffect(() => {
    track("product_viewed");
    track("offer_viewed");
  }, []);

  const checkoutUrl = buildCheckoutUrl(nome);
  const checkout = () => {
    track("checkout_clicked");
    trackMeta("InitiateCheckout");
  };

  return (
    <section id="material" className={cn("mt-16", enter)}>
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-widest text-primary">APRESENTAÇÃO DO MATERIAL</p>
        <h2 className="mt-3 font-display text-2xl font-extrabold text-brand-dark sm:text-3xl">
          Seu material básico de preparação, organizado em um só lugar
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Estude e revise Português, Matemática e Informática com materiais organizados para sua preparação.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {(Object.keys(CONTENTS) as Subject[]).map((subject) => (
          <div key={subject} className="rounded-2xl bg-card p-5 text-center shadow-soft ring-1 ring-border">
            <p className="font-display font-extrabold text-brand-dark">{CONTENTS[subject].title}</p>
            <p className="mt-2 text-sm text-muted-foreground">Material para estudar e revisar os fundamentos.</p>
          </div>
        ))}
      </div>


      <div className="mt-14 rounded-3xl bg-secondary p-5 sm:p-8">
        <p className="text-center text-sm font-extrabold tracking-widest text-primary">VEJA O QUE VOCÊ VAI RECEBER</p>
        <h2 className="mt-2 text-center font-display text-xl font-extrabold text-brand-dark">
          Confira algumas páginas reais do material.
        </h2>
        <ApostilaCarousel />
      </div>

      <div className="mt-14">
        <h2 className="text-center font-display text-2xl font-extrabold text-brand-dark">O que você vai estudar</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Conteúdos presentes nos materiais, organizados para facilitar seu estudo e revisão.
        </p>
        <div className="mt-6">
          {(Object.keys(CONTENTS) as Subject[]).map((subject) => (
            <ContentAccordion key={subject} subject={subject} />
          ))}
        </div>
      </div>

      <ValueStack checkoutUrl={checkoutUrl} onCheckout={checkout} />


    </section>
  );
}
