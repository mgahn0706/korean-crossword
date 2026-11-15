import { useEffect, useState } from "react";
import StepNavigation from "./StepNavigation";
import type { ProcessedImage, SelectionRow } from "./types";

type QuizGroup = { id: string; imageIds: string[] };

export default function StepThreeOrdering({
  processedImages, removedImageIds, quizImageIds, quizGroups, answerImageIds,
  onBack, onAppendToRow, onQuizGroupChange, onToggleRemovedImage,
  onRemoveFromSelectionRow, onMoveImage, onMoveQuizGroup, onSetAnswers, onNext,
}: {
  processedImages: ProcessedImage[];
  removedImageIds: string[];
  quizImageIds: string[];
  quizGroups: QuizGroup[];
  answerImageIds: string[][];
  onBack: () => void;
  onAppendToRow: (row: SelectionRow, imageId: string) => void;
  onQuizGroupChange: (imageId: string, groupId: string) => void;
  onToggleRemovedImage: (imageId: string) => void;
  onRemoveFromSelectionRow: (row: SelectionRow, imageId: string) => void;
  onMoveImage: (row: SelectionRow, imageId: string, direction: -1 | 1) => void;
  onMoveQuizGroup: (groupId: string, direction: -1 | 1) => void;
  onSetAnswers: (quizIndex: number, imageIds: string[]) => void;
  onNext: () => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [answerPicker, setAnswerPicker] = useState<{ quizIndex: number; candidateId: string | null; selectedIds: string[] } | null>(null);
  const imageById = new Map(processedImages.map((image) => [image.id, image]));
  const preview = previewId ? imageById.get(previewId) : null;
  const answerCandidates = processedImages.filter((image) => !removedImageIds.includes(image.id));
  const answerCandidate = answerPicker?.candidateId ? imageById.get(answerPicker.candidateId) : null;
  const secondary = "rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-40";

  useEffect(() => {
    if (!previewId && !answerPicker) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewId(null);
        setAnswerPicker(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewId, answerPicker]);

  return (
    <section className="mt-6 space-y-5">
      <header className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">이미지 구성</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">퀴즈와 정답 구성</h2>
        <p className="mt-2 text-sm text-stone-600">원본에서 퀴즈 이미지를 선택하고, 퀴즈마다 정답 이미지를 지정하세요.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">퀴즈 {quizGroups.length}개</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-slate-700">퀴즈 이미지 {quizImageIds.length}장</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-slate-700">정답 이미지 {answerImageIds.reduce((count, images) => count + images.length, 0)}장</span>
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
                <div className="mt-3 border-t border-stone-200 pt-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">정답 이미지 {answerImageIds[groupIndex].length}장 (선택 사항)</p>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setAnswerPicker({ quizIndex: groupIndex, candidateId: answerImageIds[groupIndex][0] ?? answerCandidates[0]?.id ?? null, selectedIds: [...answerImageIds[groupIndex]] })} className={secondary}>{answerImageIds[groupIndex].length ? "정답 이미지 편집" : "정답 이미지 선택"}</button>
                      {answerImageIds[groupIndex].length > 0 ? <button type="button" onClick={() => onSetAnswers(groupIndex, [])} className={secondary}>모두 해제</button> : null}
                    </div>
                  </div>
                  {answerImageIds[groupIndex].length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {answerImageIds[groupIndex].map((imageId, index) => {
                        const image = imageById.get(imageId);
                        if (!image) return null;
                        return <button key={imageId} type="button" onClick={() => setPreviewId(imageId)} className="overflow-hidden rounded-lg border border-stone-200 bg-white text-left hover:border-stone-400" aria-label={`${groupIndex + 1}번 퀴즈 ${index + 1}번째 정답 크게 보기`}><div className="relative aspect-video"><img src={image.url} alt="" className="h-full w-full object-contain" /><span className="absolute left-2 top-2 rounded bg-slate-900 px-2 py-1 text-xs text-white">{index + 1}</span></div><p className="truncate px-2 py-1.5 text-xs text-slate-700" title={image.file.name}>{image.file.name}</p></button>;
                      })}
                    </div>
                  ) : <p className="rounded-lg border border-dashed border-stone-300 bg-white p-3 text-xs text-stone-500">연결된 정답 이미지가 없습니다.</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <StepNavigation onBack={onBack} onNext={onNext} nextLabel="퀴즈 정보 입력" nextDisabled={quizGroups.length === 0} />

      {answerPicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label={`${answerPicker.quizIndex + 1}번 퀴즈 정답 이미지 선택`} onMouseDown={(event) => { if (event.target === event.currentTarget) setAnswerPicker(null); }}>
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 p-4">
              <div><h3 className="text-base font-semibold text-slate-900">{answerPicker.quizIndex + 1}번 퀴즈의 정답 이미지</h3><p className="mt-1 text-xs text-stone-500">이미지를 크게 확인하고 여러 장을 추가하세요. 선택한 순서대로 저장됩니다.</p></div>
              <button type="button" onClick={() => setAnswerPicker(null)} className={secondary}>닫기</button>
            </div>
            <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
              <div className="grid content-start grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {answerCandidates.map((image, index) => (
                  <button key={image.id} type="button" onClick={() => setAnswerPicker({ ...answerPicker, candidateId: image.id })} aria-pressed={answerPicker.candidateId === image.id} className={`overflow-hidden rounded-lg border text-left ${answerPicker.candidateId === image.id ? "border-sky-500 ring-2 ring-sky-200" : "border-stone-200 hover:border-stone-400"}`}>
                    <div className="relative aspect-video bg-stone-50"><img src={image.url} alt="" className="h-full w-full object-contain" /><span className="absolute left-1 top-1 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">{index + 1}</span>{answerPicker.selectedIds.includes(image.id) ? <span className="absolute right-1 top-1 rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">정답 {answerPicker.selectedIds.indexOf(image.id) + 1}</span> : null}</div>
                    <p className="truncate px-2 py-1.5 text-xs text-slate-700" title={image.file.name}>{image.file.name}</p>
                  </button>
                ))}
              </div>
              <div className="flex min-h-48 flex-col overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                {answerCandidate ? <><div className="min-h-0 flex-1 p-2"><img src={answerCandidate.url} alt="정답 후보 크게 보기" className="max-h-[40vh] h-full w-full object-contain" /></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-white px-3 py-2"><p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700" title={answerCandidate.file.name}>{answerCandidate.file.name}</p><button type="button" onClick={() => setAnswerPicker({ ...answerPicker, selectedIds: answerPicker.selectedIds.includes(answerCandidate.id) ? answerPicker.selectedIds.filter((id) => id !== answerCandidate.id) : [...answerPicker.selectedIds, answerCandidate.id] })} className={secondary}>{answerPicker.selectedIds.includes(answerCandidate.id) ? "선택 해제" : "정답에 추가"}</button></div></> : <p className="m-auto text-sm text-stone-500">선택할 이미지가 없습니다.</p>}
              </div>
            </div>
            {answerPicker.selectedIds.length > 0 ? <div className="border-t border-stone-200 px-3 py-2"><p className="mb-2 text-xs font-semibold text-slate-700">선택한 정답 · {answerPicker.selectedIds.length}장</p><div className="flex gap-2 overflow-x-auto pb-1">{answerPicker.selectedIds.map((id, index) => { const image = imageById.get(id); if (!image) return null; return <div key={id} className="flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-1"><img src={image.url} alt="" className="h-10 w-16 object-contain" /><span className="text-xs font-semibold text-slate-700">{index + 1}</span><button type="button" disabled={index === 0} onClick={() => { const next = [...answerPicker.selectedIds]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setAnswerPicker({ ...answerPicker, selectedIds: next }); }} className={secondary} aria-label={`${index + 1}번째 정답 앞으로 이동`}>←</button><button type="button" disabled={index === answerPicker.selectedIds.length - 1} onClick={() => { const next = [...answerPicker.selectedIds]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; setAnswerPicker({ ...answerPicker, selectedIds: next }); }} className={secondary} aria-label={`${index + 1}번째 정답 뒤로 이동`}>→</button><button type="button" onClick={() => setAnswerPicker({ ...answerPicker, selectedIds: answerPicker.selectedIds.filter((item) => item !== id) })} className={secondary} aria-label={`${index + 1}번째 정답 선택 해제`}>×</button></div>; })}</div></div> : null}
            <div className="flex justify-end gap-2 border-t border-stone-200 p-3"><button type="button" onClick={() => setAnswerPicker(null)} className={secondary}>취소</button><button type="button" onClick={() => { onSetAnswers(answerPicker.quizIndex, answerPicker.selectedIds); setAnswerPicker(null); }} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">정답 이미지 {answerPicker.selectedIds.length}장 저장</button></div>
          </div>
        </div>
      ) : null}

      {preview ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label="이미지 크게 보기" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewId(null); }}><div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b border-stone-200 p-3"><span className="min-w-0 truncate text-sm font-medium">{preview.file.name}</span><button type="button" onClick={() => setPreviewId(null)} className={secondary}>닫기</button></div><div className="min-h-0 flex-1 bg-stone-100 p-3"><img src={preview.url} alt={preview.file.name} className="max-h-[75vh] w-full object-contain" /></div><div className="border-t border-stone-200 p-3"><button type="button" disabled={removedImageIds.includes(preview.id) || quizImageIds.includes(preview.id)} onClick={() => onAppendToRow("quiz", preview.id)} className="w-full rounded-lg bg-slate-900 p-2 text-sm font-medium text-white disabled:opacity-40">새 퀴즈로 추가</button></div></div></div> : null}
    </section>
  );
}
