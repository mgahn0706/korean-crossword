import { pokemonNouns } from "./custom/pokemon";

const slangs: string[] = ["응아니야", "샤갈", "밤티"];

export const ADDITIONAL_WORD_LIST = new Set<string>([
  ...pokemonNouns,
  ...slangs,
]);
