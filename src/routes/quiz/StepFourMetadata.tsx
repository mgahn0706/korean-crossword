import { useState } from "react";
import { QUIZ_TAGS, QUIZ_TAG_KOREAN_NAME } from "./constants";
import { QUIZ_TAG_DESCRIPTION } from "./tagDescriptions";
import type { ProcessedImage, QuizMetadata, Tags } from "./types";
import StepNavigation from "./StepNavigation";

export default function StepFourMetadata({
  totalQuizItems,
  activeQuizIndex,
  quizGroups,
  currentQuizImages,
  currentAnswerImages,
  currentQuizMetadata,
  currentQuizId,
  meetingId,
  currentQuizImageSources,
  onChangeIndex,
  onBack,
  onNext,
  onMetadataChange,
  onToggleTag,
}: {
  totalQuizItems: number;
  activeQuizIndex: number;
  quizGroups: { id: string; imageIds: string[] }[];
  currentQuizImages: ProcessedImage[];
  currentAnswerImages: ProcessedImage[];
  currentQuizMetadata: QuizMetadata;
  currentQuizId: string;
  meetingId: string;
  currentQuizImageSources: string[];
  onChangeIndex: (index: number | ((current: number) => number)) => void;
  onBack: () => void;
  onNext: () => void;
  onMetadataChange: (
    field: keyof QuizMetadata,
    value: string | string[] | Tags[]
  ) => void;
  onToggleTag: (tag: Tags) => void;
}) {
  const [imageSelection, setImageSelection] = useState({ quizIndex: activeQuizIndex, imageIndex: 0 });
  const activeImageIndex = imageSelection.quizIndex === activeQuizIndex ? imageSelection.imageIndex : 0;
  const activeImage = currentQuizImages[activeImageIndex] ?? currentQuizImages[0];
  return (
    <section className="mt-5 space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                퀴즈 이미지
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                퀴즈 미리보기
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((current) => Math.max(0, current - 1))
                }
                disabled={activeQuizIndex === 0}
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
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
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                다음
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-50">
            <div className="border-b border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              {totalQuizItems === 0
                ? "퀴즈 없음"
                : `${activeQuizIndex + 1}번 퀴즈 이미지 (${currentQuizImages.length}장)`}
            </div>
            <div className="bg-white p-2">
              {activeImage ? (
                <div className="aspect-[16/8.5]">
                  <img
                    src={activeImage.url}
                    alt={`${activeQuizIndex + 1}번 퀴즈 ${activeImageIndex + 1}번째 이미지`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-stone-400">
                  퀴즈 이미지가 없습니다.
                </div>
              )}
            </div>
            {currentQuizImages.length > 1 ? (
              <div className="flex flex-wrap gap-2 border-t border-stone-200 bg-white p-2">
                {currentQuizImages.map((image, index) => (
                  <button key={image.id} type="button" onClick={() => setImageSelection({ quizIndex: activeQuizIndex, imageIndex: index })} aria-label={`${index + 1}번째 퀴즈 이미지 보기`} aria-current={activeImageIndex === index ? "true" : undefined} className={`min-w-9 rounded-lg px-3 py-2 text-xs font-semibold ${activeImageIndex === index ? "bg-slate-900 text-white" : "border border-stone-200 bg-white text-slate-700"}`}>{index + 1}</button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3 overflow-hidden rounded-[1rem] border border-stone-200 bg-stone-50">
            <div className="border-b border-stone-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-900">
              {totalQuizItems === 0
                ? "정답 이미지"
                : `${activeQuizIndex + 1}번 문제 정답 이미지 (${currentAnswerImages.length}장)`}
            </div>
            <div className="grid gap-2 bg-white p-2 sm:grid-cols-2">
              {currentAnswerImages.length > 0 ? (
                currentAnswerImages.map((image, index) => (
                  <div key={image.id} className="relative aspect-video rounded-lg border border-stone-200 bg-stone-50">
                    <img src={image.url} alt={`${activeQuizIndex + 1}번 문제 ${index + 1}번째 정답 이미지`} className="h-full w-full object-contain" />
                    <span className="absolute left-2 top-2 rounded bg-slate-900 px-2 py-1 text-xs text-white">{index + 1}/{currentAnswerImages.length}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-stone-400">
                  연결된 정답 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
            퀴즈 정보
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            퀴즈 메타데이터
          </h2>

          <div className="mt-4 space-y-3">
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
                title={currentQuizImageSources.join(", ")}
              >
                이미지
                <span className="ml-1 font-medium text-slate-900">
                  {currentQuizImageSources.join(", ") || "-"}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {quizGroups.map((group, index) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onChangeIndex(index)}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeQuizIndex === index
                      ? "bg-slate-900 text-white"
                      : "border border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {index + 1}번 ({group.imageIds.length}장)
                </button>
              ))}
            </div>

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
                      title={QUIZ_TAG_DESCRIPTION[tag]}
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

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        nextLabel="내보내기 확인"
      />
    </section>
  );
}
