/// <reference lib="webworker" />

import { canBeJungseong, disassemble } from "es-hangul";
import type { CrosswordGrid } from "../lib/crossword/types";

type WorkerRequest = {
  id: number;
  grid: CrosswordGrid;
  customWords: string[];
};

type WorkerResponse =
  | { id: number; success: true; grid: CrosswordGrid }
  | { id: number; success: false; reason: string };

type Slot = {
  id: number;
  direction: "across" | "down";
  cells: Array<{ row: number; col: number }>;
  length: number;
};

type LengthIndex = {
  words: string[];
  allBits: Uint32Array;
  positionBits: Array<Map<string, Uint32Array>>;
};

type PreparedDictionary = {
  buckets: Map<number, string[]>;
  indexes: Map<number, LengthIndex>;
};

const workerScope = self as DedicatedWorkerGlobalScope;
const PLACEHOLDER_LETTERS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ"];
const MAX_CANDIDATES_PER_SLOT = 20;
const MAX_SEARCH_STEPS = 1200;

let dictionariesPromise: Promise<PreparedDictionary[]> | null = null;

function normalizeWord(word: string): string {
  const normalized = word.normalize("NFC").trim();

  if (normalized === "") {
    return "";
  }

  return normalized.replace(/[^\p{Script=Hangul}\p{Letter}\p{Number}]/gu, "");
}

function toCellSequence(word: string): string[] {
  const normalized = normalizeWord(word);

  if (normalized === "") {
    return [];
  }

  const jamo = Array.from(disassemble(normalized));

  if (jamo.length >= 2 && jamo[0] === "ㅇ" && canBeJungseong(jamo[1])) {
    return jamo.slice(1);
  }

  return jamo;
}

function prepareDictionary(source: Iterable<string>): PreparedDictionary {
  const buckets = new Map<number, string[]>();

  for (const rawWord of source) {
    const sequence = toCellSequence(rawWord);

    if (sequence.length < 2) {
      continue;
    }

    const key = sequence.join("");
    const bucket = buckets.get(sequence.length);

    if (bucket == null) {
      buckets.set(sequence.length, [key]);
      continue;
    }

    bucket.push(key);
  }

  for (const [length, words] of buckets) {
    buckets.set(length, Array.from(new Set(words)));
  }

  return {
    buckets,
    indexes: new Map<number, LengthIndex>(),
  };
}

function createBitset(size: number, fill = false): Uint32Array {
  const bitset = new Uint32Array(Math.ceil(size / 32));

  if (!fill || size === 0) {
    return bitset;
  }

  bitset.fill(0xffffffff);
  const remainder = size % 32;

  if (remainder !== 0) {
    bitset[bitset.length - 1] = (1 << remainder) - 1;
  }

  return bitset;
}

function setBit(bitset: Uint32Array, index: number) {
  bitset[index >>> 5] |= 1 << (index & 31);
}

function bitsetAnd(target: Uint32Array, source: Uint32Array) {
  for (let index = 0; index < target.length; index += 1) {
    target[index] &= source[index];
  }
}

function bitsetHasAny(bitset: Uint32Array): boolean {
  return bitset.some((chunk) => chunk !== 0);
}

function collectBitsetIndexes(bitset: Uint32Array, limit: number): number[] {
  const indexes: number[] = [];

  for (let chunkIndex = 0; chunkIndex < bitset.length; chunkIndex += 1) {
    let chunk = bitset[chunkIndex];

    while (chunk !== 0) {
      const lowestBit = chunk & -chunk;
      const bitIndex = 31 - Math.clz32(lowestBit);
      indexes.push(chunkIndex * 32 + bitIndex);

      if (indexes.length >= limit) {
        return indexes;
      }

      chunk ^= lowestBit;
    }
  }

  return indexes;
}

function getLengthIndex(dictionary: PreparedDictionary, length: number): LengthIndex {
  const cached = dictionary.indexes.get(length);

  if (cached != null) {
    return cached;
  }

  const words = dictionary.buckets.get(length) ?? [];
  const positionBits = Array.from({ length }, () => new Map<string, Uint32Array>());

  for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
    const chars = Array.from(words[wordIndex]);

    for (let charIndex = 0; charIndex < chars.length; charIndex += 1) {
      const char = chars[charIndex];
      let bitset = positionBits[charIndex].get(char);

      if (bitset == null) {
        bitset = createBitset(words.length);
        positionBits[charIndex].set(char, bitset);
      }

      setBit(bitset, wordIndex);
    }
  }

  const index = {
    words,
    allBits: createBitset(words.length, true),
    positionBits,
  };

  dictionary.indexes.set(length, index);
  return index;
}

function extractSlots(grid: CrosswordGrid): Slot[] {
  const slots: Slot[] = [];
  let nextId = 0;
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  for (let row = 0; row < rowCount; row += 1) {
    let col = 0;

    while (col < colCount) {
      if (grid[row][col] === "#") {
        col += 1;
        continue;
      }

      const start = col;

      while (col < colCount && grid[row][col] !== "#") {
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
      if (grid[row][col] === "#") {
        row += 1;
        continue;
      }

      const start = row;

      while (row < rowCount && grid[row][col] !== "#") {
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

function resolveCandidates(slot: Slot, grid: CrosswordGrid, dictionary: PreparedDictionary): string[] {
  const index = getLengthIndex(dictionary, slot.length);

  if (index.words.length === 0) {
    return [];
  }

  const bitset = index.allBits.slice();

  for (let position = 0; position < slot.cells.length; position += 1) {
    const { row, col } = slot.cells[position];
    const cell = grid[row][col];

    if (cell === "" || cell === "#") {
      continue;
    }

    const matchingBits = index.positionBits[position].get(cell);

    if (matchingBits == null) {
      return [];
    }

    bitsetAnd(bitset, matchingBits);

    if (!bitsetHasAny(bitset)) {
      return [];
    }
  }

  return collectBitsetIndexes(bitset, MAX_CANDIDATES_PER_SLOT).map((wordIndex) => index.words[wordIndex]);
}

function applyCandidate(slot: Slot, grid: CrosswordGrid, candidate: string) {
  const previousValues = slot.cells.map(({ row, col }) => grid[row][col]);
  const chars = Array.from(candidate);

  for (let index = 0; index < slot.cells.length; index += 1) {
    const { row, col } = slot.cells[index];
    grid[row][col] = chars[index];
  }

  return () => {
    for (let index = 0; index < slot.cells.length; index += 1) {
      const { row, col } = slot.cells[index];
      grid[row][col] = previousValues[index];
    }
  };
}

function fillRemainingCells(grid: CrosswordGrid): CrosswordGrid {
  let fillIndex = 0;

  return grid.map((row) =>
    row.map((cell) => {
      if (cell === "#" || cell !== "") {
        return cell;
      }

      const nextCell = PLACEHOLDER_LETTERS[fillIndex % PLACEHOLDER_LETTERS.length];
      fillIndex += 1;
      return nextCell;
    }),
  );
}

function recommendGrid(
  initialGrid: CrosswordGrid,
  dictionaries: PreparedDictionary[],
): CrosswordGrid {
  const slots = extractSlots(initialGrid);
  const grid = initialGrid.map((row) => [...row]);
  let bestGrid = grid.map((row) => [...row]);
  let bestAcrossCount = 0;
  let bestDownCount = 0;
  let searchSteps = 0;

  const isBetterScore = (acrossCount: number, downCount: number) => {
    const total = acrossCount + downCount;
    const bestTotal = bestAcrossCount + bestDownCount;

    if (total !== bestTotal) {
      return total > bestTotal;
    }

    const imbalance = Math.abs(acrossCount - downCount);
    const bestImbalance = Math.abs(bestAcrossCount - bestDownCount);

    if (imbalance !== bestImbalance) {
      return imbalance < bestImbalance;
    }

    return acrossCount > bestAcrossCount;
  };

  const search = (remainingSlots: Slot[], acrossCount: number, downCount: number) => {
    if (searchSteps >= MAX_SEARCH_STEPS) {
      return;
    }

    searchSteps += 1;

    if (isBetterScore(acrossCount, downCount)) {
      bestAcrossCount = acrossCount;
      bestDownCount = downCount;
      bestGrid = grid.map((row) => [...row]);
    }

    if (
      remainingSlots.length === 0 ||
      acrossCount + downCount + remainingSlots.length <= bestAcrossCount + bestDownCount
    ) {
      return;
    }

    let targetSlot: Slot | null = null;
    let targetCandidates: string[] = [];

    for (const slot of remainingSlots) {
      const candidates = dictionaries.flatMap((dictionary) => resolveCandidates(slot, grid, dictionary));
      const uniqueCandidates = Array.from(new Set(candidates));

      if (uniqueCandidates.length === 0) {
        continue;
      }

      if (targetSlot == null || uniqueCandidates.length < targetCandidates.length) {
        targetSlot = slot;
        targetCandidates = uniqueCandidates;
      }
    }

    if (targetSlot == null) {
      return;
    }

    const nextSlots = remainingSlots.filter((slot) => slot.id !== targetSlot.id);

    for (const candidate of targetCandidates) {
      const rollback = applyCandidate(targetSlot, grid, candidate);
      search(
        nextSlots,
        acrossCount + (targetSlot.direction === "across" ? 1 : 0),
        downCount + (targetSlot.direction === "down" ? 1 : 0),
      );
      rollback();
    }

    search(nextSlots, acrossCount, downCount);
  };

  search(slots, 0, 0);
  return fillRemainingCells(bestGrid);
}

async function loadDictionaries() {
  if (dictionariesPromise == null) {
    dictionariesPromise = import("../fixtures/koreanNounLists").then(
      ({ COMMON_NOUNS, KOREAN_NOUNS }) => [
        prepareDictionary(COMMON_NOUNS),
        prepareDictionary(KOREAN_NOUNS),
      ],
    );
  }

  return dictionariesPromise;
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const dictionaries = await loadDictionaries();
    const orderedDictionaries =
      event.data.customWords.length > 0
        ? [prepareDictionary(event.data.customWords), ...dictionaries]
        : dictionaries;
    const grid = recommendGrid(event.data.grid, orderedDictionaries);
    const payload: WorkerResponse = { id: event.data.id, success: true, grid };
    workerScope.postMessage(payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Grid recommendation failed.";
    const payload: WorkerResponse = { id: event.data.id, success: false, reason };
    workerScope.postMessage(payload);
  }
};
