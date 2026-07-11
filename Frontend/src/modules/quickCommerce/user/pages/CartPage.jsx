import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Timer,
  Trash2,
  Search,
  Share2,
  Receipt,
  Bike,
  Heart,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@core/context/SettingsContext";
import { useToast } from "@shared/components/ui/Toast";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/shared/ProductCard";
import { customerApi } from "../services/customerApi";
import emptyBoxAnimation from "../assets/lottie/Empty box.json";
import {
  getQuickCategoriesPath,
  getQuickCheckoutPath,
} from "../utils/routes";
import { resolveQuickImageUrl } from "../utils/image";

const DEFAULT_QUICK_BILLING_SETTINGS = {
  deliveryFee: 25,
  deliveryFeeRanges: [],
  freeDeliveryThreshold: 0,
  platformFee: 0,
  gstRate: 0,
};

const calculateQuickCartPricing = ({
  subtotal = 0,
  cartItems = [],
  feeSettings = DEFAULT_QUICK_BILLING_SETTINGS,
  categoryFeeMap = {},
}) => {
  const safeSubtotal = Number(subtotal || 0);
  const freeThreshold = Number(feeSettings?.freeDeliveryThreshold || 0);
  const ranges = Array.isArray(feeSettings?.deliveryFeeRanges)
    ? [...feeSettings.deliveryFeeRanges].sort((a, b) => Number(a.min) - Number(b.min))
    : [];

  let deliveryFee = 0;
  if (safeSubtotal <= 0) {
    deliveryFee = 0;
  } else if (Number.isFinite(freeThreshold) && freeThreshold > 0 && safeSubtotal >= freeThreshold) {
    deliveryFee = 0;
  } else if (ranges.length) {
    let matchedFee = null;
    for (let i = 0; i < ranges.length; i += 1) {
      const range = ranges[i] || {};
      const min = Number(range.min);
      const max = Number(range.max);
      const fee = Number(range.fee);
      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(fee)) continue;
      const isLast = i === ranges.length - 1;
      const inRange = isLast
        ? safeSubtotal >= min && safeSubtotal <= max
        : safeSubtotal >= min && safeSubtotal < max;
      if (inRange) {
        matchedFee = fee;
        break;
      }
    }
    deliveryFee = Number.isFinite(matchedFee)
      ? matchedFee
      : Number(feeSettings?.deliveryFee || 0);
  } else {
    deliveryFee = Number(feeSettings?.deliveryFee || 0);
  }

  const handlingFee = cartItems.reduce((maxFee, item) => {
    const candidateIds = [item?.headerId, item?.categoryId, item?.subcategoryId];
    const itemFee = candidateIds.reduce((currentMax, rawId) => {
      const normalizedId =
        rawId && typeof rawId === "object" && rawId._id
          ? String(rawId._id)
          : String(rawId || "").trim();
      return Math.max(currentMax, Number(categoryFeeMap[normalizedId] || 0));
    }, 0);
    return Math.max(maxFee, itemFee);
  }, 0);
  const platformFee = Number(feeSettings?.platformFee || 0);
  const gstRate = Number(feeSettings?.gstRate || 0);
  const gstAmount =
    Number.isFinite(gstRate) && gstRate > 0
      ? Math.round(safeSubtotal * (gstRate / 100))
      : 0;

  return {
    deliveryFee,
    handlingFee,
    platformFee,
    gstAmount,
    grandTotal: Math.max(
      0,
      safeSubtotal + deliveryFee + handlingFee + platformFee + gstAmount,
    ),
  };
};

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, loading } = useCart();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const { addToWishlist } = useWishlist();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleMoveToWishlist = async (item) => {
    try {
      await addToWishlist(item);
      removeFromCart(item.id || item._id);
      showToast(`Moved ${item.name} to wishlist`, "success");
    } catch (error) {
      showToast("Failed to move item to wishlist", "error");
    }
  };

  const getDynamicDeliveryTime = () => {
    const times = cart
      .map((item) => {
        const match = String(item.deliveryTime || "").match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(Boolean);

    if (times.length > 0) {
      const minTime = Math.min(...times);
      return `${minTime} minutes`;
    }
    return "10 minutes"; // Default fallback
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Minutekart Cart",
          text: "Check out my cart items on Minutekart!",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Cart link copied to clipboard!", "success");
      } catch (err) {
        showToast("Failed to copy link", "error");
      }
    }
  };
  const [quickBillingSettings, setQuickBillingSettings] = useState(
    DEFAULT_QUICK_BILLING_SETTINGS,
  );
  const [categoryFeeMap, setCategoryFeeMap] = useState({});
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const tipAmounts = [
    { value: 0, label: "No Tip" },
    { value: 10, label: "₹10" },
    { value: 20, label: "₹20" },
    { value: 30, label: "₹30" },
  ];

  useEffect(() => {
    let cancelled = false;
    if (!cart || cart.length === 0) {
      setSimilarProducts([]);
      return;
    }

    const referenceProduct = cart[0];
    const catId = referenceProduct.subcategoryId?._id || referenceProduct.subcategoryId || referenceProduct.categoryId?._id || referenceProduct.categoryId || referenceProduct.headerId?._id || referenceProduct.headerId;
    const storeId = referenceProduct.sellerId || referenceProduct.storeId || (referenceProduct.seller?._id || referenceProduct.seller?.id);

    if (!catId) {
      setSimilarProducts([]);
      return;
    }

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
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

          const getBaseId = (id) => String(id || "").split("::")[0];
          const cartProductBaseIds = new Set(cart.map(item => getBaseId(item.id || item._id)));
          const filtered = formattedProds.filter(p => !cartProductBaseIds.has(getBaseId(p.id)));
          setSimilarProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching similar products in CartPage:", error);
        if (!cancelled) setSimilarProducts([]);
      } finally {
        if (!cancelled) setSimilarLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      cancelled = true;
    };
  }, [cart]);

  useEffect(() => {
    let mounted = true;

    const loadBillingSettings = async () => {
      try {
        const [billingResponse, categoriesResponse] = await Promise.all([
          customerApi.getBillingSettings(),
          customerApi.getCategories({ tree: true }),
        ]);
        const feeSettings =
          billingResponse?.data?.data?.feeSettings ||
          billingResponse?.data?.result ||
          null;
        if (!mounted || !feeSettings) return;
        setQuickBillingSettings((prev) => ({
          ...prev,
          ...feeSettings,
          deliveryFeeRanges: Array.isArray(feeSettings.deliveryFeeRanges)
            ? feeSettings.deliveryFeeRanges
            : prev.deliveryFeeRanges,
        }));

        const results =
          categoriesResponse?.data?.results ||
          categoriesResponse?.data?.result ||
          [];
        const nextFeeMap = {};
        const visit = (items = []) => {
          items.forEach((item) => {
            const id = String(item?._id || item?.id || "").trim();
            if (id) nextFeeMap[id] = Number(item?.handlingFees || 0);
            if (Array.isArray(item?.children) && item.children.length > 0) {
              visit(item.children);
            }
          });
        };
        if (Array.isArray(results)) {
          visit(results);
        }
        if (mounted) {
          setCategoryFeeMap(nextFeeMap);
        }
      } catch (error) {
        console.error("Failed to load quick cart billing settings:", error);
      }
    };

    void loadBillingSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClearAll = async () => {
    setShowClearConfirm(false);
    await clearCart();
    showToast("Cart cleared", "info");
  };

  const categoriesPath = getQuickCategoriesPath();
  const checkoutPath = getQuickCheckoutPath();
  const itemCount = cart.reduce((count, item) => count + Number(item.quantity || 0), 0);
  const totalSavings = cart.reduce((total, item) => {
    const mrp = Number(item.mrp || item.originalPrice || item.price);
    const price = Number(item.price);
    return total + (mrp > price ? (mrp - price) * item.quantity : 0);
  }, 0);
  const { deliveryFee, handlingFee, platformFee, gstAmount, grandTotal: baseGrandTotal } =
    calculateQuickCartPricing({
      subtotal: cartTotal,
      cartItems: cart,
      feeSettings: quickBillingSettings,
      categoryFeeMap,
    });
  const grandTotal = baseGrandTotal + selectedTip;
  const paymentMethods = [
    ...(settings?.onlineEnabled === false
      ? []
      : [
          {
            id: "online",
            label: "Pay Online",
            icon: CreditCard,
            sublabel: "UPI / Cards / NetBanking",
          },
        ]),
    ...(settings?.codEnabled === false
      ? []
      : [
          {
            id: "cash",
            label: "Cash on Delivery",
            icon: Banknote,
            sublabel: "Pay after delivery",
          },
        ]),
  ];
  const [selectedPayment, setSelectedPayment] = useState("cash");

  const handleRemove = (item) => {
    removeFromCart(item.id || item._id);
    showToast(`${item.name} removed from cart`, "info");
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(categoriesPath);
  };

  useEffect(() => {
    if (!paymentMethods.length) return;
    const exists = paymentMethods.some((method) => method.id === selectedPayment);
    if (!exists) {
      setSelectedPayment(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPayment]);

  const selectedPaymentMethod =
    paymentMethods.find((method) => method.id === selectedPayment) || null;

  if (loading && cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-neutral-950 px-4 py-6">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-[28px] bg-white dark:bg-neutral-900 px-6 py-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 dark:border-neutral-700 border-t-[#0c831f] dark:border-t-[#0ea5e9]" />
          <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Loading your cart</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pulling in your saved items...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-neutral-950 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-900 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-800"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Your Cart</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add items to get started</p>
            </div>
          </div>

          <div className="rounded-[28px] bg-white dark:bg-neutral-900 px-6 py-10 text-center shadow-sm border border-transparent dark:border-neutral-800">
            <div className="mx-auto mb-6 flex h-44 w-44 items-center justify-center">
              <Lottie animationData={emptyBoxAnimation} loop className="h-40 w-40" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your cart is empty</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Pick a few essentials and they&apos;ll show up here.
            </p>
            <Link to={categoriesPath} className="mt-6 inline-flex w-full">
              <Button className="h-12 w-full rounded-2xl bg-[#0c831f] text-white hover:bg-[#0b721b] dark:bg-emerald-600 dark:hover:bg-emerald-700">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-neutral-950 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      {/* Sticky Full-width Header */}
      <header className="sticky top-0 z-[500] bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          {/* Left: Back Button & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-neutral-800 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-neutral-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Checkout</h1>
          </div>

          {/* Right: Search & Share Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/quick/search"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-neutral-800 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-neutral-700 hover:bg-slate-50 transition-colors"
            >
              <Search size={16} />
            </Link>
            
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-full bg-white dark:bg-neutral-800 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-neutral-700 hover:bg-slate-50 transition-colors text-xs font-black cursor-pointer"
            >
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="mx-auto max-w-3xl px-4 py-4">

        {/* Clear cart confirmation */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <div className="relative z-10 w-full max-w-sm rounded-[28px] bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-transparent dark:border-neutral-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 mx-auto">
                <Trash2 size={22} className="text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">Clear your cart?</h3>
              <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                All {itemCount} item{itemCount === 1 ? "" : "s"} will be removed. This can't be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-2xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-600"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grouped Delivery + Products Card */}
        <section className="mb-4 rounded-[28px] bg-white dark:bg-neutral-900 shadow-sm border border-slate-100 dark:border-neutral-800 overflow-hidden">
          {/* Grouped Delivery Header */}
          <div className="p-4 flex items-center gap-4 bg-slate-50/50 dark:bg-neutral-850 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9f7ec] dark:bg-emerald-950 text-[#0c831f] dark:text-emerald-400 border border-[#c6f0d3] dark:border-emerald-800/30">
              <Timer size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                Delivery in {getDynamicDeliveryTime()}
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                Shipment of {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Grouped Product List */}
          <div className="divide-y divide-slate-100 dark:divide-neutral-850">
            {cart.map((item) => {
              const mrp = Number(item.mrp || item.originalPrice || item.price);
              const price = Number(item.price);
              const showDiscount = mrp > price;

              return (
                <div
                  key={item.id || item._id}
                  className="p-4 flex gap-3 items-start"
                >
                  {/* Left: Product Image */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-800">
                    <img
                      src={resolveQuickImageUrl(item.mainImage || item.image) || item.mainImage || item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop"}
                      alt={item.name}
                      className="h-full w-full object-contain p-1 dark:mix-blend-normal"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop";
                      }}
                    />
                  </div>

                  {/* Center: Info Area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[64px]">
                    <div>
                      <h3 className="line-clamp-2 text-[13px] font-bold text-slate-800 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        {item.weight || item.unit || "1 unit"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToWishlist(item)}
                      className="mt-1 text-[11px] font-bold text-slate-400 hover:text-[#0c831f] dark:hover:text-emerald-400 transition-colors text-left w-fit cursor-pointer"
                    >
                      Move to wishlist
                    </button>
                  </div>

                  {/* Right: Quantity Selector & Price Stack */}
                  <div className="flex flex-col items-end shrink-0 mt-0.5">
                    {/* Square-ish Green Quantity Counter Block */}
                    <div className="flex items-center justify-between bg-[#0c831f] text-white rounded-lg shadow-sm overflow-hidden h-[30px] w-[70px]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id || item._id, -1)}
                        className="w-6 h-full flex items-center justify-center hover:bg-[#096317] transition-colors cursor-pointer"
                      >
                        <Minus size={9} strokeWidth={3} />
                      </button>
                      <span className="text-[11px] font-black text-center flex-1 select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const stock = Number(item.stock ?? Infinity);
                          if (item.quantity >= stock) {
                            showToast(`Only ${stock} in stock`, "error");
                            return;
                          }
                          updateQuantity(item.id || item._id, 1);
                        }}
                        disabled={item.quantity >= Number(item.stock ?? Infinity)}
                        className="w-6 h-full flex items-center justify-center hover:bg-[#096317] disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Plus size={9} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Price details directly below button with small gap */}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {showDiscount && (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 line-through">
                          {"\u20B9"}{mrp * item.quantity}
                        </span>
                      )}
                      <span className="text-[13px] font-extrabold text-slate-900 dark:text-white">
                        {"\u20B9"}{price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* You might also like section */}
        {!similarLoading && similarProducts.length > 0 && (
          <section className="mt-4 rounded-[24px] bg-white dark:bg-neutral-900 p-5 shadow-sm border border-transparent dark:border-neutral-800">
            <h3 className="mb-4 text-[14px] font-extrabold text-slate-900 dark:text-white">
              You might also like
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {similarProducts.slice(0, 3).map((item) => (
                <ProductCard key={item.id} product={item} compact={true} />
              ))}
            </div>

            {/* See all products button */}
            {cart.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => navigate(`/quick/product/${cart[0].id || cart[0]._id}/similar`)}
                  className="w-[94%] mx-auto flex items-center justify-center bg-[#F0F4F8] dark:bg-neutral-800/60 border border-slate-200/30 rounded-[14px] py-1.5 px-4 hover:bg-[#E5ECF2] dark:hover:bg-neutral-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {/* Overlapping Thumbnails */}
                    <div className="flex items-center -space-x-2.5">
                      {similarProducts.slice(0, 3).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="w-8 h-8 rounded-full border-[2px] border-white dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center p-0.5 overflow-hidden"
                          style={{ zIndex: 3 - idx }}
                        >
                          <img
                            src={item.image || item.mainImage}
                            alt=""
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-[#3B4C69] dark:text-slate-300 font-bold text-xs">
                      <span>See all products</span>
                      <ChevronRight size={12} className="text-[#3B4C69] dark:text-slate-300 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Bill Details Section */}
        <section className="mt-4 rounded-[24px] bg-white dark:bg-neutral-900 p-4 shadow-sm border border-slate-100 dark:border-neutral-800">
          <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white mb-4">
            Bill details
          </h3>

          <div className="space-y-3.5 text-[13px] text-slate-600 dark:text-slate-400">
            {/* Items total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Items total</span>
                {totalSavings > 0 && (
                  <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5 text-[10px] font-black tracking-tight">
                    Saved ₹{totalSavings}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {totalSavings > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 line-through">
                    {"\u20B9"}{cartTotal + totalSavings}
                  </span>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{"\u20B9"}{cartTotal}</span>
              </div>
            </div>

            {/* Handling charge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 border-b border-dotted border-slate-300 dark:border-neutral-700 pb-0.5">
                  Handling charge
                </span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{"\u20B9"}{handlingFee}</span>
            </div>

            {/* Delivery charge */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bike size={16} className="text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 border-b border-dotted border-slate-300 dark:border-neutral-700 pb-0.5">
                    Delivery charge
                  </span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {deliveryFee === 0 ? "FREE" : `\u20B9${deliveryFee}`}
                </span>
              </div>
              {/* Delivery threshold hint */}
              {deliveryFee > 0 && quickBillingSettings?.freeDeliveryThreshold > 0 && (
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 ml-6">
                  Shop for {"\u20B9"}{Math.max(0, Number(quickBillingSettings.freeDeliveryThreshold) - cartTotal)} more to get FREE delivery
                </p>
              )}
            </div>

            {/* Platform fee (if > 0) */}
            {platformFee > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 border-b border-dotted border-slate-300 dark:border-neutral-700 pb-0.5">
                    Platform fee
                  </span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{"\u20B9"}{platformFee}</span>
              </div>
            )}

            {/* GST (if > 0) */}
            {gstAmount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 border-b border-dotted border-slate-300 dark:border-neutral-700 pb-0.5">
                    GST
                  </span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{"\u20B9"}{gstAmount}</span>
              </div>
            )}
            {/* Delivery Partner Tip (if > 0) */}
            {selectedTip > 0 && (
              <div className="flex items-center justify-between text-pink-600 dark:text-pink-400 font-semibold">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-pink-500 fill-pink-500 shrink-0" />
                  <span className="border-b border-dotted border-pink-300 dark:border-pink-800 pb-0.5">Delivery Partner Tip</span>
                </div>
                <span>+₹{selectedTip}</span>
              </div>
            )}


            {/* Grand Total */}
            <div className="border-t border-slate-100 dark:border-neutral-800 pt-3">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-bold text-slate-900 dark:text-white border-b border-dotted border-slate-400 dark:border-neutral-600 pb-0.5">
                  Grand total
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{"\u20B9"}{grandTotal}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tip for Partner */}
        <section className="mt-4 rounded-[24px] bg-white dark:bg-neutral-900 p-5 shadow-sm border border-transparent dark:border-neutral-800">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-neutral-850 dark:to-neutral-900/60 rounded-[20px] p-4 border border-pink-100/50 dark:border-neutral-800/40">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={18} className="text-pink-500 fill-pink-500" />
              <h3 className="font-black text-slate-800 dark:text-white text-sm">
                Tip your delivery partner
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              100% of the tip goes to them
            </p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {tipAmounts.map((tip) => (
                <button
                  key={tip.value}
                  onClick={() => {
                    setSelectedTip(tip.value);
                    setCustomTip("");
                  }}
                  className={`py-2 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                    selectedTip === tip.value && !customTip
                      ? "border-pink-500 bg-pink-100 text-pink-700 dark:bg-pink-900/45 dark:text-pink-400"
                      : "border-pink-200/60 bg-white text-slate-700 hover:border-pink-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {tip.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="Enter custom tip amount (₹)"
                value={customTip}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setCustomTip(val);
                  setSelectedTip(val ? Number(val) : 0);
                }}
                className="w-full h-10 rounded-xl border border-pink-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-xs font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-pink-400 dark:focus:border-pink-500 transition-colors"
              />
              {customTip && (
                <button
                  onClick={() => { setCustomTip(""); setSelectedTip(0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] bg-white dark:bg-neutral-900 p-5 shadow-sm border border-transparent dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Payment
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Choose how you want to pay
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                We&apos;ll carry this choice into checkout so you don&apos;t have to pick it again.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {paymentMethods.length ? (
              paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPayment === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? "border-[#0c831f] dark:border-emerald-600 bg-green-50 dark:bg-emerald-900/10"
                        : "border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSelected ? "bg-green-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-neutral-800"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={isSelected ? "text-[#0c831f] dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${isSelected ? "text-[#0c831f] dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>
                        {method.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{method.sublabel}</p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-[#0c831f] dark:border-emerald-500 bg-[#0c831f] dark:bg-emerald-500" : "border-slate-300 dark:border-neutral-700"
                      }`}
                    >
                      {isSelected ? <Check size={12} className="text-white" /> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Payment options are currently unavailable. You can still review the order on checkout.
              </div>
            )}
          </div>
        </section>

        <Link
          to={checkoutPath}
          state={{ selectedPayment, selectedTip }}
          className="block mt-4"
        >
          <section className="rounded-[24px] bg-white dark:bg-neutral-900 p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.99] border border-transparent dark:border-neutral-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Checkout
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Address, payment and seller confirmation
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Review delivery details on the next screen and place the order to push it into the matched seller dashboard.
                </p>
              </div>
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c831f]/10 dark:bg-emerald-900/20 text-[#0c831f] dark:text-emerald-400">
                <ChevronRight size={18} />
              </div>
            </div>
          </section>
        </Link>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[520] border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              To pay
            </p>
            <p className="truncate text-2xl font-bold text-slate-900 dark:text-white">
              {"\u20B9"}
              {grandTotal}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedPaymentMethod ? selectedPaymentMethod.label : "Includes delivery charges"}
            </p>
          </div>

          <Link
            to={checkoutPath}
            state={{ selectedPayment, selectedTip }}
            className="block w-full flex-1 sm:min-w-[220px]"
          >
            <Button className="h-12 w-full rounded-2xl bg-[#0c831f] dark:bg-emerald-600 px-4 text-sm text-white whitespace-normal sm:whitespace-nowrap hover:bg-[#0b721b] dark:hover:bg-emerald-700">
              <ShoppingBag size={18} className="mr-2" />
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
