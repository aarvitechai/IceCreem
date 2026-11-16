"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl" aria-hidden>🧊</div>
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-choco-light">We could not load this page. Please try again in a moment.</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  );
}
