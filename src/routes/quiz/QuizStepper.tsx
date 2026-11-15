import type { Step } from "./types";

const STEP_ITEMS = [
  { step: 1, title: "업로드", description: "PDF 또는 PNG 선택" },
  { step: 2, title: "설정", description: "PNG 확인 및 모임 정보" },
  { step: 3, title: "썸네일", description: "대표 이미지 구성" },
  { step: 4, title: "이미지 구성", description: "퀴즈와 정답 연결" },
  { step: 5, title: "퀴즈 정보", description: "제목, 창작자, 정답 입력" },
  { step: 6, title: "내보내기", description: "ZIP 다운로드 확인" },
] as const;

export default function QuizStepper({ step }: { step: Step }) {
  const current = STEP_ITEMS[step - 1];
  return (
    <section aria-label="업로드 진행 상황" className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-medium text-stone-500">{step} / {STEP_ITEMS.length} 단계</p><p className="mt-0.5 text-base font-semibold text-slate-900">{current.title} · {current.description}</p></div>
        <span className="text-sm font-semibold text-slate-700">{Math.round((step / STEP_ITEMS.length) * 100)}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={STEP_ITEMS.length}>
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${(step / STEP_ITEMS.length) * 100}%` }} />
      </div>
      <ol className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {STEP_ITEMS.map((item) => (
          <li key={item.step} aria-current={step === item.step ? "step" : undefined} className={`rounded-lg px-2 py-1.5 text-center text-xs font-medium ${step === item.step ? "bg-slate-900 text-white" : step > item.step ? "bg-stone-100 text-slate-700" : "text-stone-400"}`}>
            {item.title}
          </li>
        ))}
      </ol>
    </section>
  );
}
