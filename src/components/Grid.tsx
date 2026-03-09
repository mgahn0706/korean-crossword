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

export function Grid({ grid, onCellChange }: GridProps) {
  const columnCount = grid[0]?.length ?? 0;

  return (
    <div className="grid-wrap">
      <div
        className="crossword-grid"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isBlack = cell === "#";

            return (
              <input
                key={`${rowIndex}-${colIndex}`}
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
            );
          }),
        )}
      </div>
    </div>
  );
}
