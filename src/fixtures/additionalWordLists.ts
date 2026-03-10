import { ADDITIONAL_WORD_LIST_DATA } from "./generated/additionalWordList.generated";

const slangs: string[] = [];

export const ADDITIONAL_WORD_LIST = new Set<string>([
  ...ADDITIONAL_WORD_LIST_DATA,
  ...slangs,
]);
