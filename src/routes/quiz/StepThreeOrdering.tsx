import { useEffect, useState } from "react";
import StepNavigation from "./StepNavigation";
import type { ProcessedImage, SelectionRow } from "./types";

type QuizGroup = { id: string; imageIds: string[] };

export default function StepThreeOrdering({
  processedImages, removedImageIds, quizImageIds, quizGroups, answerImageIds,
  onBack, onAppendToRow, onQuizGroupChange, onToggleRemovedImage,
  onRemoveFromSelectionRow, onMoveImage, onMoveQuizGroup, onSetAnswer, onNext,
}: {
  processedImages: ProcessedImage[];
  removedImageIds: string[];
  quizImageIds: string[];
  quizGroups: QuizGroup[];
  answerImageIds: (string | null)[];
  onBack: () => void;
  onAppendToRow: (row: SelectionRow, imageId: string) => void;
  onQuizGroupChange: (imageId: string, groupId: string) => void;
  onToggleRemovedImage: (imageId: string) => void;
  onRemoveFromSelectionRow: (row: SelectionRow, imageId: string) => void;
  onMoveImage: (row: SelectionRow, imageId: string, direction: -1 | 1) => void;
  onMoveQuizGroup: (groupId: string, direction: -1 | 1) => void;
  onSetAnswer: (quizIndex: number, imageId: string | null) => void;
  onNext: () => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const imageById = new Map(processedImages.map((image) => [image.id, image]));
  const preview = previewId ? imageById.get(previewId) : null;
  const secondary = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-40";

  useEffect(() => {
    if (!previewId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewId]);

  return (
    <section className="mt-6 space-y-5">
      <header className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">이미지 구성</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">퀴즈와 정답 구성</h2>
        <p className="mt-2 text-sm text-stone-600">원본에서 퀴즈 이미지를 선택하고, 퀴즈마다 정답 이미지를 지정하세요.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">퀴즈 {quizGroups.length}개</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-slate-700">퀴즈 이미지 {quizImageIds.length}장</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-slate-700">정답 이미지 {answerImageIds.filter(Boolean).length}장</span>
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">1. 원본 이미지 선택</h3>
        <p className="mt-1 text-sm text-stone-600">이미지를 누르면 크게 볼 수 있습니다. 정답은 아래의 각 퀴즈 카드에서 선택합니다.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {processedImages.map((image, index) => {
            const excluded = removedImageIds.includes(image.id);
            const inQuiz = quizImageIds.includes(image.id);
            return (
              <article key={image.id} className={`overflow-hidden rounded-xl border border-stone-200 ${excluded ? "bg-stone-100 opacity-60" : "bg-white"}`}>
                <button type="button" onClick={() => setPreviewId(image.id)} className="block w-full bg-stone-50" aria-label={`${index + 1}번째 이미지 크게 보기`}>
                  <div className="relative aspect-video"><img src={image.url} alt="" className="h-full w-full object-contain" /><span className="absolute left-2 top-2 rounded-full bg-slate-900 px-2 py-1 text-xs text-white">{index + 1}</span></div>
                </button>
                <div className="space-y-2 p-3">
                  <p className="truncate text-xs font-medium text-slate-800" title={image.file.name}>{image.file.name}</p>
                  <button type="button" disabled={excluded || inQuiz} onClick={() => onAppendToRow("quiz", image.id)} className="w-full rounded-lg bg-slate-900 p-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500">{inQuiz ? "퀴즈에 추가됨" : "새 퀴즈로 추가"}</button>
                  <button type="button" onClick={() => onToggleRemovedImage(image.id)} className="text-xs text-stone-500 underline underline-offset-2 hover:text-slate-900">{excluded ? "이미지 복원" : "이 이미지 제외"}</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">2. 퀴즈별 이미지</h3>
        <p className="mt-1 text-sm text-stone-600">같은 카드에 있는 이미지는 한 퀴즈입니다. 화살표로 순서를 바꾸고, 여러 장을 합치거나 분리할 수 있습니다.</p>
        {quizGroups.length === 0 ? <p className="mt-4 rounded-xl bg-stone-50 p-5 text-sm text-stone-500">원본에서 새 퀴즈로 추가하세요.</p> : (
          <div className="mt-4 space-y-3">
            {quizGroups.map((group, groupIndex) => (
              <article key={group.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{groupIndex + 1}번 퀴즈</span><span className="text-xs text-stone-500">{group.imageIds.length}장</span></div>
                  <div className="flex gap-1">
                    {groupIndex > 0 ? <button type="button" onClick={() => onQuizGroupChange(group.imageIds[0], quizGroups[groupIndex - 1].id)} className={secondary}>이전 퀴즈에 합치기</button> : null}
                    <button type="button" disabled={groupIndex === 0} onClick={() => onMoveQuizGroup(group.id, -1)} className={secondary} aria-label="퀴즈 앞으로 이동">↑</button>
                    <button type="button" disabled={groupIndex === quizGroups.length - 1} onClick={() => onMoveQuizGroup(group.id, 1)} className={secondary} aria-label="퀴즈 뒤로 이동">↓</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.imageIds.map((imageId, imageIndex) => {
                    const image = imageById.get(imageId);
                    if (!image) return null;
                    return (
                      <div key={imageId} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                        <button type="button" onClick={() => setPreviewId(imageId)} className="block w-full" aria-label="퀴즈 이미지 크게 보기"><div className="relative aspect-video"><img src={image.url} alt="" className="h-full w-full object-contain" /><span className="absolute left-2 top-2 rounded bg-slate-900 px-2 py-1 text-xs text-white">{imageIndex + 1}/{group.imageIds.length}</span></div></button>
                        <div className="flex items-center justify-between gap-2 p-2">
                          <span className="min-w-0 truncate text-xs text-stone-600" title={image.file.name}>{image.file.name}</span>
                          <div className="flex shrink-0 gap-1">
                            {imageIndex > 0 ? <button type="button" onClick={() => onQuizGroupChange(imageId, imageId)} className={secondary}>여기서 분리</button> : null}
                            <button type="button" disabled={imageIndex === 0} onClick={() => onMoveImage("quiz", imageId, -1)} className={secondary} aria-label="이미지 앞으로 이동">←</button>
                            <button type="button" disabled={imageIndex === group.imageIds.length - 1} onClick={() => onMoveImage("quiz", imageId, 1)} className={secondary} aria-label="이미지 뒤로 이동">→</button>
                            <button type="button" onClick={() => onRemoveFromSelectionRow("quiz", imageId)} className={secondary} aria-label="퀴즈에서 제거">×</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <label className="mt-3 block border-t border-stone-200 pt-3 text-xs font-medium text-slate-700">
                  정답 이미지 (선택 사항)
                  <select value={answerImageIds[groupIndex] ?? ""} onChange={(event) => onSetAnswer(groupIndex, event.target.value || null)} className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-900">
                    <option value="">정답 이미지 없음</option>
                    {processedImages.filter((image) => !removedImageIds.includes(image.id)).map((image, index) => <option key={image.id} value={image.id}>{index + 1}. {image.file.name}</option>)}
                  </select>
                </label>
                {answerImageIds[groupIndex] && imageById.get(answerImageIds[groupIndex]!) ? <button type="button" onClick={() => setPreviewId(answerImageIds[groupIndex])} className="mt-2 text-xs font-medium text-sky-700 underline underline-offset-2">선택한 정답 크게 보기</button> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <StepNavigation onBack={onBack} onNext={onNext} nextLabel="퀴즈 정보 입력" nextDisabled={quizGroups.length === 0} />

      {preview ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label="이미지 크게 보기" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewId(null); }}><div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b border-stone-200 p-3"><span className="min-w-0 truncate text-sm font-medium">{preview.file.name}</span><button type="button" onClick={() => setPreviewId(null)} className={secondary}>닫기</button></div><div className="min-h-0 flex-1 bg-stone-100 p-3"><img src={preview.url} alt={preview.file.name} className="max-h-[75vh] w-full object-contain" /></div><div className="border-t border-stone-200 p-3"><button type="button" disabled={removedImageIds.includes(preview.id) || quizImageIds.includes(preview.id)} onClick={() => onAppendToRow("quiz", preview.id)} className="w-full rounded-lg bg-slate-900 p-2 text-sm font-medium text-white disabled:opacity-40">새 퀴즈로 추가</button></div></div></div> : null}
    </section>
  );
}
