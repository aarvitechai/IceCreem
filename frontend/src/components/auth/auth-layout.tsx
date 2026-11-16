import { CalendarHeart, PackageCheck, Zap } from "lucide-react";
import { SpinStamp } from "@/components/home/spin-stamp";
import { AppImage } from "@/components/ui";

const perks = [
  { icon: PackageCheck, text: "Track every order live" },
  { icon: Zap, text: "Faster checkout next time" },
  { icon: CalendarHeart, text: "Manage wedding and party bookings" },
];

/**
 * Two column screen for login and register: a bright picture side with the perks of an account,
 * and the form on a white card. On phones the picture side becomes a short coral header.
 */
export function AuthLayout({ title, subtitle, image, children }: { title: string; subtitle: string; image: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-choco/5 lg:grid-cols-2">
        <div className="relative overflow-hidden bg-gradient-to-br from-berry to-pink p-8 text-white sm:p-10">
          <span aria-hidden className="absolute -left-12 -top-12 size-48 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-20 -right-10 size-64 rounded-full bg-sun/25" />
          <div className="relative space-y-3">
            <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-wide sm:text-5xl">{title}</h1>
            <p className="text-white/90">{subtitle}</p>
          </div>
          <div className="relative mt-8 hidden lg:block">
            <div className="relative mx-auto aspect-square w-64 overflow-hidden rounded-[2rem] ring-8 ring-white/20">
              <AppImage src={image} alt="" sizes="256px" className="object-cover" />
            </div>
            <SpinStamp className="absolute -bottom-4 right-6" />
          </div>
          <ul className="relative mt-6 space-y-2 lg:mt-10">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20"><Icon className="size-4" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
