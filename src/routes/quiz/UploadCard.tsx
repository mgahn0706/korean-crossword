export default function UploadCard({
  id,
  title,
  description,
  accept,
  multiple,
  buttonLabel,
  variant,
  onSelect,
}: {
  id: string;
  title: string;
  description: string;
  accept: string;
  multiple: boolean;
  buttonLabel: string;
  variant: "primary" | "secondary";
  onSelect: (files: File[]) => void;
}) {
  const isPrimary = variant === "primary";

  return (
    <label
      htmlFor={id}
      className={`group block cursor-pointer ${
        isPrimary
          ? "quiz-pdf-float relative overflow-hidden rounded-[2rem] border border-sky-300/60 bg-[#dbeafe] p-6 text-sky-950 shadow-[0_20px_60px_rgba(59,130,246,0.16)] transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(186,230,253,0.8),transparent_38%),linear-gradient(155deg,#eff6ff_0%,#dbeafe_55%,#bfdbfe_100%)] before:content-[''] hover:border-sky-400/70 hover:shadow-[0_24px_70px_rgba(59,130,246,0.22)]"
          : "rounded-[1.5rem] border border-stone-200 bg-[#fbfaf8] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:border-stone-300 hover:bg-white"
      }`}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onSelect(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      {isPrimary ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.56),_transparent_62%)]" />
      ) : null}
      <div className="relative z-20">
        <p
          className={`text-[0.72rem] font-semibold uppercase tracking-[0.24em] ${
            isPrimary ? "text-sky-800/70" : "text-stone-500"
          }`}
        >
          업로드 방식
        </p>
        <h2
          className={`mt-3 text-2xl font-semibold ${
            isPrimary ? "text-sky-950" : "text-slate-900"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-3 text-sm leading-6 ${
            isPrimary ? "text-sky-900/72" : "text-stone-600"
          }`}
        >
          {description}
        </p>
        {isPrimary ? (
          <div className="quiz-pdf-breathe mt-6 inline-flex items-center gap-3 rounded-full border border-sky-500/40 bg-[linear-gradient(135deg,#0284c7_0%,#0ea5e9_52%,#38bdf8_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(14,165,233,0.24)] transition duration-300 group-hover:border-sky-500/60 group-hover:bg-[linear-gradient(135deg,#0369a1_0%,#0284c7_52%,#0ea5e9_100%)]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/18 text-white">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 fill-none stroke-current stroke-2"
              >
                <path d="M12 3v11" />
                <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
                <path d="M5 19h14" />
              </svg>
            </span>
            {buttonLabel}
          </div>
        ) : (
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition group-hover:text-stone-900">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-[11px]">
              PNG
            </span>
            {buttonLabel}
          </div>
        )}
      </div>
    </label>
  );
}
