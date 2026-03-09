export type CellValue = "" | "#" | string;

export type CrosswordGrid = CellValue[][];

export type SlotDirection = "across" | "down";

export type Slot = {
  id: number;
  direction: SlotDirection;
  cells: Array<{ row: number; col: number }>;
  length: number;
};
