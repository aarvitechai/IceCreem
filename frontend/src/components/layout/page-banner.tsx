import { Check } from "lucide-react";

const steps = ["Cart", "Details", "Done"];

/** Coral banner at the top of shop pages. Pass step to show cart and checkout progress. */
export function PageBanner({ title, text, step }: { title: string; text?: string; step?: 1 | 2 | 3 }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-berry to-pink py-10 text-center text-white sm:py-14">
      <span aria-hidden className="absolute -left-10 -top-10 size-40 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-16 right-4 size-52 rounded-full bg-sun/30" />
      <div className="container-page relative">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-6xl">{title}</h1>
        {text && <p className="mt-2 text-white/90">{text}</p>}
        {step && (
          <ol className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2" aria-label="Checkout progress">
            {steps.map((s, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              return (
                <li key={s} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
                  {i > 0 && <span aria-hidden className={`h-0.5 w-6 sm:w-10 ${n <= step ? "bg-white" : "bg-white/40"}`} />}
                  <span className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${done || current ? "bg-white text-berry" : "bg-white/25 text-white"}`}>
                    {done ? <Check className="size-4" /> : n}
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${current ? "" : "text-white/80"}`}>{s}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
