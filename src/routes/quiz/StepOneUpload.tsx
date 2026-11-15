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
    <section className="mt-6 grid gap-4 md:grid-cols-2">
      <UploadCard
        id={pdfInputId}
        title="PDF 파일 업로드"
        description="PDF 한 개를 업로드하면 페이지별 PNG로 변환합니다."
        accept="application/pdf"
        multiple={false}
        buttonLabel="PDF 선택"
        variant="secondary"
        onSelect={(files) => {
          void onSelect("pdf", files);
        }}
      />

      <UploadCard
        id={pngInputId}
        title="PNG 파일 업로드"
        description="페이지별 PNG 여러 장을 한 번에 업로드합니다."
        accept="image/png"
        multiple
        buttonLabel="PNG 여러 장 선택"
        variant="secondary"
        onSelect={(files) => { void onSelect("png", files); }}
      />
    </section>
  );
}
