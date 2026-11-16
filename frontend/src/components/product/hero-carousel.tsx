"use client";

import Link from "next/link";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { AppImage } from "@/components/ui";
import { whatsappLink } from "@/lib/brand";
import type { Banner } from "@/lib/types";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation
      loop={banners.length > 1}
      className="hero-swiper overflow-hidden rounded-3xl"
    >
      {banners.map((b, i) => (
        <SwiperSlide key={b.id}>
          <div className="relative h-[340px] sm:h-[420px] lg:h-[460px]">
            <AppImage src={b.imageUrl} alt="" priority={i === 0} sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent sm:from-black/40 sm:via-black/15" />
            <div className="relative flex h-full max-w-xl flex-col justify-center gap-4 px-8 text-white sm:px-14">
              <h1 className="text-3xl font-bold leading-tight drop-shadow sm:text-5xl">{b.title}</h1>
              {b.subtitle && <p className="text-base text-white/90 sm:text-lg">{b.subtitle}</p>}
              <div className="flex flex-wrap gap-3">
                <Link href={b.linkUrl ?? "/products"} className="btn bg-white text-choco shadow-md hover:bg-cream">
                  {b.linkUrl?.startsWith("/wedding") ? "Check dates" : "Order now"}
                </Link>
                <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn border border-white/60 text-white hover:bg-white/15">
                  Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export function ProductSlider({ children }: { children: React.ReactNode[] }) {
  return (
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={16}
      slidesPerView={1.3}
      breakpoints={{ 640: { slidesPerView: 2.3 }, 1024: { slidesPerView: 4 } }}
      className="!pb-2"
    >
      {children.map((child, i) => (
        <SwiperSlide key={i} className="!h-auto">{child}</SwiperSlide>
      ))}
    </Swiper>
  );
}
