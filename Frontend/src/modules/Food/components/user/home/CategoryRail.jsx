import React, { memo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowDownUp, Utensils } from "lucide-react";
import { CategoryChipRowSkeleton } from "@food/components/ui/loading-skeletons";
import OptimizedImage from "@food/components/OptimizedImage";
import { FOOD_VEG_COLOR } from "@food/constants/theme";
import allIcon from "@/assets/c0a633fa42582f2a3752d4341dcfa5a2-removebg-preview.png";

const CategoryRail = memo(({ 
  displayCategories, 
  showCategorySkeleton,
  navigate,
  backendOrigin = "",
  selectedCategory = "all",
  setSelectedCategory
}) => {
  const categoryScrollRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const rail = categoryScrollRef.current;
      if (!rail) return;

      const selectedButton = rail.querySelector("[data-category-selected='true']");
      if (!selectedButton || typeof selectedButton.scrollIntoView !== "function") return;

      selectedButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedCategory, displayCategories]);

  const dbAllCategory = displayCategories?.find(
    (cat) => cat.name?.trim().toLowerCase() === "all" || cat.slug?.trim().toLowerCase() === "all"
  );

  const filteredCategories = displayCategories?.filter(
    (cat) => cat.name?.trim().toLowerCase() !== "all" && cat.slug?.trim().toLowerCase() !== "all"
  ) || [];

  const allIconToUse = dbAllCategory?.image || allIcon;
  const allNameToUse = dbAllCategory?.name || "All";

  return (
    <section className="px-4 py-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        What's on your mind?
      </h2>
      
      <div 
        ref={categoryScrollRef}
        className="flex gap-4 overflow-x-auto -mx-4 px-4 scrollbar-hide pb-2" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
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

        {/* All section */}
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          data-category-selected={selectedCategory === "all" ? "true" : "false"}
          className={`flex-shrink-0 flex flex-col items-center gap-2 group pb-1.5 transition-all outline-none border-b-2 ${
            selectedCategory === "all" ? "border-[#DC021B]" : "border-transparent"
          }`}
        >
          <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] transition-transform group-hover:scale-110 flex items-center justify-center">
            <img
              src={allIconToUse}
              alt={allNameToUse}
              className="w-full h-full object-contain"
            />
          </div>
          <span className={`text-xs font-semibold truncate w-full text-center transition-colors ${
            selectedCategory === "all" ? "text-[#DC021B] dark:text-[#DC021B]" : "text-gray-600 dark:text-gray-300"
          }`}>
            {allNameToUse}
          </span>
        </button>

        {!showCategorySkeleton && filteredCategories.map((category, index) => {
          const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, "-");
          const isSelected = selectedCategory === categorySlug;
          return (
            <button
              key={category.id || index}
              type="button"
              onClick={() => setSelectedCategory(categorySlug)}
              data-category-selected={isSelected ? "true" : "false"}
              className={`flex-shrink-0 flex flex-col items-center gap-2 group pb-1.5 transition-all outline-none border-b-2 ${
                isSelected ? "border-[#DC021B]" : "border-transparent"
              }`}
            >
              <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] transition-transform group-hover:scale-110 flex items-center justify-center">
                <OptimizedImage
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-contain"
                  backendOrigin={backendOrigin}
                />
              </div>
              <span className={`text-xs font-semibold truncate w-full text-center transition-colors ${
                isSelected ? "text-[#DC021B] dark:text-[#DC021B]" : "text-gray-600 dark:text-gray-300"
              }`}>
                {category.name}
              </span>
            </button>
          );
        })}

        {showCategorySkeleton && <CategoryChipRowSkeleton className="flex-shrink-0" />}

        {/* See All link at the end */}
        <Link
          to={`/user/category/${selectedCategory || 'all'}`}
          className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
        >
          <div className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] rounded-full transition-transform group-hover:scale-110 flex items-center justify-center bg-[#FFF0F1] dark:bg-red-950/30">
            <Utensils className="h-6 w-6 text-[#ef4f5f] dark:text-red-450" />
          </div>
          <div className="flex items-center gap-0.5 justify-center mt-0.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              See all
            </span>
            <span className="text-[8px] text-[#ef4f5f] dark:text-red-450 select-none">▼</span>
          </div>
        </Link>
      </div>
    </section>
  );
});

export default CategoryRail;
