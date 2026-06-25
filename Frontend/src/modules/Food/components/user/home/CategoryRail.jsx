import React, { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowDownUp } from "lucide-react";
import { CategoryChipRowSkeleton } from "@food/components/ui/loading-skeletons";
import OptimizedImage from "@food/components/OptimizedImage";
import foodPattern from "@food/assets/food_pattern_background.png";
import { FOOD_VEG_COLOR } from "@food/constants/theme";
import allIcon from "@/assets/c0a633fa42582f2a3752d4341dcfa5a2-removebg-preview.png";

const CategoryRail = memo(({ 
  displayCategories, 
  showCategorySkeleton,
  navigate,
  backendOrigin = ""
}) => {
  return (
    <section className="px-4 py-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        What's on your mind?
      </h2>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div 
          className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/user/under-250")}
        >
          <div 
            className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] rounded-2xl flex flex-col items-center justify-center p-1 shadow-sm transition-transform group-hover:scale-105 group-active:scale-95"
            style={{ backgroundColor: FOOD_VEG_COLOR }}
          >
            <span className="text-[10px] font-bold text-white/90">UNDER</span>
            <span className="text-sm sm:text-base font-black text-white">₹200</span>
            <div className="mt-1 px-2 py-0.5 bg-white rounded-full">
              <span className="text-[8px] font-extrabold" style={{ color: FOOD_VEG_COLOR }}>Explore</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Offers</span>
        </div>

        {/* All section linking to All Categories page, placed next to the categories list */}
        <Link
          to="/user/category/all"
          className="flex-shrink-0 flex flex-col items-center gap-2 group"
        >
          <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] transition-transform group-hover:scale-110 flex items-center justify-center">
            <img
              src={allIcon}
              alt="All"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate w-full text-center">
            All
          </span>
        </Link>


        {!showCategorySkeleton && displayCategories.map((category, index) => (
          <Link
            key={category.id || index}
            to={`/user/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] transition-transform group-hover:scale-110 flex items-center justify-center">
              <OptimizedImage
                src={category.image}
                alt={category.name}
                className="w-full h-full object-contain"
                backendOrigin={backendOrigin}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate w-full text-center">
              {category.name}
            </span>
          </Link>
        ))}

        {showCategorySkeleton && <CategoryChipRowSkeleton className="flex-shrink-0" />}
      </div>
    </section>
  );
});

export default CategoryRail;
