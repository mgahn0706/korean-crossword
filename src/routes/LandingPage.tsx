import LinkButton from "./LinkButton";
import { ROUTE_CARDS, ROUTES, type RouteCard } from "./config";

const KOREAN_LANDING_FONT =
  "[font-family:'Pretendard_Variable','Pretendard','SUIT_Variable','SUIT','Noto_Sans_KR','Apple_SD_Gothic_Neo','Malgun_Gothic',sans-serif]";

function RouteCardLink({ route }: { route: RouteCard }) {
  const delayClass =
    route.path === ROUTES.koreanCrossword
      ? "landing-grid-rise-delay-1"
      : route.path === ROUTES.cryptic
      ? "landing-grid-rise-delay-2"
      : route.path === ROUTES.connections
      ? "landing-grid-rise-delay-3"
      : "landing-grid-rise-delay-4";

  return (
    <LinkButton
      path={route.path}
      className={`landing-grid-rise landing-sheen group relative overflow-hidden rounded-[2rem] border border-white/18 bg-white/8 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/28 hover:bg-white/12 ${delayClass}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-[999px] bg-gradient-to-r opacity-90 blur-2xl transition duration-500 group-hover:scale-110 ${route.accentClass}`}
      />
      <div className="relative flex min-h-56 flex-col justify-between gap-8">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/62">
            {route.eyebrow}
          </p>
          <h2
            className={`mt-4 text-3xl leading-[1.15] text-white ${KOREAN_LANDING_FONT}`}
          >
            {route.label}
          </h2>
          <p className="mt-4 max-w-72 text-sm leading-6 text-white/72">
            {route.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white transition group-hover:translate-x-1">
            바로가기
          </span>
        </div>
      </div>
    </LinkButton>
  );
}

function LandingLogo() {
  return (
    <div className="landing-fade-up landing-fade-up-delay-3 flex items-center justify-center lg:justify-end">
      <div className="landing-logo-shell relative h-[22rem] w-[22rem] sm:h-[24rem] sm:w-[24rem]">
        <div className="absolute inset-0 rounded-full bg-white/6 blur-3xl" />
        <div className="landing-logo-square landing-logo-square-left absolute left-1/2 top-1/2 h-44 w-44 -translate-x-[68%] -translate-y-1/2 rotate-45 border border-white/22 bg-slate-100/20 shadow-[0_20px_60px_rgba(148,163,184,0.14)] backdrop-blur-sm" />
        <div className="landing-logo-square landing-logo-square-right absolute left-1/2 top-1/2 h-44 w-44 -translate-x-[32%] -translate-y-1/2 rotate-45 border border-white/30 bg-slate-100/30 shadow-[0_24px_80px_rgba(226,232,240,0.14)] backdrop-blur-md" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06131d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,166,99,0.28),_transparent_28%),radial-gradient(circle_at_80%_18%,_rgba(78,205,255,0.24),_transparent_24%),radial-gradient(circle_at_50%_110%,_rgba(255,88,136,0.2),_transparent_28%),linear-gradient(140deg,_#07111b_0%,_#0d1d2b_45%,_#101522_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-position:center] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black_30%,transparent_78%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="landing-orb absolute left-[6%] top-28 h-56 w-56 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="landing-orb landing-orb-reverse absolute bottom-12 right-[10%] h-64 w-64 rounded-full bg-orange-300/12 blur-3xl" />
      <div className="landing-orb absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-300/8 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 sm:px-10 lg:px-12">
        <header className="landing-fade-up flex items-center justify-between gap-4">
          <div className="landing-fade-up landing-fade-up-delay-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-white/55">
              추러스 문제 제작실
            </p>
            <p
              className={`mt-3 text-xl text-white/92 sm:text-2xl ${KOREAN_LANDING_FONT}`}
            >
              한국어 퍼즐 제작 도구 모음
            </p>
          </div>
          <a
            href="https://churrus.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="landing-fade-up landing-fade-up-delay-2 inline-flex items-center rounded-full border border-white/18 bg-white/8 px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/28 hover:bg-white/12"
          >
            추러스 홈페이지 바로가기
          </a>
        </header>

        <div className="mt-16 grid items-end gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
          <div className="landing-fade-up landing-fade-up-delay-1">
            <p className="landing-fade-up landing-fade-up-delay-1 text-sm uppercase tracking-[0.3em] text-cyan-200/70">
              문제팀을 위해서
            </p>
            <h1
              className={`landing-fade-up landing-fade-up-delay-2 mt-6 max-w-4xl text-5xl leading-[1.08] text-white sm:text-6xl lg:text-7xl word-break-[keep-all] ${KOREAN_LANDING_FONT}`}
            >
              추러스에서 쓸 퍼즐을
              <br />
              한곳에서 바로 만드세요
            </h1>
            <p className="landing-fade-up landing-fade-up-delay-3 mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              한국어 크로스워드, 크립틱, 커넥션, 퀴즈까지 같은 입구에서 열고
              바로 제작할 수 있도록 정리한 추러스용 문제 제작 화면입니다.
            </p>
          </div>

          <LandingLogo />
        </div>

        <div className="mt-16 grid gap-5 pb-8 md:grid-cols-2 xl:grid-cols-4">
          {ROUTE_CARDS.map((route) => (
            <RouteCardLink key={route.path} route={route} />
          ))}
        </div>
      </section>
    </main>
  );
}
