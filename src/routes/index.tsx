import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApostilaOffer, DiagnosisResult, NameStep, Opening, ProcessingScreen, QuizQuestion } from "@/components/quiz/Screens";
import { QUESTIONS, computeDiagnosis, type Answers } from "@/lib/quiz-data";
import { track, trackMeta } from "@/lib/tracking";
import { captureUtms } from "@/lib/utm";

const TITLE = "Quiz de Preparação para Concursos | Meu Preparatório";
const DESC =
  "Descubra em menos de 2 minutos como está sua base em Português, Matemática e Informática para concursos públicos.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPage,
});

type Stage = { kind: "opening" } | { kind: "name" } | { kind: "question"; index: number } | { kind: "processing" } | { kind: "result" };

const STORAGE_KEY = "mp_quiz_answers";

function QuizPage() {
  const [stage, setStage] = useState<Stage>({ kind: "opening" });
  const [answers, setAnswers] = useState<Answers>([]);
  /** Lead name — available through the whole flow for personalization. */
  const [nome_lead, setNomeLead] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const diagnosis = useMemo(() => computeDiagnosis(answers), [answers]);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* storage unavailable */
    }
  }, [answers]);
  useEffect(() => {
    try {
      if (nome_lead) sessionStorage.setItem("nome_lead", nome_lead);
    } catch {
      /* storage unavailable */
    }
  }, [nome_lead]);
  useEffect(() => {
    captureUtms();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (stage.kind === "processing") {
      track("quiz_completed");
      timer.current = window.setTimeout(() => setStage({ kind: "result" }), 2200);
    }
    if (stage.kind === "result") {
      track("result_viewed", { ...diagnosis });
      trackMeta("Lead");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const select = (index: number, option: number) => {
    const next = [...answers];
    next[index] = option;
    setAnswers(next);
    track("quiz_question_answered", { question: index + 1, answer: QUESTIONS[index]?.options[option]?.label ?? "" });
    timer.current = window.setTimeout(() => {
      setStage(index + 1 < QUESTIONS.length ? { kind: "question", index: index + 1 } : { kind: "processing" });
    }, 450);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:py-12">
        {stage.kind === "opening" && (
          <Opening
            onStart={() => {
              track("quiz_started");
              setAnswers([]);
              setStage({ kind: "name" });
            }}
          />
        )}
        {stage.kind === "name" && (
          <NameStep
            initial={nome_lead}
            onBack={() => setStage({ kind: "opening" })}
            onSubmit={(n) => {
              setNomeLead(n);
              trackMeta("CompleteRegistration");
              setStage({ kind: "question", index: 0 });
            }}
          />
        )}
        {stage.kind === "question" && QUESTIONS[stage.index] && (
          <QuizQuestion
            key={stage.index}
            data={QUESTIONS[stage.index]!}
            index={stage.index}
            total={QUESTIONS.length}
            selected={answers[stage.index]}
            onSelect={(o) => select(stage.index, o)}
            onBack={() => {
              window.clearTimeout(timer.current);
              setStage(stage.index === 0 ? { kind: "name" } : { kind: "question", index: stage.index - 1 });
            }}
          />
        )}
        {stage.kind === "processing" && <ProcessingScreen nome={nome_lead} />}
        {stage.kind === "result" && (
          <>
            <DiagnosisResult diagnosis={diagnosis} nome={nome_lead} />
            <ApostilaOffer nome={nome_lead} />
          </>
        )}
      </div>
    </main>
  );
}
