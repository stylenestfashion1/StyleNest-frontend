import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";

export const CardCarousel = ({
  items = [],
  autoplayDelay = 2500,
  showPagination = true,
  showNavigation = true,
  onItemClick,
}) => {
  const css = `
  .category-swiper {
    width: 100%;
    padding-top: 20px;
    padding-bottom: 50px;
  }
  
  .category-swiper .swiper-slide {
    background-position: center;
    background-size: cover;
    width: 280px;
    height: 380px;
    border-radius: 20px;
    overflow: hidden;
    transition: transform 0.3s ease;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    .category-swiper .swiper-slide {
      width: 320px;
      height: 420px;
    }
  }
  
  .category-swiper .swiper-3d .swiper-slide-shadow-left,
  .category-swiper .swiper-3d .swiper-slide-shadow-right {
    background: none !important;
  }

  .category-swiper .swiper-pagination-bullet {
    background: rgba(255, 255, 255, 0.4);
    opacity: 1;
  }

  .category-swiper .swiper-pagination-bullet-active {
    background: #ffffff;
    width: 20px;
    border-radius: 4px;
  }
  `;

  return (
    <div className="w-full">
      <style>{css}</style>
      <Swiper
        className="category-swiper"
        spaceBetween={30}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        loop={items.length > 2}
        slidesPerView={"auto"}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 2.2,
          slideShadows: false,
        }}
        pagination={showPagination ? { clickable: true } : false}
        modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={item.id || index}
            onClick={() => onItemClick && onItemClick(item)}
            className="group relative shadow-2xl"
          >
            <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-neutral-900 border border-white/10">
              <img
                src={item.image || item.src}
                alt={item.name || item.alt || "Category"}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
                  Explore
                </span>
                <h3 className="mt-1 font-serif text-2xl text-white">
                  {item.name || item.alt}
                </h3>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default CardCarousel;
