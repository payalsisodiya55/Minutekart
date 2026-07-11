import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Heart, Minus, Plus, ChevronsDown, ChevronsUp, SlidersHorizontal, ArrowUpDown, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { cn } from '@/lib/utils';

import ProductDetailSheet from '../components/shared/ProductDetailSheet';
import { useProductDetail } from '../context/ProductDetailContext';
import { customerApi } from '../services/customerApi';
import MiniCart from '../components/shared/MiniCart';
import SectionRenderer from "../components/experience/SectionRenderer";
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useCartAnimation } from '../context/CartAnimationContext';
import { resolveQuickImageUrl } from '../utils/image';
import { useHeroTransition } from '../context/HeroTransitionContext';

const QUICK_THEME_STORAGE_KEY = "food.quick.headerColor";
const QUICK_HEADER_RETURN_STORAGE_KEY = "food.quick.headerReturn";
const FALLBACK_HEADER_COLOR = "#0c831f";

const normalizeId = (value) => {
    if (value == null) return null;
    if (typeof value === 'object') {
        return String(value._id || value.id || value.slug || '');
    }
    return String(value);
};

// Custom premium product card matching the 2nd reference image
const CategoryProductCard = ({ product }) => {
    const { cart, addToCart, updateQuantity } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { animateAddToCart, animateRemoveFromCart } = useCartAnimation();
    const { triggerHeroExpand } = useHeroTransition();
    const navigate = useNavigate();
    const [currentImgIdx, setCurrentImgIdx] = useState(0);
    const imageRef = React.useRef(null);
    const cardRef = React.useRef(null);

    // Intercept card tap: capture rect, trigger hero expand, then navigate
    const handleCardTap = (e) => {
        // Don't trigger hero if tapping wishlist button or add/quantity controls
        if (e.target.closest('button')) return;
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        triggerHeroExpand(
            rect,
            product,
            () => navigate(`/quick/product/${product.id}`, {
                state: { product, fromHero: true }
            })
        );
    };

    const allImages = React.useMemo(() => {
        const main = product.image || product.mainImage;
        const gallery = Array.isArray(product.galleryImages) ? product.galleryImages : [];
        const urls = [];
        if (main) urls.push(main);
        gallery.forEach(img => {
            const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl);
            if (url && url !== main) {
                urls.push(url);
            }
        });
        return urls;
    }, [product.image, product.mainImage, product.galleryImages]);
    
    const cartItem = cart.find(item => item.id === product.id || item.productId === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    const isWishlisted = isInWishlist(product.id || product._id);

    const displayPrice = product.price || product.salePrice;
    const originalPrice = product.originalPrice || product.mrp;
    const showDiscount = originalPrice && originalPrice > displayPrice;
    const discountPercent = showDiscount ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

    return (
        <div
            ref={cardRef}
            onClick={handleCardTap}
            className="flex flex-col bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 rounded-[14px] pt-1 px-1.5 md:px-2 pb-2 relative group select-none shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] h-full justify-between cursor-pointer active:scale-[0.97]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            {/* Top section: Time badge & Wishlist */}
            <div className="flex items-center justify-between mb-0.5">
                <div className="bg-[#E5F7ED] dark:bg-emerald-950/40 text-[#0c831f] dark:text-emerald-400 font-bold text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-[4px] inline-flex items-center justify-center leading-tight">
                    {product.deliveryTime || "10-15 mins"}
                </div>
                <button
                    onClick={() => toggleWishlist(product)}
                    className="w-5 h-5 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                >
                    <Heart
                        size={15}
                        className={cn(
                            isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                        )}
                    />
                </button>
            </div>

            {/* Product Image */}
            <div ref={imageRef} className="relative w-full h-[98px] md:h-[114px] bg-transparent flex items-center justify-center p-0 overflow-hidden mb-0.5">
                {allImages.length > 1 ? (
                    <div className="w-full h-full relative">
                        <div 
                            className="w-full h-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onScroll={(e) => {
                                const scrollLeft = e.currentTarget.scrollLeft;
                                const width = e.currentTarget.clientWidth;
                                if (width > 0) {
                                    const newIndex = Math.round(scrollLeft / width);
                                    if (newIndex !== currentImgIdx) {
                                        setCurrentImgIdx(newIndex);
                                    }
                                }
                            }}
                        >
                            {allImages.map((imgUrl, imgIdx) => (
                                <div 
                                    key={imgIdx} 
                                    className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-0"
                                >
                                    <img
                                        src={resolveQuickImageUrl(imgUrl) || imgUrl}
                                        alt={`${product.name} - ${imgIdx + 1}`}
                                        className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal transform group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Dot Indicators */}
                        <div className="absolute bottom-0 left-2 flex items-center gap-1 z-10 pointer-events-none">
                            {allImages.map((_, dotIdx) => (
                                <div
                                    key={dotIdx}
                                    className={cn(
                                        "rounded-full transition-all duration-300",
                                        dotIdx === currentImgIdx
                                            ? "w-2.5 h-2.5 bg-white border border-[#8FA8B8] dark:border-neutral-500 shadow-sm"
                                            : "w-1.5 h-1.5 bg-[#8FA8B8] dark:bg-neutral-600"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <img
                        src={resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal transform group-hover:scale-105 transition-transform duration-300"
                    />
                )}
            </div>

            {/* Info and button section */}
            <div className="flex flex-col flex-1 justify-between text-left">
                <div>
                    {/* Name */}
                    <h3 className="text-[12px] md:text-[13px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
                        {product.name}
                    </h3>

                    {/* Weight / Unit */}
                    <div className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0">
                        {product.weight || "1 unit"}
                    </div>
                </div>

                <div>
                    {/* Price Line */}
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-[13px] md:text-[14px] font-extrabold text-slate-900 dark:text-white leading-none">
                            ₹{displayPrice}
                        </span>
                        {showDiscount && (
                            <>
                                <span className="text-[10px] md:text-[11px] text-slate-400 line-through font-semibold">
                                    ₹{originalPrice}
                                </span>
                                <span className="text-[10px] md:text-[11px] text-[#0c831f] font-bold">
                                    {discountPercent}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* ADD Button or Quantity Counter */}
                    <div className="mt-1">
                        {quantity === 0 ? (
                            <button
                                onClick={() => {
                                    addToCart(product);
                                    if (imageRef.current) {
                                        const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
                                        animateAddToCart(imageRef.current.getBoundingClientRect(), resolvedSrc);
                                    }
                                }}
                                className="w-full bg-white dark:bg-neutral-800 border border-[#0c831f] text-[#0c831f] font-black text-[12px] h-[26px] rounded-[8px] shadow-sm hover:bg-[#0c831f]/5 active:scale-95 transition-all cursor-pointer flex items-center justify-center uppercase"
                            >
                                ADD
                            </button>
                        ) : (
                            <div className="w-full flex items-center justify-between bg-[#0c831f] text-white rounded-[8px] shadow-sm overflow-hidden h-[26px]">
                                <button
                                    onClick={() => {
                                        if (imageRef.current) {
                                            const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
                                            animateRemoveFromCart(imageRef.current.getBoundingClientRect(), resolvedSrc);
                                        }
                                        updateQuantity(product.id, -1);
                                    }}
                                    className="px-3 h-full flex items-center justify-center hover:bg-[#096317] active:scale-90 transition-transform"
                                >
                                    <Minus size={9} strokeWidth={3} />
                                </button>
                                <span className="text-[11px] font-black min-w-[14px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => {
                                        if (imageRef.current) {
                                            const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
                                            animateAddToCart(imageRef.current.getBoundingClientRect(), resolvedSrc);
                                        }
                                        updateQuantity(product.id, 1);
                                    }}
                                    className="px-3 h-full flex items-center justify-center hover:bg-[#096317] active:scale-90 transition-transform"
                                >
                                    <Plus size={9} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Custom premium transition separating sheet banner
const TransitionBanner = ({ direction, name, icon, arrowRef }) => {
    const isUp = direction === 'up';
    return (
        <div className="w-full flex flex-col items-center pt-8 pb-7 bg-[#F4FCF3] dark:bg-emerald-950/10 border-t border-emerald-100/50 dark:border-emerald-900/20 rounded-t-3xl border-b border-b-slate-100/30">
            <div
                ref={arrowRef}
                className="text-[#0c831f] mb-1 flex flex-col items-center opacity-60 transition-transform duration-75"
                style={{ transform: 'scale(0.8) translateY(0px)' }}
            >
                {isUp ? (
                    <ChevronsUp size={28} strokeWidth={3} className="animate-pulse" />
                ) : (
                    <ChevronsDown size={28} strokeWidth={3} className="animate-pulse" />
                )}
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#0c831f]/75 mb-1.5">
                {isUp ? "Pull Up for Next" : "Pull Down for Previous"}
            </span>

            <h4 className="text-[17px] font-extrabold text-slate-800 dark:text-white mb-4">
                {name || ""}
            </h4>

            <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center p-3 shadow-md">
                <img 
                    src={icon || 'https://cdn-icons-png.flaticon.com/128/2321/2321801.png'} 
                    alt="Category Icon" 
                    className="w-full h-full object-contain" 
                />
            </div>
        </div>
    );
};

const CategoryProductsPage = () => {
    const prevArrowRef = React.useRef(null);
    const nextArrowRef = React.useRef(null);
    const { categoryId: rawCatId } = useParams();
    const catId = normalizeId(rawCatId);
    const navigate = useNavigate();
    const location = useLocation();
    const { currentLocation } = useAppLocation();
    const initialSubcategoryId = normalizeId(location.state?.activeSubcategoryId) || 'all';
    const { isOpen: isProductDetailOpen } = useProductDetail();
    
    // Core Layout States
    const [selectedSubCategory, setSelectedSubCategory] = useState(initialSubcategoryId);
    const [category, setCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([{ id: 'all', name: 'All', icon: 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [headerTheme, setHeaderTheme] = useState(FALLBACK_HEADER_COLOR);
    const [mainCategories, setMainCategories] = useState([]);
    const [experienceSections, setExperienceSections] = useState([]);
    const [heroConfig, setHeroConfig] = useState(null);
    const [categoryMap, setCategoryMap] = useState({});
    const [subcategoryMap, setSubcategoryMap] = useState({});

    // Filter and Sort States
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedSort, setSelectedSort] = useState('default');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedPriceRange, setSelectedPriceRange] = useState('all');

    // Caching & Deduplication Layer
    const categoryCacheRef = React.useRef({});
    const promisesCacheRef = React.useRef({});
    
    // Scroll state preservation map
    const scrollPositionsRef = React.useRef({});

    // Gesture Animation States & Refs
    const [activeTransition, setActiveTransition] = useState({
        active: false,
        direction: null,
        prevPanel: null,
        nextPanel: null
    });

    const dragStartRef = React.useRef(null);
    const isDraggingRef = React.useRef(false);
    const gestureActiveRef = React.useRef(false);
    const gestureDirectionRef = React.useRef(null);
    const gestureStartRef = React.useRef(null);

    const animationContainerRef = React.useRef(null);
    const currentPanelScrollRef = React.useRef(null);
    const currentPanelRef = React.useRef(null);
    const prevPanelRef = React.useRef(null);
    const nextPanelRef = React.useRef(null);

    // Retrieve header theme on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedTheme = window.sessionStorage.getItem(QUICK_THEME_STORAGE_KEY);
        const storedHeaderReturn = window.sessionStorage.getItem(QUICK_HEADER_RETURN_STORAGE_KEY);

        if (storedTheme && /^#[0-9a-fA-F]{6}$/.test(storedTheme)) {
            setHeaderTheme(storedTheme);
            return;
        }

        if (storedHeaderReturn) {
            try {
                const parsed = JSON.parse(storedHeaderReturn);
                if (parsed?.color && /^#[0-9a-fA-F]{6}$/.test(parsed.color)) {
                    setHeaderTheme(parsed.color);
                }
            } catch (error) {}
        }
    }, []);

    // Get categories mapping for SectionRenderer
    const buildCategoryMap = (allCats) => {
        const cMap = {};
        const sMap = {};
        const fullMap = {};
        
        const flatten = (items) => {
            items.forEach(item => {
                const itemId = normalizeId(item._id || item.id);
                if (itemId) fullMap[itemId] = item;
                if (item.slug) fullMap[String(item.slug)] = item;
                if (item.type === 'category') {
                    if (itemId) cMap[itemId] = item;
                    if (item.slug) cMap[String(item.slug)] = item;
                }
                else if (item.type === 'subcategory') {
                    if (itemId) sMap[itemId] = item;
                    if (item.slug) sMap[String(item.slug)] = item;
                }
                if (item.children && item.children.length > 0) flatten(item.children);
            });
        };
        flatten(allCats);
        setCategoryMap(cMap);
        setSubcategoryMap(sMap);
        return fullMap;
    };

    // Unified caching & fetching handler
    const getCategoryDataFromCacheOrFetch = async (targetCatId, forceFetch = false) => {
        if (!targetCatId) return null;
        const normId = normalizeId(targetCatId);

        const hasValidLocation =
            Number.isFinite(currentLocation?.latitude) &&
            Number.isFinite(currentLocation?.longitude);

        // Return from cache if available, not in loading placeholder state, and matches location availability
        if (!forceFetch && categoryCacheRef.current[normId] && !categoryCacheRef.current[normId].isLoading) {
            const cachedEntry = categoryCacheRef.current[normId];
            if (!hasValidLocation || cachedEntry.hasLocation) {
                return cachedEntry;
            }
        }

        // Return existing in-flight promise if available
        if (promisesCacheRef.current[normId]) {
            return promisesCacheRef.current[normId];
        }

        // Set placeholder loading state in cache
        if (!categoryCacheRef.current[normId]) {
            categoryCacheRef.current[normId] = {
                products: [],
                subCategories: [{ id: 'all', name: 'All', icon: 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }],
                category: null,
                experienceSections: [],
                heroConfig: null,
                isLoading: true,
                hasLocation: hasValidLocation
            };
        }

        const fetchPromise = (async () => {
            try {
                let allCats = mainCategories;
                if (!allCats || allCats.length === 0) {
                    const catRes = await customerApi.getCategories({ tree: true });
                    if (catRes?.data?.success) {
                        const results = catRes.data.results || catRes.data.result || [];
                        allCats = Array.isArray(results) ? results : [];
                        setMainCategories(allCats);
                    }
                }

                const [prodRes, expRes, heroRes] = await Promise.all([
                    hasValidLocation ? customerApi.getProducts({
                        categoryId: normId,
                        lat: currentLocation.latitude,
                        lng: currentLocation.longitude,
                    }).catch(() => null) : null,
                    customerApi.getExperienceSections({ pageType: 'header', headerId: normId }).catch(() => null),
                    customerApi.getHeroConfig({ pageType: 'header', headerId: normId }).catch(() => null)
                ]);

                let productsList = [];
                if (prodRes?.data?.success) {
                    const rawResult = prodRes.data.result;
                    const dbProds = Array.isArray(prodRes.data.results)
                        ? prodRes.data.results
                        : Array.isArray(rawResult?.items)
                            ? rawResult.items
                            : Array.isArray(rawResult)
                                ? rawResult
                                : [];

                    productsList = dbProds.map(p => ({
                        ...p,
                        id: p._id,
                        image: p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
                        price: p.salePrice || p.price,
                        originalPrice: p.price,
                        weight: p.weight || "1 unit",
                        deliveryTime: "8-15 mins"
                    }));
                }

                let targetCategory = null;
                let subCategoriesList = [{ id: 'all', name: 'All', icon: 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }];

                if (allCats && allCats.length > 0) {
                    const fullMap = buildCategoryMap(allCats);
                    targetCategory = fullMap[normId];
                    if (targetCategory) {
                        let subs = [];
                        if (targetCategory.children && targetCategory.children.length > 0) {
                            subs = targetCategory.children;
                        } else if (targetCategory.parentId) {
                            const parentIdStr = normalizeId(targetCategory.parentId?._id || targetCategory.parentId);
                            const parent = fullMap[parentIdStr];
                            if (parent) {
                                subs = parent.children && parent.children.length > 0
                                    ? parent.children
                                    : allCats.filter(cat => normalizeId(cat.parentId?._id || cat.parentId) === parentIdStr);
                            }
                        }

                        const formattedSubs = subs.map(s => ({
                            id: normalizeId(s._id || s.id),
                            name: s.name,
                            icon: s.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321801.png',
                            banner: s.banner || '',
                            sortOrder: Number(s.sortOrder || 0),
                        })).sort((a, b) => a.sortOrder - b.sortOrder);
                        subCategoriesList = [{ id: 'all', name: 'All', icon: targetCategory.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }, ...formattedSubs];
                    }
                }

                const data = {
                    products: productsList,
                    subCategories: subCategoriesList,
                    category: targetCategory,
                    experienceSections: expRes?.data?.success ? (expRes.data.result || expRes.data.results || []) : [],
                    heroConfig: heroRes?.data?.success ? heroRes.data.result : null,
                    isLoading: false,
                    hasLocation: hasValidLocation
                };

                categoryCacheRef.current[normId] = data;
                return data;
            } catch (err) {
                console.error("Error preloading category details:", err);
                const errorData = {
                    products: [],
                    subCategories: [{ id: 'all', name: 'All', icon: 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }],
                    category: null,
                    experienceSections: [],
                    heroConfig: null,
                    isLoading: false,
                    hasLocation: hasValidLocation,
                    error: true
                };
                categoryCacheRef.current[normId] = errorData;
                return errorData;
            } finally {
                delete promisesCacheRef.current[normId];
            }
        })();

        promisesCacheRef.current[normId] = fetchPromise;
        return fetchPromise;
    };

    // Load active category
    const fetchData = async (targetId) => {
        const normId = normalizeId(targetId);
        const hasValidLocation =
            Number.isFinite(currentLocation?.latitude) &&
            Number.isFinite(currentLocation?.longitude);
        const cached = categoryCacheRef.current[normId];
        
        // Skip setting isLoading to true if category is preloaded and has location products loaded
        const isCached = cached && !cached.isLoading && (!hasValidLocation || cached.hasLocation);
        
        if (!isCached) {
            setIsLoading(true);
        }

        const data = await getCategoryDataFromCacheOrFetch(targetId);
        if (data) {
            setProducts(data.products);
            setCategory(data.category);
            setSubCategories(data.subCategories);
            setExperienceSections(data.experienceSections);
            setHeroConfig(data.heroConfig);
        }
        setIsLoading(false);
    };

    // Fetch on page navigate or location change
    useEffect(() => {
        fetchData(catId);
        setSelectedSubCategory(normalizeId(location.state?.activeSubcategoryId) || 'all');
    }, [catId, location.state?.activeSubcategoryId, currentLocation?.latitude, currentLocation?.longitude]);

    // Background preloader for adjacent main categories
    useEffect(() => {
        if (!mainCategories || mainCategories.length === 0 || !catId) return;

        const currentCatIndex = mainCategories.findIndex(c => normalizeId(c._id || c.id) === catId || String(c.slug || '') === catId);
        if (currentCatIndex !== -1) {
            const nextMain = currentCatIndex < mainCategories.length - 1 ? mainCategories[currentCatIndex + 1] : null;
            const prevMain = currentCatIndex > 0 ? mainCategories[currentCatIndex - 1] : null;

            if (nextMain) {
                getCategoryDataFromCacheOrFetch(normalizeId(nextMain._id || nextMain.id));
            }
            if (prevMain) {
                getCategoryDataFromCacheOrFetch(normalizeId(prevMain._id || prevMain.id));
            }
        }
    }, [mainCategories, catId]);

    // Synchronously extract subcategories for any main category
    const getSubCategoriesForCategory = (mainCatId) => {
        const normId = normalizeId(mainCatId);
        if (!mainCategories || mainCategories.length === 0) return [];
        
        const fullMap = {};
        const flatten = (items) => {
            items.forEach(item => {
                const itemId = normalizeId(item._id || item.id);
                if (itemId) fullMap[itemId] = item;
                if (item.slug) fullMap[String(item.slug)] = item;
                if (item.children && item.children.length > 0) flatten(item.children);
            });
        };
        flatten(mainCategories);
        
        const cat = fullMap[normId];
        if (!cat) return [];
        
        let subs = [];
        if (cat.children && cat.children.length > 0) {
            subs = cat.children;
        } else if (cat.parentId) {
            const parentIdStr = normalizeId(cat.parentId?._id || cat.parentId);
            const parent = fullMap[parentIdStr];
            if (parent) {
                subs = parent.children && parent.children.length > 0
                    ? parent.children
                    : mainCategories.filter(item => normalizeId(item.parentId?._id || item.parentId) === parentIdStr);
            }
        }
        
        const formattedSubs = subs.map(s => ({
            id: normalizeId(s._id || s.id),
            name: s.name,
            icon: s.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321801.png',
            banner: s.banner || '',
            sortOrder: Number(s.sortOrder || 0),
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        
        return [{ id: 'all', name: 'All', icon: cat.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }, ...formattedSubs];
    };

    // Calculate panel data for render
    const getPanelData = (mainId, subId) => {
        const cached = categoryCacheRef.current[mainId];
        if (!cached) {
            return { products: [], subCategories: getSubCategoriesForCategory(mainId), category: null, experienceSections: [], heroConfig: null, isLoading: true };
        }
        
        const safeProds = cached.products || [];
        let list = safeProds.filter(p => {
            if (subId === 'all') return true;
            const pSubId = normalizeId(p.subcategoryId?._id || p.subcategoryId) || '';
            const pCatId = normalizeId(p.categoryId?._id || p.categoryId) || '';
            return pSubId === subId || pCatId === subId;
        });
        
        // Apply type filters
        if (selectedType === 'veg') {
            list = list.filter(p => p.isVeg || (p.name && /veg/i.test(p.name)) || (p.description && /veg/i.test(p.description)));
        } else if (selectedType === 'nonveg') {
            list = list.filter(p => !p.isVeg && !(p.name && /veg/i.test(p.name)));
        }

        // Apply price filters
        if (selectedPriceRange === 'under-150') {
            list = list.filter(p => (p.price || 0) < 150);
        } else if (selectedPriceRange === '150-300') {
            list = list.filter(p => (p.price || 0) >= 150 && (p.price || 0) <= 300);
        } else if (selectedPriceRange === 'above-300') {
            list = list.filter(p => (p.price || 0) > 300);
        }

        // Apply sort filters
        if (selectedSort === 'price-low-high') {
            list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (selectedSort === 'price-high-low') {
            list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        }
        
        return {
            products: list,
            subCategories: cached.subCategories || getSubCategoriesForCategory(mainId),
            category: cached.category,
            experienceSections: cached.experienceSections || [],
            heroConfig: cached.heroConfig,
            isLoading: cached.isLoading
        };
    };

    // Determine adjacent panels for transition
    const getAdjacentPanels = () => {
        if (!catId) return { prev: null, next: null };
        
        const subCats = subCategories;
        const currentSubIndex = subCats.findIndex(s => s.id === selectedSubCategory);
        
        let prev = null;
        let next = null;
        
        // Prev Category selection
        if (currentSubIndex > 0) {
            prev = {
                mainCategoryId: catId,
                subCategoryId: subCats[currentSubIndex - 1].id,
                name: subCats[currentSubIndex - 1].name,
                icon: subCats[currentSubIndex - 1].icon
            };
        } else {
            const currentCatIndex = mainCategories.findIndex(c => normalizeId(c._id || c.id) === catId || String(c.slug || '') === catId);
            if (currentCatIndex > 0) {
                const prevMain = mainCategories[currentCatIndex - 1];
                const prevMainId = normalizeId(prevMain._id || prevMain.id);
                const prevSubCats = getSubCategoriesForCategory(prevMainId);
                const targetSub = prevSubCats.length > 0 ? prevSubCats[prevSubCats.length - 1] : { id: 'all', name: 'All' };
                
                prev = {
                    mainCategoryId: prevMainId,
                    subCategoryId: targetSub.id,
                    name: targetSub.name,
                    icon: targetSub.icon || prevMain.image
                };
            }
        }
        
        // Next Category selection
        if (currentSubIndex !== -1 && currentSubIndex < subCats.length - 1) {
            next = {
                mainCategoryId: catId,
                subCategoryId: subCats[currentSubIndex + 1].id,
                name: subCats[currentSubIndex + 1].name,
                icon: subCats[currentSubIndex + 1].icon
            };
        } else {
            const currentCatIndex = mainCategories.findIndex(c => normalizeId(c._id || c.id) === catId || String(c.slug || '') === catId);
            if (currentCatIndex !== -1 && currentCatIndex < mainCategories.length - 1) {
                const nextMain = mainCategories[currentCatIndex + 1];
                const nextMainId = normalizeId(nextMain._id || nextMain.id);
                
                next = {
                    mainCategoryId: nextMainId,
                    subCategoryId: 'all',
                    name: nextMain.name || nextMain.slug,
                    icon: nextMain.image
                };
            }
        }
        
        return { prev, next };
    };

    // Scroll listener for current panel
    const handleScrollEvent = (e) => {
        const scrollTop = e.currentTarget.scrollTop;
        const cacheKey = `${catId}_${selectedSubCategory}`;
        scrollPositionsRef.current[cacheKey] = scrollTop;
    };

    // Restore scroll position on selection change
    useEffect(() => {
        const container = currentPanelScrollRef.current;
        if (container) {
            const cacheKey = `${catId}_${selectedSubCategory}`;
            const savedScroll = scrollPositionsRef.current[cacheKey];
            
            if (savedScroll !== undefined) {
                setTimeout(() => {
                    if (currentPanelScrollRef.current) {
                        currentPanelScrollRef.current.scrollTop = savedScroll === 99999
                            ? currentPanelScrollRef.current.scrollHeight
                            : savedScroll;
                    }
                }, 20);
            } else {
                container.scrollTop = 0;
            }
        }
    }, [selectedSubCategory, catId, isLoading]);

    // Gesture Handlers
    const handleDragStart = (clientY, clientX, isTouch, scrollTop, scrollHeight, clientHeight) => {
        if (isProductDetailOpen) return;
        dragStartRef.current = {
            y: clientY,
            x: clientX,
            scrollTop,
            scrollHeight,
            clientHeight,
            isTouch,
            time: Date.now()
        };
        isDraggingRef.current = true;
    };

    const handleDragMove = (clientY, clientX) => {
        if (!isDraggingRef.current || !dragStartRef.current) return;
        
        const start = dragStartRef.current;
        const deltaY = clientY - start.y;
        const deltaX = clientX - start.x;
        
        // Avoid fighting horizontal scroll gestures on product lists
        if (Math.abs(deltaX) > Math.abs(deltaY) * 0.8 && !gestureActiveRef.current) {
            isDraggingRef.current = false;
            return;
        }

        const container = currentPanelScrollRef.current;
        if (!container) return;

        const currentScrollTop = container.scrollTop;
        const currentScrollHeight = container.scrollHeight;
        const currentClientHeight = container.clientHeight;
        const maxScroll = currentScrollHeight - currentClientHeight;

        if (!gestureActiveRef.current) {
            // Detect Boundary Overscroll Triggers (uses live scroll positions to support mid-drag boundary hits)
            if (currentScrollTop <= 0 && deltaY > 0) {
                gestureActiveRef.current = true;
                gestureDirectionRef.current = 'down';
                gestureStartRef.current = clientY;

                const { prev } = getAdjacentPanels();
                if (prev) {
                    // Trigger preload in case it's not complete
                    getCategoryDataFromCacheOrFetch(prev.mainCategoryId);
                    setActiveTransition({
                        active: true,
                        direction: 'down',
                        prevPanel: prev,
                        nextPanel: null
                    });
                } else {
                    gestureActiveRef.current = false;
                }
            } else if (currentScrollTop >= maxScroll - 2 && deltaY < 0) {
                gestureActiveRef.current = true;
                gestureDirectionRef.current = 'up';
                gestureStartRef.current = clientY;

                const { next } = getAdjacentPanels();
                if (next) {
                    // Trigger preload in case it's not complete
                    getCategoryDataFromCacheOrFetch(next.mainCategoryId);
                    setActiveTransition({
                        active: true,
                        direction: 'up',
                        prevPanel: null,
                        nextPanel: next
                    });
                } else {
                    gestureActiveRef.current = false;
                }
            }
        } else {
            // Overscroll interactive transition is active
            const offsetY = clientY - gestureStartRef.current;
            const animContainer = animationContainerRef.current;
            if (animContainer) {
                if (gestureDirectionRef.current === 'down') {
                    if (offsetY < 0) {
                        animContainer.style.transform = 'translateY(0px)';
                    } else {
                        animContainer.style.transform = `translateY(${offsetY}px)`;
                    }
                } else {
                    if (offsetY > 0) {
                        animContainer.style.transform = 'translateY(0px)';
                    } else {
                        animContainer.style.transform = `translateY(${offsetY}px)`;
                    }
                }
            }

            // Animate transition chevrons representing drag force
            const direction = gestureDirectionRef.current;
            const containerHeight = currentClientHeight;
            const progress = Math.min(1.2, Math.abs(offsetY) / (containerHeight * 0.4));
            const arrowRef = direction === 'up' ? nextArrowRef : prevArrowRef;

            if (arrowRef && arrowRef.current) {
                // Scale up and translate chevrons based on drag pull depth
                const scale = 0.8 + Math.min(1.0, progress) * 0.55;
                const translateY = direction === 'up' ? -progress * 25 : progress * 25;
                arrowRef.current.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                
                // Opacity scales from faint to fully solid
                arrowRef.current.style.opacity = `${0.6 + Math.min(1.0, progress) * 0.4}`;

                // Add bounce animation once threshold is breached
                if (progress >= 1.0) {
                    arrowRef.current.classList.add('animate-bounce');
                } else {
                    arrowRef.current.classList.remove('animate-bounce');
                }
            }
        }
    };

    const handleDragEnd = (clientY) => {
        isDraggingRef.current = false;
        if (!gestureActiveRef.current || !dragStartRef.current) return;
        
        gestureActiveRef.current = false;
        
        const container = currentPanelScrollRef.current;
        if (!container) return;
        
        const containerHeight = container.clientHeight;
        const offsetY = clientY - gestureStartRef.current;
        const duration = Date.now() - dragStartRef.current.time;
        const velocity = offsetY / duration;

        const direction = gestureDirectionRef.current;
        let isComplete = false;

        if (direction === 'up') {
            if (offsetY < -containerHeight * 0.4 || velocity < -0.4) {
                isComplete = true;
            }
        } else if (direction === 'down') {
            if (offsetY > containerHeight * 0.4 || velocity > 0.4) {
                isComplete = true;
            }
        }

        const animContainer = animationContainerRef.current;
        if (animContainer) {
            animContainer.style.transition = 'transform 450ms cubic-bezier(0.175, 0.885, 0.32, 1.1)';
            const targetY = isComplete
                ? (direction === 'up' ? -containerHeight : containerHeight)
                : 0;

            animContainer.style.transform = `translateY(${targetY}px)`;

            // Animate chevrons release transitions
            const arrowRef = direction === 'up' ? nextArrowRef : prevArrowRef;
            if (arrowRef && arrowRef.current) {
                arrowRef.current.classList.remove('animate-bounce');
                arrowRef.current.style.transition = 'transform 450ms cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 450ms';
                if (isComplete) {
                    const finalY = direction === 'up' ? -40 : 40;
                    arrowRef.current.style.transform = `scale(1.4) translateY(${finalY}px)`;
                    arrowRef.current.style.opacity = '1.0';
                } else {
                    arrowRef.current.style.transform = 'scale(0.8) translateY(0px)';
                    arrowRef.current.style.opacity = '0.6';
                }
            }

            setTimeout(() => {
                animContainer.style.transition = 'none';
                animContainer.style.transform = 'translateY(0px)';

                // Clean up arrow transition styles
                if (arrowRef && arrowRef.current) {
                    arrowRef.current.style.transition = 'none';
                    arrowRef.current.style.transform = 'scale(0.8) translateY(0px)';
                    arrowRef.current.style.opacity = '0.6';
                }

                if (isComplete) {
                    const targetPanel = direction === 'up' ? activeTransition.nextPanel : activeTransition.prevPanel;
                    if (targetPanel) {
                        const { mainCategoryId, subCategoryId } = targetPanel;
                        const cacheKey = `${mainCategoryId}_${subCategoryId}`;
                        
                        if (scrollPositionsRef.current[cacheKey] === undefined) {
                            scrollPositionsRef.current[cacheKey] = direction === 'down' ? 99999 : 0;
                        }

                        if (mainCategoryId !== catId) {
                            navigate(`/quick/categories/${mainCategoryId}`, { 
                                state: { activeSubcategoryId: subCategoryId },
                                replace: true 
                            });
                        } else {
                            setSelectedSubCategory(subCategoryId);
                        }
                    }
                }

                setActiveTransition({
                    active: false,
                    direction: null,
                    prevPanel: null,
                    nextPanel: null
                });
            }, 450);
        }
    };

    // Attach non-passive events directly to the current scrollable container
    useEffect(() => {
        const container = currentPanelScrollRef.current;
        if (!container || isProductDetailOpen) return;

        const onTouchStart = (e) => {
            const touch = e.touches[0];
            handleDragStart(
                touch.clientY,
                touch.clientX,
                true,
                container.scrollTop,
                container.scrollHeight,
                container.clientHeight
            );
        };

        const onTouchMove = (e) => {
            if (e.touches.length > 1) return;
            const touch = e.touches[0];
            
            if (gestureActiveRef.current && e.cancelable) {
                e.preventDefault();
            }
            
            handleDragMove(touch.clientY, touch.clientX);
            
            if (gestureActiveRef.current && e.cancelable) {
                e.preventDefault();
            }
        };

        const onTouchEnd = (e) => {
            const touch = e.changedTouches[0] || e.touches[0];
            handleDragEnd(touch ? touch.clientY : dragStartRef.current.y);
        };

        const onMouseDown = (e) => {
            handleDragStart(
                e.clientY,
                e.clientX,
                false,
                container.scrollTop,
                container.scrollHeight,
                container.clientHeight
            );
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            handleDragMove(e.clientY, e.clientX);
        };

        const onMouseUp = (e) => {
            handleDragEnd(e.clientY);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        container.addEventListener('touchstart', onTouchStart, { passive: true });
        container.addEventListener('touchmove', onTouchMove, { passive: false });
        container.addEventListener('touchend', onTouchEnd, { passive: true });
        container.addEventListener('mousedown', onMouseDown);

        return () => {
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchmove', onTouchMove);
            container.removeEventListener('touchend', onTouchEnd);
            container.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [selectedSubCategory, catId, activeTransition, isProductDetailOpen, subCategories, mainCategories]);

    const productsById = React.useMemo(() => {
        const map = {};
        products.forEach(p => {
            map[p._id || p.id] = p;
        });
        return map;
    }, [products]);

    // Renders list content for individual panels
    const renderPanelContent = (panelState, isCurrent) => {
        const { mainCategoryId, subCategoryId, isLoading: panelLoading } = panelState;
        const panelData = getPanelData(mainCategoryId, subCategoryId);
        const productsList = panelData.products;
        const bannerUrl = subCategoryId === 'all'
            ? panelData.category?.banner
            : panelData.subCategories.find(s => s.id === subCategoryId)?.banner;
            
        const resolvedBannerUrl = resolveQuickImageUrl(bannerUrl);
        const isPanelLoading = panelLoading || panelData.isLoading;

        return (
            <div 
                ref={isCurrent ? currentPanelScrollRef : null}
                className="w-full h-full overflow-y-auto overscroll-y-contain pb-28 pt-1 px-3 hide-scrollbar select-none"
                onScroll={isCurrent ? handleScrollEvent : null}
            >
                {subCategoryId === 'all' && panelData.experienceSections?.filter(s => !['bestseller', 'bestsellers', 'best seller', 'best sellers'].includes((s.title || '').trim().toLowerCase())).length > 0 && (
                    <div className="mb-4">
                        <SectionRenderer
                            sections={panelData.experienceSections.filter(s => 
                                !['bestseller', 'bestsellers', 'best seller', 'best sellers'].includes((s.title || '').trim().toLowerCase())
                            )}
                            productsById={productsList.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})}
                            categoriesById={categoryMap}
                            subcategoriesById={subcategoryMap}
                        />
                    </div>
                )}

                {resolvedBannerUrl && (
                    <div className="mb-3.5 rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-neutral-800/80">
                        <img 
                            src={resolvedBannerUrl} 
                            alt="Category Banner" 
                            className="w-full h-auto object-cover max-h-[140px] md:max-h-[185px]"
                        />
                    </div>
                )}

                {/* Subcategory Label inside Panel to announce category/subcategory */}
                <div className="mb-3 mt-1 flex items-center justify-between px-1">
                    <span className="text-[12px] font-black tracking-wide text-slate-800 dark:text-slate-200">
                        {panelData.category?.name || ""}
                        {subCategoryId !== 'all' && ` • ${panelData.subCategories.find(s => s.id === subCategoryId)?.name || ""}`}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                        {productsList.length} items
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                    {isPanelLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-transparent flex flex-col h-[220px]">
                                <div className="flex flex-col rounded-[12px] overflow-hidden border border-slate-200/20 shadow-[0_1px_4px_rgba(0,0,0,0.02)] w-full">
                                    <div className="w-full aspect-square bg-[#F3F4F6] dark:bg-neutral-800" />
                                    <div className="w-full bg-white dark:bg-neutral-900 flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100/50">
                                        <div className="h-4 w-10 bg-slate-100 dark:bg-neutral-800 rounded" />
                                        <div className="h-5 w-12 bg-slate-100 dark:bg-neutral-800 rounded" />
                                    </div>
                                </div>
                                <div className="h-3 w-1/3 bg-slate-200/60 dark:bg-neutral-800 rounded mt-2.5 mb-1.5" />
                                <div className="h-4 w-3/4 bg-slate-200/60 dark:bg-neutral-700 rounded mb-1.5" />
                                <div className="h-2 w-1/2 bg-slate-100/50 dark:bg-neutral-800 rounded" />
                            </div>
                        ))
                    ) : (
                        productsList.map((product) => (
                            <CategoryProductCard key={product.id} product={product} />
                        ))
                    )}
                    {productsList.length === 0 && !isPanelLoading && (
                        <div className="col-span-full py-20 text-center w-full">
                            <p className="text-gray-400 font-bold italic">No products found in this category</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen w-full flex-col bg-white dark:bg-background font-sans pt-0 transition-colors duration-500 overflow-hidden">
            <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col h-full overflow-hidden">
                {/* Header */}
                <header className={cn(
                    "sticky top-0 z-[100] px-4 py-4 flex items-center justify-between border-b border-white/20 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md shrink-0",
                    isProductDetailOpen && "hidden md:flex"
                )}
                    style={{
                        backgroundImage: `linear-gradient(180deg, ${headerTheme} 0%, ${headerTheme}F2 100%)`,
                    }}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1 hover:bg-white/15 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-white" />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/75">
                                Quick Category
                            </span>
                            <h1 className="text-[18px] font-bold text-white tracking-tight">
                                {category?.name || location.state?.categoryName || catId}
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 relative overflow-hidden h-full">
                    {/* Sidebar */}
                    <aside className="w-[76px] md:w-24 shrink-0 border-r border-slate-100 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 overflow-y-auto hide-scrollbar h-full pb-32 transition-colors">
                        {subCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedSubCategory(cat.id)}
                                className={cn(
                                    "flex flex-col items-center py-3.5 px-1 gap-1.5 transition-all relative",
                                    selectedSubCategory === cat.id
                                        ? "bg-white dark:bg-neutral-900"
                                        : "bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800"
                                )}
                            >
                                {selectedSubCategory === cat.id && (
                                    <div className="absolute right-0 top-[2px] bottom-[2px] w-[4px] bg-[#0c831f] rounded-l-full" />
                                )}
                                <div className={cn(
                                    "w-[54px] h-[54px] rounded-full flex items-center justify-center p-1 overflow-hidden transition-all duration-300",
                                    selectedSubCategory === cat.id 
                                        ? "bg-[#E8F5E9] dark:bg-emerald-950/40" 
                                        : "bg-[#F3F4F6] dark:bg-neutral-800"
                                )}>
                                    <img src={cat.icon} alt={cat.name} className={cn(
                                        "w-full h-full object-contain object-center mix-blend-multiply dark:mix-blend-normal transition-transform duration-300",
                                        selectedSubCategory === cat.id ? "scale-110" : "scale-100"
                                    )} />
                                </div>
                                <span className={cn(
                                    "text-[9.5px] md:text-[10px] text-center font-sans leading-[1.1] px-0.5",
                                    selectedSubCategory === cat.id 
                                        ? "font-bold text-slate-900 dark:text-white" 
                                        : "font-medium text-slate-500 dark:text-slate-400"
                                )}>
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 min-w-0 bg-white dark:bg-neutral-950 transition-colors flex flex-col h-full overflow-hidden">
                        {/* Horizontal Filters Pill Bar (Remains Static) */}
                        <div className="bg-white dark:bg-neutral-900 mb-1.5 px-3 border-b border-slate-200/60 dark:border-neutral-800 z-10 shrink-0">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5">
                                {/* Filter 1: Filters */}
                                <button 
                                    onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-1.5 border rounded-[10px] text-[12px] font-bold shrink-0 transition-all active:scale-95 shadow-none",
                                        activeDropdown === 'filters' || selectedType !== 'all' || selectedPriceRange !== 'all'
                                            ? "bg-[#0c831f]/10 border-[#0c831f] text-[#0c831f] dark:bg-emerald-950/20"
                                            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    <SlidersHorizontal size={13} className={cn(activeDropdown === 'filters' || selectedType !== 'all' || selectedPriceRange !== 'all' ? "text-[#0c831f]" : "text-slate-600 dark:text-slate-400")} />
                                    <span>Filters</span>
                                    <ChevronDown size={13} className={cn(activeDropdown === 'filters' || selectedType !== 'all' || selectedPriceRange !== 'all' ? "text-[#0c831f]" : "text-slate-500 dark:text-slate-400 ml-0.5")} />
                                </button>

                                {/* Filter 2: Sort */}
                                <button 
                                    onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-1.5 border rounded-[10px] text-[12px] font-bold shrink-0 transition-all active:scale-95 shadow-none",
                                        activeDropdown === 'sort' || selectedSort !== 'default'
                                            ? "bg-[#0c831f]/10 border-[#0c831f] text-[#0c831f] dark:bg-emerald-950/20"
                                            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    <ArrowUpDown size={13} className={cn(activeDropdown === 'sort' || selectedSort !== 'default' ? "text-[#0c831f]" : "text-slate-600 dark:text-slate-400")} />
                                    <span>
                                        {selectedSort === 'default' ? 'Sort' : selectedSort === 'price-low-high' ? 'Low to High' : 'High to Low'}
                                    </span>
                                    <ChevronDown size={13} className={cn(activeDropdown === 'sort' || selectedSort !== 'default' ? "text-[#0c831f]" : "text-slate-500 dark:text-slate-400 ml-0.5")} />
                                </button>

                                {/* Filter 3: Type */}
                                <button 
                                    onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-1.5 border rounded-[10px] text-[12px] font-bold shrink-0 transition-all active:scale-95 shadow-none",
                                        activeDropdown === 'type' || selectedType !== 'all'
                                            ? "bg-[#0c831f]/10 border-[#0c831f] text-[#0c831f] dark:bg-emerald-950/20"
                                            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    <span>
                                        {selectedType === 'all' ? 'Type' : selectedType === 'veg' ? 'Veg Only' : 'Non-Veg'}
                                    </span>
                                    <ChevronDown size={13} className={cn(activeDropdown === 'type' || selectedType !== 'all' ? "text-[#0c831f]" : "text-slate-500 dark:text-slate-400 ml-0.5")} />
                                </button>

                                {/* Filter 4: Price */}
                                <button 
                                    onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-1.5 border rounded-[10px] text-[12px] font-bold shrink-0 transition-all active:scale-95 shadow-none",
                                        activeDropdown === 'price' || selectedPriceRange !== 'all'
                                            ? "bg-[#0c831f]/10 border-[#0c831f] text-[#0c831f] dark:bg-emerald-950/20"
                                            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700"
                                    )}
                                >
                                    <span>
                                        {selectedPriceRange === 'all' ? 'Price' : selectedPriceRange === 'under-150' ? 'Under ₹150' : selectedPriceRange === '150-300' ? '₹150-300' : 'Above ₹300'}
                                    </span>
                                    <ChevronDown size={13} className={cn(activeDropdown === 'price' || selectedPriceRange !== 'all' ? "text-[#0c831f]" : "text-slate-500 dark:text-slate-400 ml-0.5")} />
                                </button>
                            </div>

                            {/* Dropdowns */}
                            {activeDropdown && (
                                <>
                                    {/* Backdrop */}
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setActiveDropdown(null)}
                                    />
                                    
                                    {/* Dropdown Box */}
                                    <div className="absolute left-0 right-0 md:left-auto mt-0 mx-3 md:mx-0 z-50 min-w-[200px] bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-1">
                                        {activeDropdown === 'filters' && (
                                            <>
                                                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Active Filters</div>
                                                <button 
                                                    onClick={() => { setSelectedType('all'); setSelectedPriceRange('all'); setActiveDropdown(null); }}
                                                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-slate-50 dark:hover:bg-neutral-700/50 rounded-xl text-red-500 font-bold"
                                                >
                                                    Clear All Filters
                                                </button>
                                            </>
                                        )}
                                        
                                        {activeDropdown === 'sort' && (
                                            <>
                                                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Sort By</div>
                                                <button 
                                                    onClick={() => { setSelectedSort('default'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedSort === 'default' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    Default Sort
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedSort('price-low-high'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedSort === 'price-low-high' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    Price: Low to High
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedSort('price-high-low'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedSort === 'price-high-low' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    Price: High to Low
                                                </button>
                                            </>
                                        )}

                                        {activeDropdown === 'type' && (
                                            <>
                                                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Product Type</div>
                                                <button 
                                                    onClick={() => { setSelectedType('all'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedType === 'all' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    All Types
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedType('veg'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium flex items-center gap-1.5", selectedType === 'veg' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                                    Veg Only
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedType('nonveg'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium flex items-center gap-1.5", selectedType === 'nonveg' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                                    Non-Veg Only
                                                </button>
                                            </>
                                        )}

                                        {activeDropdown === 'price' && (
                                            <>
                                                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Price Range</div>
                                                <button 
                                                    onClick={() => { setSelectedPriceRange('all'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedPriceRange === 'all' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    All Prices
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedPriceRange('under-150'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedPriceRange === 'under-150' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    Under ₹150
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedPriceRange('150-300'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedPriceRange === '150-300' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    ₹150 - ₹300
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedPriceRange('above-300'); setActiveDropdown(null); }}
                                                    className={cn("w-full text-left px-3 py-2 text-[13px] rounded-xl font-medium", selectedPriceRange === 'above-300' ? "text-[#0c831f] bg-[#0c831f]/5 font-bold" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700/50")}
                                                >
                                                    Above ₹300
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Interactive Stacked Sliding Panels Viewport */}
                        <div className="flex-1 relative overflow-hidden w-full bg-white dark:bg-neutral-950">
                            <div 
                                ref={animationContainerRef}
                                className="w-full h-full relative"
                                style={{ willChange: 'transform' }}
                            >
                                {/* Previous Panel */}
                                {activeTransition.active && activeTransition.direction === 'down' && activeTransition.prevPanel && (
                                    <div 
                                        ref={prevPanelRef}
                                        className="absolute left-0 w-full h-full flex flex-col"
                                        style={{ top: '-100%' }}
                                    >
                                        <div className="flex-1 min-h-0 relative">
                                            {renderPanelContent(activeTransition.prevPanel, false)}
                                        </div>
                                        <div className="shrink-0">
                                            <TransitionBanner 
                                                direction="down" 
                                                name={activeTransition.prevPanel.name} 
                                                icon={activeTransition.prevPanel.icon} 
                                                arrowRef={prevArrowRef}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Current Panel */}
                                <div 
                                    ref={currentPanelRef}
                                    className="absolute top-0 left-0 w-full h-full"
                                >
                                    {renderPanelContent({ mainCategoryId: catId, subCategoryId: selectedSubCategory, isLoading }, true)}
                                </div>

                                {/* Next Panel */}
                                {activeTransition.active && activeTransition.direction === 'up' && activeTransition.nextPanel && (
                                    <div 
                                        ref={nextPanelRef}
                                        className="absolute left-0 w-full h-full flex flex-col"
                                        style={{ top: '100%' }}
                                    >
                                        <div className="shrink-0">
                                            <TransitionBanner 
                                                direction="up" 
                                                name={activeTransition.nextPanel.name} 
                                                icon={activeTransition.nextPanel.icon} 
                                                arrowRef={nextArrowRef}
                                            />
                                        </div>
                                        <div className="flex-1 min-h-0 relative">
                                            {renderPanelContent(activeTransition.nextPanel, false)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>

                <MiniCart />
                <ProductDetailSheet />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                    
                    body {
                        font-family: 'Outfit', sans-serif;
                    }
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .hide-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}} />
        </div>
    );
};

export default CategoryProductsPage;
