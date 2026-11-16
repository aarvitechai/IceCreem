"use client";

import Link from "next/link";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { AppImage } from "@/components/ui";
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
      className="overflow-hidden rounded-3xl"
    >
      {banners.map((b, i) => (
        <SwiperSlide key={b.id}>
          <div className="relative h-[340px] sm:h-[420px] lg:h-[460px]">
            <AppImage src={b.imageUrl} alt="" priority={i === 0} sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
            <div className="relative flex h-full max-w-xl flex-col justify-center gap-4 px-8 text-white sm:px-14">
              <h1 className="text-3xl font-bold leading-tight drop-shadow sm:text-5xl">{b.title}</h1>
              {b.subtitle && <p className="text-base text-white/90 sm:text-lg">{b.subtitle}</p>}
              {b.linkUrl && (
                <Link href={b.linkUrl} className="btn w-fit bg-white text-choco hover:bg-cream">
                  Explore now
                </Link>
              )}
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
