import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RestaurantGridSkeleton, LoadingSkeletonRegion } from "@food/components/ui/loading-skeletons";
import { Button } from "@food/components/ui/button";
import RestaurantPreviewCard from "../RestaurantPreviewCard";

const FoodRestaurantCard = memo(({ 
  restaurant, 
  index, 
  isOutOfService, 
  availabilityTick, 
  isFavorite, 
  onFavoriteToggle, 
  backendOrigin,
  onMenuLoaded
}) => {
  return (
    <div
      key={restaurant?.id || restaurant?._id || index}
      className="h-full transform transition-all duration-300 hover:-translate-y-3 hover:scale-[1.02]"
      style={{
        perspective: 1000,
        animation: index < 10 ? `fade-in-up 0.5s ease-out ${index * 0.05}s backwards` : "none",
      }}
    >
      <RestaurantPreviewCard
        restaurant={restaurant}
        index={index}
        isOutOfService={isOutOfService}
        availabilityTick={availabilityTick}
        isFavorite={isFavorite}
        onFavoriteToggle={onFavoriteToggle}
        backendOrigin={backendOrigin}
        onMenuLoaded={onMenuLoaded}
      />
    </div>
  );
});

const RestaurantGrid = memo(({
  filteredRestaurants,
  visibleRestaurants,
  showRestaurantSkeleton,
  isLoadingFilterResults,
  loadingRestaurants,
  isOutOfService,
  availabilityTick,
  isFavorite,
  onFavoriteToggle,
  backendOrigin,
  hasMoreRestaurants,
  loadMoreRestaurants,
  restaurantLoadMoreRef
}) => {
  const [hasDishesMap, setHasDishesMap] = React.useState({});
  
  const handleMenuLoaded = React.useCallback((id, hasDishes) => {
    setHasDishesMap(prev => {
      if (prev[id] === hasDishes) return prev;
      return { ...prev, [id]: hasDishes };
    });
  }, []);

  React.useEffect(() => {
    if (!restaurantLoadMoreRef || !restaurantLoadMoreRef.current || !hasMoreRestaurants) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreRestaurants();
      }
    }, { threshold: 0.1 });
    
    observer.observe(restaurantLoadMoreRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [hasMoreRestaurants, loadMoreRestaurants, restaurantLoadMoreRef]);

  const activeFilteredRestaurants = React.useMemo(() => {
    return filteredRestaurants.filter((r) => {
      const id = r.restaurantId || r._id || r.id;
      return hasDishesMap[id] !== false;
    });
  }, [filteredRestaurants, hasDishesMap]);

  const activeVisibleRestaurants = React.useMemo(() => {
    return visibleRestaurants.filter((r) => {
      const id = r.restaurantId || r._id || r.id;
      return hasDishesMap[id] !== false;
    });
  }, [visibleRestaurants, hasDishesMap]);

  return (
    <section className="content-auto space-y-0 pb-8 pt-3 sm:pt-4 md:pb-10 lg:pt-6">
      <div className="mb-4 px-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {activeFilteredRestaurants.length} Restaurants Delivering to You
          </h2>
          <span className="text-sm font-medium text-gray-500">Featured</span>
        </div>
      </div>
      
      <div className={`relative ${showRestaurantSkeleton ? "min-h-[360px] sm:min-h-[420px]" : ""}`}>
        <AnimatePresence>
          {showRestaurantSkeleton && (
            <motion.div
              className="absolute inset-0 z-10 rounded-lg bg-white/94 dark:bg-[#1a1a1a]/94"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <LoadingSkeletonRegion label="Loading restaurants" className="h-full p-1 sm:p-2">
                <RestaurantGridSkeleton count={3} className="grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" compact />
              </LoadingSkeletonRegion>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`grid grid-cols-1 items-stretch gap-5 px-4 pt-1 transition-opacity duration-300 sm:gap-4 sm:pt-1.5 md:grid-cols-2 lg:gap-5 lg:pt-2 lg:grid-cols-3 xl:gap-6 ${
            isLoadingFilterResults || loadingRestaurants ? "opacity-50" : "opacity-100"
          }`}
        >
          {activeVisibleRestaurants.map((restaurant, index) => (
            <FoodRestaurantCard
              key={restaurant?.id || restaurant?._id || restaurant?.slug || index}
              restaurant={restaurant}
              index={index}
              isOutOfService={isOutOfService}
              availabilityTick={availabilityTick}
              isFavorite={isFavorite}
              onFavoriteToggle={onFavoriteToggle}
              backendOrigin={backendOrigin}
              onMenuLoaded={handleMenuLoaded}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 px-4 pt-4 sm:pt-6">
        {hasMoreRestaurants && (
          <Button
            variant="outline"
            onClick={loadMoreRestaurants}
            className="border-gray-300 text-sm font-medium hover:border-gray-400 rounded-full px-8 py-6 h-auto"
          >
            Loading more restaurants...
          </Button>
        )}
        <div ref={restaurantLoadMoreRef} className="h-10 w-full" aria-hidden="true" />
      </div>
    </section>
  );
});

export default RestaurantGrid;
