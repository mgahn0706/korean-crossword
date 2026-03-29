import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import type { ProcessedImage } from "./types";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFJS_ASSET_BASE = `${import.meta.env.BASE_URL}pdfjs/`;
const PDFJS_CMAP_URL = `${PDFJS_ASSET_BASE}cmaps/`;
const PDFJS_STANDARD_FONT_URL = `${PDFJS_ASSET_BASE}standard_fonts/`;

export async function renderPdfToImages(
  file: File,
  onProgress: (text: string) => void
) {
  const buffer = await file.arrayBuffer();
  const pdf = (await getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: PDFJS_CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: PDFJS_STANDARD_FONT_URL,
    useWorkerFetch: true,
    useSystemFonts: true,
  }).promise) as PDFDocumentProxy;
  const renderScale = Math.max(2, window.devicePixelRatio || 1);
  const baseName = file.name.replace(/\.pdf$/i, "");
  const images: ProcessedImage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress(`PDF ${pageNumber}/${pdf.numPages} 페이지를 PNG로 변환 중...`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("캔버스를 초기화할 수 없습니다.");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
      intent: "print",
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
          return;
        }

        reject(new Error("PNG 파일 생성에 실패했습니다."));
      }, "image/png");
    });

    const imageFile = new File(
      [blob],
      `${baseName}-${String(pageNumber).padStart(2, "0")}.png`,
      { type: "image/png" }
    );

    images.push({
      id: `${imageFile.name}-${imageFile.size}-${pageNumber}`,
      file: imageFile,
      url: URL.createObjectURL(imageFile),
      width: canvas.width,
      height: canvas.height,
    });
  }

  return images;
}
