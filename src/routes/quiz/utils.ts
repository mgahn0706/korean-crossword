import { EMPTY_MEETING } from "./constants";
import type {
  MeetingCategory,
  ProcessedImage,
  QuizMetadata,
} from "./types";

export function formatMeetingId(
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
      return `OT-${sequence}`;
    case "미니정모":
      return `${year}-${paddedMonth}-mini`;
    case "대이동":
      return `${year}-MOVE-${sequence}`;
    default:
      return `${year}-${paddedMonth}`;
  }
}

export function revokeProcessedImages(images: ProcessedImage[]) {
  images.forEach((image) => URL.revokeObjectURL(image.url));
}

export function convertPngFiles(files: File[]) {
  return files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    url: URL.createObjectURL(file),
    width: 0,
    height: 0,
  }));
}

export function removeFromOrderedList(items: string[], targetId: string) {
  return items.filter((item) => item !== targetId);
}

export function reorderItems(
  items: string[],
  draggedId: string,
  targetId: string | null
) {
  const nextItems = items.filter((item) => item !== draggedId);

  if (targetId === null || !nextItems.includes(targetId)) {
    return [...nextItems, draggedId];
  }

  const targetIndex = nextItems.indexOf(targetId);
  nextItems.splice(targetIndex, 0, draggedId);
  return nextItems;
}

export function createEmptyQuizMetadata(): QuizMetadata {
  return {
    title: "",
    creators: [],
    answer: "",
    tags: [],
  };
}

export function buildQuizId(meetingId: string, quizNumber: number) {
  void meetingId;
  return `quiz-${quizNumber}`;
}

export function sanitizeMeetingYear(value: number) {
  return value || EMPTY_MEETING.date.year;
}

export function sanitizeMeetingMonth(value: number) {
  return Math.min(12, Math.max(1, value || EMPTY_MEETING.date.month));
}

export async function loadImage(url: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("이미지를 불러오는 중 오류가 발생했습니다."));
    image.src = url;
  });
}

export async function sampleImageColorAt({
  url,
  x,
  y,
}: {
  url: string;
  x: number;
  y: number;
}) {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("캔버스를 초기화할 수 없습니다.");
  }

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function quantizeChannel(value: number) {
  return Math.round(value / 24) * 24;
}

export async function extractDominantColors(
  url: string,
  limit = 6
) {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("캔버스를 초기화할 수 없습니다.");
  }

  const sampleWidth = 48;
  const sampleHeight = Math.max(
    1,
    Math.round((sampleWidth * (image.naturalHeight || image.height)) / (image.naturalWidth || image.width))
  );

  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const data = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const counts = new Map<string, number>();

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];

    if (alpha < 160) {
      continue;
    }

    const red = quantizeChannel(data[index]);
    const green = quantizeChannel(data[index + 1]);
    const blue = quantizeChannel(data[index + 2]);

    if (
      Math.abs(red - green) < 10 &&
      Math.abs(green - blue) < 10 &&
      (red > 236 || red < 20)
    ) {
      continue;
    }

    const color = `#${[red, green, blue]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")}`;

    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([color]) => color);
}

export async function renderThumbnailBlob({
  backgroundColor,
  centerImageUrl,
}: {
  backgroundColor: string;
  centerImageUrl: string | null;
}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("캔버스를 초기화할 수 없습니다.");
  }

  canvas.width = 1600;
  canvas.height = 900;
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (centerImageUrl) {
    const image = await loadImage(centerImageUrl);
    const longestEdgeScale = 500 / Math.max(image.width, image.height);
    const frameMaxWidth = canvas.width * 0.42;
    const frameMaxHeight = canvas.height * 0.52;
    const scale = Math.min(
      longestEdgeScale,
      frameMaxWidth / image.width,
      frameMaxHeight / image.height,
      1
    );
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    context.drawImage(image, x, y, drawWidth, drawHeight);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("썸네일 PNG 생성에 실패했습니다."));
    }, "image/png");
  });
}
