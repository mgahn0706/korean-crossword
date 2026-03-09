import { useRef, useState } from "react";
import type { CellValue, CrosswordGrid } from "../lib/crossword/types";

type GridProps = {
  grid: CrosswordGrid;
  onCellChange: (rowIndex: number, colIndex: number, value: CellValue) => void;
  cellNumbers: Map<string, number>;
  topBarCells: Set<string>;
  bottomBarCells: Set<string>;
  leftBarCells: Set<string>;
  rightBarCells: Set<string>;
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

function getActiveWordCells(
  grid: CrosswordGrid,
  activeCellKey: string | null,
  activeDirection: "across" | "down",
) {
  if (activeCellKey == null) {
    return new Set<string>();
  }

  const [rowText, colText] = activeCellKey.split(":");
  const rowIndex = Number(rowText);
  const colIndex = Number(colText);

  if (Number.isNaN(rowIndex) || Number.isNaN(colIndex) || grid[rowIndex]?.[colIndex] === "#") {
    return new Set<string>();
  }

  const cells = new Set<string>();

  if (activeDirection === "across") {
    let startCol = colIndex;
    while (startCol > 0 && grid[rowIndex][startCol - 1] !== "#") {
      startCol -= 1;
    }

    let endCol = colIndex;
    while (endCol + 1 < (grid[0]?.length ?? 0) && grid[rowIndex][endCol + 1] !== "#") {
      endCol += 1;
    }

    for (let currentCol = startCol; currentCol <= endCol; currentCol += 1) {
      cells.add(`${rowIndex}:${currentCol}`);
    }
  } else {
    let startRow = rowIndex;
    while (startRow > 0 && grid[startRow - 1][colIndex] !== "#") {
      startRow -= 1;
    }

    let endRow = rowIndex;
    while (endRow + 1 < grid.length && grid[endRow + 1][colIndex] !== "#") {
      endRow += 1;
    }

    for (let currentRow = startRow; currentRow <= endRow; currentRow += 1) {
      cells.add(`${currentRow}:${colIndex}`);
    }
  }

  return cells;
}

export function Grid({
  grid,
  onCellChange,
  cellNumbers,
  topBarCells,
  bottomBarCells,
  leftBarCells,
  rightBarCells,
}: GridProps) {
  const columnCount = grid[0]?.length ?? 0;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pointerDownCellKeyRef = useRef<string | null>(null);
  const [activeDirection, setActiveDirection] = useState<"across" | "down">("across");
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const activeWordCells = getActiveWordCells(grid, activeCellKey, activeDirection);

  const focusCell = (rowIndex: number, colIndex: number) => {
    const targetIndex = rowIndex * columnCount + colIndex;
    const targetInput = inputRefs.current[targetIndex];

    if (targetInput != null) {
      requestAnimationFrame(() => {
        targetInput.focus();
        targetInput.select();
      });
    }
  };

  const getDirectionalNeighbor = (
    rowIndex: number,
    colIndex: number,
    step: 1 | -1,
  ) => {
    const rowDelta = activeDirection === "across" ? 0 : step;
    const colDelta = activeDirection === "across" ? step : 0;
    const nextRow = rowIndex + rowDelta;
    const nextCol = colIndex + colDelta;

    if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= columnCount) {
      return null;
    }

    if (grid[nextRow][nextCol] === "#") {
      return null;
    }

    return { row: nextRow, col: nextCol };
  };

  const focusNextCell = (rowIndex: number, colIndex: number) => {
    const neighbor = getDirectionalNeighbor(rowIndex, colIndex, 1);

    if (neighbor != null) {
      focusCell(neighbor.row, neighbor.col);
      setActiveCellKey(`${neighbor.row}:${neighbor.col}`);
    }
  };

  const focusPreviousCell = (rowIndex: number, colIndex: number) => {
    const neighbor = getDirectionalNeighbor(rowIndex, colIndex, -1);

    if (neighbor != null) {
      onCellChange(neighbor.row, neighbor.col, "");
      focusCell(neighbor.row, neighbor.col);
      setActiveCellKey(`${neighbor.row}:${neighbor.col}`);
    }
  };

  return (
    <div className="grid-wrap">
      <div
        className="crossword-grid"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isBlack = cell === "#";
            const cellKey = `${rowIndex}:${colIndex}`;
            const cellNumber = cellNumbers.get(cellKey);
            const inputIndex = rowIndex * columnCount + colIndex;
            const isActiveCell = activeCellKey === cellKey;
            const isActiveWordCell = activeWordCells.has(cellKey);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell-shell${isBlack ? " grid-cell-shell-black" : ""}${
                  isActiveWordCell ? " grid-cell-shell-word-active" : ""
                }${isActiveCell ? " grid-cell-shell-current" : ""}${
                  topBarCells.has(cellKey) ? " grid-cell-shell-top-bar" : ""
                }${bottomBarCells.has(cellKey) ? " grid-cell-shell-bottom-bar" : ""}${
                  leftBarCells.has(cellKey) ? " grid-cell-shell-left-bar" : ""
                }${rightBarCells.has(cellKey) ? " grid-cell-shell-right-bar" : ""}`}
              >
                {cellNumber != null ? <span className="grid-cell-number">{cellNumber}</span> : null}
                <input
                  ref={(element) => {
                    inputRefs.current[inputIndex] = element;
                  }}
                  aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                  className={`grid-cell${isBlack ? " grid-cell-black" : ""}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={2}
                  value={isBlack ? "" : cell}
                  onMouseDown={() => {
                    pointerDownCellKeyRef.current = activeCellKey;
                  }}
                  onFocus={() => {
                    setActiveCellKey(`${rowIndex}:${colIndex}`);
                  }}
                  onClick={() => {
                    const nextKey = `${rowIndex}:${colIndex}`;

                    if (pointerDownCellKeyRef.current === nextKey) {
                      setActiveDirection((current) =>
                        current === "across" ? "down" : "across",
                      );
                    }

                    setActiveCellKey(nextKey);
                    pointerDownCellKeyRef.current = nextKey;
                  }}
                  onKeyDown={(event) => {
                    if (isBlack && event.key === "Backspace") {
                      event.preventDefault();
                      onCellChange(rowIndex, colIndex, "");
                      focusCell(rowIndex, colIndex);
                      return;
                    }

                    if (!isBlack && event.key === "Backspace") {
                      event.preventDefault();

                      if (cell !== "") {
                        onCellChange(rowIndex, colIndex, "");
                        focusCell(rowIndex, colIndex);
                        setActiveCellKey(`${rowIndex}:${colIndex}`);
                        return;
                      }

                      focusPreviousCell(rowIndex, colIndex);
                    }
                  }}
                  onChange={(event) => {
                    const nextValue = normalizeCellValue(event.target.value);
                    onCellChange(rowIndex, colIndex, nextValue);

                    if (nextValue !== "" && nextValue !== "#") {
                      focusNextCell(rowIndex, colIndex);
                    }
                  }}
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
