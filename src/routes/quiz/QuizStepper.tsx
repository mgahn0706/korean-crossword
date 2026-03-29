import type { Step } from "./types";

const STEP_ITEMS = [
  { step: 1, title: "업로드", description: "PDF 또는 PNG 선택" },
  { step: 2, title: "설정", description: "PNG 확인 및 모임 정보" },
  { step: 3, title: "썸네일", description: "대표 이미지 구성" },
  { step: 4, title: "순서", description: "최종 PNG 구성" },
  { step: 5, title: "메타데이터", description: "퀴즈 정보 편집" },
  { step: 6, title: "내보내기", description: "ZIP 다운로드 확인" },
] as const;

export default function QuizStepper({ step }: { step: Step }) {
  return (
    <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:px-6">
      <div className="flex items-start gap-4 sm:items-center">
        {STEP_ITEMS.map((item, index) => (
          <>
            {index > 0 ? (
              <div className="mt-5 h-px flex-1 bg-stone-200 sm:mt-0" />
            ) : null}
            <div
              key={item.step}
              className={`flex items-center gap-3 ${
                step === item.step ? "text-slate-900" : "text-stone-400"
              }`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  step === item.step
                    ? "bg-slate-900 text-white"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-stone-500">{item.description}</p>
              </div>
            </div>
          </>
        ))}
      </div>
    </section>
  );
}
