import Image from "next/image";
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { label as toLabel } from "@/lib/format";

/** Small set of shared UI pieces. Styles come from globals.css component classes. */

export function Spinner({ className = "size-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-berry ${className}`} aria-hidden />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="size-8" />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-choco/5">
      <span className="flex size-20 items-center justify-center rounded-full bg-pink-light text-4xl" aria-hidden>🍦</span>
      <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">{title}</h3>
      {text && <p className="max-w-sm text-sm text-choco-light">{text}</p>}
      {action}
    </div>
  );
}

const statusColors: Record<string, string> = {
  Placed: "bg-mango-light text-amber-800",
  Enquiry: "bg-mango-light text-amber-800",
  Planned: "bg-mango-light text-amber-800",
  Issued: "bg-mango-light text-amber-800",
  Pending: "bg-mango-light text-amber-800",
  Confirmed: "bg-sky-100 text-sky-800",
  Quoted: "bg-sky-100 text-sky-800",
  InProduction: "bg-violet-100 text-violet-800",
  Running: "bg-violet-100 text-violet-800",
  AdvancePaid: "bg-violet-100 text-violet-800",
  Partial: "bg-violet-100 text-violet-800",
  Packed: "bg-indigo-100 text-indigo-800",
  Scheduled: "bg-indigo-100 text-indigo-800",
  OutForDelivery: "bg-berry-light text-berry-dark",
  Delivered: "bg-mint-light text-emerald-800",
  Completed: "bg-mint-light text-emerald-800",
  Settled: "bg-mint-light text-emerald-800",
  Paid: "bg-mint-light text-emerald-800",
  Closed: "bg-gray-100 text-gray-700",
  Cancelled: "bg-red-100 text-red-700",
  Returned: "bg-red-100 text-red-700",
  Refunded: "bg-gray-100 text-gray-700",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[value] ?? "bg-gray-100 text-gray-700"}`}>
      {toLabel(value)}
    </span>
  );
}

export function VegMark({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? "border-green-600" : "border-red-600";
  const dot = isVeg ? "bg-green-600" : "bg-red-600";
  return (
    <span className={`inline-flex size-4 items-center justify-center border-2 ${color}`} title={isVeg ? "Veg" : "Non veg"}>
      <span className={`size-1.5 rounded-full ${dot}`} />
    </span>
  );
}

/** next/image that also works for SVG and API uploads (served unoptimized). */
export function AppImage({ src, alt, className, priority, sizes }: { src: string | null; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  const url = src || "/images/products/placeholder.svg";
  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
      unoptimized={url.endsWith(".svg") || url.startsWith("/uploads/")}
      className={className ?? "object-cover"}
    />
  );
}

// ---------- Form fields ----------

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, error, hint, id, ...rest }, ref) {
    const fieldId = id ?? rest.name;
    return (
      <div>
        <label htmlFor={fieldId} className="label">{label}</label>
        <input id={fieldId} ref={ref} className="input" aria-invalid={!!error} {...rest} />
        {hint && !error && <p className="mt-1 text-xs text-choco-light">{hint}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ label, error, id, ...rest }, ref) {
    const fieldId = id ?? rest.name;
    return (
      <div>
        <label htmlFor={fieldId} className="label">{label}</label>
        <textarea id={fieldId} ref={ref} rows={3} className="input" aria-invalid={!!error} {...rest} />
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);

export const SelectField = forwardRef<HTMLSelectElement, FieldProps & SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectField({ label, error, id, children, ...rest }, ref) {
    const fieldId = id ?? rest.name;
    return (
      <div>
        <label htmlFor={fieldId} className="label">{label}</label>
        <select id={fieldId} ref={ref} className="input" aria-invalid={!!error} {...rest}>{children}</select>
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-4 text-sm">
      <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="text-choco-light">Page {page} of {totalPages}</span>
      <button className="btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}

export function StatCard({ title, value, hint, tone = "berry" }: { title: string; value: string | number; hint?: string; tone?: "berry" | "mint" | "mango" | "choco" }) {
  const tones = { berry: "bg-berry-light", mint: "bg-mint-light", mango: "bg-mango-light", choco: "bg-cream-dark" };
  return (
    <div className="card p-5">
      <div className={`mb-3 inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-choco-light">{hint}</div>}
    </div>
  );
}
