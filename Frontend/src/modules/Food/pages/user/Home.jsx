import { useSearchParams, Link, useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import React, {
  Suspense,
  lazy,
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  startTransition,
} from "react";
import { createPortal } from "react-dom";
import {
  Star,
  Clock,
  MapPin,
  Heart,
  Search,
  Tag,
  Flame,
  ShoppingBag,
  ShoppingCart,
  Mic,
  SlidersHorizontal,
  CheckCircle2,
  Bookmark,
  BadgePercent,
  X,
  ArrowDownUp,
  ArrowRight,
  Timer,
  CalendarClock,
  ShieldCheck,
  IndianRupee,
  UtensilsCrossed,
  Leaf,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Check,
  Share2,
  Cake,
} from "lucide-react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import {
  CategoryChipRowSkeleton,
  ExploreGridSkeleton,
  HeroBannerSkeleton,
  LoadingSkeletonRegion,
  RestaurantCardSkeleton,
  RestaurantGridSkeleton,
} from "@food/components/ui/loading-skeletons";
import { useProfile } from "@food/context/ProfileContext";
import { useCart } from "@food/context/CartContext";
import { HorizontalCarousel } from "@food/components/ui/horizontal-carousel";
import { DotPattern } from "@food/components/ui/dot-pattern";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@food/components/ui/card";
import { Button } from "@food/components/ui/button";
import { Badge } from "@food/components/ui/badge";
import { Input } from "@food/components/ui/input";
import { Switch } from "@food/components/ui/switch";
import { Checkbox } from "@food/components/ui/checkbox";
import {
  useSearchOverlay,
  useLocationSelector,
} from "@food/components/user/UserLayout";

const debugLog = (...args) => { };
const debugWarn = (...args) => { };
const debugError = (...args) => { };

// Import shared food images - prevents duplication
import { foodImages } from "@food/constants/images";

import { Avatar, AvatarFallback } from "@food/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";
import { useLocation } from "@food/hooks/useLocation";
import { useZone } from "@food/hooks/useZone";


import api, { publicGetOnce, restaurantAPI, adminAPI } from "@food/api";
import { API_BASE_URL } from "@food/api/config";
import OptimizedImage from "@food/components/OptimizedImage";
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability";
import HomeHeader from "@food/components/user/home/HomeHeader";
import { LocationProvider as QuickLocationProvider } from "../../../quickCommerce/user/context/LocationContext";
import { ProductDetailProvider as QuickProductDetailProvider } from "../../../quickCommerce/user/context/ProductDetailContext";
import { WishlistProvider as QuickWishlistProvider } from "../../../quickCommerce/user/context/WishlistContext";
import { CartAnimationProvider as QuickCartAnimationProvider } from "../../../quickCommerce/user/context/CartAnimationContext";
import { CartProvider as QuickCartProvider } from "../../../quickCommerce/user/context/CartContext";
import { prefetchQuickHomeBootstrap } from "../../../quickCommerce/user/services/customerApi";
import PromoRow from "@food/components/user/home/PromoRow";
import { optimizeCloudinaryUrl } from "../../../../shared/utils/cloudinaryUtils";
import VegModePopups from "@food/components/user/VegModePopups";

import { toast } from "sonner";
import { FOOD_THEME_COLOR, FOOD_VEG_COLOR } from "@food/constants/theme";
import { flattenMenuItems, getMenuFromResponse } from "@food/utils/menuItems";
import * as imgUtils from "@food/utils/imageUtils";
import { useFoodHomeData } from "@food/hooks/useFoodHomeData";
import { getCachedSettings } from "@/modules/common/utils/businessSettings";
import { useServiceability } from "@/modules/common/hooks/useServiceability";
import ServiceUnavailable from "@/modules/common/components/ServiceUnavailable";
import bakeryIcon from "@food/assets/explore more icons/bakery.png";
import customLogo from "@food/assets/customl_ogo.png";

// Extracted Sub-components
const BannerSection = lazy(() => import("@food/components/user/home/BannerSection"));
const CategoryRail = lazy(() => import("@food/components/user/home/CategoryRail"));
const RecommendedSection = lazy(() => import("@food/components/user/home/RecommendedSection"));
const RestaurantGrid = lazy(() => import("@food/components/user/home/RestaurantGrid"));
const SortFilterSection = lazy(() => import("@food/components/user/home/SortFilterSection"));
const ExploreMoreSection = lazy(() => import("@food/components/user/home/ExploreMoreSection"));
const PopularRestaurantSection = lazy(() => import("@food/components/user/home/PopularRestaurantSection"));

const MiniCart = lazy(() => import("@food/components/user/MiniCart"));
const OrderTrackingCard = lazy(() => import("@food/components/user/OrderTrackingCard"));
const QuickCommerceHomePage = lazy(() => import("../../../quickCommerce/user/pages/Home"));
const DudhwalaHomeScreen = lazy(() => import("../../../Dudhwala/screens/HomeScreen"));

// Animated placeholder for search - moved outside component to prevent recreation
const placeholders = [
  'Search restaurant', 'Search "burger"', 'Search "biryani"', 'Search "pizza"', 'Search "desserts"',
  'Search "chinese"', 'Search "thali"', 'Search "momos"', 'Search "dosa"', 'Search "thali"',
];

const quickPlaceholders = [
  'Search "milk"', 'Search "bread"', 'Search "eggs"', 'Search "chips"',
  'Search "fruits"', 'Search "atta"', 'Search "cold drink"', 'Search "ice cream"',
];

const WEBVIEW_SESSION_CACHE_BUSTER = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getStoredDeliveryAddressMode = () => {
  if (typeof window === "undefined") return "saved";
  return window.localStorage.getItem("deliveryAddressMode") || "saved";
};

const defaultBannersImages = [];

const defaultBannersData = [];

export default function Home() {
  const HERO_BANNER_AUTO_SLIDE_MS = 3500;
  const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [heroSearch, setHeroSearch] = useState("");
  const { openSearch, closeSearch, searchValue, setSearchValue } = useSearchOverlay();
  const { openLocationSelector } = useLocationSelector();
  const { vegMode, setVegMode: setVegModeContext, isFavorite, addFavorite, removeFavorite, getDefaultAddress } = useProfile();
  const { cart, addToCart, updateQuantity, getCartItem } = useCart();
  const hasFoodCartItems = useMemo(
    () => cart.some((item) => (item?.orderType || "food") !== "quick"),
    [cart],
  );

  const [prevVegMode, setPrevVegMode] = useState(vegMode);
  const [showVegModePopup, setShowVegModePopup] = useState(false);
  const [showSwitchOffPopup, setShowSwitchOffPopup] = useState(false);
  const [isApplyingVegMode, setIsApplyingVegMode] = useState(false);
  const [isSwitchingOffVegMode, setIsSwitchingOffVegMode] = useState(false);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);
  const [availabilityTick, setAvailabilityTick] = useState(Date.now());
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("food");
  const [quickThemeColor, setQuickThemeColor] = useState("#DC021B");
  const [showToast, setShowToast] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showStickyCategories, setShowStickyCategories] = useState(false);
  const [dishesUnder250, setDishesUnder250] = useState([]);
  const [loadingDishesUnder250, setLoadingDishesUnder250] = useState(true);


  const heroShellRef = useRef(null);
  const restaurantLoadMoreRef = useRef(null);
  const isHandlingSwitchOff = useRef(false);
  const routerLocation = useRouterLocation();

  // --- Location Logic ---
  const { location, deliveryAddressMode } = useLocation();
  const { zoneId: effectiveZoneId, isInService: isLiveInService, isOutOfService: isEffectiveOutOfService } = useZone(location);

  // --- Serviceability ---
  const { isModuleEnabled, loading: serviceabilityLoading } = useServiceability(activeTab);
  
  const hideExtras = !isModuleEnabled || isEffectiveOutOfService;

  // --- Core Data Hook ---
  const {
    banners,
    categories,
    restaurants,
    landing,
    meta,
    actions,
    state
  } = useFoodHomeData({
    zoneId: effectiveZoneId,
    location: location,
    vegMode,
    backendOrigin: BACKEND_ORIGIN,
    availabilityTick
  });

  const finalExploreItemsFiltered = useMemo(() => {
    const items = landing?.exploreMore || [];
    // Hide home bakery from this section as requested
    return items.filter(
      (item) =>
        item.id !== "home-bakery" &&
        !item.href?.includes("bakery") &&
        !item.label?.toLowerCase().includes("bakery")
    );
  }, [landing?.exploreMore]);

  // --- UI Effects ---
  useEffect(() => {
    const intervalId = setInterval(() => setAvailabilityTick(Date.now()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  const dynamicPlaceholders = useMemo(() => {
    const list = [];
    if (categories && Array.isArray(categories.display) && categories.display.length > 0) {
      let catCount = 0;
      for (const cat of categories.display) {
        if (!cat || !cat.name) continue;
        const nameLower = cat.name.trim().toLowerCase();
        if (nameLower === "all" || nameLower === "offers" || nameLower === "offer") continue;
        
        list.push(`Search "${cat.name.trim().toLowerCase()}"`);
        catCount++;
        
        if (catCount % 2 === 0) {
          list.push('Search "Restaurant"');
        }
      }
    }
    
    if (list.length === 0) {
      return [
        'Search "cake"',
        'Search "dall"',
        'Search "Restaurant"',
        'Search "pizza"',
        'Search "biryani"',
        'Search "Restaurant"',
      ];
    }
    
    return list;
  }, [categories?.display]);

  const activePlaceholders = useMemo(() => {
    return activeTab === "quick" ? quickPlaceholders : dynamicPlaceholders;
  }, [activeTab, dynamicPlaceholders]);

  useEffect(() => {
    setPlaceholderIndex(0);
    const interval = setInterval(() => {
      if (activePlaceholders.length > 0) {
        setPlaceholderIndex((prev) => (prev + 1) % activePlaceholders.length);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activePlaceholders]);

  const activeBannerImages = useMemo(() => banners?.images || [], [banners?.images]);

  const activeBannerData = useMemo(() => banners?.data || [], [banners?.data]);

  // Auto-slide banners
  useEffect(() => {
    if (!activeBannerImages.length) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBannerImages.length);
    }, HERO_BANNER_AUTO_SLIDE_MS);
    return () => clearInterval(interval);
  }, [activeBannerImages.length]);

  useEffect(() => {
    let cancelled = false;
    const fetchDishes = async () => {
      try {
        setLoadingDishesUnder250(true);
        const response = await restaurantAPI.getRestaurants(effectiveZoneId ? { zoneId: effectiveZoneId } : {});
        const restaurantsRaw = Array.isArray(response?.data?.data?.restaurants)
          ? response.data.data.restaurants
          : [];
        
        const allDishes = [];
        await Promise.all(
          restaurantsRaw.map(async (restaurant) => {
            const restaurantId = restaurant?.restaurantId || restaurant?._id;
            if (!restaurantId) return;
            try {
              const menuResponse = await restaurantAPI.getMenuByRestaurantId(restaurantId);
              const menu = getMenuFromResponse(menuResponse);
              const menuItems = flattenMenuItems(menu)
                .filter((item) => Number(item?.price || 0) <= 250 && item?.isAvailable !== false)
                .map((item) => {
                  const foodType = String(item?.foodType || "").toLowerCase();
                  const isVeg = foodType.includes("veg") && !foodType.includes("non");
                  return {
                    ...item,
                    id: String(item?.id || item?._id || `${restaurantId}-${item?.name || "dish"}`),
                    price: Number(item?.price || 0),
                    isVeg,
                    restaurant: restaurant?.restaurantName || restaurant?.name || "Restaurant",
                    restaurantId: String(restaurantId),
                    rating: Number(restaurant?.rating || 4.2),
                    image:
                      item?.image ||
                      restaurant?.coverImages?.[0]?.url ||
                      restaurant?.coverImages?.[0] ||
                      restaurant?.menuImages?.[0]?.url ||
                      restaurant?.menuImages?.[0] ||
                      restaurant?.profileImage?.url ||
                      "",
                  };
                });
              allDishes.push(...menuItems);
            } catch (err) {
              // Ignore single restaurant menu fetch errors
            }
          })
        );

        if (!cancelled) {
          const uniqueDishes = [];
          const seenNames = new Set();
          for (const dish of allDishes) {
            const nameKey = dish.name.toLowerCase().trim();
            if (!seenNames.has(nameKey)) {
              seenNames.add(nameKey);
              uniqueDishes.push(dish);
            }
          }
          setDishesUnder250(uniqueDishes.slice(0, 15));
        }
      } catch (error) {
        console.error("Error fetching dynamic dishes under 250:", error);
      } finally {
        if (!cancelled) {
          setLoadingDishesUnder250(false);
        }
      }
    };

    if (effectiveZoneId) {
      fetchDishes();
    } else {
      setLoadingDishesUnder250(false);
    }

    return () => {
      cancelled = true;
    };
  }, [effectiveZoneId, location?.latitude, location?.longitude]);

  const displayedDishesUnder250 = useMemo(() => {
    if (!vegMode) return dishesUnder250;
    return dishesUnder250.filter((dish) => dish.isVeg);
  }, [dishesUnder250, vegMode]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) {
        setShowStickyCategories(false);
        return;
      }
      const categoryRailElement = document.getElementById("category-rail-section");
      if (categoryRailElement) {
        const rect = categoryRailElement.getBoundingClientRect();
        // Toggle sticky state based on category rail bottom position
        setShowStickyCategories(rect.bottom <= 0);
      } else {
        setShowStickyCategories(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);


  // Prevent body scroll when popups are open
  useEffect(() => {
    if (showVegModePopup || showSwitchOffPopup || showAllCategoriesModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showVegModePopup, showSwitchOffPopup, showAllCategoriesModal]);

  // Sync activeTab with URL
  useEffect(() => {
    const path = routerLocation.pathname;
    const isQuick = path.endsWith("/quick") || path.includes("/quick/");
    const isMilk = path.endsWith("/dudhwala") || path.includes("/dudhwala/");

    let targetTab = "food";
    if (isQuick) targetTab = "quick";
    else if (isMilk) targetTab = "milk";

    if (activeTab !== targetTab) setActiveTab(targetTab);
  }, [routerLocation.pathname, activeTab]);

  // --- Handlers ---
  const handleTabChange = (tab) => {
    startTransition(() => setActiveTab(tab));
    if (tab === "quick") navigate("/quick", { replace: true });
    else if (tab === "milk") navigate("/dudhwala", { replace: true });
    else navigate("/food/user", { replace: true });
  };

  const handleVegModeChange = (newValue) => {
    if (isHandlingSwitchOff.current) return;
    if (newValue && !vegMode) setShowVegModePopup(true);
    else if (!newValue && vegMode) {
      isHandlingSwitchOff.current = true;
      setShowSwitchOffPopup(true);
    } else {
      setVegModeContext(newValue);
    }
  };

  const handleSearchFocus = useCallback(() => {
    if (activeTab === "quick") navigate("/quick/search");
    else navigate("/food/user/search");
  }, [activeTab, navigate]);

  const handleAddToCart = (dish, event = null) => {
    if (isEffectiveOutOfService) {
      toast.error("You are outside the service zone. Please select a location within the service area.");
      return;
    }

    const rect = event ? event.currentTarget.getBoundingClientRect() : null;
    const sourcePosition = rect ? {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY,
      viewportX: rect.left + rect.width / 2,
      viewportY: rect.top + rect.height / 2,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    } : null;

    const existing = getCartItem(dish.id);
    if (existing) {
      updateQuantity(dish.id, existing.quantity + 1, sourcePosition, {
        id: dish.id,
        name: dish.name,
        imageUrl: dish.image,
      });
      toast.success(`Increased ${dish.name} quantity to ${existing.quantity + 1}`);
    } else {
      const result = addToCart({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        restaurant: dish.restaurant,
        description: dish.description || "",
        originalPrice: dish.originalPrice || dish.price,
      }, sourcePosition);
      if (result?.ok === false) {
        toast.error(result.error || 'Cannot add item from different restaurant. Please clear cart first.');
      } else {
        toast.success(`Added ${dish.name} to cart!`);
      }
    }
  };

  const handleIncreaseQuantity = (dish, event = null) => {
    handleAddToCart(dish, event);
  };

  const handleDecreaseQuantity = (dish, event = null) => {
    const rect = event ? event.currentTarget.getBoundingClientRect() : null;
    const sourcePosition = rect ? {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY,
      viewportX: rect.left + rect.width / 2,
      viewportY: rect.top + rect.height / 2,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    } : null;

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


  // --- Render ---
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0a0a] pb-16 md:pb-6 overflow-x-clip">
      <div className="md:hidden relative overflow-x-clip z-[50]">
        {!state.isBootstrapped ? (
          <div className="px-4 pt-6 pb-4">
            <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl mb-6" />
            <div className="h-14 w-full bg-slate-100 animate-pulse rounded-2xl" />
          </div>
        ) : (
          <HomeHeader
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            location={location}
            savedAddressText={imgUtils.formatSavedAddress(location)}
            handleLocationClick={() => openLocationSelector()}
            handleSearchFocus={handleSearchFocus}
            placeholderIndex={placeholderIndex}
            placeholders={activePlaceholders}
            vegMode={vegMode}
            onVegModeChange={handleVegModeChange}
            headerVideoUrl={landing.videoUrl}
            headerImages={landing.headerImages}
            quickThemeColor={quickThemeColor}
            hideExtras={hideExtras}
            disableSticky={showStickyCategories}
            bannerComponent={
              <div className="h-[130px] sm:h-36 md:h-44 mt-3 relative z-10 w-full bg-transparent" />
            }
          />
        )}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {hideExtras ? (
          <motion.div
            key="unavailable"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-[#0a0a0a]"
          >
            <ServiceUnavailable 
              type={!isModuleEnabled ? "module" : "zone"} 
              moduleName={activeTab === 'food' ? 'Food Delivery' : activeTab === 'quick' ? 'ChotuuMart' : 'ChotuuDudhwala'}
              onRefresh={() => window.location.reload()}
            />
          </motion.div>
        ) : activeTab === "food" ? (
          <motion.div
            key="food-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="bg-white dark:bg-[#0a0a0a]"
          >
            <div id="category-rail-section">
              <Suspense fallback={<CategoryChipRowSkeleton className="py-1" />}>
                <CategoryRail
                  displayCategories={categories.display}
                  showCategorySkeleton={categories.loading}
                  navigate={navigate}
                  setShowAllCategoriesModal={setShowAllCategoriesModal}
                  backendOrigin={BACKEND_ORIGIN}
                />
              </Suspense>
            </div>

            <Suspense fallback={null}>
              <SortFilterSection
                activeFilters={state.activeFilters}
                toggleFilter={actions.toggleFilter}
                setIsFilterOpen={(val) => { }} // Hook handles internal apply
              />
            </Suspense>

            {/* Meals under ₹250 section */}
            <section className="px-4 py-4 space-y-3 bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Meals under
                  </h2>
                  <span className="flex items-center justify-center border-[1.5px] border-gray-900 dark:border-white rounded-full px-2 py-0.5 text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-none">
                    ₹250
                  </span>
                </div>
                <Link
                  to="/food/user/under-250"
                  className="text-xs sm:text-sm font-bold flex items-center gap-0.5 transition-all hover:opacity-80 active:scale-95"
                  style={{ color: FOOD_THEME_COLOR }}
                >
                  See All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loadingDishesUnder250 ? (
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex-shrink-0 w-[150px] flex flex-col gap-2">
                      <div className="w-full h-[115px] rounded-2xl bg-gray-100 dark:bg-neutral-800 animate-pulse" />
                      <div className="h-3 w-12 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded" />
                      <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 animate-pulse rounded" />
                      <div className="h-4 w-1/2 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : displayedDishesUnder250.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4 w-full">No meals under ₹250 available currently</div>
              ) : (
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {displayedDishesUnder250.map((dish) => {
                    return (
                      <div
                        key={dish.id}
                        className="flex-shrink-0 w-[140px] flex flex-col gap-2 group"
                      >
                        {/* Image container */}
                        <div className="relative w-full h-[140px] rounded-2xl bg-gray-50 border border-gray-100 dark:border-gray-800">
                          <div className="w-full h-full rounded-2xl overflow-hidden relative">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          
                          {/* Rating Badge Overlay */}
                          <div className="absolute -bottom-[1px] -left-[1px] bg-white dark:bg-[#0a0a0a] pt-[3px] pr-[5px] rounded-tr-lg rounded-bl-2xl flex items-center justify-center z-10">
                            <div className="flex items-center gap-[2px] bg-[#EAFBF1] dark:bg-emerald-950/90 text-[#2E7D32] dark:text-emerald-400 text-[10.5px] font-bold px-[5px] py-[2px] rounded-[4px] shadow-sm"><span className="text-[11px] leading-none">★</span><span className="leading-none">{dish.rating}</span></div>
                          </div>
                          
                          {/* Popular Badge */}
                          <div className="absolute top-2 left-2 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm" style={{ backgroundColor: FOOD_VEG_COLOR }}>
                            Popular
                          </div>

                          {/* Plus Button or Quantity Selector Overlay (Inside the image) */}
                          {(() => {
                            const cartItem = getCartItem(dish.id);
                            const quantity = cartItem ? cartItem.quantity : 0;
                            if (quantity > 0) {
                              return (
                                <div
                                  className="absolute bottom-2 right-2 h-8 rounded-full bg-white shadow-md flex items-center justify-between border px-1.5 gap-1.5"
                                  style={{ borderColor: `${FOOD_THEME_COLOR}33` }}
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => handleDecreaseQuantity(dish, e)}
                                    className="w-5 h-5 flex items-center justify-center hover:opacity-80 transition-all active:scale-75"
                                    style={{ color: FOOD_THEME_COLOR }}
                                  >
                                    <Minus className="h-3.5 w-3.5" strokeWidth={3.5} />
                                  </button>
                                  <span className="text-[12px] font-black text-gray-950 min-w-[12px] text-center select-none">
                                    {quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleIncreaseQuantity(dish, e)}
                                    className="w-5 h-5 flex items-center justify-center hover:opacity-80 transition-all active:scale-75"
                                    style={{ color: FOOD_THEME_COLOR }}
                                  >
                                    <Plus className="h-3.5 w-3.5" strokeWidth={3.5} />
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={(e) => handleAddToCart(dish, e)}
                                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border transition-all active:scale-90"
                                style={{ borderColor: `${FOOD_THEME_COLOR}33` }}
                              >
                                <Plus className="h-4 w-4" style={{ color: FOOD_THEME_COLOR }} strokeWidth={3} />
                              </button>
                            );
                          })()}
                        </div>

                        {/* Content info */}
                        <div className="flex flex-col gap-1 min-w-0 mt-2.5">
                          {/* Restaurant */}
                          <div className="flex items-center min-w-0">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                              {dish.restaurant}
                            </span>
                          </div>

                          {/* Veg/Non-veg Dot & Name */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="shrink-0 w-3.5 h-3.5 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center p-[2.5px] bg-white">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dish.isVeg ? FOOD_VEG_COLOR : "#dc2626" }} />
                            </div>
                            <span className="text-[12px] font-bold text-gray-900 dark:text-white truncate">
                              {dish.name}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-1.5">
                            {dish.originalPrice ? (
                              <>
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{dish.originalPrice}
                                </span>
                                <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md" style={{ color: FOOD_THEME_COLOR, backgroundColor: `${FOOD_THEME_COLOR}15` }}>
                                  ₹{dish.price}
                                </span>
                              </>
                            ) : (
                              <span className="text-[12px] font-black text-gray-950 dark:text-white">
                                  ₹{dish.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Suspense fallback={null}>
              <PopularRestaurantSection popularRestaurants={meta.popular} />
            </Suspense>

            <Suspense fallback={null}>
              <RecommendedSection recommendedForYouRestaurants={meta.recommended} />
            </Suspense>


            {(banners.loading || (banners?.images?.length > 0)) && (
              <Suspense fallback={<HeroBannerSkeleton className="h-full w-full px-4 mt-3" />}>
                <section className="content-auto px-4 pt-3 sm:pt-4 lg:pt-5">
                  <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] h-48 sm:h-56 md:h-64 lg:h-72">
                    <BannerSection
                      showBannerSkeleton={banners.loading}
                      heroBannerImages={banners.images}
                      heroBannersData={banners.data}
                      currentBannerIndex={currentBannerIndex}
                      setCurrentBannerIndex={setCurrentBannerIndex}
                      heroShellRef={heroShellRef}
                      navigate={navigate}
                      backendOrigin={BACKEND_ORIGIN}
                    />
                  </div>
                </section>
              </Suspense>
            )}



            <Suspense fallback={null}>
              <ExploreMoreSection
                exploreMoreHeading={landing.heading}
                showExploreSkeleton={landing.loading}
                finalExploreItems={finalExploreItemsFiltered}
                backendOrigin={BACKEND_ORIGIN}
              />
            </Suspense>

            {/* Hiding Custom Cake card as requested
            <div className="px-4 py-4 md:py-6 mt-2 mx-auto max-w-7xl">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col-reverse lg:flex-row items-center justify-between gap-6 sm:gap-8 shadow-[0_8px_30px_rgb(236,72,153,0.3)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="flex-1 z-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 w-full">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white drop-shadow-md tracking-tight leading-tight">
                      Custom Cake Chahiye? <br className="hidden lg:block" />
                      <span className="text-yellow-200">Bas Chotuu Ko Bataiye!</span> 🎂
                    </h3>
                    <p className="text-white/95 text-sm sm:text-base font-semibold drop-shadow-sm">
                      Dream it, we bake it! ✨
                    </p>
                  </div>
                  
                  <Button asChild className="mt-2 bg-white text-pink-600 hover:bg-pink-50 hover:text-pink-700 rounded-xl shadow-[0_6px_15px_rgba(0,0,0,0.1)] border-0 px-6 py-5 w-full sm:w-auto text-base font-bold transition-all hover:-translate-y-1 active:scale-95 group whitespace-nowrap">
                    <Link to="/food/user/custom-cakes" className="flex items-center justify-center gap-2">
                      Explore Now
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-lg"
                      >
                        🚀
                      </motion.div>
                    </Link>
                  </Button>
                </div>
                
                <motion.div 
                  initial={{ rotate: -5, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="z-10 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 shrink-0 flex items-center justify-center pointer-events-none"
                >
                  <img 
                    src={customLogo} 
                    alt="Custom Cake Logo" 
                    className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
                  />
                </motion.div>
              </motion.div>
            </div>
            */}

            <Suspense fallback={<RestaurantGridSkeleton count={3} />}>
              <RestaurantGrid
                filteredRestaurants={restaurants.visible}
                visibleRestaurants={restaurants.visible}
                showRestaurantSkeleton={restaurants.loading}
                isLoadingFilterResults={restaurants.isLoadingFilterResults}
                loadingRestaurants={restaurants.loading}
                availabilityTick={availabilityTick}
                isFavorite={isFavorite}
                onFavoriteToggle={(e, restaurant, slug, favorite) => {
                  if (favorite) removeFavorite(slug);
                  else {
                    addFavorite(restaurant);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }
                }}
                backendOrigin={BACKEND_ORIGIN}
                hasMoreRestaurants={restaurants.hasMore}
                loadMoreRestaurants={actions.loadMoreRestaurants}
                restaurantLoadMoreRef={restaurantLoadMoreRef}
              />
            </Suspense>
          </motion.div>
        ) : activeTab === "quick" ? (
          <motion.div
            key="quick-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="bg-white dark:bg-[#0a0a0a]"
          >
            <QuickLocationProvider>
              <QuickCartProvider>
                <QuickWishlistProvider>
                  <QuickCartAnimationProvider>
                    <QuickProductDetailProvider>
                      <Suspense fallback={<div className="h-screen w-full bg-white dark:bg-[#0a0a0a]" />}>
                        <QuickCommerceHomePage
                          embedded
                          onThemeChange={({ color }) => color && setQuickThemeColor(color)}
                          embeddedHeaderColor={quickThemeColor}
                        />
                      </Suspense>
                    </QuickProductDetailProvider>
                  </QuickCartAnimationProvider>
                </QuickWishlistProvider>
              </QuickCartProvider>
            </QuickLocationProvider>
          </motion.div>
        ) : (
          <motion.div
            key="milk-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="bg-white dark:bg-[#0a0a0a]"
          >
            <Suspense fallback={<div className="h-screen w-full bg-white dark:bg-[#0a0a0a]" />}>
              <DudhwalaHomeScreen />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Veg Mode Popups (Enable / Switch Off) */}
      <VegModePopups
        showVegModePopup={showVegModePopup}
        showSwitchOffPopup={showSwitchOffPopup}
        onCloseVegPopup={(level) => {
          setShowVegModePopup(false);
          if (level) {
            setVegModeContext(level);
          }
        }}
        onCloseSwitchOffPopup={() => {
          setShowSwitchOffPopup(false);
          isHandlingSwitchOff.current = false;
        }}
        onConfirmSwitchOff={() => {
          setVegModeContext(false);
          setShowSwitchOffPopup(false);
          isHandlingSwitchOff.current = false;
        }}
      />

      {/* Category Modal */}
      <AnimatePresence>
        {showAllCategoriesModal && (
          <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-[#1a1a1a]">
            <HomeHeader embedded location={location} savedAddressText="All Categories" handleLocationClick={() => setShowAllCategoriesModal(false)} />
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
              {categories.display.map(cat => (
                <Link key={cat.id} to={`/user/category/${cat.slug}`} className="flex flex-col items-center gap-2" onClick={() => setShowAllCategoriesModal(false)}>
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm bg-gray-50">
                    <OptimizedImage src={cat.image} className="w-full h-full object-cover" backendOrigin={BACKEND_ORIGIN} />
                  </div>
                  <span className="text-xs font-semibold text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
            <Button className="m-6 rounded-2xl" variant="secondary" onClick={() => setShowAllCategoriesModal(false)}>Close</Button>
          </div>
        )}
      </AnimatePresence>

      {activeTab === "food" && hasFoodCartItems && !hideExtras && <Suspense fallback={null}><MiniCart /></Suspense>}
      {!hideExtras && <Suspense fallback={null}><OrderTrackingCard hasBottomNav /></Suspense>}

      {/* Sticky Categories & Filters Header */}
      <AnimatePresence>
        {showStickyCategories && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden fixed top-0 left-0 right-0 z-[150] bg-white dark:bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-b border-gray-100 dark:border-gray-800 pt-4 pb-4 flex flex-col gap-2"
          >
            {/* Category horizontal rail */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categories.display.map((category, index) => (
                <Link
                  key={category.id || index}
                  to={`/user/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1 group w-[92px]"
                >
                  <div className="w-[72px] h-[72px] rounded-full overflow-hidden shadow-sm border border-gray-100 transition-transform group-hover:scale-105 bg-white">
                    <OptimizedImage
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      backendOrigin={BACKEND_ORIGIN}
                    />
                  </div>
                  <span className="text-[12px] font-black text-gray-700 dark:text-gray-300 truncate w-full text-center uppercase tracking-wide">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
