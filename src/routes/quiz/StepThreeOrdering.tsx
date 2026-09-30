import { useEffect, useState } from "react";
import StepNavigation from "./StepNavigation";
import type {
  DragRow,
  ProcessedImage,
  SelectionRow,
} from "./types";

type RowKey = SelectionRow | "all";

export default function StepThreeOrdering({
  processedImages,
  removedImageIds,
  quizImageIds,
  answerImageIds,
  onBack,
  onReset,
  onAppendToRow,
  onToggleRemovedImage,
  onRemoveFromSelectionRow,
  onDragStart,
  onDragEnd,
  onRowDrop,
  onNext,
}: {
  processedImages: ProcessedImage[];
  removedImageIds: string[];
  quizImageIds: string[];
  answerImageIds: string[];
  onBack: () => void;
  onReset: () => void;
  onAppendToRow: (row: SelectionRow, imageId: string) => void;
  onToggleRemovedImage: (imageId: string) => void;
  onRemoveFromSelectionRow: (row: SelectionRow, imageId: string) => void;
  onDragStart: (imageId: string, row: DragRow) => void;
  onDragEnd: () => void;
  onRowDrop: (row: SelectionRow, targetId: string | null) => void;
  onNext: () => void;
}) {
  const rows: ReadonlyArray<readonly [RowKey, string, string[]]> = [
    ["quiz", "선택된 퀴즈 이미지", quizImageIds],
    ["answer", "선택된 정답 이미지", answerImageIds],
    ["all", "전체 PNG 이미지", processedImages.map((image) => image.id)],
  ];
  const [dragOverRow, setDragOverRow] = useState<SelectionRow | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const previewImage = processedImages.find(
    (image) => image.id === previewImageId
  );

  useEffect(() => {
    if (!previewImageId) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImageId(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewImageId]);

  return (
    <section className="mt-6 space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Final PNG
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              최종 PNG 순서 설정
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              아래 원본 슬라이드를 크게 확인한 뒤 퀴즈 또는 정답으로 바로
              추가하세요. 선택된 슬라이드는 드래그해서 순서를 바꿀 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50"
            >
              처음으로
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {rows.map(([rowKey, rowLabel, rowItems]) => (
            <div
              key={rowKey}
              className={`rounded-[1.5rem] border p-4 transition ${
                dragOverRow === rowKey
                  ? "border-sky-400 bg-sky-50/70"
                  : "border-stone-200 bg-stone-50/60"
              }`}
              onDragEnter={() => {
                if (rowKey !== "all") {
                  setDragOverRow(rowKey);
                  setDragOverTargetId(null);
                }
              }}
              onDragLeave={(event) => {
                if (rowKey === "all") {
                  return;
                }

                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverRow((current) => (current === rowKey ? null : current));
                  setDragOverTargetId(null);
                }
              }}
              onDragOver={(event) => {
                if (rowKey !== "all") {
                  event.preventDefault();
                  setDragOverRow(rowKey);
                }
              }}
              onDrop={(event) => {
                if (rowKey === "all") {
                  return;
                }
                event.preventDefault();
                onRowDrop(rowKey, null);
                setDragOverRow(null);
                setDragOverTargetId(null);
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {rowLabel}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {rowKey === "all"
                      ? "슬라이드를 크게 확인한 뒤 퀴즈 또는 정답 버튼으로 바로 추가하세요."
                      : "드래그해서 순서를 바꾸거나 다른 row로 옮길 수 있습니다."}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                    "border border-stone-200 bg-white text-slate-700"
                  }`}
                >
                  {rowKey === "all"
                    ? `원본 PNG ${processedImages.length}장`
                    : `${rowItems.length}장 선택됨`}
                </div>
              </div>

              <div
                className={`mt-3 min-h-24 rounded-[1.1rem] border border-dashed bg-white px-2 py-2 transition ${
                  dragOverRow === rowKey
                    ? "border-sky-400 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.35)]"
                    : "border-stone-300"
                }`}
              >
                {rowItems.length === 0 ? (
                  <div className="flex h-16 items-center justify-center text-sm text-stone-400">
                    아직 선택된 이미지가 없습니다.
                  </div>
                ) : (
                  <div
                    className={
                      rowKey === "all"
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                        : "flex gap-2 overflow-x-auto pb-1"
                    }
                  >
                    {rowItems.map((imageId, index) => {
                      const image = processedImages.find(
                        (item) => item.id === imageId
                      );

                      if (!image) {
                        return null;
                      }

                      const isRemoved = removedImageIds.includes(image.id);

                      return (
                        <div
                          key={`${rowKey}-${image.id}`}
                          className={rowKey === "all" ? "relative min-w-0" : "relative shrink-0"}
                        >
                          {dragOverRow === rowKey && dragOverTargetId === image.id ? (
                            <div className="absolute -left-1 top-2 bottom-2 z-20 w-1 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(186,230,253,0.9)]" />
                          ) : null}
                          <div
                            draggable={!isRemoved}
                            onClick={() => setPreviewImageId(image.id)}
                            onDragStart={() => {
                              if (isRemoved) {
                                return;
                              }
                              onDragStart(image.id, rowKey);
                            }}
                            onDragEnd={() => {
                              onDragEnd();
                              setDragOverRow(null);
                              setDragOverTargetId(null);
                            }}
                            onDragOver={(event) => {
                              if (rowKey !== "all") {
                                event.preventDefault();
                                setDragOverRow(rowKey);
                                setDragOverTargetId(image.id);
                              }
                            }}
                            onDrop={(event) => {
                              if (rowKey === "all") {
                                return;
                              }
                              event.preventDefault();
                              onRowDrop(rowKey, image.id);
                              setDragOverRow(null);
                              setDragOverTargetId(null);
                            }}
                            className={`${rowKey === "all" ? "w-full" : "w-64 sm:w-72"} overflow-hidden rounded-[0.9rem] border bg-stone-50 transition ${
                              isRemoved
                                ? "cursor-default border-stone-200"
                                : "cursor-pointer border-stone-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] active:cursor-grabbing"
                            } ${rowKey === "all" ? (isRemoved ? "" : "cursor-zoom-in") : "cursor-grab"} ${
                              dragOverRow === rowKey && dragOverTargetId === image.id
                                ? "border-sky-400 shadow-[0_0_0_2px_rgba(125,211,252,0.7)]"
                                : ""
                            }`}
                          >
                            <div
                              className={`relative aspect-video overflow-hidden bg-white ${
                                isRemoved ? "opacity-35" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (rowKey === "all") {
                                    onToggleRemovedImage(image.id);
                                    return;
                                  }
                                  onRemoveFromSelectionRow(rowKey, image.id);
                                }}
                                className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                aria-label={
                                  rowKey === "all"
                                    ? isRemoved
                                      ? "복원"
                                      : "제거"
                                    : "row에서 제거"
                                }
                              >
                                {rowKey === "all" && isRemoved ? "↺" : "×"}
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPreviewImageId(image.id);
                                }}
                                className="absolute bottom-2 right-2 z-10 inline-flex items-center justify-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                                aria-label={`${image.file.name} 크게 보기`}
                              >
                                크게 보기
                              </button>
                              <span className="absolute left-2 top-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-md">
                                {rowKey === "quiz"
                                  ? `${index + 1}번 문제 이미지`
                                  : rowKey === "answer"
                                    ? `${index + 1}번 문제 정답 이미지`
                                    : `${index + 1}번 PNG`}
                              </span>
                              <img
                                src={image.url}
                                alt={`${rowLabel} ${index + 1}`}
                                className="h-full w-full object-contain"
                              />
                            </div>

                            <div
                              className={`px-3 py-2 text-xs text-stone-600 ${
                                isRemoved ? "opacity-45" : ""
                              }`}
                            >
                              <p
                                className="truncate font-medium text-slate-900"
                                title={image.file.name}
                              >
                                {image.file.name}
                              </p>
                              {rowKey === "all" ? (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onAppendToRow("quiz", image.id);
                                    }}
                                    disabled={isRemoved || quizImageIds.includes(image.id)}
                                    className="inline-flex min-h-9 items-center justify-center rounded-[0.75rem] bg-slate-900 px-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
                                  >
                                    {quizImageIds.includes(image.id) ? "퀴즈에 추가됨" : "퀴즈에 추가"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onAppendToRow("answer", image.id);
                                    }}
                                    disabled={isRemoved || answerImageIds.includes(image.id)}
                                    className="inline-flex min-h-9 items-center justify-center rounded-[0.75rem] border border-stone-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                                  >
                                    {answerImageIds.includes(image.id) ? "정답에 추가됨" : "정답에 추가"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        nextLabel="메타데이터 편집으로"
        nextDisabled={quizImageIds.length === 0}
      />

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="슬라이드 크게 보기"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewImageId(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-4 py-3 sm:px-5">
              <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                {previewImage.file.name}
              </p>
              <button
                type="button"
                onClick={() => setPreviewImageId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xl text-slate-700 transition hover:bg-stone-50"
                aria-label="미리보기 닫기"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-stone-100 p-3 sm:p-5">
              <img
                src={previewImage.url}
                alt={`${previewImage.file.name} 크게 보기`}
                className="h-full max-h-[78vh] w-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-stone-200 p-3 sm:ml-auto sm:flex sm:w-auto sm:min-w-[24rem] sm:p-4">
              <button
                type="button"
                onClick={() => onAppendToRow("quiz", previewImage.id)}
                disabled={
                  removedImageIds.includes(previewImage.id) ||
                  quizImageIds.includes(previewImage.id)
                }
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[0.9rem] bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
              >
                {quizImageIds.includes(previewImage.id)
                  ? "퀴즈에 추가됨"
                  : "퀴즈에 추가"}
              </button>
              <button
                type="button"
                onClick={() => onAppendToRow("answer", previewImage.id)}
                disabled={
                  removedImageIds.includes(previewImage.id) ||
                  answerImageIds.includes(previewImage.id)
                }
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[0.9rem] border border-stone-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              >
                {answerImageIds.includes(previewImage.id)
                  ? "정답에 추가됨"
                  : "정답에 추가"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
