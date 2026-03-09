import { assemble, disassemble } from "es-hangul";
import { extractSlots } from "./slots";
import type { CrosswordGrid, Slot } from "./types";

export type LengthIndex = {
  words: string[];
  allBits: Uint32Array;
  positionBits: Array<Map<string, Uint32Array>>;
  wordSet: Set<string>;
};

export type PreparedDictionary = {
  buckets: Map<number, string[]>;
  indexes: Map<number, LengthIndex>;
};

type SolveResult =
  | { success: true; grid: CrosswordGrid }
  | { success: false; reason: string };

function normalizeWord(word: string): string {
  const normalized = word.normalize("NFC").trim();

  if (normalized === "") {
    return "";
  }

  const compact = normalized.replace(/\s+/g, "");
  const cleaned = compact.replace(/[^\p{Script=Hangul}\p{Letter}\p{Number}]/gu, "");

  if (cleaned === "") {
    return "";
  }

  try {
    return assemble([disassemble(cleaned)]);
  } catch {
    return cleaned;
  }
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

function collectBitsetIndexes(bitset: Uint32Array): number[] {
  const indexes: number[] = [];

  for (let chunkIndex = 0; chunkIndex < bitset.length; chunkIndex += 1) {
    let chunk = bitset[chunkIndex];

    while (chunk !== 0) {
      const lowestBit = chunk & -chunk;
      const bitIndex = 31 - Math.clz32(lowestBit);
      indexes.push(chunkIndex * 32 + bitIndex);
      chunk ^= lowestBit;
    }
  }

  return indexes;
}

export function prepareDictionary(source: Iterable<string>): PreparedDictionary {
  const buckets = new Map<number, string[]>();

  for (const rawWord of source) {
    const word = normalizeWord(rawWord);
    const chars = Array.from(word);

    if (chars.length < 2 || /\s/.test(word)) {
      continue;
    }

    const bucket = buckets.get(chars.length);

    if (bucket == null) {
      buckets.set(chars.length, [word]);
      continue;
    }

    bucket.push(word);
  }

  for (const [length, words] of buckets) {
    buckets.set(length, Array.from(new Set(words)));
  }

  return {
    buckets,
    indexes: new Map<number, LengthIndex>(),
  };
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
    wordSet: new Set(words),
  };

  dictionary.indexes.set(length, index);
  return index;
}

function getPattern(slot: Slot, grid: CrosswordGrid): string[] {
  return slot.cells.map(({ row, col }) => {
    const cell = grid[row][col];
    return cell === "#" ? "" : cell;
  });
}

function isSlotFilled(slot: Slot, grid: CrosswordGrid): boolean {
  return slot.cells.every(({ row, col }) => grid[row][col] !== "");
}

function resolveCandidates(
  slot: Slot,
  grid: CrosswordGrid,
  dictionary: PreparedDictionary,
  usedWords: Set<string>,
): string[] {
  const index = getLengthIndex(dictionary, slot.length);

  if (index.words.length === 0) {
    return [];
  }

  const pattern = getPattern(slot, grid);
  const bitset = index.allBits.slice();

  for (let position = 0; position < pattern.length; position += 1) {
    const char = pattern[position];

    if (char === "") {
      continue;
    }

    const matchingBits = index.positionBits[position].get(char);

    if (matchingBits == null) {
      return [];
    }

    bitsetAnd(bitset, matchingBits);

    if (!bitsetHasAny(bitset)) {
      return [];
    }
  }

  return collectBitsetIndexes(bitset)
    .map((wordIndex) => index.words[wordIndex])
    .filter((word) => !usedWords.has(word));
}

function applyWord(slot: Slot, grid: CrosswordGrid, word: string) {
  const previousValues = slot.cells.map(({ row, col }) => grid[row][col]);
  const chars = Array.from(word);

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

function seedCompletedSlots(
  slots: Slot[],
  grid: CrosswordGrid,
  dictionary: PreparedDictionary,
  assignedSlots: Set<number>,
  usedWords: Set<string>,
): boolean {
  for (const slot of slots) {
    if (!isSlotFilled(slot, grid)) {
      continue;
    }

    const word = slot.cells.map(({ row, col }) => grid[row][col]).join("");
    const index = getLengthIndex(dictionary, slot.length);

    if (!index.wordSet.has(word) || usedWords.has(word)) {
      return false;
    }

    assignedSlots.add(slot.id);
    usedWords.add(word);
  }

  return true;
}

function search(
  slots: Slot[],
  grid: CrosswordGrid,
  dictionary: PreparedDictionary,
  assignedSlots: Set<number>,
  usedWords: Set<string>,
): boolean {
  let targetSlot: Slot | null = null;
  let targetCandidates: string[] = [];

  for (const slot of slots) {
    if (assignedSlots.has(slot.id)) {
      continue;
    }

    const candidates = resolveCandidates(slot, grid, dictionary, usedWords);

    if (candidates.length === 0) {
      return false;
    }

    if (targetSlot == null || candidates.length < targetCandidates.length) {
      targetSlot = slot;
      targetCandidates = candidates;

      if (candidates.length === 1) {
        break;
      }
    }
  }

  if (targetSlot == null) {
    return true;
  }

  assignedSlots.add(targetSlot.id);

  for (const candidate of targetCandidates) {
    const rollback = applyWord(targetSlot, grid, candidate);
    usedWords.add(candidate);

    if (search(slots, grid, dictionary, assignedSlots, usedWords)) {
      return true;
    }

    usedWords.delete(candidate);
    rollback();
  }

  assignedSlots.delete(targetSlot.id);
  return false;
}

export function solveCrosswordWithPrepared(
  initialGrid: CrosswordGrid,
  dictionaries: PreparedDictionary[],
): SolveResult {
  const slots = extractSlots(initialGrid);

  if (slots.length === 0) {
    return { success: false, reason: "Add at least one across or down slot of length 2 or more." };
  }

  for (const dictionary of dictionaries) {
    const grid = initialGrid.map((row) => [...row]);
    const assignedSlots = new Set<number>();
    const usedWords = new Set<string>();

    if (!seedCompletedSlots(slots, grid, dictionary, assignedSlots, usedWords)) {
      continue;
    }

    if (search(slots, grid, dictionary, assignedSlots, usedWords)) {
      return { success: true, grid };
    }
  }

  return { success: false, reason: "No valid fill found for the current pattern." };
}

export function solveCrossword(
  initialGrid: CrosswordGrid,
  dictionaries: Iterable<string>[],
): SolveResult {
  return solveCrosswordWithPrepared(
    initialGrid,
    dictionaries.map((dictionary) => prepareDictionary(dictionary)),
  );
}
