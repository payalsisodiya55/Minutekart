import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Heart, BadgePercent, Timer, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@food/context/CartContext";
import { toast } from "sonner";
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability";
import { restaurantAPI } from "@food/api";
import { flattenMenuItems, getMenuFromResponse } from "@food/utils/menuItems";

export default function RestaurantPreviewCard({
  restaurant,
  index,
  isOutOfService,
  availabilityTick,
  isFavorite,
  onFavoriteToggle,
  backendOrigin,
  onMenuLoaded,
}) {
  const navigate = useNavigate();
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  const nameStr = typeof restaurant?.name === "string" ? restaurant.name.trim() : "";
  const fallbackSlugSource =
    nameStr ||
    (typeof restaurant?.restaurantName === "string" ? restaurant.restaurantName.trim() : "") ||
    String(restaurant?.slug || restaurant?.id || restaurant?._id || `restaurant-${index}`);

  const restaurantSlug =
    typeof restaurant?.slug === "string" && restaurant.slug.trim()
      ? restaurant.slug.trim()
      : fallbackSlugSource.toLowerCase().replace(/\s+/g, "-");

  const availability = getRestaurantAvailabilityStatus(restaurant, new Date(availabilityTick), {
    ignoreOperationalStatus: false,
  });
  const favorite = isFavorite(restaurantSlug);

  useEffect(() => {
    let active = true;
    const fetchMenu = async () => {
      const restaurantId = restaurant?.restaurantId || restaurant?._id || restaurant?.id;
      if (!restaurantId) {
        setLoading(false);
        if (onMenuLoaded) {
          onMenuLoaded(null, false);
        }
        return;
      }
      try {
        const response = await restaurantAPI.getMenuByRestaurantId(restaurantId);
        if (!active) return;
        const menu = getMenuFromResponse(response);
        const menuItems = flattenMenuItems(menu);

        // Normalize menu items and flag veg status
        const normalized = menuItems.map((item) => {
          const foodType = String(item?.foodType || "").toLowerCase();
          const isVeg = foodType.includes("veg") && !foodType.includes("non");
          return {
            ...item,
            id: String(item?.id || item?._id || `${restaurantId}-${item?.name || "dish"}`),
            price: Number(item?.price || 0),
            isVeg,
            image:
              item?.image ||
              restaurant?.coverImages?.[0]?.url ||
              restaurant?.coverImages?.[0] ||
              restaurant?.profileImage?.url ||
              "",
          };
        });

        // Filter out unavailable dishes
        const availableItems = normalized.filter((item) => item?.isAvailable !== false);

        // Sort: popular first
        const sorted = [...availableItems].sort((a, b) => {
          const aPop = a.popular || a.isPopular || false;
          const bPop = b.popular || b.isPopular || false;
          if (aPop && !bPop) return -1;
          if (!aPop && bPop) return 1;
          return 0;
        });

        setDishes(sorted.slice(0, 3));
        if (onMenuLoaded) {
          onMenuLoaded(restaurantId, sorted.length > 0);
        }
      } catch (err) {
        console.error("Error fetching restaurant menu:", err);
        if (onMenuLoaded) {
          onMenuLoaded(restaurantId, false);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMenu();
    return () => {
      active = false;
    };
  }, [restaurant]);

  const handleAddToCart = (dish, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isOutOfService) {
      toast.error("You are outside the service zone. Please select a location within the service area.");
      return;
    }

    const rect = event ? event.currentTarget.getBoundingClientRect() : null;
    const sourcePosition = rect
      ? {
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + rect.height / 2 + window.scrollY,
          viewportX: rect.left + rect.width / 2,
          viewportY: rect.top + rect.height / 2,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        }
      : null;

    const existing = getCartItem(dish.id);
    if (existing) {
      updateQuantity(dish.id, existing.quantity + 1, sourcePosition, {
        id: dish.id,
        name: dish.name,
        imageUrl: dish.image,
      });
      toast.success(`Increased ${dish.name} quantity to ${existing.quantity + 1}`);
    } else {
      const result = addToCart(
        {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          image: dish.image,
          restaurant: restaurant.name || restaurant.restaurantName || "Restaurant",
          restaurantId: String(restaurant.restaurantId || restaurant._id || restaurant.id),
          description: dish.description || "",
          originalPrice: dish.originalPrice || dish.price,
        },
        sourcePosition
      );
      if (result?.ok === false) {
        toast.error(result.error || "Cannot add item from different restaurant. Please clear cart first.");
      } else {
        toast.success(`Added ${dish.name} to cart!`);
      }
    }
  };

  const handleDecreaseQuantity = (dish, event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event ? event.currentTarget.getBoundingClientRect() : null;
    const sourcePosition = rect
      ? {
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + rect.height / 2 + window.scrollY,
          viewportX: rect.left + rect.width / 2,
          viewportY: rect.top + rect.height / 2,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        }
      : null;

    const existing = getCartItem(dish.id);
    if (existing) {
      updateQuantity(dish.id, existing.quantity - 1, sourcePosition, {
        id: dish.id,
        name: dish.name,
        imageUrl: dish.image,
      });
      if (existing.quantity - 1 === 0) {
        toast.success(`Removed ${dish.name} from cart`);
      } else {
        toast.success(`Decreased ${dish.name} quantity to ${existing.quantity - 1}`);
      }
    }
  };

  return (
    <div
      className={`h-full w-full flex flex-col gap-3 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-[#1a1a1a] ${
        isOutOfService || !availability.isOpen ? "grayscale opacity-80" : ""
      }`}
    >
      {/* Restaurant Header Section */}
      <Link to={`/user/restaurants/${restaurantSlug}`} className="block group">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight truncate group-hover:text-[#cc2532] transition-colors duration-200">
                {restaurant.name}
              </h3>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-xs ${
                  availability.isOpen ? "bg-emerald-500" : "bg-gray-400"
                }`}
              >
                {availability.isOpen ? "Open" : "Offline"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
              <div className="flex items-center gap-0.5 text-green-700 dark:text-green-500 font-extrabold">
                <Star className="h-3.5 w-3.5 fill-current text-green-700 dark:text-green-500" />
                <span>{Number(restaurant.rating) > 0 ? Number(restaurant.rating).toFixed(1) : "NEW"}</span>
              </div>
              <span>•</span>
              <span>{restaurant.deliveryTime}</span>
              <span>•</span>
              <span>{restaurant.distance}</span>
              {restaurant.cuisine && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[100px] sm:max-w-none">{restaurant.cuisine}</span>
                </>
              )}
            </div>

            {restaurant.offer && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#0c831f] dark:text-[#109f26]">
                <BadgePercent className="h-4 w-4 text-[#0c831f] dark:text-[#109f26] flex-shrink-0" strokeWidth={2.5} />
                <span className="truncate">{restaurant.offer}</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onFavoriteToggle(event, restaurant, restaurantSlug, favorite);
              }}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              className={`h-8 w-8 rounded-full shadow-xs border flex items-center justify-center transition-all ${
                favorite
                  ? "bg-[#cc2532] text-white border-[#cc2532]"
                  : "bg-white text-gray-400 hover:text-[#cc2532] border-gray-100 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>
      </Link>

      {/* Dish Preview Section */}
      <div className="flex-1 mt-1 border-t border-gray-100/80 dark:border-gray-800/80 pt-3">
        {loading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[130px] sm:w-[140px] flex flex-col gap-1.5">
                <div className="w-full h-[98px] sm:h-[108px] rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-[11px] text-gray-400 dark:text-gray-500 py-3 text-center">
            No preview dishes available
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
            {dishes.map((dish) => {
              const cartItem = getCartItem(dish.id);
              const quantity = cartItem ? cartItem.quantity : 0;
              const hasPopular = dish.popular || dish.isPopular || false;

              return (
                <div
                  key={dish.id}
                  className="flex-shrink-0 w-[130px] sm:w-[140px] flex flex-col gap-1.5 relative group/dish"
                >
                  {/* Dish image container */}
                  <div className="relative w-full h-[98px] sm:h-[108px] rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100/50 dark:border-gray-800/50 overflow-hidden">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/dish:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">No Image</span>
                      </div>
                    )}

                    {/* Popular Badge */}
                    {hasPopular && (
                      <div className="absolute top-1 left-1 bg-[#398616] text-white text-[7px] font-extrabold px-1 py-0.5 rounded shadow-xs select-none">
                        Popular
                      </div>
                    )}

                    {/* Plus Button or Quantity Selector Overlay */}
                    {quantity > 0 ? (
                      <div
                        className="absolute bottom-1.5 right-1.5 h-8 rounded-full bg-white shadow-md flex items-center justify-between border border-[#cc2532]/20 px-1.5 gap-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDecreaseQuantity(dish, e)}
                          className="w-5.5 h-5.5 flex items-center justify-center text-[#cc2532] hover:opacity-80 transition-all active:scale-75"
                        >
                          <Minus className="h-3 w-3" strokeWidth={3.5} />
                        </button>
                        <span className="text-[11px] font-black text-gray-950 min-w-[10px] text-center select-none">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(dish, e)}
                          className="w-5.5 h-5.5 flex items-center justify-center text-[#cc2532] hover:opacity-80 transition-all active:scale-75"
                        >
                          <Plus className="h-3 w-3" strokeWidth={3.5} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(dish, e)}
                        className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-[#cc2532]/20 transition-all hover:scale-105 active:scale-90"
                      >
                        <Plus className="h-4 w-4 text-[#cc2532]" strokeWidth={3.5} />
                      </button>
                    )}
                  </div>

                  {/* Dish Info */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="shrink-0 w-3 h-3 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center p-[1.5px] bg-white flex-shrink-0">
                        <div className={`w-1 h-1 rounded-full ${dish.isVeg ? "bg-[#398616]" : "bg-red-600"}`} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate flex-1 leading-tight">
                        {dish.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-950 dark:text-gray-300 leading-none">
                      ₹{dish.price}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* See All Button Section */}
      <div className="border-t border-gray-100 dark:border-gray-800/80 pt-2.5 mt-auto flex items-center justify-between">
        {availability.isOpen && availability.closingCountdownLabel ? (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            <Timer className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" strokeWidth={2.5} />
            <span>{availability.closingCountdownLabel}</span>
          </div>
        ) : (
          <div />
        )}
        <Link
          to={`/user/restaurants/${restaurantSlug}`}
          className="text-xs font-bold text-[#cc2532] hover:text-[#a81e29] flex items-center gap-0.5 hover:opacity-80 active:scale-95 transition-all"
        >
          See All Menu <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
