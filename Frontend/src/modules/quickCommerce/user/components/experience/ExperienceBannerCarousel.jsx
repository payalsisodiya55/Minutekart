import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getCloudinarySrcSet } from "@/shared/utils/cloudinaryUtils";
import { getQuickProductPath, getQuickCategoryPath } from "../../utils/routes";

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

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isResetting, setIsResetting] = React.useState(false);
  const loopedItems = items.length > 1 ? [...items, items[0]] : items;
  const stepPercent = 100 / loopedItems.length;

  React.useEffect(() => {
    if (items.length <= 1) return;

    const intervalId = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [items.length]);

  React.useEffect(() => {
    if (items.length <= 1 || activeIndex !== items.length) return;

    const timeoutId = window.setTimeout(() => {
      setIsResetting(true);
      setActiveIndex(0);
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
        style={{
          width: `${loopedItems.length * 100}%`,
          gap: `${effectiveSlideGap}px`,
          transform: `translateX(-${activeIndex * stepPercent}%)`,
        }}
      >
        {loopedItems.map((banner, idx) => {
          const hasLink = banner.linkType && banner.linkType !== "none" && banner.linkValue;
          return (
            <div
              key={idx}
              className={cn(
                "relative shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center box-border",
                fullWidth ? "h-[190px] rounded-none px-0" : "h-[190px] px-4 md:px-8"
              )}
              style={{
                width: `${stepPercent}%`,
              }}
            >
              {fullWidth ? (
                <img
                  src={banner.imageUrl}
                  srcSet={getCloudinarySrcSet(banner.imageUrl)}
                  sizes="100vw"
                  alt={banner.title || section?.title || "Banner"}
                  className={cn(
                    "w-full h-full object-cover object-center",
                    hasLink && "cursor-pointer hover:brightness-95 active:scale-[0.99] transition-all"
                  )}
                  onClick={() => handleBannerClick(banner)}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              ) : (
                <div
                  className={cn(
                    "h-full w-full max-w-[560px] -translate-x-2 md:-translate-x-4 overflow-hidden rounded-3xl bg-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
                    hasLink && "cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all"
                  )}
                  onClick={() => handleBannerClick(banner)}
                >
                  <img
                    src={banner.imageUrl}
                    srcSet={getCloudinarySrcSet(banner.imageUrl)}
                    sizes="(max-width: 768px) 100vw, 560px"
                    alt={banner.title || section?.title || "Banner"}
                    className="w-full h-full object-cover object-center"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
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
