import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import LocationDrawer from "./LocationDrawer";
import { useLocation } from "../../context/LocationContext";
import { useProductDetail } from "../../context/ProductDetailContext";
import { useCart } from "../../context/CartContext";
import { useSettings } from "@core/context/SettingsContext";
import { cn } from "@/lib/utils";
import {
  buildHeaderGradient,
  buildMiniCartColor,
  buildSearchBarBackgroundColor,
  shiftHex,
} from "../../utils/headerTheme";
import {
  getQuickCartPath,
  getQuickHomePath,
  getQuickSearchPath,
  getQuickWishlistPath,
  getQuickCategoryPath,
} from "../../utils/routes";
import LogoImage from "@/assets/Logo.png";
import shoppingCartAnimation from "@/assets/lottie/shopping-cart.json";
import { Sparkles, X } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { resolveQuickImageUrl } from "../../utils/image";
import ThemeToggle from "../layout/ThemeToggle";

// MUI Icons
import HomeIcon from "@mui/icons-material/Home";
import DevicesIcon from "@mui/icons-material/Devices";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import KitchenIcon from "@mui/icons-material/Kitchen";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PetsIcon from "@mui/icons-material/Pets";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SpaIcon from "@mui/icons-material/Spa";
import ToysIcon from "@mui/icons-material/Toys";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import YardIcon from "@mui/icons-material/Yard";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import DiamondIcon from "@mui/icons-material/Diamond";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import BuildIcon from "@mui/icons-material/Build";
import LuggageIcon from "@mui/icons-material/Luggage";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import ChevronDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

const ICON_COMPONENTS = {
  electronics: DevicesIcon,
  fashion: CheckroomIcon,
  home: HomeIcon,
  food: LocalCafeIcon,
  sports: SportsSoccerIcon,
  books: MenuBookIcon,
  beauty: SpaIcon,
  toys: ToysIcon,
  automotive: DirectionsCarIcon,
  pets: PetsIcon,
  health: LocalHospitalIcon,
  garden: YardIcon,
  office: BusinessCenterIcon,
  music: MusicNoteIcon,
  jewelry: DiamondIcon,
  baby: ChildCareIcon,
  tools: BuildIcon,
  luggage: LuggageIcon,
  grocery: LocalGroceryStoreIcon,
};

const serviceTabs = [
  { name: "Chotuu FoodWala" },
  { name: "ChotuuMart" },
  { name: "Chotuu Dudhwala" },
];

const isMeaningfulLocationValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized &&
    normalized !== "select location" &&
    normalized !== "current location"
  );
};

const buildLocationDisplay = (addressText, currentLocation) => {
  if (isMeaningfulLocationValue(addressText)) {
    const parts = String(addressText)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 3) {
      return {
        title: parts.slice(0, 2).join(", "),
        subtitle: parts.slice(2).join(", "),
      };
    }

    if (parts.length === 2) {
      return {
        title: parts.join(", "),
        subtitle: "Tap to choose delivery location",
      };
    }

    return {
      title: String(addressText).trim(),
      subtitle: "Tap to choose delivery location",
    };
  }

  const fallbackTitle = currentLocation?.city || "Select Location";
  const fallbackSubtitle = currentLocation?.name || "Tap to choose delivery location";

  return {
    title: fallbackTitle,
    subtitle: fallbackSubtitle,
  };
};

const lightenHex = (hex, amount = 0.18) => {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;

  const clamp = (value) => Math.max(0, Math.min(255, value));
  const toHex = (value) => clamp(value).toString(16).padStart(2, "0");
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
};

function CircularCategoryItem({
  cat,
  isActive = false,
  isDropdown = false,
  isMore = false,
  onClick,
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 snap-center bg-transparent border-0 select-none outline-none cursor-pointer group shrink-0"
      style={{ minWidth: "56px", maxWidth: "64px" }}
    >
      <div
        className={cn(
          "h-[52px] w-[52px] md:h-[60px] md:w-[60px] rounded-full flex items-center justify-center transition-all",
          isActive 
            ? "bg-[#E8F5E9] ring-2 ring-[#0c831f]/30" 
            : isMore
              ? "bg-[#E8F5E9]"
              : "bg-[#f4f5f4]"
        )}
      >
        {typeof cat.icon === "function" ||
          (typeof cat.icon === "object" && cat.icon.$$typeof) ? (
          <cat.icon
            sx={{
              fontSize: 28,
              color: isActive ? "#0c831f" : "#4b5563",
            }}
          />
        ) : (
          <img
            src={cat.icon || cat.image}
            alt={cat.name}
            className="h-8 w-8 md:h-10 md:w-10 object-contain"
          />
        )}
      </div>
      <div className="flex items-center justify-center w-full">
        <span
          className={cn(
            "text-[9px] uppercase tracking-wide text-center leading-tight font-bold text-gray-600 line-clamp-1",
            isActive && "text-[#0c831f] font-black"
          )}
          style={{ maxWidth: isDropdown ? "46px" : "58px" }}
        >
          {cat.name}
        </span>
        {isDropdown && (
          <ChevronDownIcon
            sx={{
              fontSize: 14,
              color: isActive ? "#0c831f" : "#4b5563",
              marginLeft: "1px",
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </motion.button>
  );
}

function HeaderCategoryDrawer({ isOpen, onClose, categories, activeCategory, onSelect }) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[32px] z-[610] max-h-[85vh] overflow-y-auto outline-none shadow-2xl pb-8"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 z-10">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Choose Category</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const isActive = (activeCategory?._id || activeCategory?.id) === (cat._id || cat.id);
                return (
                  <button
                    key={cat._id || cat.id}
                    onClick={() => {
                      onSelect(cat);
                      onClose();
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer bg-transparent outline-none",
                      isActive
                        ? "border-[#0c831f] bg-[#E8F5E9] dark:bg-emerald-950/20"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 dark:bg-slate-800/40 dark:border-slate-800"
                    )}
                  >
                    <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      {typeof cat.icon === "function" || (typeof cat.icon === "object" && cat.icon.$$typeof) ? (
                        <cat.icon sx={{ fontSize: 28, color: isActive ? "#0c831f" : "#64748b" }} />
                      ) : (
                        <img src={cat.icon || cat.image} alt={cat.name} className="h-10 w-10 object-contain" />
                      )}
                    </div>
                    <span className={cn("text-xs font-bold text-center", isActive ? "text-[#0c831f]" : "text-gray-700 dark:text-gray-300")}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const MainLocationHeader = ({
  categories: externalCategories = [],
  quickCategories = [],
  activeCategory,
  onCategorySelect,
  embedded = false,
  embeddedHeaderColor = null,
  showTopContent = true,
  showSearchBar = true,
  showCategories = true,
  showLocation = true,
}) => {
  const { scrollY } = useScroll();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
  const { currentLocation, refreshLocation, isFetchingLocation } =
    useLocation();
  const { isOpen: isProductDetailOpen } = useProductDetail();
  const { cartCount } = useCart();
  const { settings } = useSettings();
  const appName = settings?.appName || "ChotuuMart";
  const logoUrl = settings?.logoUrl || LogoImage;
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const cartPath = getQuickCartPath(routerLocation.pathname);
  const homePath = getQuickHomePath(routerLocation.pathname);
  const searchPath = getQuickSearchPath(routerLocation.pathname);
  const wishlistPath = getQuickWishlistPath();

  const { title: locationTitle, subtitle: locationSubtitle } = React.useMemo(
    () => buildLocationDisplay(currentLocation.name, currentLocation),
    [currentLocation],
  );

  const [internalCategories, setInternalCategories] = useState([]);

  useEffect(() => {
    // Only fetch if showCategories is true and no external categories provided
    if (showCategories && externalCategories.length === 0) {
      customerApi.getCategories().then((res) => {
        if (res.data.success) {
          const dbCats = res.data.results || res.data.result || [];
          const headers = dbCats
            .filter((cat) => cat.type === "header")
            .map((cat) => {
              const customImg = cat.image?.url || cat.image;
              const resolvedImg = customImg ? resolveQuickImageUrl(customImg) : null;
              return {
                ...cat,
                id: cat._id,
                icon: resolvedImg || (cat.iconId && ICON_COMPONENTS[cat.iconId]) || Sparkles,
              };
            });
          setInternalCategories(headers);
        }
      });
    }
  }, [showCategories, externalCategories.length]);

  const categories = (externalCategories.length > 0 ? externalCategories : internalCategories)
    .filter(cat => !serviceTabs.some(tab => tab.name.toLowerCase() === cat.name?.toLowerCase()));

  const activeHeaderId = activeCategory?._id || activeCategory?.id || "all";
  const subCategories = React.useMemo(() => {
    if (activeHeaderId === "all") {
      return quickCategories.slice(0, 8);
    }
    return quickCategories.filter(cat => String(cat.parentId) === String(activeHeaderId)).slice(0, 8);
  }, [activeHeaderId, quickCategories]);

  const handleSubcategoryClick = (cat) => {
    navigate(getQuickCategoryPath(cat.id || cat._id));
  };

  // Search Logic
  const handleSearchClick = () => {
    navigate(searchPath);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate(searchPath, { state: { query: e.target.value } });
    }
  };

  // Search placeholder animation
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search ");
  const [typingState, setTypingState] = useState({
    textIndex: 0,
    charIndex: 0,
    isDeleting: false,
    isPaused: false,
  });

  const staticText = "Search ";
  const typingPhrases = [
    '"milk, atta, chips..."',
    '"bread, butter..."',
    '"fruits, vegetables..."',
    '"eggs, dairy..."',
    '"chocolates, snacks..."',
  ];

  useEffect(() => {
    const { textIndex, charIndex, isDeleting, isPaused } = typingState;
    const currentPhrase = typingPhrases[textIndex];

    if (isPaused) {
      const timeout = setTimeout(() => {
        setTypingState((prev) => ({
          ...prev,
          isPaused: false,
          isDeleting: true,
        }));
      }, 2000); // Pause after full phrase
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (charIndex < currentPhrase.length) {
            setSearchPlaceholder(
              staticText + currentPhrase.substring(0, charIndex + 1),
            );
            setTypingState((prev) => ({
              ...prev,
              charIndex: prev.charIndex + 1,
            }));
          } else {
            // Finished typing
            setTypingState((prev) => ({ ...prev, isPaused: true }));
          }
        } else {
          // Deleting
          if (charIndex > 0) {
            setSearchPlaceholder(
              staticText + currentPhrase.substring(0, charIndex - 1),
            );
            setTypingState((prev) => ({
              ...prev,
              charIndex: prev.charIndex - 1,
            }));
          } else {
            // Finished deleting
            setTypingState((prev) => ({
              ...prev,
              isDeleting: false,
              textIndex: (prev.textIndex + 1) % typingPhrases.length,
            }));
          }
        }
      },
      isDeleting ? 50 : 100,
    ); // 50ms deleting speed, 100ms typing speed

    return () => clearTimeout(timeout);
  }, [typingState]);

  // Smooth scroll interpolations.
  // In embedded mode this header lives inside the main food page, so collapsing
  // it on page scroll causes the category rail to "compact" or glitch.
  const rawHeaderTopPadding = useTransform(scrollY, [0, 160], [16, 12]);
  const rawHeaderBottomPadding = useTransform(scrollY, [0, 160], [4, 3]);
  const rawHeaderRoundness = useTransform(scrollY, [0, 160], [0, 24]);
  const rawBgOpacity = useTransform(scrollY, [0, 160], [1, 0.98]);

  // Content animations
  const rawContentHeight = useTransform(scrollY, [0, 160], ["64px", "0px"]);
  const rawContentOpacity = useTransform(scrollY, [0, 160], [1, 0]);
  const rawNavHeight = useTransform(scrollY, [0, 200], ["60px", "56px"]);
  const rawNavOpacity = useTransform(scrollY, [0, 200], [1, 1]);
  const rawNavMargin = useTransform(scrollY, [0, 200], [4, 2]);
  const rawCategorySpacing = useTransform(scrollY, [0, 200], [3, 1]);
  const rawCartOpacity = useTransform(scrollY, [0, 110, 150], [1, 0.7, 0]);
  const rawCartScale = useTransform(scrollY, [0, 110, 150], [1, 0.9, 0.75]);

  const rawDisplayContent = useTransform(scrollY, (value) =>
    value > 160 ? "none" : "block",
  );
  const rawDisplayNav = useTransform(scrollY, () => "flex");
  const rawDisplayCart = useTransform(scrollY, (value) =>
    value > 150 ? "none" : "block",
  );

  const headerTopPadding = embedded ? 16 : rawHeaderTopPadding;
  const headerBottomPadding = embedded ? 4 : rawHeaderBottomPadding;
  const headerRoundness = embedded ? 0 : rawHeaderRoundness;
  const bgOpacity = embedded ? 1 : rawBgOpacity;
  const contentHeight = embedded ? "64px" : rawContentHeight;
  const contentOpacity = embedded ? 1 : rawContentOpacity;
  const navHeight = embedded ? "auto" : rawNavHeight;
  const navOpacity = embedded ? 1 : rawNavOpacity;
  const navMargin = embedded ? 0 : rawNavMargin;
  const categorySpacing = embedded ? -2 : rawCategorySpacing;
  const cartOpacity = embedded ? 1 : rawCartOpacity;
  const cartScale = embedded ? 1 : rawCartScale;
  const displayContent = embedded ? "block" : rawDisplayContent;
  const displayNav = embedded ? "flex" : rawDisplayNav;
  const displayCart = embedded ? "block" : rawDisplayCart;

  const baseHeaderColor =
    (embedded && embeddedHeaderColor) || activeCategory?.headerColor || null;
  const headerGradient = baseHeaderColor
    ? embedded
      ? "#ffffff"
      : buildHeaderGradient(baseHeaderColor)
    : "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)";
  const searchBarBg = buildSearchBarBackgroundColor(baseHeaderColor || "#1e293b");
  const categoryAccent = embedded ? "#000000" : "#ffffff";

  useEffect(() => {
    const c = buildMiniCartColor(baseHeaderColor || "#1e293b");
    document.documentElement.style.setProperty("--customer-mini-cart-color", c);
    return () => {
      document.documentElement.style.removeProperty(
        "--customer-mini-cart-color",
      );
    };
  }, [baseHeaderColor]);

  return (
    <>
      <div
        className={cn(
          embedded
            ? "sticky top-0 z-40"
            : "fixed top-0 left-0 right-0 z-200",
          isProductDetailOpen && "hidden md:block",
        )}>
        <motion.div
          style={{
            paddingTop: headerTopPadding,
            paddingBottom: headerBottomPadding,
            borderBottomLeftRadius: headerRoundness,
            borderBottomRightRadius: headerRoundness,
            opacity: bgOpacity,
            backgroundColor: embedded ? "#ffffff" : undefined,
            backgroundImage: embedded ? "none" : headerGradient,
          }}
          className={cn(
            "px-0 md:px-4 transition-all duration-300",
            embedded
              ? "backdrop-blur-xl border-b-0 shadow-none"
              : "sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
          )}>
          {/* Subtle Glow Overlay */}
          {embedded ? (
            <>
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  <circle cx="10%" cy="10%" r="20" fill="white" />
                  <circle cx="90%" cy="20%" r="15" fill="white" />
                  <circle cx="50%" cy="80%" r="25" fill="white" />
                  <path d="M 0 50 Q 25 30 50 50 T 100 50" stroke="white" strokeWidth="0.5" fill="none" />
                  <path d="M 0 70 Q 25 50 50 70 T 100 70" stroke="white" strokeWidth="0.5" fill="none" />
                </svg>
              </div>
              <div
                className="absolute top-0 left-1/4 h-24 w-24 rounded-full blur-[48px] pointer-events-none"
                style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
              />
              <div className="absolute bottom-0 right-1/4 h-28 w-28 rounded-full bg-yellow-400/10 blur-[64px] pointer-events-none" />
            </>
          ) : (
            <div className="absolute inset-0 bg-white/8 pointer-events-none" />
          )}

          {/* Desktop/Tablet Header Layout (md and above) */}
          {!embedded && (showTopContent || showSearchBar) && (
            <div className="hidden md:flex items-center justify-between relative z-20 px-2 lg:px-6 mb-4 mt-1">
              {/* Left Section: Logo + Location row */}
              <div className="flex items-center gap-4 lg:gap-8">
                <div
                  onClick={() => navigate(homePath)}
                  className="flex items-center gap-3 cursor-pointer group shrink-0">
                  <div className="group-hover:scale-110 transition-all duration-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
                    <img
                      src={logoUrl}
                      alt={`${appName} Logo`}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Location Block (Desktop inline row) */}
                {showLocation && (
                  <button
                    type="button"
                    onClick={() => setIsLocationOpen(true)}
                    className="flex flex-col border-l border-black/10 pl-4 lg:pl-8 h-10 justify-center border-0 bg-transparent p-0 text-left cursor-pointer group active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-[3px]">
                      <span className="truncate text-[15px] font-black text-slate-900 tracking-tight">
                        {locationTitle}
                      </span>
                      <ChevronDownIcon
                        sx={{ fontSize: 14, color: "#111827", opacity: 0.7 }}
                      />
                    </div>
                    <span className="max-w-[250px] lg:max-w-[320px] truncate text-[11px] font-medium text-slate-500">
                      {locationSubtitle}
                    </span>
                  </button>
                )}
              </div>

              {/* Center Section: Empty (Search moved to categories) */}
              <div className="flex-1 px-6">
                <div className="flex items-center justify-end gap-3">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                    style={{
                      opacity: cartOpacity,
                      scale: cartScale,
                      display: displayCart,
                    }}
                    type="button"
                    aria-label="Open cart"
                    onClick={() => navigate(cartPath)}
                    className="group relative h-12 w-12 shrink-0 rounded-2xl border border-white/55 bg-white/28 shadow-[0_16px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 hover:bg-white/42 hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)]">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />
                    <div className="absolute inset-x-2 top-1 h-px bg-white/70 pointer-events-none" />
                    <Lottie
                      animationData={shoppingCartAnimation}
                      loop
                      className="pointer-events-none absolute inset-0 scale-[1.18] drop-shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-transform duration-300 group-hover:scale-[1.25]"
                    />
                  </motion.button>
                </div>
              </div>

              {/* Right Section: Action Icons */}
              <div className="flex items-center gap-5 lg:gap-8 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(wishlistPath)}
                  className="text-slate-900 hover:text-red-500 transition-all">
                  <FavoriteBorderOutlinedIcon sx={{ fontSize: 24 }} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(cartPath)}
                  className="text-slate-900 hover:text-slate-700 transition-all relative group">
                  <ShoppingCartOutlinedIcon sx={{ fontSize: 24 }} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#cc2532] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-red-800 shadow-sm transition-transform group-hover:-translate-y-0.5">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </motion.button>

                <div className="flex items-center">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Delivery Info & Location (MOBILE ONLY) */}
          {!embedded && showTopContent && showLocation && <div className="md:hidden px-4">
            <motion.div
              style={{
                height: contentHeight,
                opacity: contentOpacity,
                marginBottom: navMargin,
                display: displayContent,
                overflow: "hidden",
              }}
              className="relative z-10">
              <div className="mb-1">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-white/18 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-900 backdrop-blur-sm">
                  {appName}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <button
                    type="button"
                    data-lenis-prevent
                    data-lenis-prevent-touch
                    onClick={() => {
                      setIsLocationOpen(true);
                    }}
                    className="flex items-start gap-1 cursor-pointer flex-1 min-w-0 bg-transparent border-0 p-0 text-left outline-none"
                  >
                    <LocationOnIcon
                      className="h-[14px] w-[14px] mt-[5px] shrink-0"
                      sx={{ color: "#111827" }}
                    />
                    <div className="flex min-w-0 max-w-[190px] flex-col">
                      <div className="flex items-center gap-[3px]">
                        <span className="truncate text-[16px] font-extrabold tracking-[-0.3px] text-slate-900">
                          {locationTitle}
                        </span>
                        <ChevronDownIcon className="h-[14px] w-[14px] shrink-0 opacity-80 text-slate-900" />
                      </div>
                      <span className="max-w-[190px] truncate text-[11px] font-medium text-slate-600">
                        {locationSubtitle}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>}

          {/* Top Search removed from here and moved to categories section below */}

          {showCategories && categories.length > 0 && (
            <div className="relative z-10 space-y-1 pt-0">
              {/* Compact Search Bar integrated into Categories Section */}
              <div className="px-2 md:px-0 md:max-w-2xl md:mx-auto py-1">
                <motion.div
                  onClick={handleSearchClick}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-[12px] md:rounded-full px-3 h-[44px] shadow-md flex items-center bg-white border border-gray-100 cursor-pointer">
                  <SearchIcon sx={{ color: "#1f2937", fontSize: 22 }} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder || "Search Products..."}
                    readOnly
                    className="flex-1 min-w-0 truncate bg-transparent border-none outline-none pl-3 text-slate-800 font-bold placeholder:text-gray-500 text-[15px] cursor-pointer"
                  />
                  <div className="shrink-0 flex items-center gap-2 pl-2">
                    <MicIcon sx={{ color: "#1f2937", fontSize: 20 }} />
                  </div>
                </motion.div>
              </div>

              <motion.div
                layout
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                    mass: 0.6,
                  },
                }}
                style={{
                  height: navHeight,
                  opacity: navOpacity,
                  marginTop: categorySpacing,
                  display: displayNav,
                  overflowY: "hidden",
                }}
                 className={cn(
                   "relative flex items-center justify-start gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 md:px-6 md:justify-center z-10 snap-x min-h-[90px] md:min-h-[100px] pb-1",
                   embedded ? "pt-2" : "pt-3",
                 )}>
                {/* 1. Leftmost Header Category Selector */}
                {activeCategory && (
                  <CircularCategoryItem
                    key={activeCategory._id || activeCategory.id}
                    cat={activeCategory}
                    isActive={true}
                    isDropdown={true}
                    onClick={() => setIsHeaderSelectOpen(true)}
                  />
                )}

                {/* 2. Subsequent Categories belonging to the selected Header */}
                {subCategories.map((cat) => (
                  <CircularCategoryItem
                    key={cat._id || cat.id}
                    cat={cat}
                    isActive={false}
                    onClick={() => handleSubcategoryClick(cat)}
                  />
                ))}

                {/* 3. "More" category trigger at the end */}
                <CircularCategoryItem
                  key="more-items"
                  cat={{
                    name: "More Items",
                    icon: () => (
                      <svg className="h-6 w-6 text-[#0c831f]" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="2.5"/>
                        <circle cx="12" cy="12" r="2.5"/>
                        <circle cx="19" cy="12" r="2.5"/>
                      </svg>
                    )
                  }}
                  isActive={false}
                  isMore={true}
                  onClick={() => navigate("/quick/categories")}
                />
              </motion.div>
            </div>
          )}

          {/* Background Decorative patterns */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        </motion.div>
      </div>

      <LocationDrawer
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <HeaderCategoryDrawer
        isOpen={isHeaderSelectOpen}
        onClose={() => setIsHeaderSelectOpen(false)}
        categories={categories}
        activeCategory={activeCategory}
        onSelect={onCategorySelect}
      />
    </>
  );
};

export default MainLocationHeader;
