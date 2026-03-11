import { ADDITIONAL_WORD_LIST_DATA } from "./generated/additionalWordList.generated";
import { ABBREVIATION_WORD_LIST } from "./abbreviationWordLists";

const slangs: string[] = [];

export const ADDITIONAL_WORD_LIST = new Set<string>([
  ...ADDITIONAL_WORD_LIST_DATA,
  ...ABBREVIATION_WORD_LIST,
  ...slangs,
]);
