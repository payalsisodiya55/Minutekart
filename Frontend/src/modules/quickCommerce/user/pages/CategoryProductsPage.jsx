import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Heart, Minus, Plus, ChevronsDown, SlidersHorizontal, ArrowUpDown, ChevronDown, Loader2 } from 'lucide-react';
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

const QUICK_THEME_STORAGE_KEY = "food.quick.headerColor";
const QUICK_HEADER_RETURN_STORAGE_KEY = "food.quick.headerReturn";
const FALLBACK_HEADER_COLOR = "#0c831f";

// Custom premium product card matching the 2nd reference image
const CategoryProductCard = ({ product }) => {
    const { cart, addToCart, updateQuantity } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { animateAddToCart, animateRemoveFromCart } = useCartAnimation();
    const [currentImgIdx, setCurrentImgIdx] = useState(0);
    const imageRef = React.useRef(null);

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

    return (
        <div className="flex flex-col bg-transparent relative group select-none">
            {/* Split-Background Card Container (Beige upper, White lower, rounded-[12px]) */}
            <div className="relative flex flex-col rounded-[12px] border border-slate-200/30 dark:border-neutral-800/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
                {/* Upper Portion: Image Container (Beige/Grey background, rounded top) */}
                <div className="relative w-full aspect-square bg-[#F3F4F6] dark:bg-neutral-850 rounded-t-[12px] flex items-center justify-center p-4 overflow-hidden">
                    {/* Wishlist Button */}
                    <button
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-3 right-3 z-10 w-7 h-7 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform"
                    >
                        <Heart
                            size={14}
                            className={cn(
                                isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400"
                            )}
                        />
                    </button>

                    {/* Product Image Carousel */}
                    <div ref={imageRef} className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 relative">
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
                                            className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-1"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`${product.name} - ${imgIdx + 1}`}
                                                className="max-h-[92%] max-w-[92%] object-contain mix-blend-multiply dark:mix-blend-normal"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Dot Indicators */}
                                <div className="absolute -bottom-2 left-2 flex items-center gap-1.5 z-10 pointer-events-none">
                                    {allImages.map((_, dotIdx) => (
                                        <div
                                            key={dotIdx}
                                            className={cn(
                                                "rounded-full transition-all duration-300",
                                                dotIdx === currentImgIdx
                                                    ? "w-2.5 h-2.5 bg-white dark:bg-neutral-800 border border-slate-400 dark:border-neutral-500 shadow-sm"
                                                    : "w-1.5 h-1.5 bg-slate-300 dark:bg-neutral-600"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="max-h-[92%] max-w-[92%] object-contain mix-blend-multiply dark:mix-blend-normal transform group-hover:scale-105 transition-transform duration-300"
                            />
                        )}
                    </div>
                </div>

                {/* Lower Portion: Thinner White Weight Bar (rounded bottom) */}
                <div className="bg-white dark:bg-neutral-900 w-full h-7 flex items-center pl-3.5 pr-20 border-t border-slate-100 dark:border-neutral-800 rounded-b-[12px]">
                    <span className="text-[10px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {product.weight || "1 unit"}
                    </span>
                </div>

                {/* ADD Button or Quantity Counter absolutely positioned slightly outside bottom-right border */}
                {quantity === 0 ? (
                    <button
                        onClick={() => {
                            addToCart(product);
                            if (imageRef.current) {
                                const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
                                animateAddToCart(imageRef.current.getBoundingClientRect(), resolvedSrc);
                            }
                        }}
                        className="absolute bottom-[-3px] right-[-3px] z-20 bg-white dark:bg-neutral-900 border border-[#0c831f] text-[#0c831f] font-extrabold text-[12px] h-[38px] px-4 rounded-[8px] shadow-sm hover:bg-[#0c831f]/5 active:scale-95 transition-all cursor-pointer flex items-center justify-center min-w-[64px]"
                    >
                        ADD
                    </button>
                ) : (
                    <div className="absolute bottom-[-3px] right-[-3px] z-20 flex items-center bg-[#0c831f] text-white rounded-[8px] shadow-sm overflow-hidden h-[38px]">
                        <button
                            onClick={() => {
                                if (imageRef.current) {
                                    const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
                                    animateRemoveFromCart(imageRef.current.getBoundingClientRect(), resolvedSrc);
                                }
                                updateQuantity(product.id, -1);
                            }}
                            className="px-2.5 h-full flex items-center justify-center hover:bg-[#096317] active:scale-90 transition-transform"
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
                            className="px-2.5 h-full flex items-center justify-center hover:bg-[#096317] active:scale-90 transition-transform"
                        >
                            <Plus size={9} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>

            {/* Product Metadata rendered directly on the yellow page background */}
            <div className="flex flex-col pt-1.5 pb-1 text-left px-1.5">
                {/* Price Line first */}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] md:text-[14px] font-extrabold text-slate-900 dark:text-white leading-none">
                        ₹{displayPrice}
                    </span>
                    {showDiscount && (
                        <span className="text-[10px] md:text-[11px] text-slate-400 line-through font-semibold">
                            ₹{originalPrice}
                        </span>
                    )}
                </div>

                {/* Name second */}
                <h3 className="text-[11px] md:text-[12px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5 leading-tight">
                    {product.name}
                </h3>

                {/* Delivery Time info */}
                <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-400 font-bold">
                    <svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2.5" />
                        <path d="M12 6v6l4 2" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span>{product.deliveryTime || "11 mins"}</span>
                </div>
            </div>
        </div>
    );
};

const CategoryProductsPage = () => {
    const { categoryId: catId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentLocation } = useAppLocation();
    const initialSubcategoryId = location.state?.activeSubcategoryId || 'all';
    const { isOpen: isProductDetailOpen } = useProductDetail();
    const [selectedSubCategory, setSelectedSubCategory] = useState(initialSubcategoryId);
    const [category, setCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([{ id: 'all', name: 'All', icon: 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [headerTheme, setHeaderTheme] = useState(FALLBACK_HEADER_COLOR);
    const [mainCategories, setMainCategories] = useState([]);
    const [pullProgress, setPullProgress] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isScrollable, setIsScrollable] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedSort, setSelectedSort] = useState('default');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedPriceRange, setSelectedPriceRange] = useState('all');
    const triggerRef = React.useRef(null);
    const hasScrolledSinceMount = React.useRef(false);

    useEffect(() => {
        hasScrolledSinceMount.current = false;
    }, [selectedSubCategory, catId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                const scrollable = document.documentElement.scrollHeight > window.innerHeight + 40;
                setIsScrollable(scrollable);
                if (!scrollable) {
                    setPullProgress(1);
                } else {
                    setPullProgress(0);
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [products, isLoading, selectedSubCategory]);

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

    const [experienceSections, setExperienceSections] = useState([]);
    const [heroConfig, setHeroConfig] = useState(null);
    const [categoryMap, setCategoryMap] = useState({});
    const [subcategoryMap, setSubcategoryMap] = useState({});
    const getBannerConfig = () => {
        const catName = category?.name || '';
        const subCatObj = subCategories.find(s => s.id === selectedSubCategory);
        const subCatName = subCatObj?.name || '';

        // 1. Check if the subcategory itself has a custom banner configured (when selected is not 'all')
        if (selectedSubCategory !== 'all' && subCatObj && (subCatObj.bannerImage || subCatObj.bannerTitle || subCatObj.bannerSubtitle)) {
            return {
                title: subCatObj.bannerTitle || subCatObj.name,
                subtitle: subCatObj.bannerSubtitle || "Nutritional goodness in every bite",
                gradient: "from-[#F1F9EE] to-[#E6F3E2] dark:from-neutral-900/60 dark:to-neutral-950/60",
                image: subCatObj.bannerImage || "/fresh_seasonal_fruits.png"
            };
        }

        // 2. Check if the parent category has a custom banner configured
        if (category && (category.bannerImage || category.bannerTitle || category.bannerSubtitle)) {
            return {
                title: category.bannerTitle || category.name,
                subtitle: category.bannerSubtitle || "Nutritional goodness in every bite",
                gradient: "from-[#F1F9EE] to-[#E6F3E2] dark:from-neutral-900/60 dark:to-neutral-950/60",
                image: category.bannerImage || "/fresh_seasonal_fruits.png"
            };
        }

        // If it's Fruit & Vegetables or Groceries
        if (
            catName.toLowerCase().includes('fruit') || 
            catName.toLowerCase().includes('vegetable') || 
            catName.toLowerCase().includes('grocery') || 
            subCatName.toLowerCase().includes('fruit') || 
            subCatName.toLowerCase().includes('vegetable')
        ) {
            return {
                title: "Fresh seasonal fruits",
                subtitle: "Nutritional goodness in every bite",
                gradient: "from-[#F1F9EE] to-[#E6F3E2] dark:from-neutral-900/60 dark:to-neutral-950/60",
                image: "/fresh_seasonal_fruits.png"
            };
        }

        // Dairy & Breads
        if (catName.toLowerCase().includes('dairy') || catName.toLowerCase().includes('bread') || subCatName.toLowerCase().includes('dairy') || subCatName.toLowerCase().includes('bread')) {
            return {
                title: "Fresh Dairy & Breads",
                subtitle: "Farm fresh milk, butter & soft breads daily",
                gradient: "from-[#FFF9E6] to-[#FFF1CD] dark:from-neutral-900/60 dark:to-neutral-950/60",
                image: "https://cdn-icons-png.flaticon.com/512/3054/3054929.png"
            };
        }

        // Snacks / Munchies
        if (catName.toLowerCase().includes('snack') || catName.toLowerCase().includes('munch') || subCatName.toLowerCase().includes('snack') || subCatName.toLowerCase().includes('munch')) {
            return {
                title: "Craving Snacks & Munchies?",
                subtitle: "Crunchy chips, cookies & sweets at your door",
                gradient: "from-[#FFE6E6] to-[#FFCDCD] dark:from-neutral-900/60 dark:to-neutral-950/60",
                image: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png"
            };
        }

        // Cold Drinks / Beverages
        if (catName.toLowerCase().includes('drink') || catName.toLowerCase().includes('beverage') || subCatName.toLowerCase().includes('drink') || subCatName.toLowerCase().includes('beverage')) {
            return {
                title: "Chilled Drinks & Juices",
                subtitle: "Quench your thirst in minutes",
                gradient: "from-[#E6F0FF] to-[#CDDFFF] dark:from-neutral-900/60 dark:to-neutral-950/60",
                image: "https://cdn-icons-png.flaticon.com/512/3054/3054889.png"
            };
        }

        // Fallback banner
        return {
            title: subCatName && subCatName !== 'All' ? subCatName : catName || "Daily Essentials",
            subtitle: "Premium quality delivered to your doorstep in minutes",
            gradient: "from-[#F3F4F6] to-[#E5E7EB] dark:from-neutral-900/60 dark:to-neutral-950/60",
            image: "/fresh_seasonal_fruits.png"
        };
    };

    const fetchData = () => {
        setIsLoading(true);
        const hasValidLocation =
            Number.isFinite(currentLocation?.latitude) &&
            Number.isFinite(currentLocation?.longitude);

        if (hasValidLocation) {
            customerApi.getProducts({
                categoryId: catId,
                lat: currentLocation.latitude,
                lng: currentLocation.longitude,
            }).then(prodRes => {
                if (prodRes?.data?.success) {
                    const rawResult = prodRes.data.result;
                    const dbProds = Array.isArray(prodRes.data.results)
                        ? prodRes.data.results
                        : Array.isArray(rawResult?.items)
                            ? rawResult.items
                            : Array.isArray(rawResult)
                                ? rawResult
                                : [];

                    const formattedProds = dbProds.map(p => ({
                        ...p,
                        id: p._id,
                        image: p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
                        price: p.salePrice || p.price,
                        originalPrice: p.price,
                        weight: p.weight || "1 unit",
                        deliveryTime: "8-15 mins"
                    }));
                    setProducts(Array.isArray(formattedProds) ? formattedProds : []);
                }
            }).catch(console.error).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }

        customerApi.getCategories({ tree: true }).then(catRes => {
            if (catRes?.data?.success) {
                const results = catRes.data.results || catRes.data.result || [];
                const allCats = Array.isArray(results) ? results : [];
                setMainCategories(allCats);

                const cMap = {};
                const sMap = {};
                const fullMap = {};
                
                const flatten = (items) => {
                    items.forEach(item => {
                        fullMap[item._id] = item;
                        if (item.slug) fullMap[item.slug] = item;
                        if (item.type === 'category') {
                            cMap[item._id] = item;
                            if (item.slug) cMap[item.slug] = item;
                        }
                        else if (item.type === 'subcategory') {
                            sMap[item._id] = item;
                            if (item.slug) sMap[item.slug] = item;
                        }
                        if (item.children && item.children.length > 0) flatten(item.children);
                    });
                };
                flatten(allCats);
                setCategoryMap(cMap);
                setSubcategoryMap(sMap);

                let currentCat = fullMap[catId];
                if (currentCat) {
                    setCategory(currentCat);
                    let subs = [];
                    let isDirectSub = false;

                    if (currentCat.children && currentCat.children.length > 0) {
                        subs = currentCat.children;
                    } else if (currentCat.parentId) {
                        const parent = fullMap[currentCat.parentId?._id || currentCat.parentId];
                        if (parent) {
                            subs = parent.children && parent.children.length > 0
                                ? parent.children
                                : allCats.filter(cat => cat.parentId === parent._id || cat.parentId?._id === parent._id);
                        }
                        isDirectSub = true;
                    }

                    const formattedSubs = subs.map(s => ({
                        id: s._id,
                        name: s.name,
                        icon: s.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321801.png',
                        bannerImage: s.bannerImage || '',
                        bannerTitle: s.bannerTitle || '',
                        bannerSubtitle: s.bannerSubtitle || '',
                    }));
                    setSubCategories([{ id: 'all', name: 'All', icon: currentCat.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321831.png' }, ...formattedSubs]);
                    
                    if (isDirectSub && selectedSubCategory === 'all' && !location.state?.activeSubcategoryId) {
                        setSelectedSubCategory(currentCat._id);
                    }
                }
            }
        }).catch(console.error);

        customerApi.getExperienceSections({ pageType: 'header', headerId: catId }).then(expRes => {
            if (expRes?.data?.success) {
                setExperienceSections(expRes.data.result || expRes.data.results || []);
            }
        }).catch(() => null);

        customerApi.getHeroConfig({ pageType: 'header', headerId: catId }).then(heroRes => {
            if (heroRes?.data?.success) {
                setHeroConfig(heroRes.data.result);
            }
        }).catch(() => null);
    };

    useEffect(() => {
        fetchData();
        setSelectedSubCategory(location.state?.activeSubcategoryId || 'all');
    }, [catId, location.state?.activeSubcategoryId, currentLocation?.latitude, currentLocation?.longitude]);

    const safeProducts = Array.isArray(products) ? products : [];

    const filteredProducts = React.useMemo(() => {
        let list = safeProducts.filter(p => {
            if (selectedSubCategory === 'all') return true;
            const subId = String(p.subcategoryId?._id || p.subcategoryId || '');
            const catIdStr = String(p.categoryId?._id || p.categoryId || '');
            return subId === selectedSubCategory || catIdStr === selectedSubCategory;
        });

        // Apply Type Filter
        if (selectedType === 'veg') {
            list = list.filter(p => p.isVeg || (p.name && /veg/i.test(p.name)) || (p.description && /veg/i.test(p.description)));
        } else if (selectedType === 'nonveg') {
            list = list.filter(p => !p.isVeg && !(p.name && /veg/i.test(p.name)));
        }

        // Apply Price Filter
        if (selectedPriceRange === 'under-150') {
            list = list.filter(p => (p.price || 0) < 150);
        } else if (selectedPriceRange === '150-300') {
            list = list.filter(p => (p.price || 0) >= 150 && (p.price || 0) <= 300);
        } else if (selectedPriceRange === 'above-300') {
            list = list.filter(p => (p.price || 0) > 300);
        }

        // Apply Sort
        if (selectedSort === 'price-low-high') {
            list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (selectedSort === 'price-high-low') {
            list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        }

        return list;
    }, [safeProducts, selectedSubCategory, selectedSort, selectedType, selectedPriceRange]);

    const productsById = React.useMemo(() => {
        const map = {};
        safeProducts.forEach(p => {
            map[p._id || p.id] = p;
        });
        return map;
    }, [safeProducts]);

    // Handle Category/Subcategory Switch Transition when scrolling to bottom
    const currentSubCatIndex = subCategories.findIndex(s => s.id === selectedSubCategory);
    const nextSubCat = currentSubCatIndex !== -1 && currentSubCatIndex < subCategories.length - 1 ? subCategories[currentSubCatIndex + 1] : null;

    const currentCatIndex = mainCategories.findIndex(c => c._id === catId || c.slug === catId);
    const nextMainCat = !nextSubCat && currentCatIndex !== -1 && currentCatIndex < mainCategories.length - 1 ? mainCategories[currentCatIndex + 1] : null;

    // Track scroll pull-progress of the next-category trigger element to scale the circular image dynamically
    useEffect(() => {
        const handleScroll = () => {
            if (!triggerRef.current || isTransitioning) return;

            if (window.scrollY > 15) {
                hasScrolledSinceMount.current = true;
            }

            const rect = triggerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            const visibleHeight = Math.max(0, windowHeight - rect.top);
            // Calculate progress over the first 200px of scrolling the container into view
            const progress = Math.min(1, visibleHeight / 200);
            setPullProgress(progress);

            // Auto-transition when the banner is scrolled up past the threshold (300px from the bottom)
            const hasScrolledUpEnough = rect.top < windowHeight - 300;
            if (hasScrolledUpEnough && isScrollable && hasScrolledSinceMount.current) {
                setIsTransitioning(true);
                
                // Wait 800ms to show the premium scale-up & rotate transition animation
                setTimeout(() => {
                    if (nextSubCat) {
                        setSelectedSubCategory(nextSubCat.id);
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    } else if (nextMainCat) {
                        navigate(`/quick/categories/${nextMainCat._id}`, { state: { activeSubcategoryId: 'all' } });
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    }
                    setIsTransitioning(false);
                }, 800);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedSubCategory, catId, subCategories, mainCategories, isTransitioning, isScrollable, nextSubCat, nextMainCat, navigate]);

    const handleNextTransition = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            if (nextSubCat) {
                setSelectedSubCategory(nextSubCat.id);
                window.scrollTo({ top: 0, behavior: 'auto' });
            } else if (nextMainCat) {
                navigate(`/quick/categories/${nextMainCat._id}`, { state: { activeSubcategoryId: 'all' } });
                window.scrollTo({ top: 0, behavior: 'auto' });
            }
            setIsTransitioning(false);
        }, 800);
    };

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-background font-sans pt-0 transition-colors duration-500">
            <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col">
                <header className={cn(
                    "sticky top-0 z-[100] px-4 py-4 flex items-center justify-between border-b border-white/20 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md",
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

                <div className="flex flex-1 relative items-start">
                    {/* Sidebar */}
                    <aside className="w-[76px] md:w-24 shrink-0 border-r border-slate-100 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 overflow-y-auto hide-scrollbar sticky top-0 h-screen pb-32 transition-colors">
                        {subCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedSubCategory(cat.id)}
                                className={cn(
                                    "flex flex-col items-center py-3.5 px-1 gap-1.5 transition-all relative border-r-4",
                                    selectedSubCategory === cat.id
                                        ? "bg-white dark:bg-neutral-900 border-[#0c831f]"
                                        : "border-transparent bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800"
                                )}
                            >
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

                    {/* Content */}
                    <main className="flex-1 min-w-0 px-3 pt-1 pb-12 bg-[#F2F7E0] dark:bg-neutral-950 transition-colors flex flex-col min-h-[50vh]">
                        {/* Horizontal Filters Pill Bar */}
                        <div className="sticky top-[72px] md:top-[72px] z-40 bg-white dark:bg-neutral-900 mb-1.5 px-3 -mx-3">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 border-b border-slate-200/60 dark:border-neutral-800">
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
                                    <div className="absolute top-full left-0 z-50 mt-1 min-w-[200px] bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-1">
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

                        {selectedSubCategory === 'all' && experienceSections.filter(s => !['bestseller', 'bestsellers', 'best seller', 'best sellers'].includes((s.title || '').trim().toLowerCase())).length > 0 && (
                            <div className="mb-4">
                                <SectionRenderer
                                    sections={experienceSections.filter(s => 
                                        !['bestseller', 'bestsellers', 'best seller', 'best sellers'].includes((s.title || '').trim().toLowerCase())
                                    )}
                                    productsById={productsById}
                                    categoriesById={categoryMap}
                                    subcategoriesById={subcategoryMap}
                                />
                            </div>
                        )}

                        {/* Dynamic Category Marketing Banner Card */}
                        {!isLoading && (
                            (() => {
                                const banner = getBannerConfig();
                                return (
                                    <div className="relative flex items-center justify-between overflow-hidden py-1.5 pl-2 pr-0 mb-2 select-none min-h-[75px] md:min-h-[95px]">
                                        <div className="flex flex-col text-left max-w-[65%]">
                                            <h2 className="text-[16px] md:text-[18px] font-extrabold text-slate-900 dark:text-white leading-tight">
                                                {banner.title}
                                            </h2>
                                            <p className="text-[10px] md:text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                                                {banner.subtitle}
                                            </p>
                                        </div>
                                        <div className="relative w-[110px] md:w-[135px] h-[75px] md:h-[95px] flex items-center justify-end overflow-hidden flex-shrink-0 -mr-1 md:-mr-2">
                                            <img 
                                                src={banner.image} 
                                                alt={banner.title} 
                                                className="max-h-full max-w-full object-contain object-right transform hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 flex-1">
                            {isLoading ? (
                                Array.from({ length: 12 }).map((_, i) => (
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
                                filteredProducts.map((product) => (
                                    <CategoryProductCard key={product.id} product={product} />
                                ))
                            )}
                            {filteredProducts.length === 0 && !isLoading && (
                                <div className="col-span-2 py-20 text-center w-full">
                                    <p className="text-gray-400 font-bold italic">No products found in this category</p>
                                </div>
                            )}
                        </div>

                        {/* Pull up / Tap to switch subcategory / category transition block */}
                        {(nextSubCat || nextMainCat) && (
                            <div 
                                ref={triggerRef}
                                onClick={handleNextTransition}
                                className="w-full flex flex-col items-center select-none"
                                style={{ 
                                    opacity: pullProgress,
                                    pointerEvents: pullProgress > 0.15 ? 'auto' : 'none'
                                }}
                            >
                                {/* Green Transition Card Banner */}
                                <div className="w-full flex flex-col items-center justify-center pt-8 pb-6 mt-10 border-t border-emerald-100/50 dark:border-emerald-900/20 bg-[#F4FCF3] dark:bg-emerald-950/10 rounded-t-3xl">
                                    <motion.div
                                        animate={isTransitioning ? { y: [0, -12, 0], scale: 1.1 } : { y: [0, -5, 0] }}
                                        transition={isTransitioning ? { repeat: Infinity, duration: 0.6, ease: "easeInOut" } : { repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        className="text-[#0c831f] mb-1 flex flex-col items-center"
                                    >
                                        <ChevronsDown size={22} className="rotate-180" />
                                    </motion.div>

                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c831f]/70 mb-1">
                                        Next Subcategory
                                    </span>

                                    <h4 className="text-[16px] font-extrabold text-slate-800 dark:text-white mb-4">
                                        {nextSubCat ? nextSubCat.name : nextMainCat ? (nextMainCat.name || nextMainCat.slug) : ''}
                                    </h4>

                                    <motion.div 
                                        animate={isTransitioning ? { scale: 1.25, rotate: 360 } : { scale: 0.85 + pullProgress * 0.35 }}
                                        transition={isTransitioning ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.1 }}
                                        className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center p-3 shadow-md relative"
                                    >
                                        {isTransitioning && (
                                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                                        )}
                                        <img 
                                            src={nextSubCat ? nextSubCat.icon : nextMainCat ? (nextMainCat.image || 'https://cdn-icons-png.flaticon.com/128/2321/2321801.png') : ''} 
                                            alt="Next Category" 
                                            className="w-full h-full object-contain" 
                                        />
                                    </motion.div>
                                </div>

                                {/* Next Section Skeleton Loader representing incoming content on Normal Page Background */}
                                <div className="w-full pt-6 pb-12 flex flex-col items-center bg-[#F2F7E0] dark:bg-neutral-950 opacity-70">
                                    {/* Subcategory Pills Skeleton */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full px-4 mb-4">
                                        <div className="w-12 h-6 bg-white dark:bg-neutral-900 rounded-full border border-slate-200/30 dark:border-neutral-800 flex-shrink-0 animate-pulse" />
                                        <div className="w-20 h-6 bg-white dark:bg-neutral-900 rounded-full border border-slate-200/30 dark:border-neutral-800 flex-shrink-0 animate-pulse" />
                                        <div className="w-16 h-6 bg-white dark:bg-neutral-900 rounded-full border border-slate-200/30 dark:border-neutral-800 flex-shrink-0 animate-pulse" />
                                        <div className="w-24 h-6 bg-white dark:bg-neutral-900 rounded-full border border-slate-200/30 dark:border-neutral-800 flex-shrink-0 animate-pulse" />
                                    </div>

                                    {/* Grid Skeletons */}
                                    <div className="grid grid-cols-2 gap-3 w-full px-4">
                                        <div className="flex flex-col bg-transparent h-[210px] animate-pulse">
                                            <div className="flex flex-col rounded-[12px] overflow-hidden border border-slate-200/20 shadow-[0_1px_4px_rgba(0,0,0,0.02)] w-full">
                                                <div className="w-full aspect-square bg-[#F3F4F6] dark:bg-neutral-800" />
                                                <div className="w-full bg-white dark:bg-neutral-900 flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100/50">
                                                    <div className="h-4 w-10 bg-slate-100 dark:bg-neutral-800 rounded" />
                                                    <div className="h-5 w-12 bg-slate-100 dark:bg-neutral-800 rounded" />
                                                </div>
                                            </div>
                                            <div className="h-3 w-1/3 bg-slate-200/60 dark:bg-neutral-700 rounded mt-2.5 mb-1.5" />
                                            <div className="h-4 w-3/4 bg-slate-200/60 dark:bg-neutral-700 rounded mb-1.5" />
                                            <div className="h-2 w-1/2 bg-slate-100/50 dark:bg-neutral-800 rounded" />
                                        </div>
                                        <div className="flex flex-col bg-transparent h-[210px] animate-pulse">
                                            <div className="flex flex-col rounded-[12px] overflow-hidden border border-slate-200/20 shadow-[0_1px_4px_rgba(0,0,0,0.02)] w-full">
                                                <div className="w-full aspect-square bg-[#F3F4F6] dark:bg-neutral-800" />
                                                <div className="w-full bg-white dark:bg-neutral-900 flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100/50">
                                                    <div className="h-4 w-10 bg-slate-100 dark:bg-neutral-800 rounded" />
                                                    <div className="h-5 w-12 bg-slate-100 dark:bg-neutral-800 rounded" />
                                                </div>
                                            </div>
                                            <div className="h-3 w-1/3 bg-slate-200/60 dark:bg-neutral-700 rounded mt-2.5 mb-1.5" />
                                            <div className="h-4 w-3/4 bg-slate-200/60 dark:bg-neutral-700 rounded mb-1.5" />
                                            <div className="h-2 w-1/2 bg-slate-100/50 dark:bg-neutral-800 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                    @keyframes pulse-subtle {
                        0%, 100% { opacity: 1; transform: scale(1.1); }
                        50% { opacity: .8; transform: scale(1.05); }
                    }
                    .animate-pulse-subtle {
                        animation: pulse-subtle 2s infinite ease-in-out;
                    }
                `}} />
        </div>
    );
};

export default CategoryProductsPage;
