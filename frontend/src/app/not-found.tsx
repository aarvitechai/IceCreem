import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl" aria-hidden>🍦</div>
      <h1 className="text-3xl font-bold">This scoop melted away</h1>
      <p className="text-choco-light">The page you are looking for does not exist.</p>
      <Link href="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
