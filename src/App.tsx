import { assemble, canBeJungseong } from "es-hangul";
import { startTransition, useEffect, useRef, useState } from "react";
import { Grid } from "./components/Grid";
import type { CellValue, CrosswordGrid } from "./lib/crossword/types";
import "./App.css";

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
type DictionarySets = {
  common: Set<string>;
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
  common: "흔한 명사",
  noun: "표준 명사",
  missing: "비표준어",
};

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

function App() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [attemptCount, setAttemptCount] = useState(DEFAULT_ATTEMPT_COUNT);
  const [grid, setGrid] = useState<CrosswordGrid>(() =>
    createGrid(DEFAULT_ROWS, DEFAULT_COLS)
  );
  const [symmetry, setSymmetry] = useState<SymmetryMode>("rotational");
  const [activeMode, setActiveMode] = useState<FeatureMode>("grid");
  const [customWordText, setCustomWordText] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [clueTexts, setClueTexts] = useState<Record<string, string>>({});
  const [hiddenClueIds, setHiddenClueIds] = useState<Set<string>>(new Set());
  const [dictionarySets, setDictionarySets] = useState<DictionarySets | null>(
    null
  );
  const [isSolving, setIsSolving] = useState(false);
  const [status, setStatus] = useState("격자 추천을 시작할 수 있습니다.");
  const workerRef = useRef<Worker | null>(null);
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
      import("./fixtures/koreanNounLists"),
      import("./fixtures/additionalWordLists"),
      import("./fixtures/koreanDictionaryWords"),
    ]).then(
      ([
        { COMMON_NOUNS },
        { ADDITIONAL_WORD_LIST },
        { KOREAN_DICTIONARY_WORDS },
      ]) => {
        if (!isCancelled) {
          setDictionarySets({
            common: COMMON_NOUNS,
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
        new URL("./workers/crosswordWorker.ts", import.meta.url),
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
    setGrid((currentGrid) => resizeGrid(currentGrid, nextRows, cols));
  };

  const handleColsChange = (value: number) => {
    const nextCols = Math.max(1, value || 1);
    setCols(nextCols);
    setGrid((currentGrid) => resizeGrid(currentGrid, rows, nextCols));
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

  const customWords = customWordText
    .split(/\r?\n|,/)
    .map((word) => word.trim())
    .filter(Boolean);
  const filteredCustomWords =
    lookupQuery.trim() === ""
      ? customWords.slice(0, 24)
      : customWords
          .filter((word) => word.includes(lookupQuery.trim()))
          .slice(0, 24);
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

  return (
    <main className="builder-shell">
      <header className="app-header">
        <div className="builder-copy">
          <p className="eyebrow">Korean Crossword Builder</p>
          <h1>한국어 크로스워드 제작기</h1>
          <p className="builder-description">NYT style crossword를 한글로.</p>
        </div>

        <nav className="mode-switch" aria-label="기능 모드">
          {(
            Object.entries(FEATURE_MODE_LABELS) as Array<[FeatureMode, string]>
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`mode-button${
                activeMode === mode ? " mode-button-active" : ""
              }`}
              onClick={() => setActiveMode(mode)}
            >
              {label}
            </button>
          ))}
        </nav>
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
                  <h3>보드 구성</h3>
                </div>

                <div className="controls controls-two-column">
                  <label className="field">
                    <span>행</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={rows}
                      onChange={(event) =>
                        handleRowsChange(event.target.valueAsNumber)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>열</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={cols}
                      onChange={(event) =>
                        handleColsChange(event.target.valueAsNumber)
                      }
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
                  <h3>단어 개요</h3>
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
                    <span className="stats-label">비표준어 수</span>
                    <strong>{invalidEntryCount}</strong>
                    <p>완성된 단어 {filledEntryCount}개</p>
                  </div>
                </div>
              </section>

              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">격자 채우기</p>
                  <h3>추천 채우기</h3>
                </div>

                <div className="controls">
                  <label className="field">
                    <span>추천 시도 횟수</span>
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
                  <p className="section-eyebrow">단어 목록</p>
                  <h3>사용자 목록</h3>
                </div>

                <label className="field">
                  <span>단어</span>
                  <textarea
                    className="word-list-input"
                    value={customWordText}
                    onChange={(event) => setCustomWordText(event.target.value)}
                    placeholder={"사과\n학교\n한국어"}
                  />
                </label>
                <p className="helper-text">
                  한 줄에 하나씩 입력하거나 쉼표로 구분하세요. 추천 시 이 목록을 기본 사전보다 먼저 사용합니다.
                </p>
              </section>

              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">검색</p>
                  <h3>현재 목록 필터</h3>
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

                <div className="lookup-results">
                  {filteredCustomWords.length > 0 ? (
                    filteredCustomWords.map((word) => (
                      <span key={word} className="lookup-chip">
                        {word}
                      </span>
                    ))
                  ) : (
                    <p className="empty-state">
                      현재 목록에 일치하는 단어가 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {activeMode === "clue" ? (
            <div className="config-stack">
              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">가로</p>
                  <h3>{acrossClues.length}개 항목</h3>
                </div>

                <div className="clue-list">
                  {acrossClues.length > 0 ? (
                    acrossClues.map((entry) => (
                      <label key={entry.id} className="clue-item">
                        <div className="clue-meta">
                          <strong>{entry.number}A</strong>
                          <span className="clue-answer">
                            {entry.answer} ({entry.length})
                          </span>
                          {isDuplicateAnswer(entry.answer) ? (
                            <span className="clue-warning">중복</span>
                          ) : null}
                          <span
                            className={`clue-status clue-status-${getValidation(
                              entry.answer
                            )}`}
                          >
                            {CLUE_STATUS_LABELS[getValidation(entry.answer)]}
                          </span>
                          {getValidation(entry.answer) === "missing" ? (
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
                    ))
                  ) : (
                    <p className="empty-state">아직 가로 힌트가 없습니다.</p>
                  )}
                </div>
              </section>

              <section className="config-card">
                <div className="section-heading">
                  <p className="section-eyebrow">세로</p>
                  <h3>{downClues.length}개 항목</h3>
                </div>

                <div className="clue-list">
                  {downClues.length > 0 ? (
                    downClues.map((entry) => (
                      <label key={entry.id} className="clue-item">
                        <div className="clue-meta">
                          <strong>{entry.number}D</strong>
                          <span className="clue-answer">
                            {entry.answer} ({entry.length})
                          </span>
                          {isDuplicateAnswer(entry.answer) ? (
                            <span className="clue-warning">중복</span>
                          ) : null}
                          <span
                            className={`clue-status clue-status-${getValidation(
                              entry.answer
                            )}`}
                          >
                            {CLUE_STATUS_LABELS[getValidation(entry.answer)]}
                          </span>
                          {getValidation(entry.answer) === "missing" ? (
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
                    ))
                  ) : (
                    <p className="empty-state">아직 세로 힌트가 없습니다.</p>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

export default App;
