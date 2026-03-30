import { useState } from "react";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";

const EMPTY_GRID = Array.from({ length: 16 }, () => "");
const EMPTY_CATEGORIES = Array.from({ length: 4 }, () => "");

const GROUP_COLORS = [
  {
    label: "쉬움",
    accent: "bg-[#f4dd67]",
    panel: "bg-[#f6e68f]",
    border: "border-[#e0cb5a]",
    text: "text-[#5e4800]",
  },
  {
    label: "중간",
    accent: "bg-[#9fd39c]",
    panel: "bg-[#b9e1b6]",
    border: "border-[#8dc188]",
    text: "text-[#244322]",
  },
  {
    label: "어려움",
    accent: "bg-[#96c4ed]",
    panel: "bg-[#b4d8f4]",
    border: "border-[#7fb4de]",
    text: "text-[#173d5d]",
  },
  {
    label: "매우 어려움",
    accent: "bg-[#b39ae6]",
    panel: "bg-[#cab8f1]",
    border: "border-[#9e86d3]",
    text: "text-[#433163]",
  },
] as const;

const SAMPLE_CATEGORIES = ["교통수단", "과일", "감정", "계절"];
const SAMPLE_WORDS = [
  "버스",
  "지하철",
  "택시",
  "자전거",
  "사과",
  "배",
  "복숭아",
  "포도",
  "기쁨",
  "분노",
  "슬픔",
  "사랑",
  "봄",
  "여름",
  "가을",
  "겨울",
];

function RuleModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200/70 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Builder Guide
            </p>
            <h2 className="mt-3 text-2xl font-semibold">게임 방법</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            닫기
          </button>
        </div>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
          <p className="font-semibold text-slate-900">
            공통된 주제를 가진 단어 4개를 묶어 그룹 4개를 만드세요.
          </p>
          <p>
            이 빌더는 플레이 화면이 아니라 제작 화면입니다. 노랑, 초록, 파랑,
            보라 각 행에 카테고리와 4개 단어를 함께 적어 퍼즐 구조를 바로 조립할
            수 있습니다.
          </p>
          <p>
            예시: 버스, 지하철, 택시, 자전거 → 교통수단 / 사랑, 슬픔, 기쁨, 분노
            → 감정
          </p>
          <p>
            그룹 난이도는 노랑, 초록, 파랑, 보라 순서로 정리했습니다. 더
            헷갈리는 그룹일수록 아래쪽 색을 쓰는 식으로 배치하면 검토가
            편합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [cells, setCells] = useState<string[]>(EMPTY_GRID);
  const [categories, setCategories] = useState<string[]>(EMPTY_CATEGORIES);

  const filledCount = cells.filter((cell) => cell.trim() !== "").length;

  const updateCell = (index: number, value: string) => {
    setCells((current) =>
      current.map((cell, cellIndex) => (cellIndex === index ? value : cell))
    );
  };

  const updateCategory = (index: number, value: string) => {
    setCategories((current) =>
      current.map((category, categoryIndex) =>
        categoryIndex === index ? value : category
      )
    );
  };

  const fillSample = () => {
    setCells(SAMPLE_WORDS);
    setCategories(SAMPLE_CATEGORIES);
  };

  const clearAll = () => {
    setCells(EMPTY_GRID);
    setCategories(EMPTY_CATEGORIES);
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
      />

      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-stone-200 bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <LinkButton
                path={ROUTES.home}
                className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-white"
              >
                Home
              </LinkButton>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Connections Builder
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  추러스 커넥션
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                  같은 맥락의 단어 4개씩 묶이는 커넥션 퍼즐을 설계하세요. 이제
                  카테고리와 단어가 각 색상 행 안에서 같이 편집됩니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(true)}
                className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50"
              >
                게임 방법
              </button>
              <button
                type="button"
                onClick={fillSample}
                className="inline-flex items-center rounded-full border border-stone-900/10 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                예시 채우기
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-200"
              >
                전체 비우기
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                Integrated Groups
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                카테고리와 단어를 한 줄씩 설계
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                각 색상 행이 하나의 정답 그룹입니다. 카테고리 이름과 4개 단어를
                같은 블록 안에서 함께 다듬으면 실제 커넥션 퍼즐 구조를 더 바로
                볼 수 있습니다.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <span className="font-semibold text-slate-900">
                {filledCount}
              </span>
              /16 입력됨
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {GROUP_COLORS.map((color, groupIndex) => {
              const wordStartIndex = groupIndex * 4;
              const words = cells.slice(wordStartIndex, wordStartIndex + 4);

              return (
                <section
                  key={color.label}
                  className={`rounded-[1.75rem] border p-4 sm:p-5 ${color.panel} ${color.border}`}
                >
                  <div className="grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)] xl:items-start">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`text-sm font-semibold uppercase tracking-[0.22em] ${color.text}`}
                        >
                          Group {groupIndex + 1}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold text-slate-900 ${color.accent}`}
                        >
                          {color.label}
                        </span>
                      </div>

                      <label className="mt-4 block">
                        <span
                          className={`mb-2 block text-xs font-medium uppercase tracking-[0.18em] ${color.text}`}
                        >
                          카테고리 이름
                        </span>
                        <input
                          type="text"
                          value={categories[groupIndex]}
                          onChange={(event) =>
                            updateCategory(groupIndex, event.target.value)
                          }
                          placeholder="예: 교통수단"
                          className="w-full rounded-2xl border border-slate-900/10 bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900/25 focus:bg-white"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {words.map((word, wordIndex) => {
                        const cellIndex = wordStartIndex + wordIndex;

                        return (
                          <label key={cellIndex} className="block">
                            <span
                              className={`mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${color.text}`}
                            >
                              Word {wordIndex + 1}
                            </span>
                            <input
                              type="text"
                              value={word}
                              onChange={(event) =>
                                updateCell(cellIndex, event.target.value)
                              }
                              placeholder="단어 입력"
                              className="h-24 w-full rounded-[1.5rem] border border-slate-900/10 bg-white/80 px-4 text-center text-lg font-semibold text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-slate-900/25 focus:bg-white"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
