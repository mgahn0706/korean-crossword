export const ROUTES = {
  home: "/",
  koreanCrossword: "/korean-crossword",
  cryptic: "/cryptic",
  connections: "/connections",
  suspect: "/suspect",
  quiz: "/quiz",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export type RouteCard = {
  path: RoutePath;
  label: string;
  eyebrow: string;
  description: string;
  accentClass: string;
  status: "live" | "soon";
};

export const ROUTE_CARDS: RouteCard[] = [
  {
    path: ROUTES.koreanCrossword,
    label: "한국어 크로스워드",
    eyebrow: "사용 가능",
    description:
      "한국어로 크로스워드를 만들고 공유해보세요. 단서와 답을 입력하면 자동으로 격자에 맞춰 배치됩니다.",
    accentClass:
      "from-amber-200/80 via-orange-200/60 to-rose-300/70 text-slate-950",
    status: "live",
  },
  {
    path: ROUTES.cryptic,
    label: "추러스 크립틱",
    eyebrow: "사용 가능",
    description: "주차별 크립틱 단서와 초성 힌트를 따라 푸는 말장난",
    accentClass:
      "from-sky-200/80 via-cyan-200/60 to-teal-300/70 text-slate-950",
    status: "live",
  },
  {
    path: ROUTES.connections,
    label: "추러스 커넥션",
    eyebrow: "사용 가능",
    description: "16개 단어와 카테고리를 입력하여 커넥션 퍼즐을 만드세요.",
    accentClass:
      "from-lime-200/80 via-emerald-200/65 to-green-300/70 text-slate-950",
    status: "live",
  },
  {
    path: ROUTES.suspect,
    label: "협동 크라임씬",
    eyebrow: "준비 중",
    description:
      "여러 명이 함께 단서를 추적하고 역할 정보를 정리하는 협동 크라임씬 빌더입니다.",
    accentClass:
      "from-red-200/80 via-orange-200/65 to-amber-300/70 text-slate-950",
    status: "soon",
  },
  {
    path: ROUTES.quiz,
    label: "문제적 추러스",
    eyebrow: "준비 중",
    description:
      "PDF만 올려서 문제적 추러스를 사이트에 빠르게 업로드할 수 있도록 도와줍니다.",
    accentClass:
      "from-fuchsia-200/80 via-pink-200/65 to-rose-300/70 text-slate-950",
    status: "soon",
  },
];

export function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}
