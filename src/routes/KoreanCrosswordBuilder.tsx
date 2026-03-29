import { assemble, canBeJungseong } from "es-hangul";
import { startTransition, useEffect, useRef, useState } from "react";
import { Grid } from "../components/Grid";
import type { CellValue, CrosswordGrid } from "../lib/crossword/types";
import LinkButton from "./LinkButton";
import { ROUTES } from "./config";
import "../App.css";

const DEFAULT_ROWS = 5;
const DEFAULT_COLS = 5;
const DEFAULT_ATTEMPT_COUNT = 5;
type SymmetryMode = "rotational" | "horizontal" | "vertical" | "none";

type WorkerResponse =
  | { id: number; success: true; grid: CrosswordGrid }
  | { id: number; success: false; reason: string };

type WorkerRequest = {
  id: number;
  grid: CrosswordGrid;
  customWords: string[];
  attemptCount: number;
};
type FeatureMode = "grid" | "lookup" | "clue";
type ClueDirection = "Across" | "Down";
type ClueEntry = {
  id: string;
  startRow: number;
  startCol: number;
  number: number;
  direction: ClueDirection;
  answer: string;
  length: number;
};
type ExportClue = {
  label: string;
  text: string;
};
type DictionarySets = {
  common: Set<string>;
  additional: Set<string>;
  abbreviation: Set<string>;
  all: Set<string>;
};
type ClueValidation = "incomplete" | "loading" | "common" | "noun" | "missing";

const FEATURE_MODE_LABELS: Record<FeatureMode, string> = {
  grid: "격자 개요",
  lookup: "단어 찾기",
  clue: "힌트 작성",
};
const CLUE_STATUS_LABELS: Record<ClueValidation, string> = {
  incomplete: "미완성",
  loading: "로딩 중",
  common: "쉬운 단어",
  noun: "사전 등록 단어",
  missing: "사전 미등록 단어",
};
const DEFAULT_EXPORT_TITLE = "한국어 크로스워드";

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 2.5h11v11h-11zM2.5 6h11M2.5 10h11M6 2.5v11M10 2.5v11" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.5 10.5 13.5 13.5" />
    </svg>
  );
}

function ClueIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m3 11.75 1.9-.4 6.35-6.35-1.5-1.5L3.4 9.85zm7.1-8.6 1.5 1.5 1-1a1.06 1.06 0 0 0 0-1.5 1.06 1.06 0 0 0-1.5 0z" />
      <path d="M3 13.25h10" />
    </svg>
  );
}

function ExportPngIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
      <circle cx="6" cy="6.25" r="1.1" />
      <path d="m4 11 2.3-2.3 1.8 1.8 2.2-2.2 1.7 1.7" />
    </svg>
  );
}

function ExportPdfIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
      <path d="M5.25 9.25h5.5M5.25 11.5h5.5" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.5v7" />
      <path d="m5.25 7.75 2.75 2.75 2.75-2.75" />
      <path d="M3 12.5h10" />
    </svg>
  );
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapExportText(text: string, limit: number) {
  const trimmed = text.trim();

  if (trimmed === "") {
    return ["미작성"];
  }

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current === "" ? word : `${current} ${word}`;

    if (next.length <= limit) {
      current = next;
      continue;
    }

    if (current !== "") {
      lines.push(current);
      current = word;
      continue;
    }

    let remaining = word;

    while (remaining.length > limit) {
      lines.push(remaining.slice(0, limit));
      remaining = remaining.slice(limit);
    }

    current = remaining;
  }

  if (current !== "") {
    lines.push(current);
  }

  return lines.length > 0 ? lines : ["미작성"];
}

function buildExportSvg(
  title: string,
  includeAnswers: boolean,
  grid: CrosswordGrid,
  cellNumbers: Map<string, number>,
  topBarCells: Set<string>,
  bottomBarCells: Set<string>,
  leftBarCells: Set<string>,
  rightBarCells: Set<string>,
  acrossClues: ExportClue[],
  downClues: ExportClue[]
) {
  const cellSize = 36;
  const margin = 40;
  const gridWidth = (grid[0]?.length ?? 0) * cellSize;
  const gridHeight = grid.length * cellSize;
  const clueX = margin + gridWidth + 48;
  const clueWidth = 360;
  const totalWidth = clueX + clueWidth + margin;
  const titleY = margin;
  const gridY = titleY + 28;

  let acrossY = gridY;
  const acrossMarkup: string[] = [
    `<text x="${clueX}" y="${acrossY}" font-size="16" font-weight="700" fill="#111827">가로</text>`,
  ];
  acrossY += 24;

  for (const clue of acrossClues) {
    const lines = wrapExportText(`${clue.label}. ${clue.text}`, 26);
    lines.forEach((line, index) => {
      acrossMarkup.push(
        `<text x="${clueX}" y="${acrossY}" font-size="13" fill="#1f2937">${escapeXml(
          line
        )}</text>`
      );
      acrossY += index === lines.length - 1 ? 22 : 18;
    });
  }

  acrossY += 14;

  const downMarkup: string[] = [
    `<text x="${clueX}" y="${acrossY}" font-size="16" font-weight="700" fill="#111827">세로</text>`,
  ];
  acrossY += 24;

  for (const clue of downClues) {
    const lines = wrapExportText(`${clue.label}. ${clue.text}`, 26);
    lines.forEach((line, index) => {
      downMarkup.push(
        `<text x="${clueX}" y="${acrossY}" font-size="13" fill="#1f2937">${escapeXml(
          line
        )}</text>`
      );
      acrossY += index === lines.length - 1 ? 22 : 18;
    });
  }

  const totalHeight = Math.max(gridY + gridHeight + margin, acrossY + margin);
  const cellsMarkup: string[] = [];

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < (grid[0]?.length ?? 0); colIndex += 1) {
      const value = grid[rowIndex][colIndex];
      const x = margin + colIndex * cellSize;
      const y = gridY + rowIndex * cellSize;
      const cellKey = `${rowIndex}:${colIndex}`;
      const isBlack = value === "#";

      cellsMarkup.push(
        `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${
          isBlack ? "#111111" : "#ffffff"
        }" stroke="#111111" stroke-width="1.25" />`
      );

      if (!isBlack) {
        const number = cellNumbers.get(cellKey);

        if (number != null) {
          cellsMarkup.push(
            `<text x="${x + 4}" y="${
              y + 9
            }" font-size="8" font-weight="700" fill="#374151">${number}</text>`
          );
        }

        if (includeAnswers && value !== "") {
          cellsMarkup.push(
            `<text x="${x + cellSize / 2}" y="${
              y + cellSize / 2 + 7
            }" text-anchor="middle" font-size="20" font-weight="600" fill="#111827">${escapeXml(
              value
            )}</text>`
          );
        }
      }

      if (topBarCells.has(cellKey)) {
        cellsMarkup.push(
          `<line x1="${x + 1.5}" y1="${y + 3}" x2="${x + cellSize - 1.5}" y2="${
            y + 3
          }" stroke="#111111" stroke-width="3" />`
        );
      }

      if (bottomBarCells.has(cellKey)) {
        cellsMarkup.push(
          `<line x1="${x + 1.5}" y1="${y + cellSize - 3}" x2="${
            x + cellSize - 1.5
          }" y2="${y + cellSize - 3}" stroke="#111111" stroke-width="3" />`
        );
      }

      if (leftBarCells.has(cellKey)) {
        cellsMarkup.push(
          `<line x1="${x + 3}" y1="${y + 1.5}" x2="${x + 3}" y2="${
            y + cellSize - 1.5
          }" stroke="#111111" stroke-width="3" />`
        );
      }

      if (rightBarCells.has(cellKey)) {
        cellsMarkup.push(
          `<line x1="${x + cellSize - 3}" y1="${y + 1.5}" x2="${
            x + cellSize - 3
          }" y2="${y + cellSize - 1.5}" stroke="#111111" stroke-width="3" />`
        );
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
      <rect width="100%" height="100%" fill="#f8f8f6" />
      <text x="${margin}" y="${titleY}" font-size="22" font-weight="700" fill="#111827">${escapeXml(
    title.trim() === "" ? DEFAULT_EXPORT_TITLE : title
  )}</text>
      ${cellsMarkup.join("")}
      ${acrossMarkup.join("")}
      ${downMarkup.join("")}
    </svg>
  `.trim();
}

function getClueEntries(grid: CrosswordGrid): ClueEntry[] {
  const entries: ClueEntry[] = [];
  let nextNumber = 1;
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      if (grid[rowIndex][colIndex] === "#") {
        continue;
      }

      const startsAcross =
        (colIndex === 0 || grid[rowIndex][colIndex - 1] === "#") &&
        colIndex + 1 < colCount &&
        grid[rowIndex][colIndex + 1] !== "#";
      const startsDown =
        (rowIndex === 0 || grid[rowIndex - 1][colIndex] === "#") &&
        rowIndex + 1 < rowCount &&
        grid[rowIndex + 1][colIndex] !== "#";

      const clueNumber = startsAcross || startsDown ? nextNumber : null;

      if (startsAcross && clueNumber != null) {
        let endCol = colIndex;
        while (endCol < colCount && grid[rowIndex][endCol] !== "#") {
          endCol += 1;
        }

        entries.push({
          id: `across-${rowIndex}-${colIndex}`,
          startRow: rowIndex,
          startCol: colIndex,
          number: clueNumber,
          direction: "Across",
          answer: assembleAnswer(grid[rowIndex].slice(colIndex, endCol)),
          length: endCol - colIndex,
        });
      }

      if (startsDown && clueNumber != null) {
        let endRow = rowIndex;
        const answer: string[] = [];

        while (endRow < rowCount && grid[endRow][colIndex] !== "#") {
          answer.push(grid[endRow][colIndex]);
          endRow += 1;
        }

        entries.push({
          id: `down-${rowIndex}-${colIndex}`,
          startRow: rowIndex,
          startCol: colIndex,
          number: clueNumber,
          direction: "Down",
          answer: assembleAnswer(answer),
          length: endRow - rowIndex,
        });
      }

      if (clueNumber != null) {
        nextNumber += 1;
      }
    }
  }

  return entries;
}

function getVisibleCellNumbers(
  grid: CrosswordGrid,
  clueEntries: ClueEntry[],
  hiddenClueIds: Set<string>
) {
  const numbers = new Map<string, number>();
  let nextNumber = 1;
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      if (grid[rowIndex][colIndex] === "#") {
        continue;
      }

      const key = `${rowIndex}:${colIndex}`;
      const hasVisibleClue = clueEntries.some(
        (entry) =>
          entry.startRow === rowIndex &&
          entry.startCol === colIndex &&
          !hiddenClueIds.has(entry.id)
      );

      if (hasVisibleClue) {
        numbers.set(key, nextNumber);
        nextNumber += 1;
      }
    }
  }

  return numbers;
}

function getHiddenBars(hiddenEntries: ClueEntry[]) {
  const topBars = new Set<string>();
  const bottomBars = new Set<string>();
  const leftBars = new Set<string>();
  const rightBars = new Set<string>();

  for (const entry of hiddenEntries) {
    if (entry.direction === "Across") {
      for (let offset = 0; offset < entry.length; offset += 1) {
        const cellKey = `${entry.startRow}:${entry.startCol + offset}`;
        leftBars.add(cellKey);
        if (offset === entry.length - 1) {
          rightBars.add(cellKey);
        }
      }
      continue;
    }

    for (let offset = 0; offset < entry.length; offset += 1) {
      const cellKey = `${entry.startRow + offset}:${entry.startCol}`;
      topBars.add(cellKey);
      if (offset === entry.length - 1) {
        bottomBars.add(cellKey);
      }
    }
  }

  return { topBars, bottomBars, leftBars, rightBars };
}

function assembleAnswer(cells: Array<CellValue>): string {
  const parts: string[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }

    const fragments = canBeJungseong(buffer[0]) ? ["ㅇ", ...buffer] : buffer;
    try {
      parts.push(assemble(fragments));
    } catch {
      parts.push(buffer.join(""));
    }
    buffer = [];
  };

  for (const cell of cells) {
    if (cell === "" || cell === "#") {
      flushBuffer();

      if (cell === "") {
        parts.push("·");
      }
      continue;
    }

    buffer.push(cell);
  }

  flushBuffer();

  return parts.join("");
}

function createGrid(rows: number, cols: number): CrosswordGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
}

function resizeGrid(
  currentGrid: CrosswordGrid,
  nextRows: number,
  nextCols: number
): CrosswordGrid {
  return Array.from({ length: nextRows }, (_, rowIndex) =>
    Array.from(
      { length: nextCols },
      (_, colIndex) => currentGrid[rowIndex]?.[colIndex] ?? ""
    )
  );
}

function parseGridDimension(value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : null;
}

function getSymmetricCells(
  rowIndex: number,
  colIndex: number,
  rowCount: number,
  colCount: number,
  symmetry: SymmetryMode
) {
  const positions = [{ row: rowIndex, col: colIndex }];

  if (symmetry === "rotational") {
    positions.push({
      row: rowCount - 1 - rowIndex,
      col: colCount - 1 - colIndex,
    });
  }

  if (symmetry === "horizontal") {
    positions.push({ row: rowCount - 1 - rowIndex, col: colIndex });
  }

  if (symmetry === "vertical") {
    positions.push({ row: rowIndex, col: colCount - 1 - colIndex });
  }

  return Array.from(
    new Map(
      positions.map((position) => [`${position.row}:${position.col}`, position])
    ).values()
  );
}

export default function KoreanCrosswordBuilder() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rowsInput, setRowsInput] = useState(String(DEFAULT_ROWS));
  const [colsInput, setColsInput] = useState(String(DEFAULT_COLS));
  const [attemptCount, setAttemptCount] = useState(DEFAULT_ATTEMPT_COUNT);
  const [grid, setGrid] = useState<CrosswordGrid>(() =>
    createGrid(DEFAULT_ROWS, DEFAULT_COLS)
  );
  const [symmetry, setSymmetry] = useState<SymmetryMode>("rotational");
  const [activeMode, setActiveMode] = useState<FeatureMode>("grid");
  const [customWordText] = useState("");
  const [exportTitle, setExportTitle] = useState(DEFAULT_EXPORT_TITLE);
  const [lookupQuery, setLookupQuery] = useState("");
  const [clueTexts, setClueTexts] = useState<Record<string, string>>({});
  const [hiddenClueIds, setHiddenClueIds] = useState<Set<string>>(new Set());
  const [dictionarySets, setDictionarySets] = useState<DictionarySets | null>(
    null
  );
  const [isSolving, setIsSolving] = useState(false);
  const [status, setStatus] = useState("격자 추천을 시작할 수 있습니다.");
  const [exportIncludeAnswers, setExportIncludeAnswers] = useState(true);
  const workerRef = useRef<Worker | null>(null);
  const exportDialogRef = useRef<HTMLDialogElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (activeMode !== "clue" || dictionarySets != null) {
      return;
    }

    let isCancelled = false;

    void Promise.all([
      import("../fixtures/koreanNounLists"),
      import("../fixtures/additionalWordLists"),
      import("../fixtures/koreanDictionaryWords"),
      import("../fixtures/abbreviationWordLists"),
    ]).then(
      ([
        { COMMON_NOUNS },
        { ADDITIONAL_WORD_LIST },
        { KOREAN_DICTIONARY_WORDS },
        { ABBREVIATION_WORD_LIST },
      ]) => {
        if (!isCancelled) {
          setDictionarySets({
            common: COMMON_NOUNS,
            additional: ADDITIONAL_WORD_LIST,
            abbreviation: ABBREVIATION_WORD_LIST,
            all: new Set([...KOREAN_DICTIONARY_WORDS, ...ADDITIONAL_WORD_LIST]),
          });
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [activeMode, dictionarySets]);

  const getWorker = () => {
    if (workerRef.current == null) {
      workerRef.current = new Worker(
        new URL("../workers/crosswordWorker.ts", import.meta.url),
        {
          type: "module",
        }
      );
    }

    return workerRef.current;
  };

  const handleRowsChange = (value: number) => {
    const nextRows = Math.max(1, value || 1);
    setRows(nextRows);
    setRowsInput(String(nextRows));
    setGrid((currentGrid) => resizeGrid(currentGrid, nextRows, cols));
  };

  const handleColsChange = (value: number) => {
    const nextCols = Math.max(1, value || 1);
    setCols(nextCols);
    setColsInput(String(nextCols));
    setGrid((currentGrid) => resizeGrid(currentGrid, rows, nextCols));
  };

  const commitRowsInput = () => {
    const parsed = parseGridDimension(rowsInput);

    if (parsed == null) {
      setRowsInput(String(rows));
      return;
    }

    handleRowsChange(parsed);
  };

  const commitColsInput = () => {
    const parsed = parseGridDimension(colsInput);

    if (parsed == null) {
      setColsInput(String(cols));
      return;
    }

    handleColsChange(parsed);
  };

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: CellValue
  ) => {
    setGrid((currentGrid) => {
      const nextGrid = currentGrid.map((row) => [...row]);
      const currentCell = currentGrid[rowIndex][colIndex];
      const affectsSymmetry =
        value === "#" || (currentCell === "#" && value !== "#");

      if (affectsSymmetry && symmetry !== "none") {
        for (const position of getSymmetricCells(
          rowIndex,
          colIndex,
          currentGrid.length,
          currentGrid[0]?.length ?? 0,
          symmetry
        )) {
          nextGrid[position.row][position.col] = value === "#" ? "#" : "";
        }
      }

      nextGrid[rowIndex][colIndex] = value;
      return nextGrid;
    });
  };

  const handleClearGrid = () => {
    setGrid((currentGrid) =>
      currentGrid.map((row) => row.map((cell) => (cell === "#" ? "#" : "")))
    );
    setHiddenClueIds(new Set());
    setStatus("글자를 지웠습니다.");
  };

  const handleClearAll = () => {
    setGrid(createGrid(rows, cols));
    setHiddenClueIds(new Set());
    setStatus("격자와 검은 칸을 모두 지웠습니다.");
  };

  const handleRecommendFill = async () => {
    const worker = getWorker();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const customWords = customWordText
      .split(/\r?\n|,/)
      .map((word) => word.trim())
      .filter(Boolean);

    setIsSolving(true);
    setStatus(
      "유효하지 않은 단어를 최소화하면서 흔한 명사와 가로세로 균형을 우선해 격자를 찾는 중입니다."
    );

    const result = await new Promise<WorkerResponse>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== requestId) {
          return;
        }

        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        resolve(event.data);
      };

      const handleError = () => {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        reject(new Error("크로스워드 작업기가 중단되었습니다."));
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError, { once: true });
      const payload: WorkerRequest = {
        id: requestId,
        grid,
        customWords,
        attemptCount,
      };
      worker.postMessage(payload);
    }).finally(() => {
      setIsSolving(false);
    });

    if (result.success) {
      startTransition(() => {
        setGrid(result.grid);
      });
      setStatus("추천 격자를 적용했습니다.");
      return;
    }

    setStatus(result.reason);
  };

  const lookupUrl =
    lookupQuery.trim() === ""
      ? "https://ko.dict.naver.com/#/search"
      : `https://ko.dict.naver.com/#/search?query=${encodeURIComponent(
          lookupQuery.trim()
        )}`;
  const clueEntries = getClueEntries(grid);
  const acrossClues = clueEntries.filter(
    (entry) => entry.direction === "Across"
  );
  const downClues = clueEntries.filter((entry) => entry.direction === "Down");
  const duplicateAnswerCounts = clueEntries.reduce((counts, entry) => {
    if (!entry.answer.includes("·")) {
      counts.set(entry.answer, (counts.get(entry.answer) ?? 0) + 1);
    }

    return counts;
  }, new Map<string, number>());
  const getValidation = (answer: string): ClueValidation => {
    if (answer.includes("·")) {
      return "incomplete";
    }

    if (dictionarySets == null) {
      return "loading";
    }

    if (dictionarySets.common.has(answer)) {
      return "common";
    }

    if (dictionarySets.all.has(answer)) {
      return "noun";
    }

    return "missing";
  };
  const usesAdditionalWord = (answer: string) => {
    if (answer.includes("·") || dictionarySets == null) {
      return false;
    }

    return dictionarySets.additional.has(answer);
  };
  const usesAbbreviationWord = (answer: string) => {
    if (answer.includes("·") || dictionarySets == null) {
      return false;
    }

    return dictionarySets.abbreviation.has(answer);
  };
  const isDuplicateAnswer = (answer: string) =>
    (duplicateAnswerCounts.get(answer) ?? 0) > 1;
  const totalEntryLength = clueEntries.reduce(
    (sum, entry) => sum + entry.length,
    0
  );
  const invalidEntryCount = clueEntries.reduce(
    (count, entry) =>
      count + (getValidation(entry.answer) === "missing" ? 1 : 0),
    0
  );
  const filledEntryCount = clueEntries.reduce(
    (count, entry) => count + (!entry.answer.includes("·") ? 1 : 0),
    0
  );
  const averageEntryLength =
    clueEntries.length > 0
      ? (totalEntryLength / clueEntries.length).toFixed(1)
      : "0.0";
  const longestEntryLength = clueEntries.reduce(
    (max, entry) => Math.max(max, entry.length),
    0
  );
  const cellNumbers = getVisibleCellNumbers(grid, clueEntries, hiddenClueIds);
  const hiddenEntries = clueEntries.filter((entry) =>
    hiddenClueIds.has(entry.id)
  );
  const hiddenBars = getHiddenBars(hiddenEntries);
  const visibleAcrossClues = acrossClues.filter(
    (entry) => !hiddenClueIds.has(entry.id)
  );
  const visibleDownClues = downClues.filter(
    (entry) => !hiddenClueIds.has(entry.id)
  );
  const exportAcrossClues = visibleAcrossClues.map((entry) => ({
    label: `${entry.number}A`,
    text: clueTexts[entry.id]?.trim() || `${entry.length}칸`,
  }));
  const exportDownClues = visibleDownClues.map((entry) => ({
    label: `${entry.number}D`,
    text: clueTexts[entry.id]?.trim() || `${entry.length}칸`,
  }));

  const getExportSvg = () =>
    buildExportSvg(
      exportTitle,
      exportIncludeAnswers,
      grid,
      cellNumbers,
      hiddenBars.topBars,
      hiddenBars.bottomBars,
      hiddenBars.leftBars,
      hiddenBars.rightBars,
      exportAcrossClues,
      exportDownClues
    );

  const handleExportPng = async () => {
    const svgMarkup = getExportSvg();
    const svgBlob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      image.decoding = "async";

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("PNG 내보내기에 실패했습니다."));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (context == null) {
        throw new Error("PNG 캔버스를 만들 수 없습니다.");
      }

      context.fillStyle = "#f8f8f6";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "korean-crossword.png";
      link.click();
      setStatus("PNG 파일을 내보냈습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "PNG 내보내기에 실패했습니다."
      );
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const handleExportPdf = () => {
    const exportWindow = window.open("", "_blank", "width=1100,height=850");

    if (exportWindow == null) {
      setStatus("PDF 내보내기 창을 열 수 없습니다.");
      return;
    }

    exportWindow.document.write(`<!doctype html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeXml(
            exportTitle.trim() === "" ? DEFAULT_EXPORT_TITLE : exportTitle
          )}</title>
          <style>
            body { margin: 0; padding: 32px; font-family: Apple SD Gothic Neo, Malgun Gothic, sans-serif; background: #f8f8f6; color: #111827; }
            .print-shell { display: grid; gap: 24px; }
            .print-card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 24px; }
            .print-grid svg { display: block; width: 100%; height: auto; }
            @media print { body { padding: 0; background: #ffffff; } .print-card { border: 0; padding: 18px 24px; } }
          </style>
        </head>
        <body>
          <div class="print-shell">
            <section class="print-card print-grid">${getExportSvg()}</section>
          </div>
          <script>
            window.addEventListener("load", () => {
              window.setTimeout(() => {
                window.focus();
                window.print();
              }, 150);
            });
          </script>
        </body>
      </html>`);
    exportWindow.document.close();
    setStatus("PDF로 저장할 수 있는 인쇄 창을 열었습니다.");
  };

  const openExportDialog = () => {
    exportDialogRef.current?.showModal();
  };

  const closeExportDialog = () => {
    exportDialogRef.current?.close();
  };

  return (
    <main className="builder-shell">
      <header className="app-header">
        <div className="builder-copy">
          <p className="eyebrow">Korean Crossword Builder</p>
          <h1>한국어 크로스워드 빌더</h1>
        </div>

        <div className="header-controls">
          <LinkButton path={ROUTES.home} className="export-trigger">
            홈
          </LinkButton>

          <button
            type="button"
            className="export-trigger"
            onClick={openExportDialog}
          >
            <span className="button-icon" aria-hidden="true">
              <ExportIcon />
            </span>
            내보내기
          </button>

          <nav className="mode-switch" aria-label="기능 모드">
            {(
              Object.entries(FEATURE_MODE_LABELS) as Array<
                [FeatureMode, string]
              >
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`mode-button${
                  activeMode === mode ? " mode-button-active" : ""
                }`}
                onClick={() => setActiveMode(mode)}
              >
                <span className="button-icon" aria-hidden="true">
                  {mode === "grid" ? <GridIcon /> : null}
                  {mode === "lookup" ? <SearchIcon /> : null}
                  {mode === "clue" ? <ClueIcon /> : null}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="workspace-shell">
        <section className="grid-panel">
          <Grid
            grid={grid}
            onCellChange={handleCellChange}
            cellNumbers={cellNumbers}
            topBarCells={hiddenBars.topBars}
            bottomBarCells={hiddenBars.bottomBars}
            leftBarCells={hiddenBars.leftBars}
            rightBarCells={hiddenBars.rightBars}
          />
        </section>

        <aside className="builder-panel">
          {activeMode === "grid" ? (
            <div className="config-stack">
              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">격자 설정</p>
                </div>

                <div className="controls controls-two-column">
                  <label className="field field-full">
                    <span>제목</span>
                    <input
                      type="text"
                      value={exportTitle}
                      onChange={(event) => setExportTitle(event.target.value)}
                      placeholder="제목을 입력하세요"
                    />
                  </label>

                  <label className="field">
                    <span>행</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={rowsInput}
                      onChange={(event) => setRowsInput(event.target.value)}
                      onBlur={commitRowsInput}
                    />
                  </label>

                  <label className="field">
                    <span>열</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={colsInput}
                      onChange={(event) => setColsInput(event.target.value)}
                      onBlur={commitColsInput}
                    />
                  </label>

                  <label className="field field-full">
                    <span>대칭</span>
                    <select
                      value={symmetry}
                      onChange={(event) =>
                        setSymmetry(event.target.value as SymmetryMode)
                      }
                    >
                      <option value="rotational">회전 대칭</option>
                      <option value="horizontal">가로 대칭</option>
                      <option value="vertical">세로 대칭</option>
                      <option value="none">없음</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">격자 통계</p>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stats-label">단어 수</span>
                    <strong>{clueEntries.length}</strong>
                    <p>
                      가로 {acrossClues.length}개, 세로 {downClues.length}개
                    </p>
                  </div>
                  <div className="stat-card">
                    <span className="stats-label">단어 길이</span>
                    <strong>{averageEntryLength}</strong>
                    <p>평균, 최장 {longestEntryLength}</p>
                  </div>
                  <div className="stat-card">
                    <span className="stats-label">사전 미등록 단어 수</span>
                    <strong>{invalidEntryCount}</strong>
                    <p>완성된 단어 {filledEntryCount}개</p>
                  </div>
                </div>
              </section>

              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">격자 채우기</p>
                </div>

                <div className="controls">
                  <label className="field">
                    <span className="field-label-with-help">
                      추천 시도 횟수
                      <span
                        className="help-tooltip"
                        tabIndex={0}
                        aria-label="시도 횟수를 늘리면 더 유효한 격자를 찾을 가능성이 높아지지만 추천 시간이 더 오래 걸립니다."
                      >
                        ?
                        <span className="help-tooltip-bubble" role="tooltip">
                          시도 횟수를 늘리면 더 유효한 격자를 찾을 가능성이
                          높아지지만 추천 시간은 더 오래 걸립니다.
                        </span>
                      </span>
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={attemptCount}
                      onChange={(event) =>
                        setAttemptCount(
                          Math.min(
                            20,
                            Math.max(1, event.target.valueAsNumber || 1)
                          )
                        )
                      }
                    />
                  </label>
                </div>

                <div className="actions">
                  <div className="action-row">
                    <button
                      className="action-button action-button-secondary"
                      type="button"
                      onClick={handleClearGrid}
                      disabled={isSolving}
                    >
                      글자 지우기
                    </button>
                    <button
                      className="action-button action-button-secondary"
                      type="button"
                      onClick={handleClearAll}
                      disabled={isSolving}
                    >
                      모두 지우기
                    </button>
                  </div>
                  <button
                    className="action-button action-button-primary"
                    type="button"
                    onClick={() => void handleRecommendFill()}
                    disabled={isSolving}
                  >
                    {isSolving ? "격자 채우는 중..." : "격자 추천"}
                  </button>
                  <p className="status-text">{status}</p>
                </div>
              </section>
            </div>
          ) : null}

          {activeMode === "lookup" ? (
            <div className="config-stack">
              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">검색</p>
                </div>

                <label className="field">
                  <span>검색어</span>
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(event) => setLookupQuery(event.target.value)}
                    placeholder="단어를 검색하세요"
                  />
                </label>

                <p className="helper-text">
                  입력한 검색어로 네이버 국어사전 검색 결과를 엽니다.
                </p>

                <div className="lookup-results">
                  <a
                    className="lookup-link"
                    href={lookupUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    사전에서 검색하기
                  </a>
                </div>
              </section>
            </div>
          ) : null}

          {activeMode === "clue" ? (
            <div className="config-stack">
              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">가로</p>
                </div>

                <div className="clue-list">
                  {acrossClues.length > 0 ? (
                    acrossClues.map((entry) => {
                      const validation = getValidation(entry.answer);
                      const isAbbreviation = usesAbbreviationWord(entry.answer);
                      const isAdditional = usesAdditionalWord(entry.answer);

                      return (
                        <label key={entry.id} className="clue-item">
                          <div className="clue-meta">
                            <strong>{entry.number}A</strong>
                            <span className="clue-answer">
                              {entry.answer} ({entry.length})
                            </span>
                            {isDuplicateAnswer(entry.answer) ? (
                              <span className="clue-warning">중복</span>
                            ) : null}
                            {isAbbreviation ? (
                              <span className="clue-badge">초성</span>
                            ) : null}
                            {isAdditional && !isAbbreviation ? (
                              <span className="clue-badge">추가 단어</span>
                            ) : null}
                            <span
                              className={`clue-status clue-status-${validation}`}
                            >
                              {CLUE_STATUS_LABELS[validation]}
                            </span>
                            {validation === "missing" ? (
                              <button
                                type="button"
                                className="clue-toggle"
                                onClick={() =>
                                  setHiddenClueIds((current) => {
                                    const next = new Set(current);
                                    if (next.has(entry.id)) {
                                      next.delete(entry.id);
                                    } else {
                                      next.add(entry.id);
                                    }
                                    return next;
                                  })
                                }
                              >
                                {hiddenClueIds.has(entry.id) ? "복원" : "숨김"}
                              </button>
                            ) : null}
                          </div>
                          <input
                            type="text"
                            value={clueTexts[entry.id] ?? ""}
                            onChange={(event) =>
                              setClueTexts((current) => ({
                                ...current,
                                [entry.id]: event.target.value,
                              }))
                            }
                            placeholder="가로 힌트를 입력하세요"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <p className="empty-state">아직 가로 힌트가 없습니다.</p>
                  )}
                </div>
              </section>

              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">세로</p>
                </div>

                <div className="clue-list">
                  {downClues.length > 0 ? (
                    downClues.map((entry) => {
                      const validation = getValidation(entry.answer);
                      const isAbbreviation = usesAbbreviationWord(entry.answer);
                      const isAdditional = usesAdditionalWord(entry.answer);

                      return (
                        <label key={entry.id} className="clue-item">
                          <div className="clue-meta">
                            <strong>{entry.number}D</strong>
                            <span className="clue-answer">
                              {entry.answer} ({entry.length})
                            </span>
                            {isDuplicateAnswer(entry.answer) ? (
                              <span className="clue-warning">중복</span>
                            ) : null}
                            {isAbbreviation ? (
                              <span className="clue-badge">초성</span>
                            ) : null}
                            {isAdditional && !isAbbreviation ? (
                              <span className="clue-badge">추가 단어</span>
                            ) : null}
                            <span
                              className={`clue-status clue-status-${validation}`}
                            >
                              {CLUE_STATUS_LABELS[validation]}
                            </span>
                            {validation === "missing" ? (
                              <button
                                type="button"
                                className="clue-toggle"
                                onClick={() =>
                                  setHiddenClueIds((current) => {
                                    const next = new Set(current);
                                    if (next.has(entry.id)) {
                                      next.delete(entry.id);
                                    } else {
                                      next.add(entry.id);
                                    }
                                    return next;
                                  })
                                }
                              >
                                {hiddenClueIds.has(entry.id) ? "복원" : "숨김"}
                              </button>
                            ) : null}
                          </div>
                          <input
                            type="text"
                            value={clueTexts[entry.id] ?? ""}
                            onChange={(event) =>
                              setClueTexts((current) => ({
                                ...current,
                                [entry.id]: event.target.value,
                              }))
                            }
                            placeholder="세로 힌트를 입력하세요"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <p className="empty-state">아직 세로 힌트가 없습니다.</p>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </aside>
      </div>

      <dialog ref={exportDialogRef} className="export-dialog">
        <form method="dialog" className="export-dialog-card">
          <div className="export-dialog-header">
            <div>
              <p className="section-eyebrow">내보내기</p>
              <h2>형식을 선택하세요</h2>
            </div>
            <button type="submit" className="export-close-button">
              닫기
            </button>
          </div>

          <div className="export-dialog-actions">
            <div className="export-option-group">
              <p className="export-option-title">내보내기 내용</p>
              <label className="export-option">
                <input
                  type="radio"
                  name="export-answer-visibility"
                  checked={exportIncludeAnswers}
                  onChange={() => setExportIncludeAnswers(true)}
                />
                <span>정답 포함</span>
              </label>
              <label className="export-option">
                <input
                  type="radio"
                  name="export-answer-visibility"
                  checked={!exportIncludeAnswers}
                  onChange={() => setExportIncludeAnswers(false)}
                />
                <span>빈 격자만</span>
              </label>
            </div>

            <button
              type="button"
              className="action-button action-button-secondary"
              onClick={() => {
                closeExportDialog();
                void handleExportPng();
              }}
            >
              <span className="button-icon" aria-hidden="true">
                <ExportPngIcon />
              </span>
              PNG로 내보내기
            </button>
            <button
              type="button"
              className="action-button action-button-primary"
              onClick={() => {
                closeExportDialog();
                handleExportPdf();
              }}
            >
              <span className="button-icon" aria-hidden="true">
                <ExportPdfIcon />
              </span>
              PDF로 내보내기
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
