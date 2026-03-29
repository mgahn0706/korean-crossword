import type { MeetingCategory, MeetingType, Tags } from "./types";

export const QUIZ_TAG_KOREAN_NAME: Record<Tags, string> = {
  EASY: "쉬움",
  HARD: "어려움",
  DEDUCTION: "연역 추리",
  PUZZLE: "퍼즐",
  MATHEMATICS: "수학",
  LATERAL_THINKING: "발상 전환",
  KNOWLEDGE: "사전 지식",
  PATTERN: "패턴",
  GEOMETRY: "도형",
  ADVENTURE: "대이동",
  ONLY_FOR_MEETING: "정기모임 전용",
  RIDDLE: "수수께끼",
  ENIGMATIC: "암호형",
  WORD: "언어",
  META: "메타",
};

export const QUIZ_TAGS = Object.keys(QUIZ_TAG_KOREAN_NAME) as Tags[];

export const EMPTY_MEETING: MeetingType = {
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

export const DEFAULT_MEETING_CATEGORY: MeetingCategory = "정기모임";
