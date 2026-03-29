import { EMPTY_MEETING } from "./constants";
import { sanitizeMeetingMonth, sanitizeMeetingYear } from "./utils";
import type {
  MeetingCategory,
  MeetingType,
  ProcessedImage,
  UploadMode,
} from "./types";

export default function StepTwoMeeting({
  uploadMode,
  sourceFiles,
  processedImages,
  isProcessing,
  statusText,
  errorText,
  meetingInfo,
  meetingCategory,
  isMeetingConfigComplete,
  onReset,
  onMeetingCategoryChange,
  onMeetingInfoChange,
  onMeetingDateChange,
  onNext,
}: {
  uploadMode: UploadMode;
  sourceFiles: File[];
  processedImages: ProcessedImage[];
  isProcessing: boolean;
  statusText: string;
  errorText: string;
  meetingInfo: MeetingType;
  meetingCategory: MeetingCategory;
  isMeetingConfigComplete: boolean;
  onReset: () => void;
  onMeetingCategoryChange: (value: MeetingCategory) => void;
  onMeetingInfoChange: (field: keyof MeetingType, value: string | string[]) => void;
  onMeetingDateChange: (field: keyof MeetingType["date"], value: number) => void;
  onNext: () => void;
}) {
  return (
    <section className="mt-6 space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                변환된 이미지
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                한눈에 비교할 수 있도록 작은 멀티플로 정리했습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
            >
              다시 업로드
            </button>
          </div>

          {isProcessing ? (
            <div className="mt-5 flex items-center gap-3 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin fill-none stroke-current stroke-2"
                >
                  <path
                    d="M21 12a9 9 0 1 1-2.64-6.36"
                    className="opacity-30"
                  />
                  <path d="M21 3v6h-6" />
                </svg>
              </span>
              <p className="leading-6">
                {statusText || "이미지를 준비하는 중입니다. 잠시만 기다려주세요."}
              </p>
            </div>
          ) : null}

          {!isProcessing && processedImages.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-stone-600">
              아직 생성된 PNG가 없습니다.
            </p>
          ) : null}

          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {processedImages.map((image, index) => (
              <li
                key={image.id}
                className="overflow-hidden rounded-[1.1rem] border border-stone-200 bg-stone-50"
              >
                <div className="relative aspect-video overflow-hidden bg-white">
                  <span className="absolute left-2 top-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white shadow-md">
                    {index + 1}
                  </span>
                  <img
                    src={image.url}
                    alt={`${index + 1}번째 페이지 미리보기`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-0.5 px-3 py-1.5 text-[11px] text-stone-600">
                  <p
                    className="truncate font-medium text-slate-900"
                    title={image.file.name}
                  >
                    {image.file.name}
                  </p>
                  <p>{Math.max(1, Math.round(image.file.size / 1024))} KB</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
            정기모임 설정
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            모임 메타데이터를 먼저 정리합니다.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                모임 유형 <span className="text-rose-500">*</span>
              </span>
              <select
                value={meetingCategory}
                onChange={(event) =>
                  onMeetingCategoryChange(event.target.value as MeetingCategory)
                }
                className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              >
                <option value="정기모임">정기모임</option>
                <option value="OT">OT</option>
                <option value="미니정모">미니정모</option>
                <option value="대이동">대이동</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                생성된 ID <span className="text-rose-500">*</span>
              </span>
              <div className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-100 px-4 py-3 text-base font-medium text-slate-900">
                {meetingInfo.id}
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                모임 이름 <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                value={meetingInfo.title}
                onChange={(event) =>
                  onMeetingInfoChange("title", event.target.value)
                }
                placeholder="추러스에 관하여"
                className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                부제
              </span>
              <input
                type="text"
                value={meetingInfo.subtitle ?? ""}
                onChange={(event) =>
                  onMeetingInfoChange("subtitle", event.target.value)
                }
                placeholder={`예: ${meetingInfo.date.year}년 ${meetingInfo.date.month}월 정기모임`}
                className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                연도 <span className="text-rose-500">*</span>
              </span>
              <input
                type="number"
                min={2000}
                max={2100}
                value={meetingInfo.date.year}
                onChange={(event) =>
                  onMeetingDateChange(
                    "year",
                    sanitizeMeetingYear(
                      Number(event.target.value) || EMPTY_MEETING.date.year
                    )
                  )
                }
                className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                월 <span className="text-rose-500">*</span>
              </span>
              <input
                type="number"
                min={1}
                max={12}
                value={meetingInfo.date.month}
                onChange={(event) =>
                  onMeetingDateChange(
                    "month",
                    sanitizeMeetingMonth(
                      Number(event.target.value) || EMPTY_MEETING.date.month
                    )
                  )
                }
                className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <button
              type="button"
              onClick={onNext}
              disabled={
                isProcessing ||
                processedImages.length === 0 ||
                !isMeetingConfigComplete
              }
              className="inline-flex items-center justify-center rounded-[1.25rem] bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              다음 단계로
            </button>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.5rem] border border-stone-200 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              업로드 방식
              <span className="ml-2 font-semibold text-slate-900">
                {uploadMode === "pdf" ? "PDF 한 개" : "PNG 여러 장"}
              </span>
            </span>
            <span className="hidden text-stone-300 sm:inline">•</span>
            <span>
              원본 파일
              <span className="ml-2 font-semibold text-slate-900">
                {sourceFiles.length}
              </span>
            </span>
            <span className="hidden text-stone-300 sm:inline">•</span>
            <span>
              생성된 PNG
              <span className="ml-2 font-semibold text-slate-900">
                {processedImages.length}
              </span>
            </span>
          </div>

          {statusText !== "" ? (
            <p className="text-sm text-sky-900">{statusText}</p>
          ) : null}
        </div>

        {errorText !== "" ? (
          <div className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {errorText}
          </div>
        ) : null}
      </section>
    </section>
  );
}
