import { useEffect, useState } from "react";
import ConnectionsPage from "./routes/ConnectionsPage";
import CrypticPage from "./routes/CrypticPage";
import FutureRoutePage from "./routes/FutureRoutePage";
import KoreanCrosswordBuilder from "./routes/KoreanCrosswordBuilder";
import LandingPage from "./routes/LandingPage";
import QuizPage from "./routes/QuizPage";
import { ROUTES, normalizePath } from "./routes/config";

export default function Router() {
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname)
  );

  useEffect(() => {
    const syncPath = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  switch (pathname) {
    case "":
    case ROUTES.home:
      return <LandingPage />;
    case ROUTES.koreanCrossword:
      return <KoreanCrosswordBuilder />;
    case ROUTES.cryptic:
      return <CrypticPage />;
    case ROUTES.connections:
      return <ConnectionsPage />;
    case ROUTES.suspect:
      return (
        <FutureRoutePage
          path={ROUTES.suspect}
          title="협동 크라임씬"
          summary="협업형 추리 진행, 역할 카드, 단서 흐름을 설계하는 크라임씬 제작 화면을 위한 자리입니다."
          accentClass="from-red-300 via-orange-200 to-amber-300"
        />
      );
    case ROUTES.quiz:
      return <QuizPage />;
    default:
      return (
        <FutureRoutePage
          path={normalizePath(window.location.pathname)}
          title="Route not found"
          summary="The requested builder route does not exist yet. Use the launcher to jump into the available formats."
          accentClass="from-rose-300 via-orange-200 to-cyan-300"
        />
      );
  }
}
