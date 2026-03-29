import { QUIZ_TAGS, QUIZ_TAG_KOREAN_NAME } from "./constants";
import type { ProcessedImage, QuizMetadata, Tags } from "./types";

export default function StepFourMetadata({
  totalQuizItems,
  activeQuizIndex,
  quizImageIds,
  currentQuizImage,
  currentAnswerImage,
  currentQuizMetadata,
  currentQuizId,
  meetingId,
  currentQuizImageSource,
  onChangeIndex,
  onBack,
  onNext,
  onMetadataChange,
  onToggleTag,
}: {
  totalQuizItems: number;
  activeQuizIndex: number;
  quizImageIds: string[];
  currentQuizImage: ProcessedImage | null;
  currentAnswerImage: ProcessedImage | null;
  currentQuizMetadata: QuizMetadata;
  currentQuizId: string;
  meetingId: string;
  currentQuizImageSource: string;
  onChangeIndex: (index: number | ((current: number) => number)) => void;
  onBack: () => void;
  onNext: () => void;
  onMetadataChange: (
    field: keyof QuizMetadata,
    value: string | string[] | Tags[]
  ) => void;
  onToggleTag: (tag: Tags) => void;
}) {
  return (
    <section className="mt-5 space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="hidden xl:block">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((current) => Math.max(0, current - 1))
                }
                disabled={activeQuizIndex === 0}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white/96 text-2xl text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((current) =>
                    Math.min(totalQuizItems - 1, current + 1)
                  )
                }
                disabled={
                  totalQuizItems === 0 || activeQuizIndex >= totalQuizItems - 1
                }
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white/96 text-2xl text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                ›
              </button>
            </div>
          </div>

          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Quiz Preview
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              퀴즈 미리보기
            </h2>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-50">
            <div className="border-b border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              {totalQuizItems === 0
                ? "퀴즈 없음"
                : `${activeQuizIndex + 1}번 퀴즈 이미지`}
            </div>
            <div className="aspect-[16/8.5] bg-white">
              {currentQuizImage ? (
                <img
                  src={currentQuizImage.url}
                  alt={`${activeQuizIndex + 1}번 퀴즈 이미지`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-stone-400">
                  퀴즈 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-[1.15rem] border border-stone-200 bg-stone-50">
            <div className="border-b border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              {totalQuizItems === 0
                ? "정답 이미지"
                : `${activeQuizIndex + 1}번 문제 정답 이미지`}
            </div>
            <div className="aspect-[16/4.75] bg-white">
              {currentAnswerImage ? (
                <img
                  src={currentAnswerImage.url}
                  alt={`${activeQuizIndex + 1}번 문제 정답 이미지`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-stone-400">
                  연결된 정답 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-3 xl:hidden">
            <button
              type="button"
              onClick={() =>
                onChangeIndex((current) => Math.max(0, current - 1))
              }
              disabled={activeQuizIndex === 0}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-stone-200 bg-white text-base font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeIndex((current) =>
                  Math.min(totalQuizItems - 1, current + 1)
                )
              }
              disabled={
                totalQuizItems === 0 || activeQuizIndex >= totalQuizItems - 1
              }
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-stone-200 bg-white text-base font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
            >
              다음
            </button>
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
            Quiz Metadata
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            퀴즈 메타데이터
          </h2>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                제목
              </span>
              <input
                type="text"
                value={currentQuizMetadata.title}
                onChange={(event) =>
                    onMetadataChange("title", event.target.value)
                }
                placeholder={`${activeQuizIndex + 1}번 퀴즈 제목`}
                className="w-full rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                창작자
              </span>
              <input
                type="text"
                value={currentQuizMetadata.creators.join(", ")}
                onChange={(event) =>
                  onMetadataChange(
                    "creators",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="예: 민수, 지연, 수빈"
                className="w-full rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                쉼표로 구분해서 여러 명을 입력합니다.
              </p>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                정답
              </span>
              <textarea
                rows={3}
                value={currentQuizMetadata.answer}
                onChange={(event) =>
                  onMetadataChange("answer", event.target.value)
                }
                placeholder="정답이 없다면 비워둘 수 있습니다."
                className="w-full rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <div className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                태그
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUIZ_TAGS.map((tag) => {
                  const isSelected = currentQuizMetadata.tags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-stone-200 bg-stone-50 text-slate-700 hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      {QUIZ_TAG_KOREAN_NAME[tag]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.35rem] border border-stone-200 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((current) => Math.max(0, current - 1))
                }
                disabled={activeQuizIndex === 0}
                className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                이전 문제
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((current) =>
                    Math.min(totalQuizItems - 1, current + 1)
                  )
                }
                disabled={
                  totalQuizItems === 0 || activeQuizIndex >= totalQuizItems - 1
                }
                className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                다음 문제
              </button>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
            >
              순서 설정으로 돌아가기
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              내보내기 확인
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
            <span>
              퀴즈 ID
              <span className="ml-1 font-medium text-slate-900">
                {currentQuizId || "-"}
              </span>
            </span>
            <span className="hidden text-stone-300 sm:inline">•</span>
            <span>
              모임 ID
              <span className="ml-1 font-medium text-slate-900">
                {meetingId || "-"}
              </span>
            </span>
            <span className="hidden text-stone-300 sm:inline">•</span>
            <span>
              문제 번호
              <span className="ml-1 font-medium text-slate-900">
                {totalQuizItems === 0 ? "-" : activeQuizIndex + 1}
              </span>
            </span>
            <span className="hidden text-stone-300 sm:inline">•</span>
            <span
              className="max-w-full truncate"
              title={currentQuizImageSource}
            >
              이미지
              <span className="ml-1 font-medium text-slate-900">
                {currentQuizImageSource || "-"}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quizImageIds.map((imageId, index) => (
              <button
                key={imageId}
                type="button"
                onClick={() => onChangeIndex(index)}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeQuizIndex === index
                    ? "bg-slate-900 text-white"
                    : "border border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {index + 1}번
              </button>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
