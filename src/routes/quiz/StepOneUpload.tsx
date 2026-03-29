import type { UploadMode } from "./types";
import UploadCard from "./UploadCard";

export default function StepOneUpload({
  pdfInputId,
  pngInputId,
  onSelect,
}: {
  pdfInputId: string;
  pngInputId: string;
  onSelect: (mode: UploadMode, files: File[]) => void;
}) {
  return (
    <section className="mt-6 space-y-4">
      <UploadCard
        id={pdfInputId}
        title="PDF 파일 업로드"
        description="문제집이나 정리본이 하나의 PDF로 준비되어 있다면 이 방식으로 바로 시작할 수 있습니다."
        accept="application/pdf"
        multiple={false}
        buttonLabel="PDF 바로 업로드"
        variant="primary"
        onSelect={(files) => {
          void onSelect("pdf", files);
        }}
      />

      <div className="flex flex-col items-start gap-2 px-1 py-2">
        <p className="text-sm text-stone-600">
          PDF가 아니라 이미 페이지별 이미지가 준비되어 있다면 PNG 여러 장으로도
          시작할 수 있습니다.
        </p>
        <label
          htmlFor={pngInputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-slate-900"
        >
          <input
            id={pngInputId}
            type="file"
            accept="image/png"
            multiple
            className="sr-only"
            onChange={(event) => {
              void onSelect("png", Array.from(event.target.files ?? []));
              event.currentTarget.value = "";
            }}
          />
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4 fill-none stroke-current stroke-2"
            >
              <path d="M12 5v10" />
              <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
              <path d="M6 19h12" />
            </svg>
          </span>
          <span>PNG 파일 여러 장 업로드</span>
        </label>
      </div>
    </section>
  );
}
