"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { SelectField, Spinner, TextArea, TextField } from "@/components/ui";
import { useAvailabilityQuery, useCreateBookingMutation } from "@/features/bookings/api";
import { date as fmtDate, money } from "@/lib/format";
import type { Booking, WeddingPackage } from "@/lib/types";
import { errorMessage } from "@/store/api";
import { useAppSelector } from "@/store/store";

const schema = z.object({
  eventDate: z.string().min(1, "Pick a date"),
  eventType: z.enum(["Wedding", "Reception", "Party"]),
  eventTimeSlot: z.string().max(40).optional(),
  guestCount: z.coerce.number<number>().int().min(50, "Minimum 50 guests").max(5000),
  venueName: z.string().trim().min(2, "Enter venue name").max(150),
  venueAddress: z.string().trim().min(5, "Enter venue address").max(500),
  packageId: z.coerce.number<number>().nullable(),
  contactName: z.string().trim().min(2, "Enter your name").max(120),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  specialRequest: z.string().max(1000).optional(),
});

type Values = z.infer<typeof schema>;
const STEPS = ["Date", "Event", "Package", "Contact"];
const stepFields: (keyof Values)[][] = [["eventDate"], ["eventType", "guestCount", "venueName", "venueAddress"], ["packageId"], ["contactName", "mobile", "email"]];

export function BookingWizard({ packages }: { packages: WeddingPackage[] }) {
  const params = useSearchParams();
  const user = useAppSelector((s) => s.auth.user);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Booking | null>(null);
  const [create, { isLoading }] = useCreateBookingMutation();
  const preset = Number(params.get("package")) || null;

  const { register, control, handleSubmit, setValue, trigger, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { eventType: "Wedding", guestCount: 200, packageId: preset, eventDate: "", contactName: "", mobile: "", email: "", venueName: "", venueAddress: "" },
  });

  useEffect(() => {
    if (user) reset((v) => ({ ...v, contactName: v.contactName || user.fullName, mobile: v.mobile || user.mobile, email: v.email || user.email }));
  }, [user, reset]);

  const [eventDate, eventType, guestCount, packageId] = useWatch({ control, name: ["eventDate", "eventType", "guestCount", "packageId"] });
  const values = { eventDate, eventType, guestCount, packageId };
  const pkg = packages.find((p) => p.id === Number(values.packageId));
  const estimate = pkg ? pkg.pricePerHead * (Number(values.guestCount) || 0) : 0;

  const next = async () => {
    if (await trigger(stepFields[step])) {
      if (step === 2 && pkg && values.guestCount < pkg.minGuests) {
        toast.error(`${pkg.name} needs at least ${pkg.minGuests} guests.`);
        return;
      }
      setStep((s) => s + 1);
    }
  };

  const onSubmit = async (v: Values) => {
    try {
      const booking = await create({ ...v, email: v.email || undefined, packageId: v.packageId || null }).unwrap();
      setDone(booking);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (done) {
    return (
      <div className="card mx-auto max-w-lg space-y-3 p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-mint" />
        <h2 className="text-2xl font-bold">Enquiry received</h2>
        <p className="text-choco-light">Booking number <b>{done.bookingNumber}</b> for {fmtDate(done.eventDate)}. Our team will call you and send a quote within 24 hours.</p>
        {user ? <Link href="/account/bookings" className="btn-primary">See my bookings</Link> : <Link href="/" className="btn-primary">Back to home</Link>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="card p-6 sm:p-8">
        <ol className="mb-8 flex gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-berry" : "bg-choco/10"}`} />
              <div className={`mt-2 text-xs font-semibold ${i === step ? "text-berry" : "text-choco-light"}`}>{i + 1}. {s}</div>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">When is the event?</h2>
            <Calendar selected={values.eventDate} onSelect={(d) => setValue("eventDate", d, { shouldValidate: true })} />
            {errors.eventDate && <p className="field-error">{errors.eventDate.message}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tell us about the event</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Event type" {...register("eventType")}>
                <option>Wedding</option><option>Reception</option><option>Party</option>
              </SelectField>
              <SelectField label="Serving time" {...register("eventTimeSlot")}>
                <option value="">Not sure yet</option>
                <option>Lunch (12 pm to 4 pm)</option>
                <option>Evening (6 pm to 11 pm)</option>
                <option>Late night (9 pm to 1 am)</option>
              </SelectField>
            </div>
            <TextField label="Number of guests" type="number" min={50} {...register("guestCount")} error={errors.guestCount?.message} />
            <TextField label="Venue name" {...register("venueName")} error={errors.venueName?.message} />
            <TextArea label="Venue address" {...register("venueAddress")} error={errors.venueAddress?.message} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Choose a package</h2>
            {packages.map((p) => (
              <label key={p.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 ${Number(values.packageId) === p.id ? "border-berry bg-berry-light" : "border-choco/10"}`}>
                <input type="radio" value={p.id} {...register("packageId")} className="accent-berry" />
                <div className="flex-1">
                  <div className="font-semibold">{p.name} <span className="text-sm font-normal text-choco-light">from {p.minGuests} guests</span></div>
                  <div className="text-sm text-choco-light">{p.description}</div>
                </div>
                <div className="text-right font-bold">{money(p.pricePerHead)}<div className="text-xs font-normal text-choco-light">per guest</div></div>
              </label>
            ))}
            <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 ${!values.packageId ? "border-berry bg-berry-light" : "border-choco/10"}`}>
              <input type="radio" checked={!values.packageId} onChange={() => setValue("packageId", null)} className="accent-berry" />
              <div><div className="font-semibold">Custom</div><div className="text-sm text-choco-light">Tell us your flavours and we will plan it.</div></div>
            </label>
            <TextArea label="Special requests (optional)" placeholder="Flavours, theme, sugar free options..." {...register("specialRequest")} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">How can we reach you?</h2>
            <TextField label="Your name" {...register("contactName")} error={errors.contactName?.message} />
            <TextField label="Mobile" inputMode="numeric" {...register("mobile")} error={errors.mobile?.message} />
            <TextField label="Email (optional)" type="email" {...register("email")} error={errors.email?.message} />
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="btn-ghost"><ChevronLeft className="size-4" /> Back</button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary">Next <ChevronRight className="size-4" /></button>
          ) : (
            <button type="submit" disabled={isLoading} className="btn-primary">{isLoading && <Spinner className="size-4 text-white" />} Send enquiry</button>
          )}
        </div>
      </div>

      <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-24">
        <h3 className="font-semibold">Summary</h3>
        <dl className="space-y-2 text-sm">
          <Item label="Date" value={values.eventDate ? fmtDate(values.eventDate) : "Not picked"} />
          <Item label="Event" value={values.eventType} />
          <Item label="Guests" value={String(values.guestCount || "-")} />
          <Item label="Package" value={pkg?.name ?? "Custom"} />
        </dl>
        {estimate > 0 && (
          <div className="rounded-xl bg-mango-light p-4">
            <div className="text-xs text-choco-light">Estimated amount</div>
            <div className="text-2xl font-bold">{money(estimate)}</div>
            <div className="text-xs text-choco-light">Final price comes in the quote. Advance is 30 percent.</div>
          </div>
        )}
      </aside>
    </form>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt className="text-choco-light">{label}</dt><dd className="font-medium">{value}</dd></div>;
}

/** Month calendar coloured by live capacity from the API. */
function Calendar({ selected, onSelect }: { selected: string; onSelect: (iso: string) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const { data, isFetching } = useAvailabilityQuery(cursor);

  const blanks = useMemo(() => new Date(cursor.year, cursor.month - 1, 1).getDay(), [cursor]);
  const title = new Date(cursor.year, cursor.month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const move = (delta: number) => setCursor(({ year, month }) => {
    const d = new Date(year, month - 1 + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  return (
    <div className="max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className="btn-ghost btn-sm" aria-label="Previous month"><ChevronLeft className="size-4" /></button>
        <div className="flex items-center gap-2 font-semibold">{title} {isFetching && <Spinner className="size-4" />}</div>
        <button type="button" onClick={() => move(1)} className="btn-ghost btn-sm" aria-label="Next month"><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-choco-light">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
        {data?.map((day) => {
          const n = Number(day.date.slice(8));
          const isSelected = selected === day.date;
          const left = day.max - day.booked;
          return (
            <button
              key={day.date}
              type="button"
              disabled={!day.available}
              onClick={() => onSelect(day.date)}
              title={day.available ? `${left} slot(s) left` : "Not available"}
              className={`aspect-square rounded-xl text-sm font-medium transition ${isSelected ? "bg-berry text-white" : day.available ? (left === 1 ? "bg-mango-light hover:bg-mango/40" : "bg-mint-light hover:bg-mint/30") : "cursor-not-allowed bg-choco/5 text-choco/30"}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-choco-light">
        <span className="flex items-center gap-1"><span className="size-3 rounded bg-mint-light" /> Available</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded bg-mango-light" /> Last slot</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded bg-choco/5" /> Not available</span>
      </div>
    </div>
  );
}
