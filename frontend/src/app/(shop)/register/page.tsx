"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";
import { PageLoader, Spinner, TextField } from "@/components/ui";
import { useRegisterMutation } from "@/features/auth/api";
import { errorMessage } from "@/store/api";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Add one capital letter").regex(/\d/, "Add one number"),
});

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const nextUrl = useSearchParams().get("next");
  const [registerUser, { isLoading }] = useRegisterMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await registerUser(values).unwrap();
      toast.success("Account created");
      router.replace(nextUrl?.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : "/account/orders");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <AuthLayout title="Join the scoop club" subtitle="One free account for orders, tracking and event bookings." image="/images/products/strawberry-swirl.svg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <h2 className="font-display text-3xl font-semibold uppercase tracking-wide">Create account</h2>
        <span className="wave block" aria-hidden />
        <TextField label="Full name" autoComplete="name" className="input rounded-full" {...register("fullName")} error={errors.fullName?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" type="email" autoComplete="email" className="input rounded-full" {...register("email")} error={errors.email?.message} />
          <TextField label="Mobile" inputMode="numeric" autoComplete="tel" className="input rounded-full" {...register("mobile")} error={errors.mobile?.message} />
        </div>
        <PasswordField label="Password" autoComplete="new-password" {...register("password")} error={errors.password?.message} hint="8+ characters with a capital letter and a number" />
        <button disabled={isLoading} className="btn-primary w-full py-3.5 text-base">{isLoading && <Spinner className="size-4 text-white" />} Create account</button>
        <p className="text-center text-sm text-choco-light">Already have an account? <Link href={`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`} className="font-semibold text-berry hover:underline">Log in</Link></p>
      </form>
    </AuthLayout>
  );
}
