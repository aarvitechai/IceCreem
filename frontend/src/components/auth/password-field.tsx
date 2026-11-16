"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Password input with a show / hide button. */
export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField({ label, error, hint, id, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const fieldId = id ?? rest.name;
  return (
    <div>
      <label htmlFor={fieldId} className="label">{label}</label>
      <div className="relative">
        <input id={fieldId} ref={ref} type={show ? "text" : "password"} className="input rounded-full pr-11" aria-invalid={!!error} {...rest} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-choco/50 hover:bg-cream-dark hover:text-berry"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && !error && <p className="mt-1 text-xs text-choco-light">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});
