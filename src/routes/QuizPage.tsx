import { useId, useState } from "react";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";

type UploadMode = "pdf" | "png" | null;

function UploadCard({
  id,
  title,
  description,
  accept,
  multiple,
  buttonLabel,
  onSelect,
}: {
  id: string;
  title: string;
  description: string;
  accept: string;
  multiple: boolean;
  buttonLabel: string;
  onSelect: (files: File[]) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="group block cursor-pointer rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-stone-300"
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onSelect(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
        업로드 방식
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
      <div className="mt-6 inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition group-hover:border-stone-300 group-hover:bg-white">
        {buttonLabel}
      </div>
    </label>
  );
}

export default function QuizPage() {
  const pdfInputId = useId();
  const pngInputId = useId();
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSelect = (mode: UploadMode, files: File[]) => {
    setUploadMode(mode);
    setSelectedFiles(files);
  };

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-stone-200 bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <LinkButton
                path={ROUTES.home}
                className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
              >
                Home
              </LinkButton>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Quiz Builder
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  문제적 추러스 업로드
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                  첫 단계에서는 업로드 방식만 고르면 됩니다. PDF 한 개를 올리거나,
                  PNG 여러 장을 한 번에 올려서 다음 처리 단계로 넘길 수 있도록
                  준비한 입구 화면입니다.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <UploadCard
            id={pdfInputId}
            title="PDF 파일 업로드"
            description="문제집이나 정리본이 하나의 PDF로 준비되어 있다면 이 방식으로 바로 시작할 수 있습니다."
            accept="application/pdf"
            multiple={false}
            buttonLabel="PDF 한 개 선택"
            onSelect={(files) => handleSelect("pdf", files)}
          />
          <UploadCard
            id={pngInputId}
            title="PNG 여러 장 업로드"
            description="문제 이미지가 페이지별 PNG로 나뉘어 있다면 여러 파일을 동시에 선택해 올릴 수 있습니다."
            accept="image/png"
            multiple
            buttonLabel="PNG 여러 장 선택"
            onSelect={(files) => handleSelect("png", files)}
          />
        </section>

        <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                Upload Status
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                현재 선택된 파일
              </h2>
            </div>
            {selectedFiles.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles([]);
                  setUploadMode(null);
                }}
                className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
              >
                선택 초기화
              </button>
            ) : null}
          </div>

          {selectedFiles.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-stone-600">
              아직 업로드된 파일이 없습니다. 위에서 PDF 한 개 또는 PNG 여러 장 중
              하나를 선택하세요.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.5rem] bg-stone-50 px-4 py-3 text-sm text-stone-700">
                업로드 방식
                <span className="ml-2 font-semibold text-slate-900">
                  {uploadMode === "pdf" ? "PDF 한 개" : "PNG 여러 장"}
                </span>
              </div>

              <ul className="grid gap-3">
                {selectedFiles.map((file) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                  >
                    <span className="font-semibold text-slate-900">
                      {file.name}
                    </span>
                    <span className="ml-2 text-stone-500">
                      ({Math.max(1, Math.round(file.size / 1024))} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
