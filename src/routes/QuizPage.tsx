import JSZip from "jszip";
import { useEffect, useId, useState } from "react";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";
import { DEFAULT_MEETING_CATEGORY, EMPTY_MEETING } from "./quiz/constants";
import { renderPdfToImages } from "./quiz/pdf";
import StepFourMetadata from "./quiz/StepFourMetadata";
import StepFiveExport from "./quiz/StepFiveExport";
import StepOneUpload from "./quiz/StepOneUpload";
import StepThreeThumbnail from "./quiz/StepThreeThumbnail";
import StepThreeOrdering from "./quiz/StepThreeOrdering";
import StepTwoMeeting from "./quiz/StepTwoMeeting";
import QuizStepper from "./quiz/QuizStepper";
import type {
  DragRow,
  MeetingCategory,
  MeetingType,
  ProcessedImage,
  QuizMetadata,
  QuizType,
  SelectionRow,
  Tags,
  ThumbnailAsset,
  UploadMode,
  Step,
} from "./quiz/types";
import {
  buildQuizId,
  convertPngFiles,
  createEmptyQuizMetadata,
  extractDominantColors,
  formatMeetingId,
  removeFromOrderedList,
  renderThumbnailBlob,
  reorderItems,
  revokeProcessedImages,
} from "./quiz/utils";

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
  const [meetingCategory, setMeetingCategory] = useState<MeetingCategory>(
    DEFAULT_MEETING_CATEGORY
  );
  const [meetingSequence, setMeetingSequence] = useState(1);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [quizImageIds, setQuizImageIds] = useState<string[]>([]);
  const [answerImageIds, setAnswerImageIds] = useState<string[]>([]);
  const [activeSelectionRow, setActiveSelectionRow] =
    useState<SelectionRow>("quiz");
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [draggedFromRow, setDraggedFromRow] = useState<DragRow | null>(null);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [quizMetadataByImageId, setQuizMetadataByImageId] = useState<
    Record<string, QuizMetadata>
  >({});
  const [thumbnailBackgroundColor, setThumbnailBackgroundColor] =
    useState("#f5e9d4");
  const [thumbnailDominantColors, setThumbnailDominantColors] = useState<
    string[]
  >([]);
  const [thumbnailCenterImage, setThumbnailCenterImage] =
    useState<ThumbnailAsset | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    return () => {
      revokeProcessedImages(processedImages);
    };
  }, [processedImages]);

  useEffect(() => {
    return () => {
      if (thumbnailCenterImage?.url.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailCenterImage.url);
      }
    };
  }, [thumbnailCenterImage]);

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
  }, [
    meetingCategory,
    meetingSequence,
    meetingInfo.date.year,
    meetingInfo.date.month,
  ]);

  useEffect(() => {
    setMeetingInfo((current) => {
      if ((current.subtitle ?? "").trim() !== "") {
        return current;
      }

      return {
        ...current,
        subtitle: `${current.date.year}년 ${current.date.month}월 ${meetingCategory}`,
      };
    });
  }, [meetingCategory, meetingInfo.date.year, meetingInfo.date.month]);

  useEffect(() => {
    setActiveQuizIndex((current) =>
      quizImageIds.length === 0 ? 0 : Math.min(current, quizImageIds.length - 1)
    );
  }, [quizImageIds.length]);

  useEffect(() => {
    if (processedImages.length === 0) {
      setThumbnailDominantColors([]);
      return;
    }

    let isCancelled = false;

    const loadDominantColors = async () => {
      try {
        const colors = await Promise.all(
          processedImages.slice(0, 4).map((image) => extractDominantColors(image.url, 3))
        );
        const uniqueColors = Array.from(new Set(colors.flat())).slice(0, 8);

        if (!isCancelled) {
          setThumbnailDominantColors(uniqueColors);
        }
      } catch {
        if (!isCancelled) {
          setThumbnailDominantColors([]);
        }
      }
    };

    void loadDominantColors();

    return () => {
      isCancelled = true;
    };
  }, [processedImages]);

  useEffect(() => {
    if (step !== 3) {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();

      if (!file) {
        return;
      }

      event.preventDefault();
      const nextAsset = {
        name: file.name,
        url: URL.createObjectURL(file),
      };

      setThumbnailCenterImage((current) => {
        if (current?.url.startsWith("blob:")) {
          URL.revokeObjectURL(current.url);
        }
        return nextAsset;
      });
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [step]);

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
    setMeetingCategory(DEFAULT_MEETING_CATEGORY);
    setMeetingSequence(1);
    setRemovedImageIds([]);
    setQuizImageIds([]);
    setAnswerImageIds([]);
    setActiveSelectionRow("quiz");
    setDraggedImageId(null);
    setDraggedFromRow(null);
    setActiveQuizIndex(0);
    setQuizMetadataByImageId({});
    setThumbnailBackgroundColor("#f5e9d4");
    setThumbnailDominantColors([]);
    if (thumbnailCenterImage?.url.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailCenterImage.url);
    }
    setThumbnailCenterImage(null);
    setIsExporting(false);
    setExportStatus("");
  };

  const updateMeetingInfo = (
    field: keyof MeetingType,
    value: string | string[]
  ) => {
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

  const handleSelect = async (mode: UploadMode, files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const primaryFileName = files[0]?.name.replace(/\.[^.]+$/, "") ?? "";

    revokeProcessedImages(processedImages);
    setUploadMode(mode);
    setSourceFiles(files);
    setProcessedImages([]);
    setErrorText("");
    setStep(2);
    setIsProcessing(true);
    setMeetingInfo((current) => ({
      ...current,
      title: current.title.trim() !== "" ? current.title : primaryFileName,
    }));

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

  const setThumbnailCenterImageFromFile = (file: File) => {
    const nextAsset = {
      name: file.name,
      url: URL.createObjectURL(file),
    };

    setThumbnailCenterImage((current) => {
      if (current?.url.startsWith("blob:")) {
        URL.revokeObjectURL(current.url);
      }
      return nextAsset;
    });
  };

  const toggleRemovedImage = (imageId: string) => {
    setRemovedImageIds((current) => {
      const isRemoved = current.includes(imageId);

      if (isRemoved) {
        return current.filter((item) => item !== imageId);
      }

      setQuizImageIds((items) => removeFromOrderedList(items, imageId));
      setAnswerImageIds((items) => removeFromOrderedList(items, imageId));
      return [...current, imageId];
    });
  };

  const appendToSelectionRow = (row: SelectionRow, imageId: string) => {
    if (removedImageIds.includes(imageId)) {
      return;
    }

    const setter = row === "quiz" ? setQuizImageIds : setAnswerImageIds;
    setter((current) =>
      current.includes(imageId) ? current : [...current, imageId]
    );
  };

  const removeFromSelectionRow = (row: SelectionRow, imageId: string) => {
    const setter = row === "quiz" ? setQuizImageIds : setAnswerImageIds;
    setter((current) => current.filter((item) => item !== imageId));
  };

  const handleRowDrop = (row: SelectionRow, targetId: string | null) => {
    if (!draggedImageId || !draggedFromRow) {
      return;
    }

    const targetSetter = row === "quiz" ? setQuizImageIds : setAnswerImageIds;

    if (draggedFromRow === row) {
      targetSetter((current) =>
        reorderItems(current, draggedImageId, targetId)
      );
    } else {
      if (draggedFromRow !== "all") {
        const sourceSetter =
          draggedFromRow === "quiz" ? setQuizImageIds : setAnswerImageIds;
        sourceSetter((current) =>
          current.filter((item) => item !== draggedImageId)
        );
      }

      targetSetter((current) => {
        const baseItems = current.filter((item) => item !== draggedImageId);
        if (targetId === null || !baseItems.includes(targetId)) {
          return [...baseItems, draggedImageId];
        }
        const targetIndex = baseItems.indexOf(targetId);
        baseItems.splice(targetIndex, 0, draggedImageId);
        return baseItems;
      });
    }

    setDraggedImageId(null);
    setDraggedFromRow(null);
  };

  const totalQuizItems = quizImageIds.length;
  const currentQuizImageId = quizImageIds[activeQuizIndex] ?? null;
  const currentAnswerImageId = answerImageIds[activeQuizIndex] ?? null;
  const currentQuizImage =
    processedImages.find((image) => image.id === currentQuizImageId) ?? null;
  const currentAnswerImage =
    processedImages.find((image) => image.id === currentAnswerImageId) ?? null;
  const currentQuizMetadata =
    (currentQuizImageId
      ? quizMetadataByImageId[currentQuizImageId]
      : undefined) ?? createEmptyQuizMetadata();
  const currentQuizId =
    currentQuizImageId && meetingInfo.id.trim() !== ""
      ? buildQuizId(meetingInfo.id, activeQuizIndex + 1)
      : "";
  const currentQuizImageSource = currentQuizImage?.file.name ?? "";

  const updateCurrentQuizMetadata = (
    field: keyof QuizMetadata,
    value: string | string[] | Tags[]
  ) => {
    if (!currentQuizImageId) {
      return;
    }

    setQuizMetadataByImageId((current) => ({
      ...current,
      [currentQuizImageId]: {
        ...(current[currentQuizImageId] ?? createEmptyQuizMetadata()),
        [field]: value,
      },
    }));
  };

  const toggleCurrentQuizTag = (tag: Tags) => {
    const nextTags = currentQuizMetadata.tags.includes(tag)
      ? currentQuizMetadata.tags.filter((item) => item !== tag)
      : [...currentQuizMetadata.tags, tag];

    updateCurrentQuizMetadata("tags", nextTags);
  };

  const isMeetingConfigComplete =
    meetingInfo.id.trim() !== "" &&
    meetingInfo.title.trim() !== "" &&
    Number.isFinite(meetingInfo.date.year) &&
    meetingInfo.date.year >= 2000 &&
    meetingInfo.date.year <= 2100 &&
    Number.isFinite(meetingInfo.date.month) &&
    meetingInfo.date.month >= 1 &&
    meetingInfo.date.month <= 12;

  const quizData: QuizType[] = quizImageIds.map((imageId, index) => {
    const metadata = quizMetadataByImageId[imageId] ?? createEmptyQuizMetadata();
    const quizId = buildQuizId(meetingInfo.id, index + 1);

    return {
      id: quizId,
      meetingId: meetingInfo.id,
      quizNumber: index + 1,
      title: metadata.title.trim(),
      creators: metadata.creators,
      quizImageSource: `quizImages/${meetingInfo.id}-${quizId}.png`,
      answer: metadata.answer.trim() === "" ? null : metadata.answer.trim(),
      tags: metadata.tags,
    };
  });

  const hasAnswerImages = quizData.some((_, index) =>
    Boolean(answerImageIds[index])
  );
  const hasThumbnail = thumbnailCenterImage !== null;

  const handleDownloadZip = async () => {
    if (quizData.length === 0 || meetingInfo.id.trim() === "") {
      return;
    }

    setIsExporting(true);
    setExportStatus("ZIP 파일을 준비하는 중입니다...");

    try {
      const zip = new JSZip();
      const quizImagesFolder = zip.folder("quizImages");

      if (!quizImagesFolder) {
        throw new Error("ZIP 폴더를 생성할 수 없습니다.");
      }

      for (const quiz of quizData) {
        const quizImageId = quizImageIds[quiz.quizNumber - 1];
        const answerImageId = answerImageIds[quiz.quizNumber - 1];
        const quizImage = processedImages.find((item) => item.id === quizImageId);
        const answerImage = processedImages.find(
          (item) => item.id === answerImageId
        );

        if (quizImage) {
          quizImagesFolder.file(
            `${meetingInfo.id}-${quiz.id}.png`,
            await quizImage.file.arrayBuffer()
          );
        }

        if (answerImage) {
          quizImagesFolder.file(
            `${meetingInfo.id}-${quiz.id}-answer.png`,
            await answerImage.file.arrayBuffer()
          );
        }
      }

      const meetingExport: MeetingType = {
        ...meetingInfo,
        imageSource: thumbnailCenterImage ? "thumbnail.png" : "",
        quizIds: quizData.map((quiz) => quiz.id),
      };

      if (thumbnailCenterImage) {
        const thumbnailBlob = await renderThumbnailBlob({
          backgroundColor: thumbnailBackgroundColor,
          centerImageUrl: thumbnailCenterImage.url,
        });
        zip.file("thumbnail.png", thumbnailBlob);
      }

      zip.file("quizData.json", JSON.stringify(quizData, null, 2));
      zip.file("meeting.json", JSON.stringify(meetingExport, null, 2));

      setExportStatus("ZIP 파일을 압축하는 중입니다...");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${meetingInfo.id}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportStatus("ZIP 다운로드가 시작되었습니다.");
    } catch (error) {
      setExportStatus(
        error instanceof Error
          ? error.message
          : "ZIP 생성 중 알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsExporting(false);
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

        <QuizStepper step={step} />

        {step === 1 ? (
          <StepOneUpload
            pdfInputId={pdfInputId}
            pngInputId={pngInputId}
            onSelect={handleSelect}
          />
        ) : step === 2 ? (
          <StepTwoMeeting
            uploadMode={uploadMode}
            sourceFiles={sourceFiles}
            processedImages={processedImages}
            isProcessing={isProcessing}
            statusText={statusText}
            errorText={errorText}
            meetingInfo={meetingInfo}
            meetingCategory={meetingCategory}
            isMeetingConfigComplete={isMeetingConfigComplete}
            onReset={resetSelection}
            onMeetingCategoryChange={setMeetingCategory}
            onMeetingInfoChange={updateMeetingInfo}
            onMeetingDateChange={updateMeetingDate}
            onNext={() => setStep(3)}
          />
        ) : step === 3 ? (
          <StepThreeThumbnail
            processedImages={processedImages}
            backgroundColor={thumbnailBackgroundColor}
            dominantColors={thumbnailDominantColors}
            centerImage={thumbnailCenterImage}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            onBackgroundColorChange={setThumbnailBackgroundColor}
            onCenterImageSelect={setThumbnailCenterImageFromFile}
          />
        ) : step === 4 ? (
          <StepThreeOrdering
            processedImages={processedImages}
            removedImageIds={removedImageIds}
            quizImageIds={quizImageIds}
            answerImageIds={answerImageIds}
            activeSelectionRow={activeSelectionRow}
            onBack={() => setStep(3)}
            onReset={resetSelection}
            onSelectRow={setActiveSelectionRow}
            onAppendToActiveRow={(imageId) =>
              appendToSelectionRow(activeSelectionRow, imageId)
            }
            onToggleRemovedImage={toggleRemovedImage}
            onRemoveFromSelectionRow={removeFromSelectionRow}
            onDragStart={(imageId, row) => {
              setDraggedImageId(imageId);
              setDraggedFromRow(row);
            }}
            onDragEnd={() => {
              setDraggedImageId(null);
              setDraggedFromRow(null);
            }}
            onRowDrop={handleRowDrop}
            onNext={() => setStep(5)}
          />
        ) : step === 5 ? (
          <StepFourMetadata
            totalQuizItems={totalQuizItems}
            activeQuizIndex={activeQuizIndex}
            quizImageIds={quizImageIds}
            currentQuizImage={currentQuizImage}
            currentAnswerImage={currentAnswerImage}
            currentQuizMetadata={currentQuizMetadata}
            currentQuizId={currentQuizId}
            meetingId={meetingInfo.id}
            currentQuizImageSource={currentQuizImageSource}
            onChangeIndex={(next) => {
              if (typeof next === "function") {
                setActiveQuizIndex(next);
                return;
              }
              setActiveQuizIndex(next);
            }}
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
            onMetadataChange={updateCurrentQuizMetadata}
            onToggleTag={toggleCurrentQuizTag}
          />
        ) : (
          <StepFiveExport
            meetingInfo={meetingInfo}
            quizData={quizData}
            hasAnswerImages={hasAnswerImages}
            hasThumbnail={hasThumbnail}
            isExporting={isExporting}
            exportStatus={exportStatus}
            onBack={() => setStep(5)}
            onDownload={() => {
              void handleDownloadZip();
            }}
          />
        )}
      </div>
    </main>
  );
}
