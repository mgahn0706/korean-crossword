import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import { useEffect, useId, useState } from "react";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFJS_ASSET_BASE = `${import.meta.env.BASE_URL}pdfjs/`;
const PDFJS_CMAP_URL = `${PDFJS_ASSET_BASE}cmaps/`;
const PDFJS_STANDARD_FONT_URL = `${PDFJS_ASSET_BASE}standard_fonts/`;

type UploadMode = "pdf" | "png" | null;
type Step = 1 | 2;
type MeetingCategory = "정기모임" | "OT" | "미니정모" | "대이동";

type ProcessedImage = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
};

interface MeetingType {
  id: string;
  title: string;
  subtitle?: string;
  imageSource?: string;
  quizIds: string[];
  date: {
    year: number;
    month: number;
  };
}

const EMPTY_MEETING: MeetingType = {
  id: "",
  title: "",
  subtitle: "",
  imageSource: "",
  quizIds: [],
  date: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
};

const DEFAULT_MEETING_CATEGORY: MeetingCategory = "정기모임";

function formatMeetingId(
  category: MeetingCategory,
  year: number,
  month: number,
  sequence: number
) {
  const paddedMonth = String(month).padStart(2, "0");

  switch (category) {
    case "정기모임":
      return `${year}-${paddedMonth}`;
    case "OT":
      return `${year}-OT-${sequence}`;
    case "미니정모":
      return `${year}-MINI-${sequence}`;
    case "대이동":
      return `${year}-MOVE-${sequence}`;
    default:
      return `${year}-${paddedMonth}`;
  }
}

function revokeProcessedImages(images: ProcessedImage[]) {
  images.forEach((image) => URL.revokeObjectURL(image.url));
}

function UploadCard({
  id,
  title,
  description,
  accept,
  multiple,
  buttonLabel,
  variant,
  onSelect,
}: {
  id: string;
  title: string;
  description: string;
  accept: string;
  multiple: boolean;
  buttonLabel: string;
  variant: "primary" | "secondary";
  onSelect: (files: File[]) => void;
}) {
  const isPrimary = variant === "primary";

  return (
    <label
      htmlFor={id}
      className={`group block cursor-pointer ${
        isPrimary
          ? "quiz-pdf-float relative overflow-hidden rounded-[2rem] border border-sky-300/60 bg-[linear-gradient(145deg,#eff8ff_0%,#dbeafe_52%,#bfdbfe_100%)] p-6 text-sky-950 shadow-[0_20px_60px_rgba(59,130,246,0.16)] transition duration-300 hover:border-sky-400/70 hover:shadow-[0_24px_70px_rgba(59,130,246,0.22)]"
          : "rounded-[1.5rem] border border-stone-200 bg-[#fbfaf8] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:border-stone-300 hover:bg-white"
      }`}
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
      {isPrimary ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_62%)]" />
      ) : null}
      <p
        className={`text-[0.72rem] font-semibold uppercase tracking-[0.24em] ${
          isPrimary ? "text-sky-800/70" : "text-stone-500"
        }`}
      >
        업로드 방식
      </p>
      <h2
        className={`mt-3 text-2xl font-semibold ${
          isPrimary ? "text-sky-950" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-3 text-sm leading-6 ${
          isPrimary ? "text-sky-900/72" : "text-stone-600"
        }`}
      >
        {description}
      </p>
      {isPrimary ? (
        <div className="quiz-pdf-breathe mt-6 inline-flex items-center gap-3 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition duration-300 group-hover:bg-sky-700">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4 fill-none stroke-current stroke-2"
            >
              <path d="M12 3v11" />
              <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
              <path d="M5 19h14" />
            </svg>
          </span>
          {buttonLabel}
        </div>
      ) : (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition group-hover:text-stone-900">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-[11px]">
            PNG
          </span>
          {buttonLabel}
        </div>
      )}
    </label>
  );
}

async function renderPdfToImages(file: File, onProgress: (text: string) => void) {
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

function convertPngFiles(files: File[]) {
  return files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    url: URL.createObjectURL(file),
    width: 0,
    height: 0,
  }));
}

export default function QuizPage() {
  const pdfInputId = useId();
  const pngInputId = useId();
  const [step, setStep] = useState<Step>(1);
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [meetingInfo, setMeetingInfo] = useState<MeetingType>(EMPTY_MEETING);
  const [quizIdsText, setQuizIdsText] = useState("");
  const [meetingCategory, setMeetingCategory] =
    useState<MeetingCategory>(DEFAULT_MEETING_CATEGORY);
  const [meetingSequence, setMeetingSequence] = useState(1);

  useEffect(() => {
    return () => {
      revokeProcessedImages(processedImages);
    };
  }, [processedImages]);

  useEffect(() => {
    setMeetingInfo((current) => ({
      ...current,
      id: formatMeetingId(
        meetingCategory,
        current.date.year,
        current.date.month,
        meetingSequence
      ),
    }));
  }, [meetingCategory, meetingSequence, meetingInfo.date.year, meetingInfo.date.month]);

  const resetSelection = () => {
    revokeProcessedImages(processedImages);
    setStep(1);
    setUploadMode(null);
    setSourceFiles([]);
    setProcessedImages([]);
    setIsProcessing(false);
    setStatusText("");
    setErrorText("");
    setMeetingInfo(EMPTY_MEETING);
    setQuizIdsText("");
    setMeetingCategory(DEFAULT_MEETING_CATEGORY);
    setMeetingSequence(1);
  };

  const updateMeetingInfo = (field: keyof MeetingType, value: string | string[]) => {
    setMeetingInfo((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateMeetingDate = (
    field: keyof MeetingType["date"],
    value: number
  ) => {
    setMeetingInfo((current) => ({
      ...current,
      date: {
        ...current.date,
        [field]: value,
      },
    }));
  };

  const updateQuizIdsText = (value: string) => {
    setQuizIdsText(value);
    setMeetingInfo((current) => ({
      ...current,
      quizIds: value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  };

  const handleSelect = async (mode: UploadMode, files: File[]) => {
    if (files.length === 0) {
      return;
    }

    revokeProcessedImages(processedImages);
    setUploadMode(mode);
    setSourceFiles(files);
    setProcessedImages([]);
    setErrorText("");
    setStep(2);
    setIsProcessing(true);

    try {
      if (mode === "pdf") {
        setStatusText("PDF를 읽는 중...");
        const images = await renderPdfToImages(files[0], setStatusText);
        setProcessedImages(images);
        setStatusText(`총 ${images.length}개의 PNG 페이지로 변환했습니다.`);
      } else {
        setStatusText("PNG 파일을 정리하는 중...");
        const images = convertPngFiles(files);
        setProcessedImages(images);
        setStatusText(`총 ${images.length}개의 PNG 파일을 불러왔습니다.`);
      }
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "파일 처리 중 알 수 없는 오류가 발생했습니다."
      );
      setStatusText("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <LinkButton
            path={ROUTES.home}
            className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50"
          >
            Home
          </LinkButton>
          <p className="text-sm text-stone-500">문제적 추러스 업로드</p>
        </div>

        <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:px-6">
          <div className="flex items-start gap-4 sm:items-center">
            <div
              className={`flex items-center gap-3 ${
                step === 1
                  ? "text-slate-900"
                  : "text-stone-400"
              }`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  step === 1
                    ? "bg-slate-900 text-white"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                1
              </span>
              <div>
                <p className="text-sm font-semibold">업로드</p>
                <p className="text-xs text-stone-500">
                  PDF 또는 PNG 선택
                </p>
              </div>
            </div>

            <div
              className={`mt-5 h-px flex-1 bg-stone-200 sm:mt-0`}
            />

            <div
              className={`flex items-center gap-3 ${
                step === 2 ? "text-slate-900" : "text-stone-400"
              }`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  step === 2
                    ? "bg-slate-900 text-white"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                2
              </span>
              <div>
                <p className="text-sm font-semibold">설정</p>
                <p className="text-xs text-stone-500">
                  PNG 확인 및 모임 정보
                </p>
              </div>
            </div>
          </div>
        </section>

        {step === 1 ? (
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
                void handleSelect("pdf", files);
              }}
            />

            <div className="flex flex-col items-start gap-2 px-1 py-2">
              <p className="text-sm text-stone-600">
                PDF가 아니라 이미 페이지별 이미지가 준비되어 있다면 PNG 여러 장으로도 시작할 수 있습니다.
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
                    void handleSelect("png", Array.from(event.target.files ?? []));
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
        ) : (
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
                    onClick={resetSelection}
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
                        <path d="M21 12a9 9 0 1 1-2.64-6.36" className="opacity-30" />
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
                      <div className="space-y-1 px-3 py-2 text-xs text-stone-600">
                        <p className="truncate font-medium text-slate-900" title={image.file.name}>
                          {image.file.name}
                        </p>
                        <p>{Math.max(1, Math.round(image.file.size / 1024))} KB</p>
                        {image.width > 0 && image.height > 0 ? (
                          <p className="tabular-nums">
                            {image.width} × {image.height}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Meeting Setup
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  모임 정보 설정
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  `MeetingType`에 맞는 모임 메타데이터를 먼저 정리합니다.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                        모임 유형
                      </span>
                      <select
                        value={meetingCategory}
                        onChange={(event) =>
                          setMeetingCategory(event.target.value as MeetingCategory)
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
                        생성된 ID
                      </span>
                      <div className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-100 px-4 py-3 text-base font-medium text-slate-900">
                        {meetingInfo.id}
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      모임 이름
                    </span>
                    <input
                      type="text"
                      value={meetingInfo.title}
                      onChange={(event) =>
                        updateMeetingInfo("title", event.target.value)
                      }
                      placeholder="예: 2026 봄 정기 모임"
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
                        updateMeetingInfo("subtitle", event.target.value)
                      }
                      placeholder="예: 추러스 정기 시즌 모임"
                      className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      대표 이미지 경로
                    </span>
                    <input
                      type="text"
                      value={meetingInfo.imageSource ?? ""}
                      onChange={(event) =>
                        updateMeetingInfo("imageSource", event.target.value)
                      }
                      placeholder="예: /images/meetings/2026-spring-01.png"
                      className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                        연도
                      </span>
                      <input
                        type="number"
                        min={2000}
                        max={2100}
                        value={meetingInfo.date.year}
                        onChange={(event) =>
                          updateMeetingDate(
                            "year",
                            Number(event.target.value) || EMPTY_MEETING.date.year
                          )
                        }
                        className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                        월
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={meetingInfo.date.month}
                        onChange={(event) =>
                          updateMeetingDate(
                            "month",
                            Math.min(
                              12,
                              Math.max(
                                1,
                                Number(event.target.value) || EMPTY_MEETING.date.month
                              )
                            )
                          )
                        }
                        className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                      />
                    </label>
                  </div>

                  {meetingCategory !== "정기모임" ? (
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                        차수
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={meetingSequence}
                        onChange={(event) =>
                          setMeetingSequence(
                            Math.max(1, Number(event.target.value) || 1)
                          )
                        }
                        className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                      Quiz IDs
                    </span>
                    <textarea
                      rows={4}
                      value={quizIdsText}
                      onChange={(event) => updateQuizIdsText(event.target.value)}
                      placeholder={"quiz-001\nquiz-002\nquiz-003"}
                      className="w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    />
                  </label>
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
        )}
      </div>
    </main>
  );
}
