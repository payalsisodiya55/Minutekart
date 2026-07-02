import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Heart,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "@shared/components/ui/Toast";
import { customerApi } from "../services/customerApi";
import { resolveQuickImageUrl } from "../utils/image";
import ProductCard from "../components/shared/ProductCard";

const getProductIdentifier = (value) =>
  String(value?.productId || value?.itemId || value?.id || value?._id || "").split("::")[0];

const normalizePrice = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanDescription = (text) => {
  if (!text) return "No description is available for this product yet.";

  const value = String(text).trim();
  if (!value) return "No description is available for this product yet.";

  if (value.startsWith("{\\rtf") || value.includes("\\par")) {
    const cleaned = value
      .replace(/\{\\[^}]*\}/g, " ")
      .replace(/\\[a-z]+\d*\s?/gi, " ")
      .replace(/\\'/g, "'")
      .replace(/[{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned || "No description is available for this product yet.";
  }

  return value;
};

const normalizeProduct = (product = {}, fallback = {}) => {
  const source = { ...fallback, ...product };
  const imageCandidates = [
    source.mainImage,
    source.image,
    ...(Array.isArray(source.galleryImages) ? source.galleryImages : []),
  ]
    .map((image) => resolveQuickImageUrl(image) || image)
    .filter(Boolean);

  const images = [...new Set(imageCandidates)];
  const salePrice = normalizePrice(source.salePrice, 0);
  const basePrice = normalizePrice(source.price, salePrice);
  const price = salePrice > 0 ? salePrice : basePrice;
  const originalPrice = Math.max(
    price,
    normalizePrice(source.originalPrice ?? source.mrp ?? source.price, price),
  );
  const stock = normalizePrice(source.stock, 0);

  return {
    ...source,
    id: source.id || source._id,
    _id: source._id || source.id,
    name: source.name || "Product",
    category:
      source.category ||
      source.categoryName ||
      source.categoryId?.name ||
      "Quick Commerce",
    price,
    originalPrice,
    description: cleanDescription(source.description),
    images:
      images.length > 0
        ? images
        : ["https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop"],
    details: [
      {
        label: "Unit",
        value: source.weight || source.unit || "1 unit",
      },
      {
        label: "Stock",
        value: stock > 0 ? `${stock} available` : "Out of stock",
      },
      {
        label: "Brand",
        value: source.brand || "Quick Select",
      },
    ],
    storeName:
      source.storeName ||
      source.restaurantName ||
      source.seller?.name ||
      source.sellerId?.name ||
      source.store?.name ||
      source.storeId?.name ||
      "Fresh Mart",
    deliveryTime: source.deliveryTime || "8-12 mins",
  };
};

const ProductDetailPage = () => {
  const { productId, id } = useParams();
  const resolvedProductId = productId || id;
  const location = useLocation();
  const navigate = useNavigate();

  const initialProduct = useMemo(() => {
    const routeProduct = location.state?.product;
    return routeProduct ? normalizeProduct(routeProduct) : null;
  }, [location.state]);

  const [product, setProduct] = useState(initialProduct);
  const [activeImage, setActiveImage] = useState(initialProduct?.images?.[0] || "");
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return initialProduct.variants[0];
    }
    return null;
  });
  const [loadingProduct, setLoadingProduct] = useState(!initialProduct);
  const [productError, setProductError] = useState("");
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const detailScrollRef = React.useRef(null);

  useEffect(() => {
    if (detailScrollRef.current) {
      const width = detailScrollRef.current.clientWidth;
      if (width > 0) {
        detailScrollRef.current.scrollLeft = currentImgIdx * width;
      }
    }
  }, [currentImgIdx]);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist: toggleWishlistGlobal, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const currentVariantId = useMemo(() => {
    if (!product) return "";
    return selectedVariant ? `${product.id}::${selectedVariant.sku}` : product.id;
  }, [product, selectedVariant]);

  const quantity = useMemo(() => {
    if (!product) return 0;
    const cartItem = cart.find(
      (item) => (item.productId || item.itemId || item.id || item._id) === currentVariantId,
    );
    return cartItem ? cartItem.quantity : 0;
  }, [cart, product, currentVariantId]);

  const isWishlisted = product
    ? isInWishlist(product.id || product._id)
    : false;

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      if (!resolvedProductId) {
        setLoadingProduct(false);
        setProductError("Product id is missing from the route.");
        return;
      }

      setLoadingProduct(true);
      setProductError("");

      try {
        const response = await customerApi.getProductDetails(resolvedProductId);
        const result =
          response?.data?.result ||
          response?.data?.data ||
          response?.data?.product ||
          null;

        if (!result) {
          throw new Error("Product not found");
        }

        if (!cancelled) {
          const normalized = normalizeProduct(result, location.state?.product);
          setProduct(normalized);
          setActiveImage((currentImage) => currentImage || normalized.images[0]);
        }
      } catch (error) {
        if (!cancelled) {
          setProduct(null);
          setProductError(
            error?.response?.data?.message || "Unable to load this product.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [location.state, resolvedProductId]);

  useEffect(() => {
    if (product?.images?.length) {
      setActiveImage(product.images[0]);
    }
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      if (!resolvedProductId) {
        setReviewLoading(false);
        return;
      }

      setReviewLoading(true);

      try {
        const response = await customerApi.getProductReviews(resolvedProductId);
        if (!cancelled) {
          const rawReviews = response?.data?.results || [];
          const uniqueReviews = [];
          const seenKeys = new Set();
          
          rawReviews.forEach(review => {
            const id = review._id || review.id;
            const uniqueKey = `${review.userId || review.userName || ''}-${review.rating || 0}-${(review.comment || '').trim()}`;
            
            if (id && !seenKeys.has(id) && !seenKeys.has(uniqueKey)) {
              seenKeys.add(id);
              seenKeys.add(uniqueKey);
              uniqueReviews.push(review);
            } else if (!id && !seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              uniqueReviews.push(review);
            }
          });

          setReviews(uniqueReviews);
        }
      } catch (error) {
        if (!cancelled) {
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setReviewLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [resolvedProductId]);

  useEffect(() => {
    let cancelled = false;
    if (!product) return;

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const catId = product.subcategoryId?._id || product.subcategoryId || product.categoryId?._id || product.categoryId;
        const storeId = product.sellerId || product.storeId || (product.seller?._id || product.seller?.id);

        if (!catId) {
          setSimilarProducts([]);
          return;
        }

        const response = await customerApi.getProducts({
          categoryId: catId,
          storeId: storeId,
          limit: 20
        });

        if (!cancelled && response?.data?.success) {
          const rawResult = response.data.result;
          const dbProds = Array.isArray(response.data.results)
            ? response.data.results
            : Array.isArray(rawResult?.items)
              ? rawResult.items
              : Array.isArray(rawResult)
                ? rawResult
                : [];

          const formattedProds = dbProds.map(p => ({
            ...p,
            id: p._id || p.id,
            image: p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
            price: p.salePrice || p.price,
            originalPrice: p.price,
            weight: p.weight || p.unit || "1 unit",
            deliveryTime: "8-15 mins"
          }));

          const filtered = formattedProds.filter(p => String(p.id) !== String(product.id));
          setSimilarProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching similar products:", error);
        if (!cancelled) setSimilarProducts([]);
      } finally {
        if (!cancelled) setSimilarLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      cancelled = true;
    };
  }, [product]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "4.8";
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlistGlobal(product);
    showToast(
      isWishlisted
        ? `${product.name} removed from wishlist`
        : `${product.name} added to wishlist`,
      isWishlisted ? "info" : "success",
    );
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedProductId || !newReview.comment.trim()) return;

    try {
      setIsSubmittingReview(true);
      const response = await customerApi.submitReview({
        productId: resolvedProductId,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });

      if (response?.data?.success) {
        showToast("Review submitted for moderation", "success");
        setNewReview({ rating: 5, comment: "" });
      }
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to submit review",
        "error",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const displayPrice = selectedVariant
    ? (selectedVariant.salePrice > 0 ? selectedVariant.salePrice : selectedVariant.price)
    : (product?.price || 0);

  const displayOriginalPrice = selectedVariant
    ? Math.max(displayPrice, selectedVariant.price)
    : (product?.originalPrice || 0);

  const displayDiscount = displayOriginalPrice > displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : 0;

  const displayWeight = selectedVariant
    ? selectedVariant.name
    : (product?.weight || product?.unit || "1 unit");

  const displayStock = selectedVariant
    ? selectedVariant.stock
    : (product?.stock || 0);

  const variantProduct = useMemo(() => {
    if (!product) return null;
    if (!selectedVariant) return product;
    return {
      ...product,
      id: currentVariantId,
      _id: currentVariantId,
      productId: currentVariantId,
      itemId: currentVariantId,
      name: `${product.name} (${selectedVariant.name})`,
      price: displayPrice,
      originalPrice: displayOriginalPrice,
      mrp: displayOriginalPrice,
      weight: selectedVariant.name,
      stock: selectedVariant.stock,
      sku: selectedVariant.sku,
    };
  }, [product, selectedVariant, currentVariantId, displayPrice, displayOriginalPrice]);

  const displayDetails = useMemo(() => {
    if (!product) return [];
    return [
      {
        label: "Unit",
        value: displayWeight,
      },
      {
        label: "Stock",
        value: displayStock > 0 ? `${displayStock} available` : "Out of stock",
      },
      {
        label: "Brand",
        value: product.brand || "Quick Select",
      },
    ];
  }, [displayWeight, displayStock, product?.brand]);

  const handleAddToCart = async () => {
    const stock = Number(displayStock ?? Infinity);
    if (stock <= 0) {
      showToast("This product is out of stock", "error");
      return;
    }
    const result = await addToCart(variantProduct);
    if (result?.ok === false) {
      showToast(result.error || "Cannot add item to cart", "error");
      return;
    }
    showToast(`${variantProduct.name} added to cart`, "success");
  };

  const handleIncrement = () => {
    const stock = Number(displayStock ?? Infinity);
    if (quantity >= stock) {
      showToast(`Only ${stock} in stock`, "error");
      return;
    }
    updateQuantity(currentVariantId, 1);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      removeFromCart(currentVariantId);
    } else {
      updateQuantity(currentVariantId, -1);
    }
  };

  if (loadingProduct) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1920px] items-center justify-center px-4 md:px-[50px]">
        <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-6 py-4 shadow-sm">
          <Loader2 className="animate-spin text-[#0c831f]" size={22} />
          <span className="font-bold text-slate-600 dark:text-slate-400">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1920px] flex-col items-center justify-center px-4 text-center md:px-[50px]">
        <h1 className="text-2xl font-black text-foreground">Product not found</h1>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
          {productError || "This product may have been removed or is no longer available."}
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-2xl bg-[#0c831f] px-6 py-3 text-white hover:bg-[#0b721b]"
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1920px] animate-in px-4 py-4 fade-in duration-700 md:px-[50px] md:py-8">
      <button
        onClick={() => navigate(-1)}
        className="group mb-6 inline-flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 transition-colors hover:text-[#0c831f] dark:hover:text-emerald-400"
      >
        <ArrowLeft
          size={20}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back
      </button>

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <div className="space-y-4 lg:w-[45%] xl:w-[40%]">
          {/* Swipeable Carousel */}
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-border bg-card dark:bg-background shadow-sm transition-colors group">
            <div 
              ref={detailScrollRef}
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
              {product.images.map((image, index) => (
                <div 
                  key={`${image}-${index}`}
                  className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center cursor-zoom-in"
                  onClick={() => setIsFullscreenOpen(true)}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal"
                  />
                </div>
              ))}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className={cn(
                "absolute right-5 top-5 rounded-full p-3.5 shadow-lg transition-all z-20",
                isWishlisted
                  ? "bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "bg-card dark:bg-background text-slate-400 dark:text-slate-300",
              )}
            >
              <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} className={cn(isWishlisted && "fill-current")} />
            </button>

            {/* Dot Indicators */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {product.images.map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      dotIdx === currentImgIdx
                        ? "bg-slate-800 dark:bg-white w-4"
                        : "bg-slate-300 dark:bg-slate-700"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 md:space-y-8 lg:w-[55%] xl:w-[60%]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full border border-[#0c831f]/20 bg-[#0c831f]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#0c831f]">
                {product.category}
              </span>
              <div className="flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-bold text-red-500">
                <Star size={12} fill="currentColor" />
                {averageRating} ({reviews.length || "0"})
              </div>
            </div>

            <h1 className="mb-2 text-3xl font-black leading-tight text-foreground md:text-4xl transition-colors">
              {product.name}
            </h1>

            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <ShieldCheck size={14} />
              </div>
              <span className="text-sm font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                Sold by:
                {" "}
                <span className="text-foreground underline decoration-emerald-500/30 decoration-2 underline-offset-4">
                  {product.storeName}
                </span>
              </span>
            </div>

            <div className="mb-5 flex items-baseline gap-4">
              <span className="text-4xl font-black text-[#0c831f] dark:text-emerald-500">
                {"\u20B9"}
                {displayPrice}
              </span>
              {displayOriginalPrice > displayPrice && (
                <>
                  <span className="text-lg font-bold text-slate-400 dark:text-slate-500 line-through">
                    {"\u20B9"}
                    {displayOriginalPrice}
                  </span>
                  <span className="rounded-lg bg-red-50 dark:bg-red-950/30 px-2 py-1 text-xs font-black uppercase text-red-500">
                    {displayDiscount}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-300 transition-colors font-medium">
              {product.description}
            </p>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="rounded-[2rem] border border-border bg-card dark:bg-slate-900/40 p-6 transition-all shadow-sm">
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-[#0c831f] dark:text-emerald-500 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0c831f] dark:bg-emerald-500 animate-pulse" />
                Select Variant
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?._id ? selectedVariant._id === v._id : (selectedVariant?.name === v.name && selectedVariant?.sku === v.sku);
                  const vPrice = v.salePrice > 0 ? v.salePrice : v.price;
                  const vOriginalPrice = Math.max(vPrice, v.price);
                  const hasDiscount = vOriginalPrice > vPrice;
                  const discountPct = hasDiscount ? Math.round(((vOriginalPrice - vPrice) / vOriginalPrice) * 100) : 0;

                  return (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "group relative flex flex-col items-start rounded-2xl border-2 px-5 py-3 transition-all duration-300 text-left min-w-[120px] shadow-sm",
                        isSelected
                          ? "border-[#0c831f] bg-green-50/50 dark:bg-green-950/20 text-[#0c831f] dark:text-emerald-400 ring-2 ring-green-100 dark:ring-green-950/40"
                          : "border-border bg-card dark:bg-slate-900 text-foreground hover:border-slate-300 dark:hover:border-slate-700 hover:shadow"
                      )}
                    >
                      <span className="text-sm font-black tracking-tight">{v.name}</span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className={cn(
                          "text-xs font-extrabold",
                          isSelected ? "text-[#0c831f] dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"
                        )}>
                          ₹{vPrice}
                        </span>
                        {hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through font-semibold font-medium">
                            ₹{vOriginalPrice}
                          </span>
                        )}
                      </div>
                      {hasDiscount && (
                        <span className="absolute -top-2 -right-2 rounded-lg bg-red-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                          {discountPct}% OFF
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-6 rounded-[2.5rem] border border-border bg-card dark:bg-slate-900/50 p-6 sm:flex-row transition-colors">
            <div className="w-full sm:w-72">
              {quantity > 0 ? (
                <div className="flex h-16 w-full items-center rounded-2xl bg-[#0c831f] px-2 text-white shadow-xl shadow-green-100">
                  <button
                    onClick={handleDecrement}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-white/20"
                  >
                    <Minus size={24} strokeWidth={3} />
                  </button>
                  <span className="flex-1 text-center text-xl font-black">{quantity}</span>
                  <button
                    disabled={quantity >= Number(displayStock ?? Infinity)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handleIncrement}
                  >
                    <Plus size={24} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                  <Button
                    onClick={handleAddToCart}
                    className="h-16 w-full rounded-2xl bg-[#0c831f] text-lg font-black text-white shadow-xl shadow-green-100 transition-all hover:-translate-y-1 hover:bg-[#0b721b]"
                  >
                  <Plus className="mr-2" size={24} strokeWidth={3} />
                  ADD TO CART
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="flex items-center justify-center gap-1 text-xs font-black uppercase tracking-widest text-[#0c831f] sm:justify-start">
                <ShieldCheck size={14} />
                Hygiene Guaranteed
              </span>
              <span className="flex items-center justify-center gap-1 text-sm font-bold text-slate-400 dark:text-slate-500 sm:justify-start">
                <Clock size={14} />
                Delivered in {product.deliveryTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {displayDetails.map((detail) => (
              <div
                key={detail.label}
                className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-colors"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {detail.label}
                </p>
                <p className="text-sm font-black text-foreground">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20 border-t border-border pt-16 max-w-4xl mx-auto w-full">
        <div className="space-y-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-3xl font-black text-foreground">Customer Reviews</h3>
            <div className="flex items-center gap-2 rounded-xl border border-[#0c831f]/10 bg-[#0c831f]/5 px-4 py-2">
              <MessageSquare size={18} className="text-[#0c831f]" />
              <span className="font-black text-[#0c831f]">
                {reviews.length} Verified
              </span>
            </div>
          </div>

          {reviewLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="animate-spin text-[#0c831f]" size={32} />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-colors"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="ds-h2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-card dark:bg-background border border-border text-slate-400 dark:text-slate-500">
                        {(review.userId?.profileImage || review.userId?.image || review.userAvatar) ? (
                          <img
                            src={resolveQuickImageUrl(review.userId?.profileImage || review.userId?.image || review.userAvatar)}
                            alt={review.userId?.name || review.userName || "Reviewer"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (review.userId?.name || review.userName || "?")[0]
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-foreground transition-colors">
                          {review.userId?.name || review.userName || "Anonymous"}
                        </h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={12}
                              className={cn(
                                index < review.rating
                                  ? "fill-red-400 text-red-400"
                                  : "text-slate-200 dark:text-slate-700",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-300 transition-colors">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[3rem] border-2 border-dashed border-border bg-background p-20 text-center">
              <p className="text-sm font-black uppercase text-slate-400">
                No reviews yet. Be the first!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Similar products section */}
      {!similarLoading && similarProducts.length > 0 && (
        <div className="mt-20 border-t border-border pt-16">
          <h3 className="mb-8 text-2xl font-black text-foreground">
            Similar products
          </h3>

          <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {similarProducts.slice(0, 6).map((item) => (
              <ProductCard key={item.id} product={item} compact={true} />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate(`/quick/product/${product.id}/similar`)}
              className="flex items-center justify-between w-full max-w-md rounded-2xl bg-blue-50/50 dark:bg-slate-900/50 border border-blue-100/50 dark:border-slate-800/50 px-5 py-3.5 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 overflow-hidden">
                  {similarProducts.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="inline-block h-10 w-10 rounded-full border-2 border-white dark:border-slate-900 bg-white overflow-hidden shadow-sm flex items-center justify-center p-0.5"
                    >
                      <img
                        src={item.image || item.mainImage}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                  See all products
                </span>
              </div>
              <span className="text-[#0c831f] font-black text-lg">›</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Swipeable Gallery Modal */}
      {isFullscreenOpen && typeof window !== "undefined" && (
        <div className="fixed inset-0 z-[99999] bg-[#f8f9fa] dark:bg-neutral-900 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Close Button */}
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="bg-black text-white hover:bg-neutral-800 p-2.5 rounded-full transition-all shadow-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Gallery Area */}
          <div className="flex-1 flex flex-col justify-center max-h-[60vh] relative">
            <div 
              className="fullscreen-scroll-container w-full h-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none"
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
              ref={(el) => {
                // When fullscreen opens, scroll to the current active image
                if (el && el.scrollLeft === 0 && currentImgIdx > 0) {
                  const width = el.clientWidth;
                  el.scrollLeft = currentImgIdx * width;
                }
              }}
            >
              {product.images.map((image, index) => (
                <div 
                  key={`fullscreen-${image}-${index}`}
                  className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-4"
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="max-h-[50vh] max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex gap-3 justify-center py-4 overflow-x-auto px-4">
              {product.images.map((image, index) => (
                <button
                  key={`thumb-${image}-${index}`}
                  onClick={() => {
                    setCurrentImgIdx(index);
                    // Scroll the main gallery container to the selected index
                    const container = document.querySelector(".fullscreen-scroll-container");
                    if (container) {
                      container.scrollTo({
                        left: index * container.clientWidth,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={cn(
                    "h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all p-1 bg-white shadow-sm",
                    currentImgIdx === index
                      ? "border-[#0c831f] scale-95"
                      : "border-transparent opacity-70"
                  )}
                >
                  <img
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Footer & Page Indicator Container */}
          <div className="mt-auto flex flex-col w-full">
            {/* Footer Area with Price and Cart Button */}
            <div className="bg-white dark:bg-neutral-800 border-t border-slate-100 dark:border-neutral-700 p-5 pb-6">
              <div className="max-w-md mx-auto flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">{displayWeight}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">₹{displayPrice}</span>
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-xs text-slate-400 line-through font-bold">₹{displayOriginalPrice}</span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">Inclusive of all taxes</p>
                </div>

                {quantity > 0 ? (
                  <div className="flex items-center bg-[#0c831f] text-white rounded-xl shadow-sm h-10 w-24 justify-between">
                    <button
                      onClick={handleDecrement}
                      className="w-8 h-full hover:bg-black/10 transition-colors flex items-center justify-center font-black"
                    >
                      <Minus size={12} strokeWidth={4} />
                    </button>
                    <span className="text-sm font-black min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="w-8 h-full hover:bg-black/10 transition-colors flex items-center justify-center font-black"
                    >
                      <Plus size={12} strokeWidth={4} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="bg-[#0c831f] hover:bg-[#0b721b] text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
