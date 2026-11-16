"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
    <div className="container-page flex justify-center py-16">
      <form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-md space-y-4 p-8" noValidate>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <TextField label="Full name" autoComplete="name" {...register("fullName")} error={errors.fullName?.message} />
        <TextField label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
        <TextField label="Mobile" inputMode="numeric" autoComplete="tel" {...register("mobile")} error={errors.mobile?.message} />
        <TextField label="Password" type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} hint="8+ characters with a capital letter and a number" />
        <button disabled={isLoading} className="btn-primary w-full py-3">{isLoading && <Spinner className="size-4 text-white" />} Create account</button>
        <p className="text-center text-sm text-choco-light">Already have an account? <Link href="/login" className="font-semibold text-berry">Log in</Link></p>
      </form>
    </div>
  );
}
