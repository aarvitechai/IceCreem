"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { EmptyState, PageLoader, Spinner, TextArea, TextField } from "@/components/ui";
import { useCheckoutSummaryQuery, usePlaceOrderMutation } from "@/features/orders/api";
import { money } from "@/lib/format";
import { errorMessage } from "@/store/api";
import { clearCart } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

const schema = z.object({
  customerName: z.string().trim().min(2, "Enter your name").max(120),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  addressLine: z.string().trim().min(5, "Enter full address").max(500),
  city: z.string().trim().min(2, "Enter city").max(80),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6 digit pincode"),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, couponCode } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const lines = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const { data: summary } = useCheckoutSummaryQuery({ items: lines, couponCode }, { skip: items.length === 0 });
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", mobile: "", email: "", addressLine: "", city: "", pincode: "", notes: "" },
  });

  useEffect(() => {
    if (user) reset((v) => ({ ...v, customerName: v.customerName || user.fullName, mobile: v.mobile || user.mobile, email: v.email || user.email }));
  }, [user, reset]);

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState title="Nothing to checkout" action={<Link href="/products" className="btn-primary">Browse ice creams</Link>} />
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const order = await placeOrder({
        ...values,
        email: values.email || undefined,
        items: lines,
        couponCode: summary?.couponCode ?? null,
        paymentMethod: "CashOnDelivery",
      }).unwrap();
      dispatch(clearCart());
      router.push(`/order-success/${order.orderNumber}?mobile=${order.customerMobile}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-semibold">Contact</h2>
            {!user && (
              <p className="text-sm text-choco-light">
                Have an account? <Link href="/login?next=/checkout" className="font-semibold text-berry">Log in</Link> to see this order in your history.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Full name" autoComplete="name" {...register("customerName")} error={errors.customerName?.message} />
              <TextField label="Mobile" inputMode="numeric" autoComplete="tel" {...register("mobile")} error={errors.mobile?.message} hint="We share delivery updates on this number" />
            </div>
            <TextField label="Email (optional)" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
          </section>

          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-semibold">Delivery address</h2>
            <TextField label="House, street, area" autoComplete="street-address" {...register("addressLine")} error={errors.addressLine?.message} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="City" autoComplete="address-level2" {...register("city")} error={errors.city?.message} />
              <TextField label="Pincode" inputMode="numeric" autoComplete="postal-code" {...register("pincode")} error={errors.pincode?.message} />
            </div>
            <TextArea label="Delivery note (optional)" placeholder="Landmark, preferred time..." {...register("notes")} />
          </section>

          <section className="card space-y-3 p-6">
            <h2 className="text-lg font-semibold">Payment</h2>
            <label className="flex items-center gap-3 rounded-xl border-2 border-berry bg-berry-light p-4">
              <input type="radio" checked readOnly className="accent-berry" />
              <span>
                <span className="block font-semibold">Cash or UPI on delivery</span>
                <span className="text-sm text-choco-light">Pay the delivery partner when your order arrives.</span>
              </span>
            </label>
            <p className="text-xs text-choco-light">Online payment (Razorpay) will be added soon.</p>
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span>{i.productName} <span className="text-choco-light">({i.variantName}) x {i.quantity}</span></span>
                <span className="font-medium">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {summary ? (
            <dl className="space-y-2 border-t border-choco/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-choco-light">Items</dt><dd>{money(summary.subTotal)}</dd></div>
              {summary.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>- {money(summary.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-choco-light">Delivery</dt><dd>{summary.deliveryCharge === 0 ? "Free" : money(summary.deliveryCharge)}</dd></div>
              <div className="flex justify-between border-t border-choco/10 pt-3 text-base font-bold"><dt>To pay</dt><dd>{money(summary.grandTotal)}</dd></div>
            </dl>
          ) : <Spinner />}
          <button type="submit" disabled={isLoading || !summary} className="btn-primary w-full py-3">
            {isLoading && <Spinner className="size-4 text-white" />} Place order
          </button>
        </aside>
      </form>
    </div>
  );
}
