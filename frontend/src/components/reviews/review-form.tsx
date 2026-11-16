"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { SelectField, Spinner, TextArea, TextField } from "@/components/ui";
import { reviewOccasions, useSubmitReviewMutation } from "@/features/reviews/api";
import { errorMessage } from "@/store/api";

const schema = z.object({
  customerName: z.string().trim().min(2, "Enter your name").max(120),
  city: z.string().trim().max(80).optional(),
  mobile: z.union([z.literal(""), z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number")]),
  occasion: z.enum(reviewOccasions),
  rating: z.number().int().min(1, "Tap the stars to rate").max(5),
  comment: z.string().trim().min(10, "Please write at least 10 characters").max(1000),
  website: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const words = ["", "Not good", "Okay", "Good", "Very good", "Loved it"];

/** Review form. Reviews go to the admin for approval before they appear on the site. */
export function ReviewForm({ defaultOccasion = "Home delivery" }: { defaultOccasion?: Values["occasion"] }) {
  const [submit, { isLoading }] = useSubmitReviewMutation();
  const [sent, setSent] = useState(false);
  const [hover, setHover] = useState(0);
  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", city: "", mobile: "", occasion: defaultOccasion, rating: 0, comment: "", website: "" },
  });
  const rating = useWatch({ control, name: "rating" });
  const shown = hover || rating;

  const onSubmit = async (v: Values) => {
    try {
      await submit({ ...v, city: v.city || undefined, mobile: v.mobile || undefined }).unwrap();
      setSent(true);
      reset();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-14 text-mint" />
        <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Thank you!</h3>
        <p className="max-w-sm text-choco-light">Your review will appear here after a quick check by our team.</p>
        <button type="button" onClick={() => setSent(false)} className="btn-outline mt-2">Write another</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue("rating", n, { shouldValidate: true })}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}, ${words[n]}`}
                aria-pressed={rating === n}
                className="rounded-full p-1 transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-berry/50"
              >
                <Star className={`size-9 ${n <= shown ? "fill-sun text-sun" : "fill-cream-dark text-choco/20"}`} />
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-choco-light" aria-live="polite">{words[shown]}</span>
        </div>
        {errors.rating && <p className="field-error">{errors.rating.message}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Your name" autoComplete="name" className="input rounded-full" {...register("customerName")} error={errors.customerName?.message} />
        <TextField label="City (optional)" autoComplete="address-level2" className="input rounded-full" {...register("city")} error={errors.city?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Your review is about" {...register("occasion")}>
          {reviewOccasions.map((o) => <option key={o}>{o}</option>)}
        </SelectField>
        <TextField label="Mobile (optional, never shown)" inputMode="numeric" autoComplete="tel" className="input rounded-full" {...register("mobile")} error={errors.mobile?.message} />
      </div>
      <TextArea label="Your review" placeholder="What did you love? Taste, delivery, the counter at your event..." {...register("comment")} error={errors.comment?.message} />

      {/* Hidden from people. Bots fill every field, so a value here marks the post as spam. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
        {isLoading && <Spinner className="size-4 text-white" />} Send review
      </button>
      <p className="text-center text-xs text-choco-light">Reviews are checked by our team before they appear. We never show your mobile number.</p>
    </form>
  );
}
