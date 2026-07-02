import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getCloudinarySrcSet } from "@/shared/utils/cloudinaryUtils";
import { getQuickProductPath, getQuickCategoryPath } from "../../utils/routes";

const isVideoUrl = (url) => {
  if (!url) return false;
  return (
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov") ||
    url.endsWith(".ogg") ||
    url.includes("/video/upload/")
  );
};

const ExperienceBannerCarousel = ({ section, items, fullWidth = false, slideGap = 0, edgeToEdge = false }) => {
  const navigate = useNavigate();

  if (!items.length) return null;

  const handleBannerClick = (banner) => {
    const { linkType, linkValue } = banner;
    if (!linkType || linkType === "none" || !linkValue) return;

    if (linkType === "url") {
      if (linkValue.startsWith("http://") || linkValue.startsWith("https://")) {
        window.open(linkValue, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = linkValue;
      }
      return;
    }

    if (linkType === "product") {
      navigate(getQuickProductPath(linkValue));
      return;
    }

    if (["category", "subcategory", "header"].includes(linkType)) {
      navigate(getQuickCategoryPath(linkValue));
      return;
    }
  };

  const effectiveSlideGap = fullWidth ? 0 : slideGap;

  const loopedItems = React.useMemo(() => {
    if (items.length > 1) {
      return [items[items.length - 1], ...items, items[0]];
    }
    return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = React.useState(items.length > 1 ? 1 : 0);
  const [isResetting, setIsResetting] = React.useState(false);
  const stepPercent = 100 / loopedItems.length;

  React.useEffect(() => {
    if (items.length <= 1) return;

    const intervalId = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [items.length]);

  React.useEffect(() => {
    if (items.length <= 1 || activeIndex !== items.length + 1) return;

    const timeoutId = window.setTimeout(() => {
      setIsResetting(true);
      setActiveIndex(1);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, items.length]);

  React.useEffect(() => {
    if (!isResetting) return;

    const frameId = window.requestAnimationFrame(() => {
      setIsResetting(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isResetting]);

  return (
    <div className={cn("overflow-hidden", fullWidth && "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]")}>
      <div
        className={cn("flex ease-out", isResetting ? "transition-none" : "transition-transform duration-500")}
        style={
          fullWidth
            ? {
                width: `${loopedItems.length * 100}%`,
                gap: `${effectiveSlideGap}px`,
                transform: `translateX(-${activeIndex * stepPercent}%)`,
              }
            : {
                width: "100%",
                gap: `${effectiveSlideGap}px`,
                transform: `translateX(calc(-${activeIndex} * (85% + ${effectiveSlideGap}px) + 7.5%))`,
              }
        }
      >
        {loopedItems.map((banner, idx) => {
          const hasLink = banner.linkType && banner.linkType !== "none" && banner.linkValue;
          const isVideo = isVideoUrl(banner.imageUrl);
          return (
            <div
              key={idx}
              className={cn(
                "relative shrink-0 flex items-center justify-center box-border",
                fullWidth ? "h-[190px] rounded-none px-0 bg-slate-100 overflow-hidden" : "h-[190px] bg-transparent"
              )}
              style={{
                width: fullWidth ? `${stepPercent}%` : "85%",
              }}
            >
              {fullWidth ? (
                <div 
                  className="relative w-full h-full overflow-hidden"
                  onClick={() => handleBannerClick(banner)}
                >
                  {isVideo ? (
                    <video
                      src={banner.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className={cn(
                        "w-full h-full object-cover object-center",
                        hasLink && "cursor-pointer hover:brightness-95 active:scale-[0.99] transition-all"
                      )}
                    />
                  ) : (
                    <img
                      src={banner.imageUrl}
                      srcSet={getCloudinarySrcSet(banner.imageUrl)}
                      sizes="100vw"
                      alt={banner.title || section?.title || "Banner"}
                      className={cn(
                        "w-full h-full object-cover object-center",
                        hasLink && "cursor-pointer hover:brightness-95 active:scale-[0.99] transition-all"
                      )}
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  )}
                  {(banner.title || banner.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6 text-left pointer-events-none">
                      {banner.subtitle && (
                        <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-0.5">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.title && (
                        <h3 className="text-white font-black text-base md:text-lg leading-tight">
                          {banner.title}
                        </h3>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    "relative h-full w-full max-w-[560px] overflow-hidden rounded-3xl bg-transparent",
                    hasLink && "cursor-pointer active:scale-[0.99] transition-all"
                  )}
                  onClick={() => handleBannerClick(banner)}
                >
                  {isVideo ? (
                    <video
                      src={banner.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <img
                      src={banner.imageUrl}
                      srcSet={getCloudinarySrcSet(banner.imageUrl)}
                      sizes="(max-width: 768px) 100vw, 560px"
                      alt={banner.title || section?.title || "Banner"}
                      className="w-full h-full object-cover object-center"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  )}
                  {(banner.title || banner.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6 text-left pointer-events-none">
                      {banner.subtitle && (
                        <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-0.5">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.title && (
                        <h3 className="text-white font-black text-base md:text-lg leading-tight">
                          {banner.title}
                        </h3>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExperienceBannerCarousel;
