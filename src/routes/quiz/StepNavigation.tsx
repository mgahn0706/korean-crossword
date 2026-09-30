import type { ReactNode } from "react";

export default function StepNavigation({
  onBack,
  backLabel = "이전 단계",
  onNext,
  nextLabel,
  nextDisabled = false,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel: ReactNode;
  nextDisabled?: boolean;
}) {
  return (
    <nav
      aria-label="단계 이동"
      className="sticky bottom-4 z-30 flex items-center justify-between gap-3 rounded-[1.5rem] border border-stone-200 bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur"
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center justify-center rounded-[1rem] border border-stone-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 sm:min-w-36"
        >
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex min-h-12 items-center justify-center rounded-[1rem] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300 sm:min-w-36"
      >
        {nextLabel}
      </button>
    </nav>
  );
}
