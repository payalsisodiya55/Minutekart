import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Minus, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "@shared/components/ui/Toast";
import { useCartAnimation } from "../../context/CartAnimationContext";
import { resolveQuickImageUrl } from "../../utils/image";
import { getCloudinarySrcSet } from "@/shared/utils/cloudinaryUtils";

import { motion, AnimatePresence } from "framer-motion";

import { getQuickProductPath } from "../../utils/routes";
import { useSettings } from "@core/context/SettingsContext";

const ScallopedBadge = ({ text, className }) => (
  <div className={cn("relative w-9 h-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_1px_3px_rgba(168,85,247,0.4)]">
      <path
        fill="#A364FF"
        d="M50 0 C 54 0, 56 4, 61 5 C 66 6, 70 2, 75 5 C 80 8, 81 14, 84 18 C 88 22, 94 23, 96 28 C 98 33, 94 38, 94 43 C 94 48, 98 52, 98 57 C 98 62, 94 66, 92 71 C 90 76, 92 82, 88 86 C 84 90, 78 89, 73 92 C 68 95, 66 100, 61 100 C 56 100, 53 96, 48 96 C 43 96, 40 100, 35 99 C 30 98, 28 92, 23 90 C 18 88, 12 89, 9 84 C 6 79, 10 74, 9 69 C 8 64, 2 61, 2 56 C 2 51, 6 47, 7 42 C 8 37, 4 31, 6 26 C 8 21, 14 20, 18 16 C 22 12, 24 6, 29 4 C 34 2, 38 6, 43 5 C 48 4, 49 0, 53 0"
      />
    </svg>
    <div className="relative z-10 text-white font-black flex flex-col items-center justify-center leading-none text-center">
      {text.includes('%') ? (
        <>
          <span className="text-[9px] leading-tight">{text.split(' ')[0]}</span>
          <span className="text-[6px] opacity-90 tracking-tighter uppercase">{text.split(' ')[1] || 'OFF'}</span>
        </>
      ) : (
        <span className="text-[8px] uppercase tracking-tighter">{text}</span>
      )}
    </div>
  </div>
);

const ProductCard = React.memo(
  ({ product, badge, className, compact = false, neutralBg = false, curvedInfo = false }) => {
    const navigate = useNavigate();
    const { toggleWishlist: toggleWishlistGlobal, isInWishlist } =
      useWishlist();
    const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
    const { showToast } = useToast();
    const { animateAddToCart, animateRemoveFromCart } = useCartAnimation();

    const [showHeartPopup, setShowHeartPopup] = React.useState(false);
    const [showVariantsModal, setShowVariantsModal] = React.useState(false);
    const [currentImgIdx, setCurrentImgIdx] = React.useState(0);
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

    const getComparableProductId = React.useCallback(
      (value) => String(value ?? "").split("::")[0],
      [],
    );

    const cartItem = React.useMemo(
      () =>
        cart.find(
          (item) =>
            getComparableProductId(item.productId || item.itemId || item.id || item._id) ===
            getComparableProductId(product.id || product._id),
        ),
      [cart, getComparableProductId, product.id, product._id],
    );
    const quantity = React.useMemo(() => {
      return cart
        .filter(
          (item) =>
            getComparableProductId(item.productId || item.itemId || item.id || item._id) ===
            getComparableProductId(product.id || product._id),
        )
        .reduce((sum, item) => sum + item.quantity, 0);
    }, [cart, getComparableProductId, product.id, product._id]);
    const isWishlisted = isInWishlist(product.id || product._id);

    const handleProductClick = React.useCallback(
      () => {
        const productId = product.id || product._id;
        if (!productId) return;
        navigate(getQuickProductPath(productId), { state: { product } });
      },
      [navigate, product],
    );

    const toggleWishlist = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isWishlisted) {
          setShowHeartPopup(true);
          setTimeout(() => setShowHeartPopup(false), 1000);
        }

        toggleWishlistGlobal(product);
        showToast(
          isWishlisted
            ? `${product.name} removed from wishlist`
            : `${product.name} added to wishlist`,
          isWishlisted ? "info" : "success",
        );
      },
      [isWishlisted, toggleWishlistGlobal, product, showToast],
    );

    const handleAddToCart = React.useCallback(
      async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.variants && product.variants.length > 1) {
          setShowVariantsModal(true);
          return;
        }

        let targetProduct = product;
        if (product.variants && product.variants.length === 1) {
          const v = product.variants[0];
          const variantId = `${product.id}::${v.sku}`;
          const vPrice = v.salePrice > 0 ? v.salePrice : v.price;
          const vOriginalPrice = Math.max(vPrice, v.price);
          targetProduct = {
            ...product,
            id: variantId,
            _id: variantId,
            productId: variantId,
            itemId: variantId,
            name: `${product.name} (${v.name})`,
            price: vPrice,
            originalPrice: vOriginalPrice,
            mrp: vOriginalPrice,
            weight: v.name,
            stock: v.stock,
            sku: v.sku,
          };
        }

        const stock = Number(targetProduct.stock ?? Infinity);
        if (stock <= 0) {
          showToast("This product is out of stock", "error");
          return;
        }

        const result = await addToCart(targetProduct);
        if (result?.ok === false) {
          showToast(result.error || "Cannot add item to cart", "error");
          return;
        }

        if (imageRef.current) {
          const resolvedSrc = resolveQuickImageUrl(targetProduct.image || targetProduct.mainImage) || targetProduct.image || targetProduct.mainImage;
          animateAddToCart(
            imageRef.current.getBoundingClientRect(),
            resolvedSrc,
          );
        }
      },
      [animateAddToCart, product, addToCart, showToast],
    );

    const handleIncrement = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.variants && product.variants.length > 1) {
          setShowVariantsModal(true);
          return;
        }

        let targetId = product.id || product._id;
        let targetStock = Number(product.stock ?? Infinity);
        if (product.variants && product.variants.length === 1) {
          const v = product.variants[0];
          targetId = `${product.id}::${v.sku}`;
          targetStock = Number(v.stock ?? Infinity);
        }

        if (quantity >= targetStock) {
          showToast(`Only ${targetStock} in stock`, "error");
          return;
        }
        updateQuantity(targetId, 1);
      },
      [updateQuantity, product, quantity, showToast],
    );

    const handleDecrement = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.variants && product.variants.length > 1) {
          setShowVariantsModal(true);
          return;
        }

        let targetId = product.id || product._id;
        if (product.variants && product.variants.length === 1) {
          const v = product.variants[0];
          targetId = `${product.id}::${v.sku}`;
        }

        if (quantity === 1) {
          const resolvedSrc = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
          if (imageRef.current) {
            animateRemoveFromCart(
              imageRef.current.getBoundingClientRect(),
              resolvedSrc,
            );
          } else {
            animateRemoveFromCart(null, resolvedSrc);
          }
          removeFromCart(targetId);
        } else {
          updateQuantity(targetId, -1);
        }
      },
      [
        quantity,
        animateRemoveFromCart,
        product,
        removeFromCart,
        updateQuantity,
      ],
    );

    const handleVariantAddToCart = React.useCallback(
      async (e, variant) => {
        e.preventDefault();
        e.stopPropagation();
        const variantId = `${product.id}::${variant.sku}`;
        const stock = Number(variant.stock ?? Infinity);
        if (stock <= 0) {
          showToast("This variant is out of stock", "error");
          return;
        }

        const vPrice = variant.salePrice > 0 ? variant.salePrice : variant.price;
        const vOriginalPrice = Math.max(vPrice, variant.price);

        const variantProductObj = {
          ...product,
          id: variantId,
          _id: variantId,
          productId: variantId,
          itemId: variantId,
          name: `${product.name} (${variant.name})`,
          price: vPrice,
          originalPrice: vOriginalPrice,
          mrp: vOriginalPrice,
          weight: variant.name,
          stock: variant.stock,
          sku: variant.sku,
        };

        const result = await addToCart(variantProductObj);
        if (result?.ok === false) {
          showToast(result.error || "Cannot add variant to cart", "error");
          return;
        }

        showToast(`${variantProductObj.name} added to cart`, "success");
      },
      [product, addToCart, showToast],
    );

    const handleVariantIncrement = React.useCallback(
      (e, variant) => {
        e.preventDefault();
        e.stopPropagation();
        const variantId = `${product.id}::${variant.sku}`;
        const item = cart.find(
          (item) => String(item.productId || item.itemId || item.id || item._id) === variantId
        );
        const stock = Number(variant.stock ?? Infinity);
        if (item) {
          if (item.quantity >= stock) {
            showToast(`Only ${stock} in stock`, "error");
            return;
          }
          updateQuantity(variantId, 1);
        }
      },
      [cart, product.id, updateQuantity, showToast],
    );

    const handleVariantDecrement = React.useCallback(
      (e, variant) => {
        e.preventDefault();
        e.stopPropagation();
        const variantId = `${product.id}::${variant.sku}`;
        const item = cart.find(
          (item) => String(item.productId || item.itemId || item.id || item._id) === variantId
        );
        if (item) {
          if (item.quantity === 1) {
            removeFromCart(variantId);
          } else {
            updateQuantity(variantId, -1);
          }
        }
      },
      [cart, product.id, updateQuantity, removeFromCart],
    );

    const hasSalePrice = product.salePrice > 0 && product.price > product.salePrice;
    const hasOriginalPrice = product.originalPrice > product.price && product.originalPrice > 0;
    
    const displayPrice = hasSalePrice ? product.salePrice : product.price;
    const strikethroughPrice = hasSalePrice ? product.price : (hasOriginalPrice ? product.originalPrice : null);
    const discountPercent = hasSalePrice 
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : hasOriginalPrice 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
      <div
        className={cn(
          "flex-shrink-0 w-full flex flex-col h-full cursor-pointer group bg-transparent",
          className,
        )}
        onClick={handleProductClick}>
        <div
          className={cn(
            "flex flex-col h-full w-full rounded-xl overflow-hidden transition-all duration-500 product-card-container premium-wave-shimmer",
            "bg-[#FFF5F5] dark:bg-neutral-900 border border-red-100/50 dark:border-neutral-800 shadow-sm",
            "hover:shadow-md",
          )}>
          {/* Top Image Section */}
          <div className="relative overflow-hidden w-full h-[115px] md:h-[135px] p-1 md:p-2 bg-white dark:bg-neutral-800">
            {/* Badge (Professional Tag) */}
            {(badge || product.discount || discountPercent > 0) && (
              <div className="absolute top-0.5 left-0.5 z-10">
                <ScallopedBadge
                  text={badge || product.discount || (discountPercent > 0 ? `${discountPercent}% OFF` : null)}
                />
              </div>
            )}

            <button
              onClick={toggleWishlist}
              className="absolute top-1 right-1 z-10 w-6 h-6 md:w-8 md:h-8 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-neutral-800 transition-all active:scale-90 border border-slate-100/50 dark:border-neutral-700">
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}>
                <Heart
                  size={window.innerWidth < 768 ? 12 : 16}
                  className={cn(
                    isWishlisted ? "text-red-500 fill-red-500" : "text-slate-300 dark:text-slate-500 group-hover:text-slate-400 dark:group-hover:text-slate-300",
                  )}
                />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHeartPopup && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1, y: 0 }}
                  animate={{ scale: 2.5, opacity: 0, y: -60 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none text-red-500/30">
                  <Heart size={48} fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full h-full rounded-md overflow-hidden bg-white dark:bg-neutral-800 flex items-center justify-center transition-transform duration-500 group-hover:scale-105 relative">
              {allImages.length > 1 ? (
                <div className="w-full h-full relative">
                  {/* Scrollable image list container */}
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
                        className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-0.5 md:p-1"
                      >
                        <img
                          ref={imgIdx === 0 ? imageRef : null}
                          src={resolveQuickImageUrl(imgUrl) || imgUrl}
                          srcSet={getCloudinarySrcSet(imgUrl)}
                          sizes="(max-width: 768px) 150px, (max-width: 1024px) 200px, 250px"
                          alt={`${product.name} - ${imgIdx + 1}`}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-1 left-2 flex items-center gap-1 z-10 pointer-events-none">
                    {allImages.map((_, dotIdx) => (
                      <div
                        key={dotIdx}
                        className={cn(
                          "w-1 h-1 rounded-full transition-all duration-300",
                          dotIdx === currentImgIdx
                            ? "bg-slate-800 w-2.5"
                            : "bg-slate-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <img
                  ref={imageRef}
                  src={resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage}
                  srcSet={getCloudinarySrcSet(product.image || product.mainImage)}
                  sizes="(max-width: 768px) 150px, (max-width: 1024px) 200px, 250px"
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-0.5 md:p-1"
                  loading="lazy"
                />
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className={cn(
            "flex flex-col flex-1 px-1.5 py-1 space-y-0.5 bg-[#FFF5F5] dark:bg-neutral-900 border-t border-red-100/30 dark:border-neutral-800 relative product-content-area transition-all duration-300",
          )}>
            <div className="space-y-0">
              <div className="flex items-center gap-1 text-[7.5px] md:text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <Clock size={7} className="text-emerald-600 dark:text-emerald-400" />
                <span>{product.deliveryTime || "10 MINS"}</span>
              </div>
              <h3 className="text-[11px] md:text-[12.5px] font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">
                {product.name}
              </h3>
              <p className="text-[8px] md:text-[10px] text-slate-400 font-semibold italic">
                {product.weight || "1 unit"}
              </p>
            </div>

            <div className="mt-auto flex items-center justify-between gap-1 pt-0.5 border-t border-slate-200/20 dark:border-neutral-800">
              <div className="flex flex-col justify-center">
                <span className="text-[12.5px] md:text-[14px] font-black text-slate-900 dark:text-white leading-none">
                  ₹{Number(displayPrice || 0).toLocaleString()}
                </span>
                {strikethroughPrice && (
                  <span className="text-[8.5px] md:text-[9.5px] text-slate-400 dark:text-slate-500 line-through font-bold leading-none mt-0.5">
                    ₹{Number(strikethroughPrice || 0).toLocaleString()}
                  </span>
                )}
              </div>

              {quantity > 0 ? (
                <div className="flex items-center bg-[#0c831f] text-white rounded-xl shadow-sm h-8 md:h-9 overflow-hidden w-[72px] md:w-[80px] justify-between">
                  <button
                    onClick={handleDecrement}
                    className="w-6 md:w-7.5 h-full hover:bg-black/10 transition-colors flex items-center justify-center font-black">
                    <Minus size={10} strokeWidth={4} />
                  </button>
                  <span className="text-[11px] md:text-[13px] font-black min-w-[16px] md:min-w-[20px] text-center px-0.5">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="w-6 md:w-7.5 h-full hover:bg-black/10 transition-colors flex items-center justify-center font-black">
                    <Plus size={10} strokeWidth={4} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex flex-col items-center justify-center bg-white dark:bg-neutral-800 border border-[#0c831f] text-[#0c831f] rounded-xl shadow-sm transition-all duration-300 active:scale-95 w-[72px] md:w-[80px] h-8 md:h-9 px-1 hover:bg-[#0c831f]/5 font-bold">
                  <span className="text-[11px] md:text-[12px] font-black uppercase leading-none">ADD</span>
                  {product.variants && product.variants.length > 1 && (
                    <span className="text-[7px] md:text-[8px] font-bold text-[#0c831f]/90 leading-none mt-0.5 whitespace-nowrap">
                      {product.variants.length} options
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Variants Modal */}
        {showVariantsModal && typeof window !== "undefined" && createPortal(
          <div className="quick-theme-scope">
            <AnimatePresence>
              <div 
                className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVariantsModal(false);
                }}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full max-w-[480px] rounded-t-[24px] bg-white dark:bg-neutral-900 p-5 shadow-2xl flex flex-col max-h-[80vh] relative pointer-events-auto mb-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {/* Close Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVariantsModal(false);
                    }}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Product Name Title */}
                  <h3 className="text-[16px] font-black pr-8 text-[#17212f] dark:text-white leading-tight mb-4 text-left">
                    {product.name}
                  </h3>

                  {/* Variants List */}
                  <div className="overflow-y-auto space-y-3 max-h-[50vh] pr-1 py-1">
                    {product.variants.map((v, idx) => {
                      const variantId = `${product.id}::${v.sku}`;
                      const variantQty = cart
                        .filter(
                          (item) =>
                            String(item.productId || item.itemId || item.id || item._id) === variantId
                        )
                        .reduce((sum, item) => sum + item.quantity, 0);

                      const vPrice = v.salePrice > 0 ? v.salePrice : v.price;
                      const vOriginalPrice = Math.max(vPrice, v.price);
                      const hasDiscount = vOriginalPrice > vPrice;
                      const discountPct = hasDiscount
                        ? Math.round(((vOriginalPrice - vPrice) / vOriginalPrice) * 100)
                        : 0;

                      return (
                        <div
                          key={v.sku || idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Variant Image Wrapper */}
                            <div className="relative w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-1 flex-shrink-0">
                              {hasDiscount && (
                                <span className="absolute top-0.5 left-0.5 z-10 bg-blue-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded leading-none shadow-sm scale-90 origin-top-left">
                                  {discountPct}% OFF
                                </span>
                              )}
                              <img
                                src={resolveQuickImageUrl(product.image || product.mainImage)}
                                alt={v.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://cdn-icons-png.flaticon.com/128/2321/2321831.png";
                                }}
                              />
                            </div>

                            <div className="flex flex-col text-left">
                              <span className="text-[13px] font-black text-slate-800 dark:text-neutral-200">
                                {v.name}
                              </span>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-[14px] font-black text-[#0c831f]">
                                  ₹{vPrice}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-slate-400 line-through font-semibold">
                                    ₹{vOriginalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Variant Action Button */}
                          <div>
                            {variantQty > 0 ? (
                              <div className="flex items-center bg-[#0c831f] text-white rounded-xl shadow-sm h-8 overflow-hidden w-[72px] justify-between">
                                <button
                                  onClick={(e) => handleVariantDecrement(e, v)}
                                  className="w-6 h-full hover:bg-black/10 transition-colors flex items-center justify-center"
                                >
                                  <Minus size={10} strokeWidth={4} />
                                </button>
                                <span className="text-[11px] font-black min-w-[16px] text-center">
                                  {variantQty}
                                </span>
                                <button
                                  onClick={(e) => handleVariantIncrement(e, v)}
                                  className="w-6 h-full hover:bg-black/10 transition-colors flex items-center justify-center"
                                >
                                  <Plus size={10} strokeWidth={4} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleVariantAddToCart(e, v)}
                                className="flex items-center justify-center bg-white dark:bg-neutral-800 border border-[#0c831f] text-[#0c831f] rounded-xl shadow-sm transition-all duration-300 active:scale-95 w-[72px] h-8 font-black text-[11px] hover:bg-[#0c831f]/5"
                              >
                                ADD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>
          </div>,
          document.body
        )}
      </div>
    );
  },
);

export default ProductCard;
