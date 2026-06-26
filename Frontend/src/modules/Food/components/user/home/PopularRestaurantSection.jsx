import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability";
import OptimizedImage from "@food/components/OptimizedImage";

const PopularRestaurantSection = memo(({ popularRestaurants }) => {
  if (!popularRestaurants || popularRestaurants.length === 0) return null;

  return (
    <motion.section
      className="content-auto py-4 px-4 bg-white dark:bg-[#0a0a0a]"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
        Popular Restaurants
      </h2>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {popularRestaurants.map((restaurant, index) => {
          const restaurantSlug =
            restaurant.slug ||
            restaurant.restaurantName?.toLowerCase().replace(/\s+/g, "-") ||
            restaurant.name?.toLowerCase().replace(/\s+/g, "-") ||
            "restaurant";
          
          const availabilityStatus = getRestaurantAvailabilityStatus(restaurant, new Date());
          const isOffline = !availabilityStatus.isOpen;
          
          // Estimated delivery time
          const deliveryTime = restaurant.deliveryTime || restaurant.estimatedDeliveryTime || "15-20 mins";
 
          // Restaurant image
          const restaurantImage = restaurant.image ||
                                  restaurant.profileImage || 
                                  (restaurant.coverImages && restaurant.coverImages.length > 0 ? restaurant.coverImages[0]?.url || restaurant.coverImages[0] : "") || 
                                  "";
 
          return (
            <motion.div
              key={`popular-${restaurant.mongoId || restaurant.id || restaurant._id || restaurantSlug}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-1 group text-center"
            >
              <Link
                to={isOffline ? "#" : `/user/restaurants/${restaurantSlug}`}
                onClick={(e) => isOffline && e.preventDefault()}
                className="relative block"
              >
                <div className={`w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] rounded-full p-[2.5px] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 overflow-hidden ${isOffline ? "grayscale opacity-75" : ""}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200/50 dark:border-neutral-800 flex items-center justify-center">
                    {restaurantImage ? (
                      <OptimizedImage
                        src={restaurantImage}
                        alt={restaurant.restaurantName || restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
                        {(restaurant.restaurantName || restaurant.name || 'R').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              
              <div className="flex flex-col gap-0.5 mt-1.5 w-full">
                <span className="text-xs font-bold text-gray-800 dark:text-neutral-200 truncate px-0.5 leading-tight group-hover:text-red-500 transition-colors">
                  {restaurant.restaurantName || restaurant.name}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">
                  {deliveryTime}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
});

PopularRestaurantSection.displayName = "PopularRestaurantSection";

export default PopularRestaurantSection;
