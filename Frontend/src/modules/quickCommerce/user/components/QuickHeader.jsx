import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LayoutGrid, Wallet } from 'lucide-react';
import { 
  buildHeaderGradient, 
  buildMiniCartColor, 
  buildSearchBarBackgroundColor 
} from '../utils/headerTheme';
import { getQuickCartPath, getQuickHomePath, getQuickSearchPath, getQuickWalletPath, getQuickWishlistPath } from '../utils/routes';
import { resolveQuickImageUrl } from '../utils/image';
import logo from '../assets/Logo.png';
import { useCart } from '../context/CartContext';

// MUI Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import ChevronDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

/** Full-width bottom stroke + tab curve; l/r are 0–100% of column where the inner bump sits. */
function buildActiveTabPath(l, r) {
  const y = 20;
  const mapX = (x) => l + ((x - 1.5) / (98.5 - 1.5)) * (r - l);
  return `M 0 ${y} L ${l} ${y} L ${l} 12 C ${mapX(2.6)} 7 ${mapX(8.2)} 1.55 ${mapX(15)} 1.55 L ${mapX(85)} 1.55 C ${mapX(91.8)} 1.55 ${mapX(97.4)} 7 ${mapX(98.5)} 12 V ${y} L 100 ${y}`;
}

function CategoryNavColumn({
  cat,
  isActive,
  categoryAccent,
  onCategorySelect,
}) {
  const colRef = useRef(null);
  const labelRef = useRef(null);
  const [lr, setLr] = useState({ l: 22, r: 78 });
  const [imgBroken, setImgBroken] = useState(false);
  const imageSrc = resolveQuickImageUrl(cat.image);

  const measure = () => {
    if (!isActive || !colRef.current || !labelRef.current) return;
    const col = colRef.current.getBoundingClientRect();
    const lab = labelRef.current.getBoundingClientRect();
    if (col.width < 4) return;
    const pad = 5;
    const l = Math.max(0, ((lab.left - col.left - pad) / col.width) * 100);
    const r = Math.min(100, ((lab.right - col.left + pad) / col.width) * 100);
    if (r - l > 6) setLr({ l, r });
  };

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (colRef.current) ro.observe(colRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isActive, cat.name]);

  const pathD = isActive ? buildActiveTabPath(lr.l, lr.r) : "";

  return (
    <motion.div
      ref={colRef}
      layout
      whileTap={{ scale: 0.96 }}
      transition={{
        layout: { type: 'spring', stiffness: 520, damping: 38, mass: 0.55 },
      }}
      onClick={() => onCategorySelect && onCategorySelect(cat)}
      className={cn(
        "relative z-[2] flex min-w-[48px] shrink-0 cursor-pointer flex-col items-center gap-0.5 border-b-2 px-2 pb-0.5 pt-0.5 snap-start md:min-w-[58px] transition-all duration-300",
        isActive ? "border-black" : "border-transparent"
      )}
    >
      <div className="relative z-10 flex h-9 w-9 items-center justify-center md:h-11 md:w-11">
        {cat.id === 'all' || cat._id === 'all' ? (
          <LayoutGrid 
            className={cn("h-5 w-5 md:h-6 md:w-6 transition-colors", isActive ? "text-black scale-110" : "text-gray-400")} 
          />
        ) : imageSrc && !imgBroken ? (
          <img
            src={imageSrc}
            alt={cat.name}
            className={cn("h-6 w-6 object-contain md:h-8 md:w-8 transition-all", isActive ? "opacity-100 scale-110 drop-shadow-sm" : "opacity-70 grayscale-[0.5]")}
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-black uppercase text-gray-500 md:h-6 md:w-6 md:text-[11px]">
            {(cat.name || '?').charAt(0)}
          </div>
        )}
      </div>
      <div className="relative mt-px w-full">
        <span
          ref={labelRef}
          className={cn(
            "relative z-10 mx-auto block max-w-[72px] truncate px-1 pb-0.5 text-center text-[8px] uppercase tracking-tight md:max-w-[88px] md:text-[10px] transition-all",
            isActive ? "font-black text-black" : "font-semibold text-gray-500",
          )}
        >
          {cat.name}
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="active-nav-glow"
          className="absolute inset-0 bg-black/5 rounded-xl -z-10 blur-md"
        />
      )}
    </motion.div>
  );
}

export default function QuickHeader({ showSearch = true, activeCategory = null, categories = [], onCategorySelect, isEmbedded = false, isInline = false }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { scrollY } = useScroll();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  if (isEmbedded) {
    return (
      <div className="relative z-10 bg-black/80 backdrop-blur-xl border-b border-white/10 px-2 pt-0 pb-0.5">
        <motion.div
            layout
            className="relative flex items-end md:justify-center gap-0 overflow-x-auto no-scrollbar snap-x min-h-[60px] md:min-h-[76px] pb-0.5">
            {categories.slice(0, 10).map((cat) => {
              const isActive = (activeCategory?._id || activeCategory?.id) === (cat._id || cat.id);
              return (
                <CategoryNavColumn
                  key={cat._id || cat.id}
                  cat={cat}
                  isActive={isActive}
                  categoryAccent="#ffffff"
                  onCategorySelect={onCategorySelect}
                />
              );
            })}
        </motion.div>
      </div>
    );
  }

  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // Search Logic
  const handleSearchClick = () => {
    navigate(getQuickSearchPath(pathname));
  };

  const handleVoiceSearch = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        navigate(getQuickSearchPath(pathname), { state: { query: transcript } });
      }
    };
    recognition.start();
  };

  // Search placeholder animation
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search ");
  const [isListening, setIsListening] = useState(false);
  const [typingState, setTypingState] = useState({
    textIndex: 0,
    charIndex: 0,
    isDeleting: false,
    isPaused: false,
  });

  const staticText = "Search ";
  const typingPhrases = ['"milk, atta, chips..."', '"bread, butter..."', '"fruits, vegetables..."', '"eggs, dairy..."', '"chocolates, snacks..."'];

  useEffect(() => {
    const { textIndex, charIndex, isDeleting, isPaused } = typingState;
    const currentPhrase = typingPhrases[textIndex];

    if (isPaused) {
      const timeout = setTimeout(() => {
        setTypingState(prev => ({ ...prev, isPaused: false, isDeleting: true }));
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentPhrase.length) {
          setSearchPlaceholder(staticText + currentPhrase.substring(0, charIndex + 1));
          setTypingState(prev => ({ ...prev, charIndex: prev.charIndex + 1 }));
        } else {
          setTypingState(prev => ({ ...prev, isPaused: true }));
        }
      } else {
        if (charIndex > 0) {
          setSearchPlaceholder(staticText + currentPhrase.substring(0, charIndex - 1));
          setTypingState(prev => ({ ...prev, charIndex: prev.charIndex - 1 }));
        } else {
          setTypingState(prev => ({ 
            ...prev, 
            isDeleting: false, 
            textIndex: (prev.textIndex + 1) % typingPhrases.length 
          }));
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [typingState]);

  // Smooth scroll interpolations
  const headerTopPadding = useTransform(scrollY, [0, 160], [16, 12]);
  const headerBottomPadding = useTransform(scrollY, [0, 160], [4, 3]);
  const headerRoundness = useTransform(scrollY, [0, 160], [0, 24]);
  const bgOpacity = useTransform(scrollY, [0, 160], [1, 0.98]);

  // Content animations
  const contentHeight = useTransform(scrollY, [0, 160], ["64px", "0px"]);
  const contentOpacity = useTransform(scrollY, [0, 160], [1, 0]);
  const navHeight = useTransform(scrollY, [0, 200], ["60px", "0px"]);
  const navOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const navMargin = useTransform(scrollY, [0, 200], [4, 0]);
  const categorySpacing = useTransform(scrollY, [0, 200], [3, 0]);

  const displayContent = useTransform(scrollY, (value) => value > 160 ? "none" : "block");
  const displayNav = useTransform(scrollY, (value) => value > 200 ? "none" : "flex");

  const baseHeaderColor = activeCategory?.headerColor || "#0c831f";
  const headerGradient = buildHeaderGradient(baseHeaderColor);
  const searchBarBg = buildSearchBarBackgroundColor(baseHeaderColor);
  const categoryAccent = "#ffffff";

  return (
    <div className={cn("left-0 right-0 z-50", isInline ? "relative" : "fixed top-0")}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          paddingTop: headerTopPadding,
          paddingBottom: headerBottomPadding,
          borderBottomLeftRadius: headerRoundness,
          opacity: bgOpacity,
          backgroundColor: "#ffffff",
        }}
        className="px-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300">
        
        {/* Subtle Glow Overlay */}
        <div className="absolute inset-0 bg-white/8 pointer-events-none" />

        {/* Desktop/Tablet Header Layout (md and above) */}
        <div className="hidden md:flex items-center justify-between relative z-20 px-2 lg:px-6 mb-4 mt-1">
          {/* Left Section: Logo + Location row */}
          <div className="flex items-center gap-4 lg:gap-8">
            <div
              onClick={() => navigate(getQuickHomePath(pathname))}
              className="flex items-center gap-3 cursor-pointer group shrink-0">
              <div className="group-hover:scale-110 transition-all duration-300 drop-shadow-sm">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </div>

            {/* Location Block (Desktop inline row) */}
            <div className="flex flex-col border-l border-gray-200 pl-4 lg:pl-8 h-10 justify-center">
              <div className="flex items-center gap-1.5 opacity-70">
                <AccessTimeIcon sx={{ fontSize: 13, color: "#333333" }} />
                <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest leading-none">
                  Delivery in 10 mins
                </span>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-black hover:text-gray-700 cursor-pointer group active:scale-95 transition-all border-0 bg-transparent p-0 text-left">
                <LocationOnIcon sx={{ fontSize: 18, color: "#0c831f" }} />
                <div className="text-[13px] font-bold leading-tight max-w-[250px] lg:max-w-[320px] truncate">
                  Home - Gurgaon, Haryana
                </div>
                <ChevronDownIcon
                  sx={{ fontSize: 12, opacity: 0.5, color: "#000000" }}
                />
              </button>
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className="flex-1 max-w-[450px] lg:max-w-2xl px-6">
            <motion.div
              onClick={handleSearchClick}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{ backgroundColor: "#f3f4f6" }}
              className="rounded-full px-4 h-11 shadow-sm flex items-center border border-gray-200 transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-300 cursor-pointer">
              <SearchIcon sx={{ color: "#6b7280", fontSize: 20 }} />
              <div className="flex-1 min-w-0 pl-2 text-gray-800 font-semibold flex items-center">
                   <span className="block truncate opacity-80 text-[15px]">{searchPlaceholder}</span>
              </div>
              <div className="shrink-0 flex items-center gap-2 border-l border-gray-300 pl-3">
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    isListening ? "bg-white text-[#0c831f] scale-110 animate-pulse" : "text-gray-500 hover:bg-gray-200"
                  )}
                >
                  <MicIcon sx={{ color: "inherit", fontSize: 20 }} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Section: Action Icons */}
          <div className="flex items-center gap-5 lg:gap-8 shrink-0">
            <motion.button
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(getQuickWishlistPath(pathname))}
              className="text-black hover:text-gray-700 transition-all">
              <FavoriteBorderOutlinedIcon sx={{ fontSize: 24 }} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(getQuickCartPath(pathname))}
              className="flex items-center gap-2 rounded-2xl bg-[#f8cb46] px-4 py-2.5 text-[#111] shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 active:scale-95"
            >
              <div className="relative">
                <ShoppingCartOutlinedIcon sx={{ fontSize: 20 }} />
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-tight">View Cart</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(getQuickWalletPath())}
              className="text-black lg:bg-gray-100 p-1.5 lg:rounded-full hover:bg-gray-200 transition-all transform"
              aria-label="Open wallet">
              <Wallet className="h-7 w-7" />
            </motion.button>
          </div>
        </div>

        {/* Collapsible Delivery Info & Location (MOBILE ONLY) */}
        <div className="md:hidden">
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
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-gray-800">
                Blinkit
              </span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <AccessTimeIcon sx={{ fontSize: 16, color: "#333333" }} />
                  <span className="text-base font-bold text-black tracking-tight leading-none">
                    10 mins
                  </span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-800 cursor-pointer group active:scale-95 transition-transform border-0 bg-transparent p-0 text-left">
                  <LocationOnIcon sx={{ fontSize: 16, color: "#0c831f" }} />
                  <div className="text-[10px] font-medium leading-tight max-w-[280px] truncate">
                    Home - Gurgaon, Haryana
                  </div>
                  <ChevronDownIcon
                    sx={{ fontSize: 12, opacity: 0.5, color: "#000000" }}
                  />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(getQuickWalletPath())}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-black shadow-sm transition-all"
                aria-label="Open wallet"
              >
                <Wallet className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Search Bar (MOBILE ONLY) */}
        <div className="relative z-10 mt-[1.5px] flex items-center gap-2 md:hidden">
          <motion.div
            onClick={handleSearchClick}
            whileTap={{ scale: 0.98 }}
            style={{ backgroundColor: "#f3f4f6" }}
            className="flex-1 rounded-[10px] px-3 h-10 shadow-sm flex items-center border border-gray-200 transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-300 cursor-pointer">
            <SearchIcon sx={{ color: "#6b7280", fontSize: 18 }} />
            <div className="flex-1 min-w-0 pl-2 text-gray-800 font-semibold">
                <span className="block truncate opacity-80 text-[14px]">{searchPlaceholder}</span>
            </div>
            <div className="shrink-0 flex items-center gap-2 border-l border-gray-300 pl-2.5">
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={cn(
                  "p-1 rounded-full transition-all",
                  isListening ? "bg-white text-[#0c831f] scale-110 animate-pulse" : "text-gray-500 hover:bg-gray-200"
                )}
              >
                <MicIcon sx={{ color: "inherit", fontSize: 18 }} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Categories Navigation - Smooth Collapse */}
        {categories.length > 0 && (
          <motion.div
            layout
            transition={{
              layout: {
                type: 'spring',
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
            className="relative flex items-end md:justify-center gap-0 overflow-x-auto no-scrollbar -mx-2 px-2 md:mx-0 md:px-0 z-10 snap-x pt-1 min-h-[60px] md:min-h-[76px] pb-0.5">
            {categories.slice(0, 10).map((cat) => {
              const isActive = (activeCategory?._id || activeCategory?.id) === (cat._id || cat.id);
              return (
                <CategoryNavColumn
                  key={cat._id || cat.id}
                  cat={cat}
                  isActive={isActive}
                  categoryAccent={categoryAccent}
                  onCategorySelect={onCategorySelect}
                />
              );
            })}
          </motion.div>
        )}

        {/* Background Decorative patterns */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
      </motion.div>
    </div>
  );
}
