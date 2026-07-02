import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { resolveQuickImageUrl } from "../utils/image";

const ExperienceBannerCarousel = ({ section, items, fullWidth = false, slideGap = 0 }) => {
  if (!items || !items.length) return null;

  const effectiveSlideGap = fullWidth ? 0 : slideGap;

  const loopedItems = React.useMemo(() => {
    if (items.length > 1) {
      return [items[items.length - 1], ...items, items[0]];
    }
    return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(items.length > 1 ? 1 : 0);
  const [isResetting, setIsResetting] = useState(false);
  const stepPercent = 100 / loopedItems.length;

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = React.useRef(0);

  const handleDragStart = (clientX) => {
    if (items.length <= 1) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    const diff = clientX - startXRef.current;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Swipe threshold (50px)
    if (dragOffset > 50) {
      setActiveIndex((prev) => prev - 1);
    } else if (dragOffset < -50) {
      setActiveIndex((prev) => prev + 1);
    }
    
    setDragOffset(0);
  };

  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleMouseDown = (e) => {
    // Avoid default image dragging outlines
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    handleDragEnd();
  };

  useEffect(() => {
    if (items.length <= 1 || isDragging) return;

    const intervalId = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [items.length, isDragging]);

  useEffect(() => {
    if (items.length <= 1) return;

    if (activeIndex === items.length + 1) {
      const timeoutId = window.setTimeout(() => {
        setIsResetting(true);
        setActiveIndex(1);
      }, 500);
      return () => window.clearTimeout(timeoutId);
    }

    if (activeIndex === 0) {
      const timeoutId = window.setTimeout(() => {
        setIsResetting(true);
        setActiveIndex(items.length);
      }, 500);
      return () => window.clearTimeout(timeoutId);
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (!isResetting) return;

    const frameId = window.requestAnimationFrame(() => {
      setIsResetting(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isResetting]);

  return (
    <div className={cn("overflow-hidden", fullWidth && "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]")}>
      <div
        className={cn("flex ease-out select-none", (isResetting || isDragging) ? "transition-none" : "transition-transform duration-500")}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={
          fullWidth
            ? {
                width: `${loopedItems.length * 100}%`,
                gap: `${effectiveSlideGap}px`,
                transform: `translateX(calc(-${activeIndex * stepPercent}% + ${dragOffset}px))`,
              }
            : {
                width: "100%",
                gap: `${effectiveSlideGap}px`,
                transform: `translateX(calc(-${activeIndex} * (85% + ${effectiveSlideGap}px) + 7.5% + ${dragOffset}px))`,
              }
        }
      >
        {loopedItems.map((banner, idx) => (
          <div
            key={idx}
            className={cn(
              "relative shrink-0 flex items-center justify-center box-border",
              fullWidth ? "h-[190px] rounded-none px-0 bg-slate-100 overflow-hidden" : "h-[180px] md:h-[220px] bg-transparent"
            )}
            style={{
              width: fullWidth ? `${stepPercent}%` : "85%",
            }}
          >
            {fullWidth ? (
              <div className="relative w-full h-full">
                <img
                  src={resolveQuickImageUrl(banner.imageUrl || banner.image)}
                  alt={banner.title || section?.title || "Banner"}
                  className="w-full h-full object-cover object-center"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent flex flex-col justify-center px-8 text-white">
                    {banner.subtitle && <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{banner.subtitle}</p>}
                    {banner.title && <h3 className="text-2xl md:text-3xl font-black uppercase italic leading-tight">{banner.title}</h3>}
                    {banner.linkType !== 'none' && (
                      <button className="mt-4 w-fit bg-[#FF1E56] text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg">
                        Order now
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full max-w-[1400px] overflow-hidden rounded-2xl bg-transparent relative group">
                <img
                  src={resolveQuickImageUrl(banner.imageUrl || banner.image)}
                  alt={banner.title || section?.title || "Banner"}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-linear-to-r from-black/30 via-transparent to-transparent flex flex-col justify-center px-10 text-white">
                    {banner.subtitle && <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-90 mb-2 drop-shadow-md">{banner.subtitle}</p>}
                    {banner.title && <h3 className="text-3xl md:text-4xl font-[1000] uppercase italic leading-none drop-shadow-xl">{banner.title}</h3>}
                    {banner.linkType !== 'none' && (
                      <button className="mt-6 w-fit bg-[#FF1E56] hover:bg-[#ff386a] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">
                        Order now
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceBannerCarousel;
