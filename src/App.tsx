import { startTransition, useEffect, useRef, useState } from "react";
import { Grid } from "./components/Grid";
import type { CellValue, CrosswordGrid } from "./lib/crossword/types";
import "./App.css";

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;

type WorkerResponse =
  | { id: number; success: true; grid: CrosswordGrid }
  | { id: number; success: false; reason: string };

function createGrid(rows: number, cols: number): CrosswordGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

function resizeGrid(
  currentGrid: CrosswordGrid,
  nextRows: number,
  nextCols: number,
): CrosswordGrid {
  return Array.from({ length: nextRows }, (_, rowIndex) =>
    Array.from(
      { length: nextCols },
      (_, colIndex) => currentGrid[rowIndex]?.[colIndex] ?? "",
    ),
  );
}

function App() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<CrosswordGrid>(() => createGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [isSolving, setIsSolving] = useState(false);
  const [status, setStatus] = useState("Ready to recommend a fill.");
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const getWorker = () => {
    if (workerRef.current == null) {
      workerRef.current = new Worker(new URL("./workers/crosswordWorker.ts", import.meta.url), {
        type: "module",
      });
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

  const handleCellChange = (rowIndex: number, colIndex: number, value: CellValue) => {
    setGrid((currentGrid) =>
      currentGrid.map((row, currentRowIndex) =>
        row.map((cell, currentColIndex) =>
          currentRowIndex === rowIndex && currentColIndex === colIndex ? value : cell,
        ),
      ),
    );
  };

  const handleRecommendFill = async () => {
    const worker = getWorker();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsSolving(true);
    setStatus("Searching common nouns first, then the full Korean noun list if needed.");

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
        reject(new Error("The crossword worker crashed."));
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError, { once: true });
      worker.postMessage({ id: requestId, grid });
    }).finally(() => {
      setIsSolving(false);
    });

    if (result.success) {
      startTransition(() => {
        setGrid(result.grid);
      });
      setStatus("Recommended fill applied.");
      return;
    }

    setStatus(result.reason);
  };

  const blackCellCount = grid.flat().filter((cell) => cell === "#").length;

  return (
    <main className="builder-shell">
      <section className="builder-panel">
        <div className="builder-copy">
          <p className="eyebrow">Crossword Builder</p>
          <h1>Configure the grid and fill each cell.</h1>
          <p className="builder-description">
            Type any single character into a square. Enter <code>.</code> to mark that square
            as black.
          </p>
        </div>

        <div className="controls">
          <label className="field">
            <span>Rows</span>
            <input
              type="number"
              min="1"
              max="40"
              value={rows}
              onChange={(event) => handleRowsChange(event.target.valueAsNumber)}
            />
          </label>

          <label className="field">
            <span>Columns</span>
            <input
              type="number"
              min="1"
              max="40"
              value={cols}
              onChange={(event) => handleColsChange(event.target.valueAsNumber)}
            />
          </label>
        </div>

        <div className="stats">
          <div>
            <span className="stats-label">Size</span>
            <strong>
              {rows} x {cols}
            </strong>
          </div>
          <div>
            <span className="stats-label">Black cells</span>
            <strong>{blackCellCount}</strong>
          </div>
        </div>

        <div className="actions">
          <button className="action-button" type="button" onClick={() => void handleRecommendFill()} disabled={isSolving}>
            {isSolving ? "Finding Fill..." : "Recommend Fill"}
          </button>
          <p className="status-text">{status}</p>
        </div>
      </section>

      <section className="grid-panel">
        <Grid grid={grid} onCellChange={handleCellChange} />
      </section>
    </main>
  );
}

export default App;
