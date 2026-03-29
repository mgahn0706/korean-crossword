import { getChoseong } from "es-hangul";
import { useRef, useState } from "react";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";
import {
  CRYPTIC_2026,
  type CrypticProblem,
} from "./crypticFixtures";

type HighlightSegment = {
  text: string;
  type: "definition" | "wordplay" | "normal";
};

function splitWithHighlights(
  full: string,
  definition: string,
  wordplay: string
) {
  const definitionIndex = full.indexOf(definition);
  const wordplayIndex = full.indexOf(wordplay);

  if (definitionIndex === -1 || wordplayIndex === -1) {
    return [{ text: full, type: "normal" }] satisfies HighlightSegment[];
  }

  const parts = [
    { text: definition, type: "definition" as const, index: definitionIndex },
    { text: wordplay, type: "wordplay" as const, index: wordplayIndex },
  ].sort((left, right) => left.index - right.index);

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const part of parts) {
    if (cursor < part.index) {
      segments.push({
        text: full.slice(cursor, part.index),
        type: "normal",
      });
    }

    segments.push({ text: part.text, type: part.type });
    cursor = part.index + part.text.length;
  }

  if (cursor < full.length) {
    segments.push({ text: full.slice(cursor), type: "normal" });
  }

  return segments;
}

export default function CrypticPage() {
  const [problem, setProblem] = useState<CrypticProblem>({ ...CRYPTIC_2026[0] });
  const [copied, setCopied] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const problemTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const highlightSegments = splitWithHighlights(
    problem.problem,
    problem.definitionPart,
    problem.wordplayPart
  );

  const updateProblem = (field: keyof CrypticProblem, value: string | number) => {
    setProblem((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetProblem = () => {
    setProblem({ ...CRYPTIC_2026[0] });
    setCopied(false);
    setSelectedText("");
  };

  const exportPreview = `{
  week: ${problem.week},
  problem: "${problem.problem}",
  answer: "${problem.answer}",
  definitionPart: "${problem.definitionPart}",
  wordplayPart: "${problem.wordplayPart}",
}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportPreview);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const syncSelectedText = () => {
    const textarea = problemTextareaRef.current;

    if (!textarea) {
      return;
    }

    const nextSelectedText = problem.problem.slice(
      textarea.selectionStart,
      textarea.selectionEnd
    );
    setSelectedText(nextSelectedText);
  };

  const applySelectionToField = (
    field: "definitionPart" | "wordplayPart"
  ) => {
    if (selectedText.trim() === "") {
      return;
    }

    updateProblem(field, selectedText);
  };

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-stone-200 bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <LinkButton
                path={ROUTES.home}
                className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
              >
                Home
              </LinkButton>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Cryptic Builder
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  추러스 크립틱 빌더
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                  플레이 화면이 아니라 단일 fixture 편집 화면입니다. 문제,
                  정답, 정의 구간, 말장난 구간을 직접 수정하면서 바로 미리볼 수
                  있습니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetProblem}
                className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50"
              >
                원본으로 되돌리기
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 space-y-6">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Active Fixture
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    단일 크립틱 fixture 편집
                  </h2>
                </div>
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  정답 길이
                  <span className="ml-2 font-semibold text-slate-900">
                    {problem.answer.length}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      problem
                    </span>
                    <textarea
                      ref={problemTextareaRef}
                      rows={4}
                      value={problem.problem}
                      onChange={(event) =>
                        updateProblem("problem", event.target.value)
                      }
                      onSelect={syncSelectedText}
                      onKeyUp={syncSelectedText}
                      onMouseUp={syncSelectedText}
                      className="w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    />
                  </label>

                  <section className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50/80 px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                          문제 구간 지정
                        </p>
                        <p className="mt-2 text-sm text-stone-600">
                          문제 문장에서 원하는 부분을 드래그한 뒤 정의 또는 말장난으로
                          지정하세요. 이 기능은 정답이 아니라 문제 문장을 기준으로
                          작동합니다.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={selectedText.trim() === ""}
                          onClick={() => applySelectionToField("definitionPart")}
                          className="rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          정의로 지정
                        </button>
                        <button
                          type="button"
                          disabled={selectedText.trim() === ""}
                          onClick={() => applySelectionToField("wordplayPart")}
                          className="rounded-full border border-sky-300 bg-sky-100 px-4 py-2 text-sm font-medium text-sky-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          말장난으로 지정
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.25rem] bg-white px-4 py-3 text-sm text-stone-700">
                      <span className="font-medium text-slate-900">현재 선택:</span>
                      <span className="ml-2">
                        {selectedText.trim() === ""
                          ? "선택된 텍스트가 없습니다."
                          : selectedText}
                      </span>
                    </div>
                  </section>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                        definitionPart
                      </span>
                      <input
                        type="text"
                        value={problem.definitionPart}
                        onChange={(event) =>
                          updateProblem("definitionPart", event.target.value)
                        }
                        className="w-full rounded-[1.25rem] border border-stone-200 bg-amber-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-amber-300 focus:bg-white"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                        wordplayPart
                      </span>
                      <input
                        type="text"
                        value={problem.wordplayPart}
                        onChange={(event) =>
                          updateProblem("wordplayPart", event.target.value)
                        }
                        className="w-full rounded-[1.25rem] border border-stone-200 bg-sky-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      week
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={problem.week}
                      onChange={(event) =>
                        updateProblem("week", Number(event.target.value || 0))
                      }
                      className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      answer
                    </span>
                    <input
                      type="text"
                      value={problem.answer}
                      onChange={(event) =>
                        updateProblem("answer", event.target.value)
                      }
                      className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    />
                  </label>

                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      answer meta
                    </p>
                    <div className="mt-3 space-y-2">
                      <p>
                        초성
                        <span className="ml-2 font-semibold text-slate-900">
                          {getChoseong(problem.answer)}
                        </span>
                      </p>
                      <p>
                        글자 수
                        <span className="ml-2 font-semibold text-slate-900">
                          {problem.answer.length}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  문제 미리보기
                </h2>

                <div className="mt-6 flex flex-wrap gap-2">
                  {Array.from({ length: problem.answer.length }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-xl font-bold text-slate-900"
                      >
                        {problem.answer[index] ?? ""}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-stone-50 px-5 py-4 text-lg leading-8 text-slate-900">
                  {highlightSegments.map((segment, index) => (
                    <span
                      key={`${segment.text}-${index}`}
                      className={
                        segment.type === "definition"
                          ? "rounded px-1 font-medium bg-[#fff3a0]"
                          : segment.type === "wordplay"
                            ? "rounded px-1 font-medium bg-[#dbeafe]"
                            : ""
                      }
                    >
                      {segment.text}
                    </span>
                  ))}
                  <span className="ml-1 text-slate-500">
                    ({problem.answer.length})
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <section className="group rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Export Snippet
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      fixture 조각
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopy();
                      }}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 opacity-0 transition group-hover:opacity-100 hover:border-stone-300 hover:bg-stone-50"
                    >
                      {copied ? "복사됨" : "복사"}
                    </button>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-[1.5rem] bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100">
                    <code>{exportPreview}</code>
                  </pre>
                </section>
              </div>
            </section>
        </section>
      </div>
    </main>
  );
}
