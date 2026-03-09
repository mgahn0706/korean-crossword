import { useState } from "react";
import { Grid } from "./components/Grid";
import "./App.css";

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;

type CellValue = "" | "#" | string;

function createGrid(rows: number, cols: number): CellValue[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

function resizeGrid(
  currentGrid: CellValue[][],
  nextRows: number,
  nextCols: number,
): CellValue[][] {
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
  const [grid, setGrid] = useState<CellValue[][]>(() => createGrid(DEFAULT_ROWS, DEFAULT_COLS));

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
      </section>

      <section className="grid-panel">
        <Grid grid={grid} onCellChange={handleCellChange} />
      </section>
    </main>
  );
}

export default App;
