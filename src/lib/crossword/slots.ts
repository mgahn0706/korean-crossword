import type { CrosswordGrid, Slot } from "./types";

function isOpenCell(cell: string) {
  return cell !== "#";
}

export function extractSlots(grid: CrosswordGrid): Slot[] {
  const slots: Slot[] = [];
  let nextId = 0;
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  for (let row = 0; row < rowCount; row += 1) {
    let col = 0;

    while (col < colCount) {
      if (!isOpenCell(grid[row][col])) {
        col += 1;
        continue;
      }

      const start = col;

      while (col < colCount && isOpenCell(grid[row][col])) {
        col += 1;
      }

      if (col - start >= 2) {
        slots.push({
          id: nextId,
          direction: "across",
          length: col - start,
          cells: Array.from({ length: col - start }, (_, index) => ({ row, col: start + index })),
        });
        nextId += 1;
      }
    }
  }

  for (let col = 0; col < colCount; col += 1) {
    let row = 0;

    while (row < rowCount) {
      if (!isOpenCell(grid[row][col])) {
        row += 1;
        continue;
      }

      const start = row;

      while (row < rowCount && isOpenCell(grid[row][col])) {
        row += 1;
      }

      if (row - start >= 2) {
        slots.push({
          id: nextId,
          direction: "down",
          length: row - start,
          cells: Array.from({ length: row - start }, (_, index) => ({ row: start + index, col })),
        });
        nextId += 1;
      }
    }
  }

  return slots;
}
