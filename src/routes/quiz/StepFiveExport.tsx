import type { MeetingType, QuizType } from "./types";

export default function StepFiveExport({
  meetingInfo,
  quizData,
  hasAnswerImages,
  hasThumbnail,
  isExporting,
  exportStatus,
  onBack,
  onDownload,
}: {
  meetingInfo: MeetingType;
  quizData: QuizType[];
  hasAnswerImages: boolean;
  hasThumbnail: boolean;
  isExporting: boolean;
  exportStatus: string;
  onBack: () => void;
  onDownload: () => void;
}) {
  return (
    <section className="mt-5 space-y-4">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
          Export
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          ZIP 다운로드 확인
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          내보내기 시 PNG 이미지들과 `quizData.json`, `meeting.json`이 하나의 ZIP
          파일로 묶입니다.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-slate-900">포함 파일 구조</p>
            <div className="mt-3 rounded-[1rem] bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-slate-100">
              <p>{meetingInfo.id || "meeting-export"}.zip</p>
              {hasThumbnail ? <p className="pl-4">thumbnail.png</p> : null}
              <p className="pl-4">quizImages/</p>
              {quizData.map((quiz) => (
                <div key={quiz.id}>
                  <p className="pl-8">{meetingInfo.id}-{quiz.id}.png</p>
                  {hasAnswerImages ? (
                    <p className="pl-8">{meetingInfo.id}-{quiz.id}-answer.png</p>
                  ) : null}
                </div>
              ))}
              <p className="pl-4">quizData.json</p>
              <p className="pl-4">meeting.json</p>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-slate-900">요약</p>
            <dl className="mt-3 space-y-2 text-sm text-stone-600">
              <div className="flex items-center justify-between gap-3">
                <dt>모임 ID</dt>
                <dd className="font-medium text-slate-900">{meetingInfo.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>문제 수</dt>
                <dd className="font-medium text-slate-900">{quizData.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>정답 이미지</dt>
                <dd className="font-medium text-slate-900">
                  {hasAnswerImages ? "포함" : "없음"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>썸네일</dt>
                <dd className="font-medium text-slate-900">
                  {hasThumbnail ? "포함" : "없음"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onDownload}
                disabled={isExporting || quizData.length === 0}
                className="inline-flex items-center justify-center rounded-[1rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isExporting ? "ZIP 생성 중..." : "ZIP 다운로드"}
              </button>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center rounded-[1rem] border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50"
              >
                메타데이터로 돌아가기
              </button>
            </div>

            <div className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-900">
              이 압축파일을 문제팀 톡방에 공유해주세요!
            </div>

            {exportStatus !== "" ? (
              <p className="mt-3 text-xs text-stone-500">{exportStatus}</p>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
