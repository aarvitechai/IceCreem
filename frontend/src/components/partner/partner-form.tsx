"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { SelectField, TextArea, TextField } from "@/components/ui";
import { brand, whatsappLink } from "@/lib/brand";

export const partnerTypes = ["Franchise outlet", "Distributor", "Hotel or restaurant supply", "Bulk or corporate orders"] as const;
const premises = ["Owned", "Rented or leased", "Not yet"] as const;
const budgets = ["Under 5 lakh", "5 to 10 lakh", "10 to 20 lakh", "Above 20 lakh"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  city: z.string().trim().min(2, "Enter your city").max(80),
  type: z.enum(partnerTypes),
  premises: z.enum(premises),
  budget: z.enum(budgets),
  message: z.string().max(500).optional(),
});

type Values = z.infer<typeof schema>;

/** Sends the enquiry to the owner on WhatsApp, already filled in. */
export function PartnerForm() {
  const { register, handleSubmit, control, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", mobile: "", city: "", type: "Franchise outlet", premises: "Owned", budget: "5 to 10 lakh", message: "" },
  });
  const type = useWatch({ control, name: "type" });
  const needsOutlet = type === "Franchise outlet";

  const send = (v: Values) => {
    const lines = [
      `Partner enquiry for ${brand.name}`,
      `Name: ${v.name}`,
      `Mobile: ${v.mobile}`,
      `City: ${v.city}`,
      `Interested in: ${v.type}`,
      ...(needsOutlet ? [`Premises: ${v.premises}`, `Budget: ${v.budget}`] : []),
      ...(v.message ? [`Note: ${v.message}`] : []),
    ];
    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener");
  };

  return (
    <form onSubmit={handleSubmit(send)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Your name" autoComplete="name" {...register("name")} error={errors.name?.message} />
        <TextField label="Mobile" inputMode="numeric" autoComplete="tel" {...register("mobile")} error={errors.mobile?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="City" autoComplete="address-level2" {...register("city")} error={errors.city?.message} />
        <SelectField label="Interested in" {...register("type")}>
          {partnerTypes.map((t) => <option key={t}>{t}</option>)}
        </SelectField>
      </div>
      {needsOutlet && (
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="label">Shop premises</legend>
            <div className="flex flex-wrap gap-2">
              {premises.map((p) => (
                <label key={p} className="cursor-pointer">
                  <input type="radio" value={p} {...register("premises")} className="peer sr-only" />
                  <span className="block rounded-full border-2 border-choco/10 bg-white px-4 py-1.5 text-sm font-medium transition peer-checked:border-berry peer-checked:bg-berry-light peer-checked:text-berry-dark peer-focus-visible:ring-2 peer-focus-visible:ring-berry/40">{p}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <SelectField label="Budget" {...register("budget")}>
            {budgets.map((b) => <option key={b}>{b}</option>)}
          </SelectField>
        </div>
      )}
      <TextArea label="Anything else (optional)" placeholder="Shop location, expected start date..." {...register("message")} />
      <button type="submit" className="btn-primary w-full py-3.5 text-base">
        <Send className="size-4" /> Send enquiry on WhatsApp
      </button>
      <p className="text-center text-xs text-choco-light">Opens WhatsApp with your details filled in. Or call {brand.owner} on {brand.phoneDisplay}.</p>
    </form>
  );
}
