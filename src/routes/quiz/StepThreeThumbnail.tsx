import { useId } from "react";
import type { ProcessedImage, ThumbnailAsset } from "./types";
import { sampleImageColorAt } from "./utils";

export default function StepThreeThumbnail({
  processedImages,
  backgroundColor,
  dominantColors,
  centerImage,
  onBack,
  onNext,
  onBackgroundColorChange,
  onCenterImageSelect,
}: {
  processedImages: ProcessedImage[];
  backgroundColor: string;
  dominantColors: string[];
  centerImage: ThumbnailAsset | null;
  onBack: () => void;
  onNext: () => void;
  onBackgroundColorChange: (value: string) => void;
  onCenterImageSelect: (file: File) => void;
}) {
  const imageInputId = useId();

  return (
    <section className="mt-6 space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                Thumbnail
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                썸네일 빌더
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              가운데 이미지 + 배경색만 설정합니다.
            </p>
          </div>

          <div
            className="mt-4 overflow-hidden rounded-[1.5rem] border border-stone-200"
            style={{ backgroundColor }}
          >
            <div className="aspect-video flex items-center justify-center p-6">
              {centerImage ? (
                <img
                  src={centerImage.url}
                  alt="썸네일 가운데 이미지"
                  className="max-h-[500px] max-w-[500px] object-contain drop-shadow-[0_18px_32px_rgba(15,23,42,0.2)]"
                />
              ) : (
                <div className="rounded-full border border-white/60 bg-white/40 px-4 py-2 text-sm font-medium text-slate-800 backdrop-blur-sm">
                  가운데 이미지를 업로드하거나 붙여넣기 하세요
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                배경색
              </span>
              <div className="flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-stone-50 px-3 py-2.5">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) =>
                    onBackgroundColorChange(event.target.value)
                  }
                  className="h-10 w-12 cursor-pointer rounded-md border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(event) =>
                    onBackgroundColorChange(event.target.value)
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                많이 쓰인 색
              </span>
              <div className="flex flex-wrap gap-2">
                {dominantColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onBackgroundColorChange(color)}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-2 py-2 text-xs font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                PNG에서 직접 색상 선택
              </span>
              <div className="grid grid-cols-2 gap-2">
                {processedImages.slice(0, 6).map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={async (event) => {
                      const rect =
                        event.currentTarget.getBoundingClientRect();
                      const imageElement =
                        event.currentTarget.querySelector("img");

                      if (!imageElement) {
                        return;
                      }

                      const naturalWidth = imageElement.naturalWidth;
                      const naturalHeight = imageElement.naturalHeight;
                      const containerWidth = rect.width;
                      const containerHeight = rect.height;
                      const scale = Math.min(
                        containerWidth / naturalWidth,
                        containerHeight / naturalHeight
                      );
                      const renderedWidth = naturalWidth * scale;
                      const renderedHeight = naturalHeight * scale;
                      const offsetX = (containerWidth - renderedWidth) / 2;
                      const offsetY = (containerHeight - renderedHeight) / 2;
                      const clickX = event.clientX - rect.left;
                      const clickY = event.clientY - rect.top;

                      if (
                        clickX < offsetX ||
                        clickY < offsetY ||
                        clickX > offsetX + renderedWidth ||
                        clickY > offsetY + renderedHeight
                      ) {
                        return;
                      }

                      const imageX = Math.max(
                        0,
                        Math.min(
                          naturalWidth - 1,
                          Math.round(((clickX - offsetX) / renderedWidth) * naturalWidth)
                        )
                      );
                      const imageY = Math.max(
                        0,
                        Math.min(
                          naturalHeight - 1,
                          Math.round(
                            ((clickY - offsetY) / renderedHeight) * naturalHeight
                          )
                        )
                      );

                      const nextColor = await sampleImageColorAt({
                        url: image.url,
                        x: imageX,
                        y: imageY,
                      });
                      onBackgroundColorChange(nextColor);
                    }}
                    className="overflow-hidden rounded-[1rem] border border-stone-200 bg-stone-50 text-left transition hover:border-stone-300 hover:bg-white"
                  >
                    <div className="relative aspect-video bg-white">
                      <img
                        src={image.url}
                        alt={`${index + 1}번째 PNG`}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white">
                        클릭해서 색 추출
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                가운데 이미지
              </span>
              <label
                htmlFor={imageInputId}
                className="flex cursor-pointer items-center justify-center rounded-[1rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-center text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:bg-white"
              >
                로컬 이미지 업로드
                <input
                  id={imageInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onCenterImageSelect(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="mt-2 text-[11px] leading-5 text-stone-500">
                이 단계에서는 클립보드 붙여넣기도 지원합니다. 이미지를 복사한 뒤
                `Ctrl+V` 또는 `Cmd+V`를 누르세요.
              </p>
              {centerImage ? (
                <p className="mt-2 truncate text-xs text-slate-900">
                  선택됨: {centerImage.name}
                </p>
              ) : null}
            </div>

            <div className="rounded-[1rem] border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs text-stone-500">
                PNG 미리보기 안에서 원하는 지점을 클릭하면 그 픽셀 색을 바로
                배경색으로 가져옵니다.
              </p>
              <p className="mt-1 text-xs text-stone-500">
                위의 추천 팔레트는 PNG에서 많이 쓰인 색을 기준으로 정리합니다.
              </p>
              <p className="mt-1 text-xs text-stone-500">
                총 {processedImages.length}장의 PNG를 기준으로 썸네일을 설정하고
                있습니다.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex flex-1 items-center justify-center rounded-[1rem] border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50"
              >
                이전
              </button>
              <button
                type="button"
                onClick={onNext}
                className="inline-flex flex-1 items-center justify-center rounded-[1rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                다음
              </button>
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}
