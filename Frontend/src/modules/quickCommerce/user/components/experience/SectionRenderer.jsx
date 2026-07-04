import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../shared/ProductCard";
import { cn } from "@/lib/utils";
import ExperienceBannerCarousel from "./ExperienceBannerCarousel";
import { resolveQuickImageUrl } from "../../utils/image";
import { getCloudinarySrcSet } from "@/shared/utils/cloudinaryUtils";
import { motion } from "framer-motion";
import { getQuickCategoryPath } from "../../utils/routes";
import { ChevronRight } from "lucide-react";

const SectionRenderer = ({ sections = [], productsById = {}, categoriesById = {}, subcategoriesById = {} }) => {
  const navigate = useNavigate();

  const categoryBgColors = [
    "#E7F3FF", // Light Blue
    "#F0FFF4", // Light Mint
    "#FFF5F5", // Light Rose
    "#FFF9E7", // Light Amber
    "#F3E8FF", // Light Purple
    "#E6FFFA", // Light Teal
    "#FFEDD5", // Light Orange
    "#F0F9FF", // Light Sky
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const heading = section.title;

        if (section.displayType === "banners") {
          const items = section.config?.banners?.items || section.config?.items || [];
          if (!items.length) return null;
          return (
            <div key={section._id} className="py-2 md:py-4">
              <ExperienceBannerCarousel section={section} items={items} slideGap={12} />
            </div>
          );
        }

        if (section.displayType === "categories") {
          const categoryConfig = section.config?.categories || {};
          const hydratedItems = categoryConfig.items || [];
          const rows = categoryConfig.rows || 1;
          const visibleCount = Math.min(categoryConfig.maxItems || (rows * 4), rows * 4);

          const items = hydratedItems.map(c => ({
            ...c,
            id: c.id || c._id,
            image: resolveQuickImageUrl(c.image || c.mainImage)
          })).slice(0, visibleCount);

          if (!items.length) return null;

          return (
            <div
              key={section._id}
              id={`section-${section._id}`}
              className="mt-0"
            >
              {heading && (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black text-foreground">
                    {heading}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {items.length} categories
                  </span>
                </div>
              )}
              <div
                className="grid grid-cols-4 gap-2 md:gap-4 overflow-hidden [perspective:1000px]"
                style={{
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {items.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{
                      rotateY: idx % 2 === 0 ? 45 : -45,
                      opacity: 0,
                      y: 20,
                      scale: 0.95
                    }}
                    whileInView={{
                      rotateY: 0,
                      opacity: 1,
                      y: 0,
                      scale: 1
                    }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: (idx % 4) * 0.05
                    }}
                    onClick={() => navigate(getQuickCategoryPath(cat.id))}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div
                      className="w-full aspect-square rounded-2xl p-1 mb-1.5 bg-[#EBF3F4] group-hover:scale-[1.03] transition-all duration-300 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={cat.image}
                        srcSet={getCloudinarySrcSet(cat.image)}
                        sizes="(max-width: 768px) 25vw, 150px"
                        alt={cat.name}
                        className="w-full h-full object-contain transition-transform duration-500 mix-blend-multiply"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[11px] md:text-xs font-semibold text-slate-800 text-center line-clamp-2 leading-tight px-0.5 group-hover:text-black transition-colors">
                      {cat.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        }

        if (section.displayType === "subcategories") {
          const subConfig = section.config?.subcategories || {};
          const items = subConfig.items || [];

          if (!items.length) return null;

          return (
            <div
              key={section._id}
              id={`section-${section._id}`}
              className=""
            >
              <div className="flex items-center justify-between mb-3">
                {heading && (
                  <h3 className="text-base font-black text-foreground">
                    {heading}
                  </h3>
                )}
                <span className="text-[11px] font-semibold text-slate-400">
                  {items.length} items
                </span>
              </div>
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
                <div className="flex gap-4 pb-2">
                  {items.map((cat) => (
                    <button
                      key={cat._id || cat.id}
                      className="flex flex-col items-center gap-2 w-20 shrink-0 group"
                      onClick={() => {
                        const parentId =
                          cat.parentId?._id ||
                          cat.parentId ||
                          cat.categoryId?._id ||
                          cat.categoryId ||
                          null;

                        if (parentId) {
                          navigate(getQuickCategoryPath(parentId), {
                            state: { activeSubcategoryId: cat._id },
                          });
                        } else {
                          // Fallback to previous behavior if we can't resolve parent
                          navigate(getQuickCategoryPath(cat._id));
                        }
                      }}
                    >
                      <div className="relative aspect-square w-full rounded-2xl bg-card dark:bg-background border border-border flex items-center justify-center overflow-hidden p-1 transition-all duration-200 group-hover:border-[#0c831f]/40 group-hover:bg-accent group-hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
                        {cat.image ? (
                          <img
                            src={resolveQuickImageUrl(cat.image)}
                            srcSet={getCloudinarySrcSet(cat.image)}
                            sizes="80px"
                            alt={cat.name}
                            className="w-full h-full object-contain object-center mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-slate-100" />
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-foreground text-center leading-snug line-clamp-2 group-hover:text-[#0c831f]">
                        {cat.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (section.displayType === "products") {
          const productConfig = section.config?.products || {};
          const hydratedItems = productConfig.items || [];
          const rows = productConfig.rows || 1;
          const columns = productConfig.columns || 2;
          const singleRowScrollable = !!productConfig.singleRowScrollable;

          const allProducts = hydratedItems.map(p => ({
            ...p,
            id: p._id || p.id,
            image: resolveQuickImageUrl(p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2"),
            price: Number(p.price || p.salePrice || 0),
            originalPrice: Number(p.originalPrice || p.mrp || p.price || p.salePrice || 0)
          }));

          if (!allProducts.length) return null;

          const getSectionCategoryInfo = () => {
            let catId = null;
            let subId = null;

            if (productConfig.categoryIds && productConfig.categoryIds.length > 0) {
              const firstCat = productConfig.categoryIds[0];
              catId = typeof firstCat === 'object' && firstCat !== null ? firstCat._id : firstCat;
            }

            if (section.config?.products?.subcategoryId) {
              const sId = section.config.products.subcategoryId;
              subId = typeof sId === 'object' && sId !== null ? sId._id : sId;
            }

            const pItems = hydratedItems || [];
            if (pItems.length > 0) {
              const firstItem = pItems[0];
              const fullProd = typeof firstItem === 'object' && firstItem !== null 
                ? firstItem 
                : productsById[firstItem?._id || firstItem?.id || firstItem];
              if (fullProd) {
                // Extract subcategory ID
                const subcatVal = fullProd.subcategoryId || fullProd.subcategory;
                if (subcatVal && !subId) {
                  subId = typeof subcatVal === 'object' ? (subcatVal._id || subcatVal.id) : subcatVal;
                }

                // Extract category ID
                const catVal = fullProd.categoryId || fullProd.category;
                if (catVal && !catId) {
                  catId = typeof catVal === 'object' ? (catVal._id || catVal.id) : catVal;
                }
              }
            }

            // If we found a subcategory but not a main category, try to resolve parent from categoryMap or subcategoryMap
            if (subId && !catId) {
              const subObj = categoriesById[subId] || subcategoriesById[subId];
              if (subObj) {
                const parentId = subObj.parentId || subObj.headerId || subObj.parent?._id || subObj.parent || subObj.header?._id || subObj.header;
                catId = parentId ? (typeof parentId === 'object' ? (parentId._id || parentId.id) : parentId) : subId;
              }
            }

            // If we found a category, see if we can resolve its parent if it's actually a subcategory
            if (catId) {
              const catObj = categoriesById[catId] || subcategoriesById[catId];
              if (catObj) {
                const parentId = catObj.parentId || catObj.headerId || catObj.parent?._id || catObj.parent || catObj.header?._id || catObj.header;
                const resolvedParentId = parentId ? (typeof parentId === 'object' ? (parentId._id || parentId.id) : parentId) : null;
                if (resolvedParentId) {
                  // The catId was actually a subcategory! Update subId to catId, and catId to the parent category
                  if (!subId) subId = catId;
                  catId = resolvedParentId;
                }
              }
            }

            return { catId, subId };
          };

          const { catId: finalCatId, subId: finalSubId } = getSectionCategoryInfo();
          const previewProducts = allProducts.slice(0, 3);

          if (singleRowScrollable) {
            return (
              <div
                key={section._id}
                id={`section-${section._id}`}
                className="mb-2"
              >
                <div className="flex items-center justify-between mb-3">
                  {heading && (
                    <h3 className="text-base font-black text-foreground">
                      {heading}
                    </h3>
                  )}
                  <span className="text-[11px] font-semibold text-slate-400">
                    {allProducts.length} items
                  </span>
                </div>
                <div className="relative z-10 flex overflow-x-auto gap-3 pb-4 no-scrollbar">
                  {allProducts.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="w-[165px] shrink-0"
                    >
                      <ProductCard product={product} compact={true} neutralBg={true} hideBadge={true} showTimeOnImage={true} />
                    </div>
                  ))}
                </div>
                {/* See all products card at the bottom of the section */}
                {finalCatId && (
                  <div 
                    onClick={() => {
                      navigate(`/quick/categories/${finalCatId}`, { state: { activeSubcategoryId: finalSubId || 'all' } });
                    }}
                    className="w-full flex items-center justify-center bg-[#F4F6F8] dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-700/30 rounded-2xl py-3 px-4 mt-4 shadow-sm hover:bg-[#EDF0F3] dark:hover:bg-neutral-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Overlapping Thumbnails */}
                      <div className="flex items-center -space-x-3.5">
                        {previewProducts.map((p, pIdx) => (
                          <div 
                            key={p.id || pIdx}
                            className="w-9 h-9 rounded-full border-[2.5px] border-white dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center p-0.5 overflow-hidden"
                            style={{ zIndex: 3 - pIdx }}
                          >
                            <img src={p.image} alt="" className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-[#3B4C69] dark:text-slate-300 font-[900] text-sm tracking-tight">
                        <span>See all products</span>
                        <ChevronRight size={16} className="text-[#3B4C69] dark:text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const visibleCount = rows * columns;
          const items = allProducts.slice(0, visibleCount);

          return (
            <div
              key={section._id}
              id={`section-${section._id}`}
              className=""
            >
              <div className="flex items-center justify-between mb-3">
                {heading && (
                  <h3 className="text-base font-black text-foreground">
                    {heading}
                  </h3>
                )}
                <span className="text-[11px] font-semibold text-slate-400">
                  {items.length} items
                </span>
              </div>
              <div
                className={cn(
                  "grid gap-2 md:gap-4",
                  columns === 1
                    ? "grid-cols-1"
                    : columns === 2
                      ? "grid-cols-2"
                      : columns === 3
                        ? "grid-cols-3"
                        : columns === 4
                          ? "grid-cols-4"
                          : columns === 5
                            ? "grid-cols-5"
                            : "grid-cols-2"
                )}
              >
                {items.map((product) => (
                  <div key={product._id || product.id}>
                    <ProductCard product={product} compact={columns > 2} neutralBg={true} hideBadge={true} showTimeOnImage={true} />
                  </div>
                ))}
              </div>
              {/* See all products card at the bottom of the section */}
              {finalCatId && (
                <div 
                  onClick={() => {
                    navigate(`/quick/categories/${finalCatId}`, { state: { activeSubcategoryId: finalSubId || 'all' } });
                  }}
                  className="w-full flex items-center justify-center bg-[#F4F6F8] dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-700/30 rounded-2xl py-3 px-4 mt-4 shadow-sm hover:bg-[#EDF0F3] dark:hover:bg-neutral-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {/* Overlapping Thumbnails */}
                    <div className="flex items-center -space-x-3.5">
                      {previewProducts.map((p, pIdx) => (
                        <div 
                          key={p.id || pIdx}
                          className="w-9 h-9 rounded-full border-[2.5px] border-white dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center p-0.5 overflow-hidden"
                          style={{ zIndex: 3 - pIdx }}
                        >
                          <img src={p.image} alt="" className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-[#3B4C69] dark:text-slate-300 font-[900] text-sm tracking-tight">
                      <span>See all products</span>
                      <ChevronRight size={16} className="text-[#3B4C69] dark:text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default SectionRenderer;
