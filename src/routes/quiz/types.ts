export type UploadMode = "pdf" | "png" | null;
export type Step = 1 | 2 | 3 | 4 | 5 | 6;
export type MeetingCategory = "정기모임" | "OT" | "미니정모" | "대이동";
export type SelectionRow = "quiz" | "answer";
export type DragRow = SelectionRow | "all";

export type ProcessedImage = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
};

export type ThumbnailAsset = {
  name: string;
  url: string;
};

export type Tags =
  | "EASY"
  | "HARD"
  | "DEDUCTION"
  | "PUZZLE"
  | "MATHEMATICS"
  | "LATERAL_THINKING"
  | "KNOWLEDGE"
  | "PATTERN"
  | "GEOMETRY"
  | "ADVENTURE"
  | "ONLY_FOR_MEETING"
  | "RIDDLE"
  | "ENIGMATIC"
  | "WORD"
  | "META";

export type QuizMetadata = {
  title: string;
  creators: string[];
  answer: string;
  tags: Tags[];
};

export interface QuizType {
  id: string;
  meetingId: string;
  quizNumber: number;
  title: string;
  creators: string[];
  quizImageSource: string;
  answer: string | null;
  tags: Tags[];
}

export interface MeetingType {
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
