import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExploreGridSkeleton } from "@food/components/ui/loading-skeletons";
import OptimizedImage from "@food/components/OptimizedImage";
import discoveryBg from "@food/assets/food_discovery_bg.png";

const ExploreMoreSection = memo(({
  exploreMoreHeading,
  showExploreSkeleton,
  finalExploreItems,
  backendOrigin = ""
}) => {
  return (
    <section className="px-4 py-4 bg-white dark:bg-[#0a0a0a]">
      {/* Title matching the second mockup image */}
      <h2 className="text-[11px] sm:text-xs font-black text-slate-500 dark:text-neutral-400 tracking-wider uppercase mb-4">
        {exploreMoreHeading || "Explore More"}
      </h2>
      
      {showExploreSkeleton ? (
        <div className="w-full">
          <ExploreGridSkeleton count={3} className="grid-cols-3" />
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          {finalExploreItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex flex-col items-center group w-[76px] sm:w-20"
            >
              {/* White rounded card with soft shadow and border */}
              <div className="w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-[20px] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800/80 shadow-[0_4px_10px_rgba(0,0,0,0.04)] flex items-center justify-center p-3.5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-active:scale-95">
                <div className="w-full h-full overflow-hidden flex items-center justify-center">
                  <OptimizedImage
                    src={item.image}
                    alt={item.label}
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
              {/* Text label underneath the card */}
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-neutral-300 mt-2 text-center tracking-wide group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
});

export default ExploreMoreSection;
