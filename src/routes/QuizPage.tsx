import JSZip from "jszip";
import { useEffect, useId, useState } from "react";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";
import {
  DEFAULT_MEETING_CATEGORY,
  DEFAULT_MEETING_SEASON,
  EMPTY_MEETING,
} from "./quiz/constants";
import { renderPdfToImages } from "./quiz/pdf";
import StepFourMetadata from "./quiz/StepFourMetadata";
import StepFiveExport from "./quiz/StepFiveExport";
import StepOneUpload from "./quiz/StepOneUpload";
import StepThreeThumbnail from "./quiz/StepThreeThumbnail";
import StepThreeOrdering from "./quiz/StepThreeOrdering";
import StepTwoMeeting from "./quiz/StepTwoMeeting";
import QuizStepper from "./quiz/QuizStepper";
import type {
  MeetingCategory,
  MeetingSeason,
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
  renderUploadedThumbnailBlob,
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
  const [meetingSeason, setMeetingSeason] = useState<MeetingSeason>(
    DEFAULT_MEETING_SEASON
  );
  const [isMeetingIdManual, setIsMeetingIdManual] = useState(false);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [quizImageIds, setQuizImageIds] = useState<string[]>([]);
  const [quizGroupByImageId, setQuizGroupByImageId] = useState<Record<string, string>>({});
  const [answerImageByGroupId, setAnswerImageByGroupId] = useState<Record<string, string>>({});
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
  const [uploadedThumbnail, setUploadedThumbnail] =
    useState<ThumbnailAsset | null>(null);
  const [thumbnailCenterImageScale, setThumbnailCenterImageScale] =
    useState(1);
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
    return () => {
      if (uploadedThumbnail?.url.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedThumbnail.url);
      }
    };
  }, [uploadedThumbnail]);

  useEffect(() => {
    if (isMeetingIdManual) {
      return;
    }

    setMeetingInfo((current) => ({
      ...current,
      id: formatMeetingId(
        meetingCategory,
        current.date.year,
        current.date.month,
        meetingSequence,
        meetingSeason
      ),
    }));
  }, [
    meetingCategory,
    meetingSequence,
    meetingInfo.date.year,
    meetingInfo.date.month,
    meetingSeason,
    isMeetingIdManual,
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
    setMeetingSeason(DEFAULT_MEETING_SEASON);
    setIsMeetingIdManual(false);
    setRemovedImageIds([]);
    setQuizImageIds([]);
    setQuizGroupByImageId({});
    setAnswerImageByGroupId({});
    setActiveQuizIndex(0);
    setQuizMetadataByImageId({});
    setThumbnailBackgroundColor("#f5e9d4");
    setThumbnailDominantColors([]);
    if (thumbnailCenterImage?.url.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailCenterImage.url);
    }
    setThumbnailCenterImage(null);
    setUploadedThumbnail(null);
    setThumbnailCenterImageScale(1);
    setIsExporting(false);
    setExportStatus("");
  };

  const updateMeetingInfo = (
    field: keyof MeetingType,
    value: string | string[]
  ) => {
    if (field === "id") {
      setIsMeetingIdManual(true);
    }

    setMeetingInfo((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const useAutomaticMeetingId = () => {
    setIsMeetingIdManual(false);
    setMeetingInfo((current) => ({
      ...current,
      id: formatMeetingId(
        meetingCategory,
        current.date.year,
        current.date.month,
        meetingSequence,
        meetingSeason
      ),
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

  const setUploadedThumbnailFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadedThumbnail({ name: file.name, url: URL.createObjectURL(file) });
  };

  const toggleRemovedImage = (imageId: string) => {
    setRemovedImageIds((current) => {
      const isRemoved = current.includes(imageId);

      if (isRemoved) {
        return current.filter((item) => item !== imageId);
      }

      setQuizImageIds((items) => removeFromOrderedList(items, imageId));
      setAnswerImageByGroupId((items) => Object.fromEntries(
        Object.entries(items).filter(([, id]) => id !== imageId)
      ));
      return [...current, imageId];
    });
  };

  const appendToSelectionRow = (row: SelectionRow, imageId: string) => {
    if (removedImageIds.includes(imageId)) {
      return;
    }

    if (row !== "quiz") return;
    setQuizImageIds((current) => current.includes(imageId) ? current : [...current, imageId]);
    setQuizGroupByImageId((current) => ({ ...current, [imageId]: crypto.randomUUID() }));
  };

  const removeFromSelectionRow = (row: SelectionRow, imageId: string) => {
    if (row === "quiz") {
      setQuizImageIds((current) => current.filter((item) => item !== imageId));
    }
  };

  const moveImage = (row: SelectionRow, imageId: string, direction: -1 | 1) => {
    if (row !== "quiz") return;
    setQuizImageIds((current) => {
      const index = current.indexOf(imageId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const quizGroups = Array.from(
    quizImageIds.reduce((groups, imageId) => {
      const groupId = quizGroupByImageId[imageId] ?? imageId;
      const group = groups.get(groupId) ?? [];
      group.push(imageId);
      groups.set(groupId, group);
      return groups;
    }, new Map<string, string[]>()).entries()
  ).map(([id, imageIds]) => ({ id, imageIds }));
  const answerImageIds = quizGroups.map((group) => answerImageByGroupId[group.id] ?? null);
  const setAnswerForQuiz = (quizIndex: number, imageId: string | null) => {
    const group = quizGroups[quizIndex];
    if (!group) return;
    setAnswerImageByGroupId((current) => {
      const next = { ...current };
      if (imageId) next[group.id] = imageId;
      else delete next[group.id];
      return next;
    });
  };
  useEffect(() => {
    setActiveQuizIndex((current) =>
      quizGroups.length === 0 ? 0 : Math.min(current, quizGroups.length - 1)
    );
  }, [quizGroups.length]);
  const totalQuizItems = quizGroups.length;
  const currentQuizGroup = quizGroups[activeQuizIndex] ?? null;
  const currentAnswerImageId = answerImageIds[activeQuizIndex] ?? null;
  const currentAnswerImage =
    processedImages.find((image) => image.id === currentAnswerImageId) ?? null;
  const currentQuizMetadata =
    (currentQuizGroup
      ? quizMetadataByImageId[currentQuizGroup.id]
      : undefined) ?? createEmptyQuizMetadata();
  const currentQuizId =
    currentQuizGroup && meetingInfo.id.trim() !== ""
      ? buildQuizId(meetingInfo.id, activeQuizIndex + 1)
      : "";
  const currentQuizImageSources = currentQuizId
    ? currentQuizGroup?.imageIds.map((_, index) =>
        `/image/quiz/${currentQuizId}${index === 0 ? "" : `-${index + 1}`}.png`
      ) ?? []
    : [];

  const updateCurrentQuizMetadata = (
    field: keyof QuizMetadata,
    value: string | string[] | Tags[]
  ) => {
    if (!currentQuizGroup) {
      return;
    }

    setQuizMetadataByImageId((current) => ({
      ...current,
      [currentQuizGroup.id]: {
        ...(current[currentQuizGroup.id] ?? createEmptyQuizMetadata()),
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

  const quizData: QuizType[] = quizGroups.map((group, index) => {
    const metadata = quizMetadataByImageId[group.id] ?? createEmptyQuizMetadata();
    const quizId = buildQuizId(meetingInfo.id, index + 1);

    return {
      id: quizId,
      meetingId: meetingInfo.id,
      quizNumber: index + 1,
      title: metadata.title.trim(),
      creators: metadata.creators,
      quizImageSource: group.imageIds.map((_, imageIndex) =>
        `/image/quiz/${quizId}${imageIndex === 0 ? "" : `-${imageIndex + 1}`}.png`
      ),
      answer: metadata.answer.trim() === "" ? null : metadata.answer.trim(),
      tags: metadata.tags,
    };
  });

  const hasThumbnail = uploadedThumbnail !== null || thumbnailCenterImage !== null;

  const handleDownloadZip = async () => {
    if (quizData.length === 0 || meetingInfo.id.trim() === "") {
      return;
    }

    setIsExporting(true);
    setExportStatus("ZIP 파일을 준비하는 중입니다...");

    try {
      const zip = new JSZip();
      const quizImagesFolder = zip.folder("image/quiz");
      const meetingImagesFolder = zip.folder("image/quiz/meeting");

      if (!quizImagesFolder || !meetingImagesFolder) {
        throw new Error("ZIP 폴더를 생성할 수 없습니다.");
      }

      for (const quiz of quizData) {
        const quizImageIdsForQuiz = quizGroups[quiz.quizNumber - 1]?.imageIds ?? [];
        const answerImageId = answerImageIds[quiz.quizNumber - 1];
        const answerImage = processedImages.find(
          (item) => item.id === answerImageId
        );

        for (const [imageIndex, quizImageId] of quizImageIdsForQuiz.entries()) {
          const quizImage = processedImages.find((item) => item.id === quizImageId);
          if (quizImage) {
            quizImagesFolder.file(
              `${quiz.id}${imageIndex === 0 ? "" : `-${imageIndex + 1}`}.png`,
              await quizImage.file.arrayBuffer()
            );
          }
        }

        if (answerImage) {
          quizImagesFolder.file(
            `${quiz.id}-answer.png`,
            await answerImage.file.arrayBuffer()
          );
        }
      }

      const meetingExport: Record<string, MeetingType> = {
        [meetingInfo.id]: {
        ...meetingInfo,
          imageSource: hasThumbnail
            ? `/image/quiz/meeting/${meetingInfo.id}.png`
            : "",
        quizIds: quizData.map((quiz) => quiz.id),
        },
      };

      if (hasThumbnail) {
        const thumbnailBlob = uploadedThumbnail
          ? await renderUploadedThumbnailBlob(uploadedThumbnail.url)
          : await renderThumbnailBlob({
              backgroundColor: thumbnailBackgroundColor,
              centerImageUrl: thumbnailCenterImage?.url ?? null,
              centerImageScale: thumbnailCenterImageScale,
            });
        meetingImagesFolder.file(`${meetingInfo.id}.png`, thumbnailBlob);
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
            meetingSeason={meetingSeason}
            isMeetingIdManual={isMeetingIdManual}
            isMeetingConfigComplete={isMeetingConfigComplete}
            onReset={resetSelection}
            onMeetingCategoryChange={setMeetingCategory}
            onMeetingSeasonChange={setMeetingSeason}
            onMeetingInfoChange={updateMeetingInfo}
            onMeetingDateChange={updateMeetingDate}
            onUseAutomaticMeetingId={useAutomaticMeetingId}
            onNext={() => setStep(3)}
          />
        ) : step === 3 ? (
          <StepThreeThumbnail
            processedImages={processedImages}
            backgroundColor={thumbnailBackgroundColor}
            dominantColors={thumbnailDominantColors}
            centerImage={thumbnailCenterImage}
            uploadedThumbnail={uploadedThumbnail}
            centerImageScale={thumbnailCenterImageScale}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            onBackgroundColorChange={setThumbnailBackgroundColor}
            onCenterImageSelect={setThumbnailCenterImageFromFile}
            onThumbnailSelect={setUploadedThumbnailFromFile}
            onThumbnailClear={() => setUploadedThumbnail(null)}
            onCenterImageScaleChange={setThumbnailCenterImageScale}
          />
        ) : step === 4 ? (
          <StepThreeOrdering
            processedImages={processedImages}
            removedImageIds={removedImageIds}
            quizImageIds={quizImageIds}
            quizGroups={quizGroups}
            onQuizGroupChange={(imageId, groupId) => {
              const startIndex = quizImageIds.indexOf(imageId);
              if (startIndex < 0) return;
              const sourceGroup = quizGroups.find((group) => group.imageIds.includes(imageId));
              if (sourceGroup?.imageIds[0] === imageId && sourceGroup.id !== groupId) {
                setAnswerImageByGroupId((current) => {
                  const next = { ...current };
                  if (!next[groupId] && next[sourceGroup.id]) next[groupId] = next[sourceGroup.id];
                  delete next[sourceGroup.id];
                  return next;
                });
              }
              setQuizGroupByImageId((current) => {
                const previousGroupId = current[imageId] ?? imageId;
                const next = { ...current };
                for (let index = startIndex; index < quizImageIds.length; index++) {
                  const id = quizImageIds[index];
                  if ((current[id] ?? id) !== previousGroupId) break;
                  next[id] = groupId;
                }
                return next;
              });
            }}
            answerImageIds={answerImageIds}
            onBack={() => setStep(3)}
            onAppendToRow={appendToSelectionRow}
            onToggleRemovedImage={toggleRemovedImage}
            onRemoveFromSelectionRow={removeFromSelectionRow}
            onMoveImage={moveImage}
            onSetAnswer={setAnswerForQuiz}
            onMoveQuizGroup={(groupId, direction) => {
              const index = quizGroups.findIndex((group) => group.id === groupId);
              const targetIndex = index + direction;
              if (index < 0 || targetIndex < 0 || targetIndex >= quizGroups.length) return;
              const next = [...quizGroups];
              [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
              setQuizImageIds(next.flatMap((group) => group.imageIds));
            }}
            onNext={() => setStep(5)}
          />
        ) : step === 5 ? (
          <StepFourMetadata
            totalQuizItems={totalQuizItems}
            activeQuizIndex={activeQuizIndex}
            quizGroups={quizGroups}
            currentQuizImages={currentQuizGroup?.imageIds.map((imageId) =>
              processedImages.find((image) => image.id === imageId)
            ).filter((image): image is ProcessedImage => Boolean(image)) ?? []}
            currentAnswerImage={currentAnswerImage}
            currentQuizMetadata={currentQuizMetadata}
            currentQuizId={currentQuizId}
            meetingId={meetingInfo.id}
            currentQuizImageSources={currentQuizImageSources}
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
            answerImageIds={answerImageIds}
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
