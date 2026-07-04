import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  ChevronDown,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Heart,
  Snowflake,
  Dog,
} from "lucide-react";

// MUI Icons (shared with admin & icon selector)
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

import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowRightIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VerifiedIcon from "@mui/icons-material/Verified";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import SavingsIcon from "@mui/icons-material/Savings";

import { getIconSvg } from "@/shared/constants/categoryIcons";
import { motion, useScroll, useTransform } from "framer-motion";
import { customerApi } from "../services/customerApi";
import { toast } from "sonner";
import ProductCard from "../components/shared/ProductCard";
import MainLocationHeader from "../components/shared/MainLocationHeader";
import MiniCart from "../components/shared/MiniCart";
import ProductDetailSheet from "../components/shared/ProductDetailSheet";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import MobileFooterMessage from "../components/layout/MobileFooterMessage";
import { useProductDetail } from "../context/ProductDetailContext";
import { cn } from "@/lib/utils";
import { Skeleton } from "@food/components/ui/skeleton";
import CardBanner from "@/assets/CardBanner.jpg";
import SectionRenderer from "../components/experience/SectionRenderer";
import ExperienceBannerCarousel from "../components/experience/ExperienceBannerCarousel";
import { useLocation } from "../context/LocationContext";
import { resolveQuickImageUrl } from "../utils/image";
import { getCloudinarySrcSet } from "@/shared/utils/cloudinaryUtils";
import { useQuickHomeData } from "../hooks/useQuickHomeData";
import {
  getSideImageByKey,
  getBackgroundColorByValue,
  getBackgroundGradientByValue,
} from "@/shared/constants/offerSectionOptions";
import {
  getQuickCartPath,
  getQuickCategoriesPath,
  getQuickCategoryPath,
} from "../utils/routes";

const DEFAULT_CATEGORY_THEME = {
  gradient: "linear-gradient(to bottom, #F7C332, #F7E08F)",
  shadow: "shadow-yellow-500/20",
  accent: "text-[#1A1A1A]",
};

const CATEGORY_METADATA = {
  All: {
    icon: HomeIcon,
    theme: DEFAULT_CATEGORY_THEME,
    banner: {
      title: "HOUSEFULL",
      subtitle: "SALE",
      floatingElements: "sparkles",
    },
  },
  Grocery: {
    icon: LocalGroceryStoreIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #cc2532, #ff5252)",
      shadow: "shadow-red-500/20",
      accent: "text-red-900",
    },
    banner: {
      title: "SUPERSAVER",
      subtitle: "FRESH & FAST",
      floatingElements: "leaves",
    },
  },
  Wedding: {
    icon: CardGiftcardIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FF4D6D, #FF8FA3)",
      shadow: "shadow-rose-500/20",
      accent: "text-rose-900",
    },
    banner: { title: "WEDDING", subtitle: "BLISS", floatingElements: "hearts" },
  },
  "Home & Kitchen": {
    icon: KitchenIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #BC6C25, #DDA15E)",
      shadow: "shadow-amber-500/20",
      accent: "text-amber-900",
    },
    banner: { title: "HOME", subtitle: "KITCHEN", floatingElements: "smoke" },
  },
  Electronics: {
    icon: DevicesIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #7209B7, #B5179E)",
      shadow: "shadow-purple-500/20",
      accent: "text-purple-900",
    },
    banner: {
      title: "TECH FEST",
      subtitle: "GADGETS",
      floatingElements: "tech",
    },
  },
  Kids: {
    icon: ChildCareIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4CC9F0, #A0E7E5)",
      shadow: "shadow-blue-500/20",
      accent: "text-blue-900",
    },
    banner: {
      title: "LITTLE ONE",
      subtitle: "CARE",
      floatingElements: "bubbles",
    },
  },
  "Pet Supplies": {
    icon: PetsIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FB8500, #FFB703)",
      shadow: "shadow-yellow-500/20",
      accent: "text-yellow-900",
    },
    banner: { title: "PAWSOME", subtitle: "DEALS", floatingElements: "bones" },
  },
  Sports: {
    icon: SportsSoccerIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4361EE, #4895EF)",
      shadow: "shadow-indigo-500/20",
      accent: "text-indigo-900",
    },
    banner: { title: "SPORTS", subtitle: "GEAR", floatingElements: "confetti" },
  },
};

const ALL_CATEGORY = {
  id: "all",
  _id: "all",
  name: "All",
  icon: HomeIcon,
  theme: DEFAULT_CATEGORY_THEME,
  headerColor: "#ffdb3a",
  banner: {
    title: "HOUSEFULL",
    subtitle: "SALE",
    floatingElements: "sparkles",
    textColor: "text-black",
  },
};

const categories = [
  {
    id: 1,
    name: "All",
    icon: HomeIcon,
    theme: DEFAULT_CATEGORY_THEME,
    banner: {
      title: "HOUSEFULL",
      subtitle: "SALE",
      floatingElements: "sparkles",
      textColor: "text-black",
    },
  },
  {
    id: 5,
    name: "Electronics",
    icon: DevicesIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #7209B7, #B5179E)",
      shadow: "shadow-purple-500/20",
      accent: "text-purple-900",
    },
    banner: {
      title: "TECH FEST",
      subtitle: "GADGETS",
      floatingElements: "tech",
      textColor: "text-white",
    },
  },
  {
    id: 2,
    name: "Grocery",
    icon: LocalGroceryStoreIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #cc2532, #ff5252)",
      shadow: "shadow-red-500/20",
      accent: "text-red-900",
    },
    banner: {
      title: "SUPERSAVER",
      subtitle: "FRESH & FAST",
      floatingElements: "leaves",
      textColor: "text-white",
    },
  },
  {
    id: 10,
    name: "Home & Kitchen",
    icon: KitchenIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #BC6C25, #DDA15E)",
      shadow: "shadow-amber-500/20",
      accent: "text-amber-900",
    },
    banner: {
      title: "HOME",
      subtitle: "KITCHEN",
      floatingElements: "smoke",
      textColor: "text-white",
    },
  },
  {
    id: 7,
    name: "Kids",
    icon: ChildCareIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4CC9F0, #A0E7E5)",
      shadow: "shadow-blue-500/20",
      accent: "text-blue-900",
    },
    banner: {
      title: "LITTLE ONE",
      subtitle: "CARE",
      floatingElements: "bubbles",
      textColor: "text-white",
    },
  },
  {
    id: 8,
    name: "Pet Supplies",
    icon: PetsIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FB8500, #FFB703)",
      shadow: "shadow-yellow-500/20",
      accent: "text-yellow-900",
    },
    banner: {
      title: "PAWSOME",
      subtitle: "DEALS",
      floatingElements: "bones",
      textColor: "text-white",
    },
  },
  {
    id: 11,
    name: "Sports",
    icon: SportsSoccerIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4361EE, #4895EF)",
      shadow: "shadow-indigo-500/20",
      accent: "text-indigo-900",
    },
    banner: {
      title: "SPORTS",
      subtitle: "GEAR",
      floatingElements: "confetti",
      textColor: "text-white",
    },
  },
  {
    id: 3,
    name: "Wedding",
    icon: CardGiftcardIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FF4D6D, #FF8FA3)",
      shadow: "shadow-rose-500/20",
      accent: "text-rose-900",
    },
    banner: {
      title: "WEDDING",
      subtitle: "BLISS",
      floatingElements: "hearts",
      textColor: "text-white",
    },
  },
];

// Map icon ids saved from admin/category icon selector to MUI icons
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
  art: ColorLensIcon,
  grocery: LocalGroceryStoreIcon,
};

const bestsellerCategories = [
  {
    id: 1,
    name: "Chips & Namkeen",
    images: [
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1599490659223-e1539e76926a?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1621444541669-451006c1103d?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 2,
    name: "Bakery & Biscuits",
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1581339399838-2a120c18bba3?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 3,
    name: "Vegetable & Fruits",
    images: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1518843025960-d70213740685?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 4,
    name: "Oil, Ghee & Masala",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1596797038558-9c50f16ee64b?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1472141521881-95d0e87e2e39?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 5,
    name: "Sweet & Chocolates",
    images: [
      "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1526081347589-7fa3cb419ee7?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1542841791-192d99906b27?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 6,
    name: "Drinks & Juices",
    images: [
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1625772290748-39126cdd9fe9?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
];

const MARQUEE_MESSAGES = [
  "24/7 Delivery",
  "Minimum Order ₹99",
  "Save Big on Essentials!",
];

const QUICK_THEME_STORAGE_KEY = "food.quick.headerColor";
const QUICK_HEADER_RETURN_STORAGE_KEY = "food.quick.headerReturn";

const quickCategoryPalettes = [
  { bgFrom: "#ffd96a", bgVia: "#ffeaa0", bgTo: "#fff0c7", glowColor: "rgba(255,184,0,0.18)", frameColor: "#f0d98a" },
  { bgFrom: "#9fe88c", bgVia: "#c3f1b2", bgTo: "#e4f8da", glowColor: "rgba(126,220,141,0.18)", frameColor: "#bfe3b7" },
  { bgFrom: "#f3a25d", bgVia: "#f9c48b", bgTo: "#fee0bf", glowColor: "rgba(255,139,61,0.16)", frameColor: "#efc08e" },
  { bgFrom: "#b8eff0", bgVia: "#d5f7f5", bgTo: "#edfdfc", glowColor: "rgba(122,215,215,0.16)", frameColor: "#b9e5e3" },
];

const getQuickCategoryImage = (category = {}) => {
  const candidate =
    category?.image ||
    category?.icon ||
    category?.thumbnail ||
    category?.imageUrl ||
    category?.iconUrl ||
    category?.media?.image ||
    category?.media?.url ||
    "";

  return (
    resolveQuickImageUrl(candidate) ||
    "https://cdn-icons-png.flaticon.com/128/2321/2321831.png"
  );
};

function QuickHomeLoadingState({ embedded }) {
  return (
    <div className={cn("pb-8", embedded ? "pt-0" : "pt-4 md:pt-6")}>
      <div className="block md:hidden">
        <Skeleton className="h-[190px] w-full rounded-none" />
      </div>

      <div className="px-4 py-4 md:px-8 lg:px-[50px]">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-[84px] flex-col items-center gap-2 md:min-w-[112px]">
              <Skeleton className="h-[96px] w-[84px] rounded-[22px] md:h-[126px] md:w-[112px]" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 md:px-8 lg:px-[50px]">
        <div className="rounded-[28px] border border-[#0c831f]/10 bg-white/80 dark:bg-card/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-8 w-52 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>

          <div className="flex gap-3 overflow-hidden md:gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="w-[140px] shrink-0 space-y-3">
                <Skeleton className="h-[132px] w-full rounded-[20px]" />
                <Skeleton className="h-3 w-5/6 rounded-full" />
                <Skeleton className="h-3 w-2/3 rounded-full" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const Home = ({ embedded = false, onThemeChange, embeddedHeaderColor = null }) => {
  const { scrollY } = useScroll();
  const { isOpen: isProductDetailOpen } = useProductDetail();
  const { currentLocation } = useLocation();
  const navigate = useNavigate();
  const routePathname = typeof window !== "undefined" ? window.location.pathname : "";
  const quickCatsRef = useRef(null);

  // --- Core Data Hook (Optimized & Cached) ---
  const {
    categories,
    activeCategory,
    setActiveCategory,
    products,
    categoryProducts,
    quickCategories,
    experienceSections,
    offerSections,
    bestSellerSections,
    categoryMap,
    subcategoryMap,
    headerSections,
    heroConfig,
    isLoading,
    isBootstrapped
  } = useQuickHomeData({ currentLocation });

  const [mobileBannerIndex, setMobileBannerIndex] = useState(0);
  const [isInstantBannerJump, setIsInstantBannerJump] = useState(false);
  const [pendingReturn, setPendingReturn] = useState(null);

  useLayoutEffect(() => {
    if (!embedded || typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [embedded, routePathname]);

  const scrollQuickCats = (direction) => {
    if (quickCatsRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      quickCatsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (typeof onThemeChange !== "function") return;
    const resolvedColor = activeCategory?.headerColor || ALL_CATEGORY.headerColor;
    if (typeof window !== "undefined" && resolvedColor) {
      window.sessionStorage.setItem(QUICK_THEME_STORAGE_KEY, resolvedColor);
    }
    onThemeChange({
      name: activeCategory?.name || ALL_CATEGORY.name,
      color: resolvedColor,
    });
  }, [activeCategory, onThemeChange]);

  const isInitialPageLoading = !isBootstrapped;
  const hasHeroBanners = (heroConfig?.banners?.items || []).length > 0;
  const isBannersLoading = isLoading && !hasHeroBanners;
  const shouldShowHeroFallback = !isInitialPageLoading && !isLoading && !hasHeroBanners;
  const isProductsLoading = isLoading && products.length === 0;

  // Autoplay for Mobile Banner Carousel
  useEffect(() => {
    const totalSlides = 3;
    const intervalId = setInterval(() => {
      setMobileBannerIndex((prev) => (prev >= totalSlides - 1 ? prev : prev + 1));
    }, 3500);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isInstantBannerJump) return;
    const id = requestAnimationFrame(() => setIsInstantBannerJump(false));
    return () => cancelAnimationFrame(id);
  }, [isInstantBannerJump]);

  const handleBannerTransitionEnd = () => {
    const totalSlides = 3;
    if (mobileBannerIndex === totalSlides - 1) {
      setIsInstantBannerJump(true);
      setMobileBannerIndex(0);
    }
  };

  const bestsellerCategories = useMemo(() => {
    const grouped = {};
    products.forEach((p) => {
      const catId = p.categoryId?._id || "other";
      const catName = p.categoryId?.name || "Other";
      if (!grouped[catId]) grouped[catId] = { id: catId, name: catName, images: [] };
      if (grouped[catId].images.length < 4) grouped[catId].images.push(p.image);
    });
    return Object.values(grouped).slice(0, 6);
  }, [products]);

  const productsById = useMemo(() => {
    const map = {};
    products.forEach((p) => { map[p._id || p.id] = p; });
    return map;
  }, [products]);

  const effectiveQuickCategories = useMemo(() => {
    const ids = heroConfig.categoryIds || [];
    if (ids.length > 0) {
      const resolved = ids.map((id) => categoryMap[id]).filter(Boolean).map((c) => ({
        id: c._id,
        name: c.name,
        image: getQuickCategoryImage(c),
        parentId: c.parentId || c.headerId || c.parent?._id || c.header?._id || c.parent || c.header
      }));
      if (resolved.length > 0) return resolved;
    }
    return quickCategories;
  }, [heroConfig.categoryIds, categoryMap, quickCategories]);

  // Filter products by active header category
  // Prefer server-fetched categoryProducts when a specific category is active
  const filteredProducts = useMemo(() => {
    const activeCatId = activeCategory?._id || activeCategory?.id;
    if (!activeCatId || activeCatId === "all") return products;

    // Use server-fetched category products if available
    if (categoryProducts !== null) return categoryProducts;

    // Fallback: client-side filter by categoryId parentId
    return products.filter((p) => {
      const productCatId = p.categoryId?._id || p.categoryId || p.category?._id || p.category;
      if (!productCatId) return false;
      const cat = categoryMap[String(productCatId)];
      if (!cat) return false;
      const parentHeaderId = cat.parentId || cat.headerId || cat.parent?._id || cat.header?._id;
      return String(parentHeaderId) === String(activeCatId) || String(productCatId) === String(activeCatId);
    });
  }, [products, categoryProducts, activeCategory, categoryMap]);

  const sectionsForRenderer = (activeCategory && activeCategory._id !== "all") ? headerSections : experienceSections;

  const opacity = useTransform(scrollY, [0, 300], [1, 0.6]);
  const y = useTransform(scrollY, [0, 300], [0, 80]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const pointerEvents = useTransform(scrollY, [0, 100], ["auto", "none"]);

  useEffect(() => {
    if (!pendingReturn?.sectionId) return;
    const allSections = sectionsForRenderer;
    if (!allSections.length) return;
    if (!allSections.some((s) => s._id === pendingReturn.sectionId)) return;

    const el = document.getElementById(`section-${pendingReturn.sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
      window.sessionStorage.removeItem("experienceReturn");
      setPendingReturn(null);
    }
  }, [sectionsForRenderer, pendingReturn]);

  const renderFloatingElements = (type) => {
    const count = 10;
    const getParticleContent = (index) => {
      switch (type) {
        case "hearts": return <Heart fill="white" size={12 + (index % 5) * 2} className="drop-shadow-sm" />;
        case "snow": return <Snowflake fill="white" size={10 + (index % 4) * 3} className="drop-shadow-sm" />;
        case "stars":
        case "sparkles": return <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="drop-shadow-md"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>;
        default: return <div className="bg-white/40 rounded-full blur-[1px]" style={{ width: 4 + (index % 3) * 3, height: 4 + (index % 3) * 3 }} />;
      }
    };

    return [...Array(count)].map((_, i) => {
      const duration = 15 + Math.random() * 20;
      const delay = Math.random() * -20;
      const depth = 0.5 + Math.random() * 0.5;
      return (
        <motion.div
          key={i} className="absolute pointer-events-none"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0.1 * depth, zIndex: Math.floor(depth * 10) }}
          animate={{ x: [0, 50, -50, 0], y: [0, -100, -50, 0], rotate: [0, 360], scale: [depth, depth * 1.2, depth] }}
          transition={{ duration: duration / depth, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <div className="transform-gpu">{getParticleContent(i)}</div>
        </motion.div>
      );
    });
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-background",
        embedded ? "min-h-0 bg-white dark:bg-card pt-0" : "min-h-screen pt-[176px] md:pt-[210px]",
      )}>
      {/* Top Dynamic Gradient Section */}
      <div
        className={cn("contents", isProductDetailOpen && "hidden md:contents")}>
        <MainLocationHeader
          categories={categories}
          quickCategories={effectiveQuickCategories}
          activeCategory={activeCategory}
          onCategorySelect={setActiveCategory}
          embedded={embedded}
          embeddedHeaderColor={embeddedHeaderColor}
          showTopContent={!embedded}
          showSearchBar={!embedded}
        />
      </div>

      {isInitialPageLoading ? (
        <QuickHomeLoadingState embedded={embedded} />
      ) : (
        <div className={cn("pt-0", embedded && "pt-0")}>
          {/* Hero Banners (mobile): admin-configured or static fallback */}
          <>
            <div className={cn("block md:hidden bg-white pb-3", embedded ? "-mt-[1px]" : "mt-0")}>
              <div>
                <div
                  className="relative w-full overflow-hidden bg-white">
                  {isBannersLoading ? (
                    <div className="w-full h-[190px] bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
                  ) : hasHeroBanners ? (
                    <div className="px-4 pt-2 pb-2">
                      <ExperienceBannerCarousel
                        section={{ title: "" }}
                        items={heroConfig.banners.items}
                        fullWidth={false}
                        slideGap={12}
                        edgeToEdge={false}
                      />
                    </div>
                  ) : shouldShowHeroFallback ? (
                    <motion.div
                      onClick={() => navigate(getQuickCategoriesPath())}
                      whileTap={{ scale: 0.97 }}
                      className="w-full cursor-pointer">
                      <div className="mx-4 rounded-2xl h-[165px] bg-[#E8F5E9] relative overflow-hidden flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        {/* Decorative dots pattern */}
                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#0c831f 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                        
                        {/* Left content */}
                        <div className="relative z-10 w-3/5 flex flex-col items-start gap-1.5 pl-5 py-4">
                          <div className="flex items-center gap-1.5 bg-[#0c831f] text-white px-2.5 py-1 rounded-full shadow-sm">
                            <FlashOnIcon sx={{ fontSize: 13 }} />
                            <span className="text-[9px] font-black uppercase tracking-wider">10-15 Mins Delivery</span>
                          </div>
                          <h4 className="text-[22px] font-[900] text-[#0c831f] tracking-tight leading-tight mt-1">
                            FREE DELIVERY
                          </h4>
                          <p className="text-[13px] font-bold text-[#1A1A1A]/70 leading-snug">
                            on orders above <span className="font-black text-[#1A1A1A]">₹299</span>
                          </p>
                          <button className="bg-[#0c831f] text-white px-5 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider shadow-md mt-1 active:scale-95 transition-transform">
                            Shop Now
                          </button>
                        </div>
                        
                        {/* Right image - delivery boy */}
                        <div className="absolute right-2 bottom-0 top-0 w-2/5 flex items-end justify-center">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/2830/2830312.png"
                            alt="Fast Delivery"
                            className="w-[130px] h-[130px] object-contain drop-shadow-lg"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </div>
          </>

          {/* Promo Marquee Strip - hidden in embedded mode */}
          {!embedded && (
            <div className={cn("w-full md:-mt-[2px] mb-4", "-mt-[2px]")}>
              <div
                className="relative overflow-hidden border-y border-[#e6ddc4] dark:border-[#3a352a] bg-[#f7f0df] dark:bg-[#2a261f] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                <div
                  className="absolute inset-y-0 left-0 w-10 pointer-events-none bg-gradient-to-r from-[#f7f0df] dark:from-[#2a261f] via-[#f7f0df]/90 dark:via-[#2a261f]/90 to-transparent"
                />
                <div
                  className="absolute inset-y-0 right-0 w-10 pointer-events-none bg-gradient-to-l from-[#f7f0df] dark:from-[#2a261f] via-[#f7f0df]/90 dark:via-[#2a261f]/90 to-transparent"
                />
                <div
                  className="classic-marquee-track flex w-max items-center gap-4 px-3 md:px-6 py-4 text-sm md:text-base font-semibold -translate-y-[4px] text-[#4b463f] dark:text-[#d3ccc2]">
                  {[...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES].map((message, idx) => (
                    <React.Fragment key={`${message}-${idx}`}>
                      <span className="whitespace-nowrap">{message}</span>
                      <span className="text-[#8a7f66] dark:text-[#a3977c]">•</span>
                    </React.Fragment>
                  ))}
                  <span className="whitespace-nowrap">❤️</span>
                  <span className="whitespace-nowrap">🎁</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Navigation Category Slider (admin-configured or global fallback) */}
          {effectiveQuickCategories.length > 0 && (
            <div
              className={cn(
                "w-full mb-5 overflow-hidden relative group z-20 md:mt-3",
                embedded ? "hidden" : "mt-4 md:mt-6",
              )}>
              <div
                className={cn(
                  "relative overflow-hidden bg-white dark:bg-card",
                  embedded ? "shadow-none" : "shadow-[0_14px_28px_rgba(15,23,42,0.09)]",
                )}>

                <div className="relative z-10 px-4 pt-3 pb-1 md:px-8 md:pt-4">
                  <h2 className="text-center text-[18px] md:text-[20px] font-bold tracking-tight text-[#132018] dark:text-white leading-none">
                    Quick categories
                  </h2>
                </div>

                {/* Left Scroll Button */}
                <div className="absolute left-4 lg:left-10 top-[58%] -translate-y-1/2 z-20 hidden md:flex">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollQuickCats("left")}
                    className="h-10 w-10 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-xl rounded-full flex items-center justify-center border border-gray-100 dark:border-neutral-700 cursor-pointer hover:bg-white dark:hover:bg-neutral-800 text-[#0c831f] dark:text-emerald-400 transition-all">
                    <ChevronLeft size={22} strokeWidth={3} />
                  </motion.button>
                </div>

                <div
                  ref={quickCatsRef}
                  className="relative z-10 flex items-start gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar px-4 pb-3 pt-1 md:px-8 md:pb-4 snap-x scroll-smooth">
                  {effectiveQuickCategories.map((cat, idx) => {
                    const palette =
                      quickCategoryPalettes[idx % quickCategoryPalettes.length];
                    const categoryImage = getQuickCategoryImage(cat);
                    return (
                      <motion.div
                        key={cat.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.sessionStorage.setItem(
                              QUICK_HEADER_RETURN_STORAGE_KEY,
                              JSON.stringify({
                                headerId:
                                  activeCategory?._id ||
                                  activeCategory?.id ||
                                  ALL_CATEGORY._id,
                                color:
                                  activeCategory?.headerColor ||
                                  ALL_CATEGORY.headerColor,
                                name:
                                  activeCategory?.name || ALL_CATEGORY.name,
                              }),
                            );
                          }
                          navigate(getQuickCategoryPath(cat.id));
                        }}
                        className="flex flex-col items-center gap-1 min-w-[84px] md:min-w-[112px] lg:min-w-[128px] cursor-pointer group/item snap-start">
                        <div
                          className="relative w-[84px] h-[96px] md:w-[112px] md:h-[126px] lg:w-[128px] lg:h-[140px] rounded-t-full rounded-b-[24px] shadow-[0_10px_22px_rgba(15,23,42,0.10)] border flex items-start justify-center p-2 transition-all duration-300 group-hover/item:-translate-y-1 group-hover/item:shadow-[0_16px_30px_rgba(15,23,42,0.14)] overflow-hidden"
                          style={{
                            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.6) 24%, rgba(255,255,255,0.15) 100%), linear-gradient(135deg, ${palette.bgFrom}, ${palette.bgVia}, ${palette.bgTo})`,
                            borderColor: palette.frameColor,
                          }}>
                          <div
                            className="absolute inset-0 opacity-40 pointer-events-none"
                            style={{ backgroundColor: palette.glowColor }}
                          />
                          {categoryImage ? (
                            <img
                              src={categoryImage}
                              alt={cat.name}
                              className="absolute left-1/2 top-3 z-10 h-[68px] w-[68px] -translate-x-1/2 object-contain drop-shadow-[0_5px_12px_rgba(0,0,0,0.10)] mix-blend-multiply group-hover/item:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute left-1/2 top-3 z-10 flex h-[68px] w-[68px] -translate-x-1/2 items-center justify-center rounded-[20px] bg-white/55 text-2xl font-black uppercase text-slate-400">
                              {(cat.name || "?").charAt(0)}
                            </div>
                          )}
                          <div className="absolute inset-x-2 bottom-1.5 z-20 text-center">
                            <span className="block text-[10px] md:text-[11px] lg:text-[12px] font-semibold text-[#1f2b20] dark:text-gray-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] group-hover/item:text-[#0c831f] dark:group-hover/item:text-emerald-700 transition-colors">
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Right Scroll Button */}
                <div className="absolute right-4 lg:right-10 top-[58%] -translate-y-1/2 z-20 hidden md:flex">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => scrollQuickCats("right")}
                    className="h-10 w-10 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-xl rounded-full flex items-center justify-center border border-gray-100 dark:border-neutral-700 cursor-pointer hover:bg-white dark:hover:bg-neutral-800 text-[#0c831f] dark:text-emerald-400 transition-all">
                    <ChevronRight size={22} strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Best Offers Section */}
          <div
            className={cn(
              "mb-4 md:mb-6",
              embedded ? "mt-0" : "mt-6 md:mt-10",
            )}>
            <div className="relative overflow-hidden bg-white dark:bg-neutral-900 pt-5 md:pt-6 pb-0 rounded-none">
              <div className="relative z-10 px-4 md:px-8">
                <div className="flex justify-between items-center mb-4 md:mb-5">
                  <h3 className="text-lg md:text-xl font-[900] text-[#1F1F1F] dark:text-white tracking-tight leading-none">
                    Best Offers
                  </h3>
                  <motion.div
                    onClick={() => navigate(getQuickCategoriesPath())}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 text-[#0c831f] dark:text-emerald-400 font-bold text-[12px] md:text-sm cursor-pointer">
                    View All
                    <ArrowRightIcon sx={{ fontSize: 14 }} />
                  </motion.div>
                </div>

                <div className="relative z-10 flex overflow-x-auto gap-3 md:gap-4 pb-5 md:pb-6 no-scrollbar snap-x snap-mandatory scroll-smooth pt-2">
                  {isProductsLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="w-[140px] md:w-[155px] lg:w-[175px] h-[220px] shrink-0 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
                    ))
                  ) : filteredProducts.slice(0, 12).map((product) => (
                    <div
                      key={product.id || product._id}
                      className="w-[140px] md:w-[155px] lg:w-[175px] shrink-0 snap-start">
                      <ProductCard
                        product={product}
                        className="bg-white rounded-xl border border-slate-100 shadow-sm transition-all"
                        compact={true}
                        isBestOffer={true}
                      />
                    </div>
                  ))}
                  {filteredProducts.length === 0 && !isLoading && (
                    <div className="w-full py-10 md:py-20 text-center text-slate-400 font-black italic md:text-xl">
                      {activeCategory && activeCategory._id !== "all"
                        ? `No products found in ${activeCategory.name}`
                        : "Curating the best deals for you..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
             {/* Best Seller Sections (Blinkit-style subcategory cards) */}
          {bestSellerSections && bestSellerSections.length > 0 && (
            <div className="w-full px-4 md:px-8 lg:px-[50px] mb-12">
              {bestSellerSections
                .filter(section => {
                  const activeCatId = activeCategory?._id || activeCategory?.id;
                  if (!activeCatId || activeCatId === "all") return true;
                  return String(section.categoryId) === String(activeCatId);
                })
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((section) => {
                  if (!section.cards || section.cards.length === 0) return null;
                  return (
                    <div key={section._id} className="mb-6">
                      <div className="mb-4 px-1">
                        <h3 className="text-xl md:text-[26px] font-extrabold text-[#1F1F1F] dark:text-white tracking-tight">
                          Bestsellers
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
                        {section.cards.map((card) => {
                          const moreCount = Math.max(0, card.totalProducts - card.previewImages.length);
                          return (
                            <motion.div
                              key={card.subcategoryId}
                              whileHover={{ y: -4 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                navigate(getQuickCategoryPath(section.categoryId), {
                                  state: { activeSubcategoryId: card.subcategoryId }
                                });
                              }}
                              className="bg-[#F3F4F6] dark:bg-neutral-800 pt-2 px-1.5 pb-4 md:pt-3 md:px-3 md:pb-5 rounded-xl md:rounded-2xl flex flex-col items-center justify-between text-center cursor-pointer border border-[#E5E7EB] dark:border-neutral-700/50 hover:shadow-md transition-all duration-300 group w-full aspect-[3/4.15]"
                            >
                              {/* 2x2 Image Grid inside the card */}
                              <div className="relative w-full aspect-square grid grid-cols-2 gap-1 md:gap-1.5">
                                {card.previewImages.slice(0, 4).map((imgUrl, i) => (
                                  <div key={i} className="aspect-square bg-white dark:bg-neutral-900 rounded-[6px] md:rounded-lg flex items-center justify-center p-0 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
                                    <img
                                      src={resolveQuickImageUrl(imgUrl)}
                                      alt=""
                                      className="w-full h-full object-contain scale-[1.45] mix-blend-multiply dark:mix-blend-normal group-hover:scale-[1.52] transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  </div>
                                ))}
                                {Array.from({ length: Math.max(0, 4 - card.previewImages.length) }).map((_, i) => (
                                  <div key={`pad-${i}`} className="aspect-square bg-white dark:bg-neutral-900/50 rounded-[6px] md:rounded-lg border border-dashed border-slate-200/50" />
                                ))}
                                
                                {/* Centered Bottom Badge overlay inside the container */}
                                {moreCount > 0 && (
                                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] md:text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-neutral-800 shadow-sm whitespace-nowrap z-10">
                                    +{moreCount} more
                                  </span>
                                )}
                              </div>

                              {/* Subcategory Name inside the card */}
                              <span className="text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 text-center leading-tight line-clamp-2 px-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {card.subcategoryName}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Offer Sections (admin-configured: Trending, etc.) – show on Home so user sees them */}
          {offerSections.length > 0 && (
            <div className="w-full px-0 pt-0 pb-2 md:pb-4">
              {[...offerSections]
                .filter(section => {
                  const lowerTitle = (section.title || '').trim().toLowerCase();
                  if (lowerTitle === 'best sellers' || lowerTitle === 'best seller' || lowerTitle === 'bestseller' || lowerTitle === 'bestsellers') return false;
                  // If a specific category is active, only show sections that match it
                  const activeCatId = activeCategory?._id || activeCategory?.id;
                  if (!activeCatId || activeCatId === "all") return true;
                  const sectionCatIds = (section.categoryIds || []).map(c =>
                    typeof c === "object" ? String(c._id || c.id || "") : String(c)
                  );
                  if (sectionCatIds.length === 0) return true; // no category filter = show always
                  return sectionCatIds.some(id => {
                    if (id === String(activeCatId)) return true;
                    const cat = categoryMap[id];
                    const parentHeaderId = cat?.parentId || cat?.headerId || cat?.parent?._id || cat?.header?._id;
                    return String(parentHeaderId) === String(activeCatId);
                  });
                })
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((section) => {
                  const bgColor = getBackgroundColorByValue(
                    section.backgroundColor,
                  );
                  const sectionProducts = (section.productIds || [])
                    .filter((p) => typeof p === "object" && p !== null)
                    .map((p) => ({
                      id: p._id,
                      _id: p._id,
                      name: p.name,
                      image: resolveQuickImageUrl(p.mainImage || p.image || ""),
                      price:
                        Number(p.salePrice || 0) > 0
                          ? Number(p.salePrice)
                          : Number(p.price || 0),
                      originalPrice: Number(
                        p.originalPrice || p.mrp || p.price || p.salePrice || 0,
                      ),
                      weight: p.weight,
                      deliveryTime: p.deliveryTime,
                    }));
                  return (
                    <motion.div
                      key={section._id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.4 }}
                      className="mb-4 overflow-hidden bg-white dark:bg-neutral-900">
                      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-1 flex items-center justify-between">
                        <h3 className="text-lg md:text-xl font-[900] text-[#1F1F1F] dark:text-white tracking-tight leading-none">
                          {section.title}
                        </h3>
                        <span className="text-[11px] md:text-xs font-semibold text-slate-400">
                          {sectionProducts.length} items
                        </span>
                      </div>
                      <div className="p-4 md:p-5">
                        {sectionProducts.length === 0 ? (
                          <div className="w-full py-6 text-center text-slate-400 text-sm font-bold">
                            No products in this section yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                            {sectionProducts.map((product) => (
                              <div
                                key={product.id}
                                className="w-full">
                                <ProductCard
                                  product={product}
                                  className="bg-white border border-slate-100 dark:border-white/5 shadow-sm rounded-xl"
                                  compact
                                  hideBadge={true}
                                  showTimeOnImage={true}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}

          {/* Main Content Area – show admin-configured sections (hero/categories already shown above are skipped) */}
          {sectionsForRenderer.length > 0 && (
            <div
              className={cn(
                "container mx-auto px-4 md:px-8 lg:px-[50px] bg-white dark:bg-slate-900 rounded-none pt-4 pb-10 mt-[-28px] mb-10 relative z-[1] shadow-sm overflow-hidden",
              )}>
              {/* Animated Top Border Glow */}
              <motion.div
                animate={{
                  x: ["-100%", "100%"],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent"
              />

              <SectionRenderer
                sections={sectionsForRenderer}
                productsById={productsById}
                categoriesById={categoryMap}
                subcategoriesById={subcategoryMap}
              />
            </div>
          )}

          {embedded && (
            <>
              <div className="hidden md:block">
                <Footer />
              </div>
              <div className="md:hidden">
                <MobileFooterMessage />
                <BottomNav />
              </div>
            </>
          )}

          {embedded && (
            <>
              <MiniCart
                linkTo={getQuickCartPath(routePathname)}
              />
              <ProductDetailSheet />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
