import type { CellValue, CrosswordGrid } from "../lib/crossword/types";

type GridProps = {
  grid: CrosswordGrid;
  onCellChange: (rowIndex: number, colIndex: number, value: CellValue) => void;
};

function normalizeCellValue(rawValue: string): CellValue {
  const compactValue = rawValue.replace(/\s+/g, "");

  if (compactValue === "") {
    return "";
  }

  const nextChar = Array.from(compactValue).at(-1) ?? "";

  if (nextChar === ".") {
    return "#";
  }

  return nextChar.toUpperCase();
}

function getCellNumbers(grid: CrosswordGrid) {
  const numbers = new Map<string, number>();
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

      if (startsAcross || startsDown) {
        numbers.set(`${rowIndex}:${colIndex}`, nextNumber);
        nextNumber += 1;
      }
    }
  }

  return numbers;
}

export function Grid({ grid, onCellChange }: GridProps) {
  const columnCount = grid[0]?.length ?? 0;
  const cellNumbers = getCellNumbers(grid);

  return (
    <div className="grid-wrap">
      <div
        className="crossword-grid"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isBlack = cell === "#";
            const cellNumber = cellNumbers.get(`${rowIndex}:${colIndex}`);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell-shell${isBlack ? " grid-cell-shell-black" : ""}`}
              >
                {cellNumber != null ? <span className="grid-cell-number">{cellNumber}</span> : null}
                <input
                  aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                  className={`grid-cell${isBlack ? " grid-cell-black" : ""}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={2}
                  value={isBlack ? "" : cell}
                  onKeyDown={(event) => {
                    if (isBlack && event.key === "Backspace") {
                      event.preventDefault();
                      onCellChange(rowIndex, colIndex, "");
                    }
                  }}
                  onChange={(event) =>
                    onCellChange(rowIndex, colIndex, normalizeCellValue(event.target.value))
                  }
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
