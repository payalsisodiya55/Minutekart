import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import {
  Navigation,
  ChevronDown,
  Search,
  Mic,
  Bookmark,
  Wallet,
  Bell,
  BellOff,
  ShoppingCart,
  User,
  X,
  Pizza,
  Beef,
  ChefHat,
  Soup,
  Coffee,
  Milk,
  Home,
  Briefcase,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@food/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@food/components/ui/popover";
import { Badge } from "@food/components/ui/badge";
import foodPattern from "@food/assets/food_pattern_background.png";
import useNotificationInbox from "@food/hooks/useNotificationInbox";
import geminiWalletImage from "@/assets/wallet_1.png";
import { FOOD_THEME_COLOR, FOOD_THEME_HOVER, FOOD_VEG_COLOR } from "@food/constants/theme";
import { useProfile } from "@food/context/ProfileContext";

const tabs = [
  {
    id: "food",
    name: "Food",
    icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
  },
  {
    id: "quick",
    name: "Instamart",
    icon: "https://cdn-icons-png.flaticon.com/512/3724/3724720.png",
    badge: "15 mins",
  },
  /* {
    id: "milk",
    name: "ChotuuDudhwala",
    icon: "https://cdn-icons-png.flaticon.com/512/933/933854.png",
  }, */
];

const normalizeHex = (hex, fallback = "#8e24aa") => {
  const value = String(hex || "").trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
};

const withAlpha = (hex, alpha) => {
  const value = normalizeHex(hex).slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const quickTheme = (baseColor) => {
  const base = normalizeHex(baseColor, "#379702");
  return {
    topBg: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 100%), ${withAlpha(base, 0.82)}`,
    accent: base,
    text: "#ffffff",
    activeBg: base,
    activeText: "#ffffff",
    inactiveBg: "rgba(0,0,0,0.3)",
    inactiveBorder: "rgba(255,255,255,0.08)",
  };
};

const foodTheme = (vegMode) => {
  const base = vegMode ? "#379702" : FOOD_THEME_COLOR;
  return {
    topBg: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 100%), ${withAlpha(base, 0.82)}`,
    accent: base,
    text: "#ffffff",
    activeBg: base,
    activeText: "#ffffff",
    inactiveBg: "rgba(0,0,0,0.25)",
    inactiveBorder: "rgba(255,255,255,0.08)",
  };
};

const milkTheme = () => {
  const base = "#0ea5e9"; // Dairy themed light blue
  return {
    topBg: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 100%), ${withAlpha(base, 0.82)}`,
    accent: base,
    text: "#ffffff",
    activeBg: base,
    activeText: "#ffffff",
    inactiveBg: "rgba(0,0,0,0.25)",
    inactiveBorder: "rgba(255,255,255,0.08)",
  };
};

const isMeaningfulLocationValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized &&
    normalized !== "select location" &&
    normalized !== "current location"
  );
};

const buildLocationDisplay = (savedAddressText, location) => {
  if (isMeaningfulLocationValue(savedAddressText)) {
    const parts = String(savedAddressText)
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
      title: String(savedAddressText).trim(),
      subtitle: "Tap to choose delivery location",
    };
  }

  const fallbackTitle =
    location?.area || location?.city || "Select Location";
  const fallbackSubtitle =
    location?.address || location?.city || "Tap to choose delivery location";

  return {
    title: fallbackTitle,
    subtitle: fallbackSubtitle,
  };
};

export default function HomeHeader({
  activeTab,
  setActiveTab,
  location,
  savedAddressText,
  handleLocationClick,
  handleSearchFocus,
  placeholderIndex,
  placeholders,
  vegMode = false,
  onVegModeChange,
  headerVideoUrl,
  headerImages = [],
  quickThemeColor,
  onQuickTabIntent,
  bannerComponent,
  hideExtras = false,
  disableSticky = false,
}) {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const routerLocation = useRouterLocation();
  
  const { userProfile } = useProfile();
  
  const avatarInitial =
    userProfile?.name?.charAt(0)?.toUpperCase() ||
    userProfile?.phone?.charAt(1)?.toUpperCase() ||
    "";

  const profileImageUrl =
    userProfile?.profileImage &&
    (typeof userProfile.profileImage === "string"
      ? userProfile.profileImage.trim()
      : userProfile.profileImage?.url);
  const videoRef = useRef(null);
  const { scrollY } = useScroll();
  const [isSticky, setIsSticky] = useState(false);

  const slides = useMemo(() => {
    const list = [];
    if (headerVideoUrl) {
      list.push({ type: "video", url: headerVideoUrl });
    }
    if (Array.isArray(headerImages)) {
      headerImages.forEach((img) => {
        if (img) list.push({ type: "image", url: img });
      });
    }
    return list;
  }, [headerVideoUrl, headerImages]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      if (latest > 120 && !isSticky) setIsSticky(true);
      else if (latest <= 120 && isSticky) setIsSticky(false);
    });
  }, [scrollY, isSticky]);

  const [notifications, setNotifications] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("food_user_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const {
    items: broadcastNotifications,
    unreadCount: broadcastUnreadCount,
    dismiss: dismissBroadcastNotification,
  } = useNotificationInbox("user", { limit: 20 });

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("food_user_notifications");
      setNotifications(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener("notificationsUpdated", sync);
    return () => window.removeEventListener("notificationsUpdated", sync);
  }, []);

  const theme = useMemo(() => {
    if (activeTab === "quick") return quickTheme(quickThemeColor);
    if (activeTab === "milk") return milkTheme();
    return foodTheme(vegMode);
  }, [activeTab, quickThemeColor, vegMode]);
  const isFood = activeTab === "food";
  const walletPath = isFood ? "/food/user/wallet" : "/quick/wallet";
  const displayLabel = useMemo(() => {
    if (savedAddressText === "All Categories") return "All Categories";
    const lbl = String(location?.label || "").trim().toLowerCase();
    if (lbl.includes("home")) return "Home";
    if (lbl.includes("office") || lbl.includes("work")) return "Office";
    if (lbl.includes("other")) return "Other";
    return location?.label || location?.area || location?.city || "Location";
  }, [location, savedAddressText]);

  const locationSubtitleText = useMemo(() => {
    if (savedAddressText === "All Categories") return "Tap to choose delivery location";
    if (!savedAddressText || savedAddressText === "Select Location") {
      return location?.address || location?.city || "Tap to choose delivery location";
    }
    return savedAddressText;
  }, [savedAddressText, location]);

  const getHeaderAddressIcon = (label) => {
    const l = String(label || "").toLowerCase();
    if (l.includes("home")) return Home;
    if (l.includes("office") || l.includes("work")) return Briefcase;
    return Navigation;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentSlide = slides[currentSlideIndex];
    if (isFood && currentSlide?.type === "video") {
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => { });
      }
      return;
    }

    video.pause();
  }, [isFood, currentSlideIndex, slides]);

  const mergedNotifications = useMemo(() => {
    const localItems = Array.isArray(notifications)
      ? notifications.map((item) => ({ ...item, source: "local" }))
      : [];
    const remoteItems = (broadcastNotifications || []).map((item) => ({
      ...item,
      id: item.id || item._id,
      source: "broadcast",
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        : "Just now",
    }));
    return [...remoteItems, ...localItems].sort(
      (a, b) =>
        new Date(b.createdAt || b.timestamp || 0).getTime() -
        new Date(a.createdAt || a.timestamp || 0).getTime(),
    );
  }, [broadcastNotifications, notifications]);

  const unreadCount =
    notifications.filter((item) => !item.read).length + broadcastUnreadCount;

  const removeNotification = (id, source) => {
    if (source === "broadcast") {
      dismissBroadcastNotification(id);
      return;
    }
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem("food_user_notifications", JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
      return next;
    });
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
        if (activeTab === "quick") {
          navigate("/quick/search", { state: { query: transcript } });
        } else {
          // For food search, we might need to trigger the overlay or redirect to a dedicated search page
          // Based on Home.jsx, it opens an overlay. But we can redirect to the search page if available.
          navigate("/food/user/search", { state: { query: transcript } });
        }
      }
    };
    recognition.start();
  };

  return (
    <motion.div
      className={`relative transition-all duration-400 ${isFood
          ? "rounded-b-[36px] min-h-[345px] overflow-hidden"
          : "rounded-b-none min-h-[88px] overflow-visible"
        }`}
      style={{ background: theme.topBg, color: theme.text }}
    >
      {isFood && slides.length > 0 && (
        <div className="absolute inset-x-0 top-0 bottom-0 z-0 flex justify-center overflow-hidden">
          <AnimatePresence initial={false}>
            {slides.map((slide, index) => {
              if (index !== currentSlideIndex) return null;
              return (
                <motion.div
                  key={`${slide.url}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {slide.type === "video" ? (
                    <video
                      ref={videoRef}
                      src={slide.url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                      className={`h-full w-full object-cover object-center transition-opacity duration-200 ${
                        isFood ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ) : (
                    <img
                      src={slide.url}
                      alt="Banner"
                      className={`h-full w-full object-cover object-center transition-opacity duration-200 ${
                        isFood ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div
            className="absolute inset-0 transition-colors duration-700"
            style={{
              background: `linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.0) 100%)`
            }}
          />
          <div
            className="absolute inset-0 transition-colors duration-700 opacity-30"
            style={{
              background: `radial-gradient(circle at 20% 30%, ${withAlpha(theme.accent, 0.4)}, transparent 70%)`
            }}
          />
          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-sm">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-350 cursor-pointer ${
                    idx === currentSlideIndex 
                      ? "w-4 bg-white" 
                      : "w-1.5 bg-white/45 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}



      <div className="flex items-center justify-between px-5 pt-5 mb-2 relative z-10">
        <button
          type="button"
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 bg-transparent border-0 p-0 text-left outline-none"
          onClick={handleLocationClick}
        >
          <>
            {(() => {
              const IconComponent = getHeaderAddressIcon(displayLabel);
              return (
                <div className="h-[38px] w-[38px] rounded-full bg-[#ffc20e] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                  <IconComponent 
                    className="h-[19px] w-[19px] text-[#1a1a1a]" 
                    strokeWidth={2.5} 
                    fill={IconComponent === Navigation ? "currentColor" : "none"} 
                  />
                </div>
              );
            })()}
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-[3px]">
                <span className="truncate text-[16px] font-extrabold tracking-[-0.3px] text-white">
                  {displayLabel}
                </span>
                <ChevronDown className="h-[14px] w-[14px] shrink-0 opacity-85 text-white" strokeWidth={3} />
              </div>
              <span className="truncate text-[11px] font-medium text-white/75 max-w-[200px] sm:max-w-[260px]">
                {locationSubtitleText}
              </span>
            </div>
          </>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {!hideExtras && (
            <>
              <Link
                to={walletPath}
                className="h-[38px] w-[38px] rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                aria-label="Open wallet"
              >
                <img src={geminiWalletImage} alt="Wallet" className="h-[24px] w-[24px] object-contain" />
              </Link>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative h-[38px] w-[38px] rounded-full bg-white/95 border border-white/60 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              >
                <Bell className="h-[18px] w-[18px] text-[#282c3f]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-yellow-400 border border-white" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden border-none shadow-2xl rounded-2xl mt-2" align="end">
              <div className="bg-white">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-600 border-none text-[10px] h-4">
                        {unreadCount} New
                      </Badge>
                    )}
                  </h3>
                  <Link to="/food/user/notifications" className="text-xs font-bold text-red-600">
                    {mergedNotifications.length > 0 ? "View All" : ""}
                  </Link>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {mergedNotifications.length > 0 ? (
                    mergedNotifications.slice(0, 5).map((item, index) => (
                      <div key={item.id || `notif-${index}`} className="p-4 flex items-start gap-3 border-b border-gray-50 last:border-0">
                        <div className="mt-1 p-2 rounded-full bg-red-100/50 text-red-600">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-bold text-gray-900 truncate">{item.title}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">{item.time}</span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  removeNotification(item.id, item.source);
                                }}
                                className="rounded-full p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                      <BellOff className="h-10 w-10 text-gray-200" />
                      <p className="text-xs text-gray-400 font-medium">All caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Link
            to="/profile?from=food"
            className="h-[38px] w-[38px] rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden"
            aria-label="Open profile"
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : avatarInitial ? (
              <div className="h-full w-full flex items-center justify-center bg-red-100 text-red-600 text-[18px] font-medium leading-none">
                {avatarInitial}
              </div>
            ) : (
              <User className="h-[20px] w-[20px] text-[#282c3f]" strokeWidth={2} />
            )}
          </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs removed as requested
      <div className="px-3 pt-1 flex items-end justify-start gap-1 relative z-10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const handleTabIntent = () => {
            if (tab.id === "quick") {
              onQuickTabIntent?.();
            }
          };
          const handleTabClick = () => {
            if (tab.route) {
              const redirectTo =
                `${routerLocation.pathname || "/food/user"}${routerLocation.search || ""}${routerLocation.hash || ""}`;
              navigate(tab.route, { state: { redirectTo } });
              return;
            }
            setActiveTab(tab.id);
          };
          return (
            <button
              key={tab.id}
              onClick={handleTabClick}
              onMouseEnter={handleTabIntent}
              onTouchStart={handleTabIntent}
              onFocus={handleTabIntent}
              className={`relative flex flex-col items-center justify-start flex-1 min-w-0 h-[64px] transition-all duration-300 ${isActive ? "z-20" : "z-10"}`}
            >
              {tab.badge && (
                <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 z-30 rounded-full bg-gradient-to-r from-red-500 to-red-400 px-2 py-0.5 text-[7.5px] font-black uppercase text-white shadow-lg">
                  {tab.badge}
                </div>
              )}

              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-all duration-300",
                  isActive ? "top-0 rounded-t-[20px]" : "top-[10px] rounded-t-[16px]"
                )}
                style={{
                  background: isActive ? theme.activeBg : theme.inactiveBg,
                  borderTop: isActive ? `1px solid ${withAlpha(theme.accent, 0.1)}` : `1px solid ${theme.inactiveBorder}`,
                  boxShadow: isActive ? "0 -4px 20px rgba(0,0,0,0.12)" : "none",
                  backdropFilter: isActive ? undefined : "blur(12px)",
                }}
              >
                {isActive && (
                  <>
                    <div
                      className="absolute bottom-0 -left-[14px] w-[14px] h-[14px] pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 0 0, transparent 14px, ${theme.activeBg} 0)`
                      }}
                    />
                    <div
                      className="absolute bottom-0 -right-[14px] w-[14px] h-[14px] pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 100% 0, transparent 14px, ${theme.activeBg} 0)`
                      }}
                    />
                  </>
                )}
              </div>

              <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-center gap-[4px] px-1 ${isActive ? "top-0" : "top-[10px]"}`}>
                {tab.id === 'milk' ? (
                  <Milk
                    className={`transition-transform duration-300 ${isActive ? "h-[28px] w-[28px] scale-110 text-white" : "h-[24px] w-[24px] brightness-0 invert opacity-80"}`}
                  />
                ) : (
                  <img
                    src={tab.icon}
                    alt={tab.name}
                    className={`object-contain transition-transform duration-300 ${isActive ? "h-[28px] w-[28px] scale-110" : "h-[24px] w-[24px] brightness-0 invert opacity-80"}`}
                  />
                )}
                <span
                  style={{ color: "#ffffff" }}
                  className={`text-[10px] font-black tracking-tight ${isActive ? "opacity-100" : "opacity-80"}`}
                >
                  {tab.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      */}

      <div className={cn("relative z-10 pb-0 px-3 overflow-visible", isFood ? "pt-3" : "pt-0")}>
        {isFood && (isSticky && !disableSticky) && <div className="h-[46px] mb-2" />}
        {isFood && !hideExtras && (
          <div 
            className={cn("flex items-center gap-2 mb-2", 
              (isSticky && !disableSticky) ? "fixed top-0 left-0 right-0 z-[100] px-4 py-2 pb-3 shadow-md backdrop-blur-xl border-b border-black/5 dark:border-white/5" : "relative w-full px-0"
            )}
            style={{ backgroundColor: (isSticky && !disableSticky) ? withAlpha(theme.accent, 0.85) : "transparent" }}
          >
            <div
              className="flex-1 rounded-full h-[48px] flex items-center px-4 cursor-pointer relative overflow-hidden bg-white shadow-[0_6px_18px_rgba(15,23,42,0.10)] border-0 text-left"
              onClick={handleSearchFocus}
            >
              <Search className="h-[18px] w-[18px] ml-1 mr-2 flex-shrink-0" style={{ color: theme.accent }} strokeWidth={2.3} />
              <div className="flex-1 overflow-hidden relative h-[20px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 whitespace-nowrap leading-[22px] text-[12.5px] font-medium text-gray-400"
                  >
                    {placeholders?.[placeholderIndex] || "Search for food..."}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "h-[28px] w-[28px] rounded-full flex items-center justify-center transition-all",
                    isListening ? "scale-110 animate-pulse" : ""
                  )}
                  style={{
                    backgroundColor: isListening ? theme.accent : withAlpha(theme.accent, 0.1),
                  }}
                >
                  <Mic className="h-[14px] w-[14px]" style={{ color: isListening ? '#ffffff' : theme.accent }} strokeWidth={2.3} />
                </button>
              </div>
            </div>

            <div className="px-2 flex flex-col items-center justify-center min-w-[64px]">
              <div className="flex flex-col items-center mb-1">
                <span className="text-[9px] font-black tracking-[0.5px] text-white leading-none">VEG</span>
                <span className="text-[7px] font-black tracking-[0.5px] text-white/70 leading-none mt-0.5">MODE</span>
              </div>
              <div className="scale-[0.80]">
                <Switch
                  checked={vegMode}
                  onCheckedChange={(checked) => onVegModeChange?.(checked)}
                  className="data-[state=checked]:bg-[#379702] data-[state=unchecked]:bg-gray-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {isFood && bannerComponent && (
        <div className="relative z-10 w-full pb-5 pt-1">
          {bannerComponent}
        </div>
      )}
    </motion.div>
  );
}
