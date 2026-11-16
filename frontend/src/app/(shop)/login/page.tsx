"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageLoader, Spinner, TextField } from "@/components/ui";
import { useLoginMutation } from "@/features/auth/api";
import { homeFor } from "@/lib/roles";
import { errorMessage } from "@/store/api";

const schema = z.object({
  login: z.string().trim().min(3, "Enter email or mobile"),
  password: z.string().min(1, "Enter password"),
});

const demo = [
  ["Customer", "customer@icecream.local"],
  ["Admin", "admin@icecream.local"],
  ["Super admin", "superadmin@icecream.local"],
  ["Staff", "staff@icecream.local"],
  ["Delivery", "delivery@icecream.local"],
  ["Hawker", "hawker@icecream.local"],
] as const;

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const nextUrl = useSearchParams().get("next");
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const result = await login(values).unwrap();
      toast.success(`Welcome, ${result.user.fullName.split(" ")[0]}`);
      // Only allow local redirects.
      router.replace(nextUrl?.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : homeFor(result.user.role));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-8" noValidate>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <TextField label="Email or mobile" autoComplete="username" {...register("login")} error={errors.login?.message} />
          <TextField label="Password" type="password" autoComplete="current-password" {...register("password")} error={errors.password?.message} />
          <button disabled={isLoading} className="btn-primary w-full py-3">{isLoading && <Spinner className="size-4 text-white" />} Log in</button>
          <p className="text-center text-sm text-choco-light">
            New here? <Link href={`/register${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`} className="font-semibold text-berry">Create an account</Link>
          </p>
        </form>

        {process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === "true" && (
          <div className="card p-5">
            <div className="mb-2 text-sm font-semibold">Demo accounts (password Admin@123)</div>
            <div className="flex flex-wrap gap-2">
              {demo.map(([name, email]) => (
                <button
                  key={email}
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => { setValue("login", email); setValue("password", "Admin@123"); }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
