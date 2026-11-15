import type { MeetingType, QuizType } from "./types";
import StepNavigation from "./StepNavigation";

export default function StepFiveExport({
  meetingInfo,
  quizData,
  answerImageIds,
  hasThumbnail,
  isExporting,
  exportStatus,
  onBack,
  onDownload,
}: {
  meetingInfo: MeetingType;
  quizData: QuizType[];
  answerImageIds: (string | null)[];
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
          내보내기
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
              {hasThumbnail ? <p className="pl-4">image/quiz/meeting/{meetingInfo.id}.png</p> : null}
              <p className="pl-4">image/quiz/</p>
              {quizData.map((quiz) => (
                <div key={quiz.id}>
                  {quiz.quizImageSource.map((source) => (
                    <p key={source} className="pl-8">{source.split("/").at(-1)}</p>
                  ))}
                  {answerImageIds[quiz.quizNumber - 1] ? (
                    <p className="pl-8">{quiz.id}-answer.png</p>
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
                  {answerImageIds.filter(Boolean).length}장
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>썸네일</dt>
                <dd className="font-medium text-slate-900">
                  {hasThumbnail ? "포함" : "없음"}
                </dd>
              </div>
            </dl>

            <div className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-900">
              이 압축파일을 문제팀 톡방에 공유해주세요!
            </div>

            {exportStatus !== "" ? (
              <p className="mt-3 text-xs text-stone-500">{exportStatus}</p>
            ) : null}
          </div>
        </div>
      </section>

      <StepNavigation
        onBack={onBack}
        onNext={onDownload}
        nextLabel={isExporting ? "ZIP 생성 중..." : "ZIP 다운로드"}
        nextDisabled={isExporting || quizData.length === 0}
      />
    </section>
  );
}
