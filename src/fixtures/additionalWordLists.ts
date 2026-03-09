const pokemonNouns: string[] = [
  "이상해씨",
  "이상해풀",
  "이상해꽃",
  "파이리",
  "리자드",
  "리자몽",
  "꼬부기",
  "어니부기",
  "거북왕",
  "캐터피",
  "단데기",
  "버터플",
  "뿔충이",
  "딱충이",
  "독침붕",
  "구구",
  "피죤",
  "피죤투",
  "꼬렛",
  "레트라",
  "깨비참",
  "깨비드릴조",
];

const slangs: string[] = ["응아니야", "샤갈", "밤티"];

export const ADDITIONAL_WORD_LIST = new Set<string>([
  ...pokemonNouns,
  ...slangs,
]);
