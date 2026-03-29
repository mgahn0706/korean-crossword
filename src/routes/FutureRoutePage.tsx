import LinkButton from "./LinkButton";
import { ROUTES, type RoutePath } from "./config";

export default function FutureRoutePage({
  path,
  title,
  summary,
  accentClass,
}: {
  path: RoutePath | string;
  title: string;
  summary: string;
  accentClass: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#081019] px-6 py-12 text-white sm:px-10">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,_#08111c_0%,_#0f1724_52%,_#151327_100%)]" />
      <div
        className={`absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r opacity-35 blur-3xl ${accentClass}`}
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.32em] text-white/55">
          Coming Soon
        </p>
        <h1
          className="mt-6 text-5xl leading-none text-white sm:text-6xl [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif]"
        >
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
          {summary}
        </p>
        <p className="mt-4 text-sm uppercase tracking-[0.26em] text-white/42">
          Route: {path}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <LinkButton
            path={ROUTES.home}
            className="inline-flex items-center rounded-full border border-white/14 bg-white/6 px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/28 hover:bg-white/12"
          >
            Back home
          </LinkButton>
          <LinkButton
            path={ROUTES.koreanCrossword}
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px] hover:bg-cyan-50"
          >
            Open Korean Crossword
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
