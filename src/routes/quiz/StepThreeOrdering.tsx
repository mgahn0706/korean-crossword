import { useState } from "react";
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
  activeSelectionRow,
  onBack,
  onReset,
  onSelectRow,
  onAppendToActiveRow,
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
  activeSelectionRow: SelectionRow;
  onBack: () => void;
  onReset: () => void;
  onSelectRow: (row: SelectionRow) => void;
  onAppendToActiveRow: (imageId: string) => void;
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
              세 row 모두 같은 방식으로 동작합니다. 위 두 row는 최종 결과이고,
              아래 전체 PNG는 원본 풀입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
            >
              이전 단계로
            </button>
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
                  : activeSelectionRow === rowKey
                    ? "border-slate-900 bg-slate-50"
                    : "border-stone-200 bg-stone-50/60"
              }`}
              onClick={() => {
                if (rowKey !== "all") {
                  onSelectRow(rowKey);
                }
              }}
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
                      ? "현재 선택된 row로 추가하거나, 선택 row로 드래그할 수 있습니다."
                      : activeSelectionRow === rowKey
                        ? "현재 선택된 row입니다. 아래 원본 PNG를 클릭하면 이 row에 추가됩니다."
                        : "이 row를 선택하면 아래 원본 PNG를 이 row로 보낼 수 있습니다."}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                    rowKey === "all"
                      ? "border border-stone-200 bg-white text-slate-700"
                      : activeSelectionRow === rowKey
                        ? "bg-slate-900 text-white"
                        : "border border-stone-200 bg-white text-slate-700"
                  }`}
                >
                  {rowKey === "all"
                    ? `원본 PNG ${processedImages.length}장`
                    : activeSelectionRow === rowKey
                      ? "선택됨"
                      : "클릭해서 선택"}
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
                  <div className="flex gap-2 overflow-x-auto pb-1">
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
                          className="relative shrink-0"
                        >
                          {dragOverRow === rowKey && dragOverTargetId === image.id ? (
                            <div className="absolute -left-1 top-2 bottom-2 z-20 w-1 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(186,230,253,0.9)]" />
                          ) : null}
                          <div
                            draggable={!isRemoved}
                            onClick={() => {
                              if (rowKey === "all" && !isRemoved) {
                                onAppendToActiveRow(image.id);
                              }
                            }}
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
                            className={`w-40 overflow-hidden rounded-[0.9rem] border bg-stone-50 transition ${
                              isRemoved
                                ? "cursor-default border-stone-200"
                                : "cursor-pointer border-stone-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] active:cursor-grabbing"
                            } ${rowKey === "all" ? (isRemoved ? "" : "cursor-copy") : "cursor-grab"} ${
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={quizImageIds.length === 0}
          className="inline-flex items-center justify-center rounded-[1.25rem] bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          메타데이터 편집으로
        </button>
      </div>
    </section>
  );
}
