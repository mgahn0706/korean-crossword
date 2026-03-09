/// <reference lib="webworker" />

import { prepareDictionary, solveCrosswordWithPrepared } from "../lib/crossword/solver";
import type { CrosswordGrid } from "../lib/crossword/types";

type WorkerRequest = {
  id: number;
  grid: CrosswordGrid;
};

type WorkerResponse =
  | { id: number; success: true; grid: CrosswordGrid }
  | { id: number; success: false; reason: string };

const workerScope = self as DedicatedWorkerGlobalScope;

let dictionariesPromise: Promise<ReturnType<typeof prepareDictionary>[]> | null = null;

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
    const result = solveCrosswordWithPrepared(event.data.grid, dictionaries);
    const payload: WorkerResponse = result.success
      ? { id: event.data.id, success: true, grid: result.grid }
      : { id: event.data.id, success: false, reason: result.reason };
    workerScope.postMessage(payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Crossword generation failed.";
    const payload: WorkerResponse = { id: event.data.id, success: false, reason };
    workerScope.postMessage(payload);
  }
};
