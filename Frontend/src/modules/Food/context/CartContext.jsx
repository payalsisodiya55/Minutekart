// src/context/cart-context.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { buildCartLineId, getFoodVariants, hasFoodVariants, getDefaultFoodVariant } from "@food/utils/foodVariants"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Minus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@food/components/ui/button"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


// Default cart context value to prevent errors during initial render
const defaultCartContext = {
  _isProvider: false, // Flag to identify if this is from the actual provider
  cart: [],
  items: [],
  itemCount: 0,
  total: 0,
  lastAddEvent: null,
  lastRemoveEvent: null,
  addToCart: () => {
    debugWarn('CartProvider not available - addToCart called');
  },
  removeFromCart: () => {
    debugWarn('CartProvider not available - removeFromCart called');
  },
  updateQuantity: () => {
    debugWarn('CartProvider not available - updateQuantity called');
  },
  getCartCount: () => 0,
  isInCart: () => false,
  getCartItem: () => null,
  clearCart: () => {
    debugWarn('CartProvider not available - clearCart called');
  },
  cleanCartForRestaurant: () => {
    debugWarn('CartProvider not available - cleanCartForRestaurant called');
  },
  replaceCart: () => {
    debugWarn('CartProvider not available - replaceCart called');
  },
  decreaseVariantQuantity: () => {},
  getCartItemQuantity: () => 0,
}

const CartContext = createContext(defaultCartContext)

const getItemOrderType = (item) => (item?.orderType === "quick" ? "quick" : "food")
const getItemSourceId = (item, orderType) =>
  String(
    item?.sourceId ||
      (orderType === "quick"
        ? item?.quickStoreId || item?.storeId || item?.sellerId || item?.restaurantId || ""
        : item?.restaurantId || item?.sourceRestaurantId || ""),
  )

const normalizeCartData = (rawCart) => {
  if (!Array.isArray(rawCart)) return []

  return rawCart
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const parsedQuantity = Number(item.quantity)
      const parsedPrice = Number(item.price)
      const normalizedRestaurantName =
        typeof item.restaurant === "string"
          ? item.restaurant
          : typeof item.restaurant?.name === "string"
            ? item.restaurant.name
            : ""

      const normalizedRestaurantId =
        item.restaurantId ||
        item.restaurant_id ||
        item.restaurant?._id ||
        item.restaurant?.restaurantId ||
        null

      const normalizedImage =
        item.image ||
        item.imageUrl ||
        item.product?.imageUrl ||
        item.product?.image ||
        ""

      const baseItemId =
        item.itemId ||
        item.productId ||
        item.foodId ||
        item.baseItemId ||
        item.menuItemId ||
        item.id ||
        item._id ||
        `cart-item-${index}`

      const variantId = item.variantId || item.variant?._id || item.variant?.id || ""
      const variantName =
        typeof item.variantName === "string"
          ? item.variantName
          : typeof item.variant?.name === "string"
            ? item.variant.name
            : ""
      const parsedVariantPrice = Number(
        item.variantPrice ?? item.variant?.price ?? item.price,
      )
      const orderType = item.orderType === "quick" ? "quick" : "food"
      const sourceId = getItemSourceId(item, orderType)
      const lineItemId =
        item.lineItemId ||
        item.cartLineId ||
        buildCartLineId(baseItemId, variantId)

      return {
        ...item,
        id: lineItemId,
        lineItemId,
        itemId: String(baseItemId),
        productId: String(baseItemId),
        variantId: variantId ? String(variantId) : "",
        variantName,
        variantPrice: Number.isFinite(parsedVariantPrice) ? parsedVariantPrice : 0,
        name: item.name || item.product?.name || "Item",
        orderType,
        type: orderType,
        sourceId,
        sourceName:
          item.sourceName ||
          (orderType === "quick"
            ? item.quickStoreName || item.storeName || item.sellerName || "Quick Commerce"
            : normalizedRestaurantName),
        quantity:
          Number.isFinite(parsedQuantity) && parsedQuantity > 0
            ? Math.floor(parsedQuantity)
            : 1,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        restaurant: normalizedRestaurantName,
        restaurantId: normalizedRestaurantId,
        image: normalizedImage,
        imageUrl: normalizedImage,
      }
    })
}

const resolveCartEntryId = (items, itemId, variantId = "") => {
  const normalizedItemId = String(itemId || "")
  const safeItems = Array.isArray(items) ? items : []

  const directMatch = safeItems.find((item) => item.id === normalizedItemId)
  if (directMatch) return directMatch.id

  const preferredId = buildCartLineId(normalizedItemId, variantId)

  const exactMatch = safeItems.find((item) => item.id === preferredId)
  if (exactMatch) return exactMatch.id

  if (!variantId) {
    const legacyBaseMatch = safeItems.find(
      (item) =>
        String(item.itemId || item.productId || item.id || "") === normalizedItemId &&
        !String(item.variantId || "").trim(),
    )
    if (legacyBaseMatch) return legacyBaseMatch.id
  }

  return preferredId
}

export function CartProvider({ children }) {
  // Safe init (works with SSR and bad JSON)
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem("cart")
      const parsed = saved ? JSON.parse(saved) : []
      return normalizeCartData(parsed)
    } catch {
      return []
    }
  })

  // Track last add event for animation
  const [lastAddEvent, setLastAddEvent] = useState(null)
  // Track last remove event for animation
  const [lastRemoveEvent, setLastRemoveEvent] = useState(null)

  const [replaceModal, setReplaceModal] = useState({
    isOpen: false,
    existingRestaurant: "",
    newRestaurant: "",
    pendingItem: null,
    pendingSourcePosition: null
  })

  const [variantSelector, setVariantSelector] = useState({
    isOpen: false,
    dish: null,
    sourcePosition: null,
    restaurant: "",
    restaurantId: "",
  })

  const handleConfirmReplace = () => {
    if (replaceModal.pendingItem) {
      setCart((prev) => {
        const safePrev = normalizeCartData(prev)
        const nonFoodItems = safePrev.filter((item) => getItemOrderType(item) !== "food")
        const newItem = { ...replaceModal.pendingItem, quantity: 1 }

        if (replaceModal.pendingSourcePosition) {
          setLastAddEvent({
            product: {
              id: replaceModal.pendingItem.id,
              name: replaceModal.pendingItem.name,
              imageUrl: replaceModal.pendingItem.image || replaceModal.pendingItem.imageUrl,
            },
            sourcePosition: replaceModal.pendingSourcePosition,
          })
          setTimeout(() => setLastAddEvent(null), 1500)
        }

        return [...nonFoodItems, newItem]
      })
    }
    setReplaceModal({
      isOpen: false,
      existingRestaurant: "",
      newRestaurant: "",
      pendingItem: null,
      pendingSourcePosition: null,
    })
  }

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      // Only save if we have items or user is authenticated to avoid cluttering localStorage for every guest visitor
      const isAuthenticated = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken");
      if (cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(normalizeCartData(cart)))
      } else {
        localStorage.removeItem("cart")
      }
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [cart])

  // Separate items by type
  const foodItems = useMemo(() => normalizeCartData(cart).filter(item => getItemOrderType(item) === "food"), [cart])
  const quickItems = useMemo(() => normalizeCartData(cart).filter(item => getItemOrderType(item) === "quick"), [cart])

  const foodCount = useMemo(() => foodItems.reduce((sum, item) => sum + (item.quantity || 0), 0), [foodItems])
  const quickCount = useMemo(() => quickItems.reduce((sum, item) => sum + (item.quantity || 0), 0), [quickItems])

  const foodTotal = useMemo(() => foodItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0), [foodItems])
  const quickTotal = useMemo(() => quickItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0), [quickItems])

  const addToCart = (item, sourcePosition = null) => {
    const safeCart = normalizeCartData(cart)
    const nextOrderType = getItemOrderType(item)

    // Prevent mixing custom cakes with other items
    const hasCustomCake = safeCart.some(i => i.isCustomCake === true)
    if (hasCustomCake) {
      return { ok: false, error: 'Your cart contains a custom cake. Custom cakes must be ordered alone.', code: 'CUSTOM_CAKE_RESTRICTION' }
    }
    if (item?.isCustomCake && safeCart.length > 0) {
      return { ok: false, error: 'Custom cakes must be ordered alone. Please clear your cart first.', code: 'CUSTOM_CAKE_RESTRICTION' }
    }

    if (safeCart.length > 0) {
      if (nextOrderType === "food") {
        const existingFoodItems = safeCart.filter(i => getItemOrderType(i) === "food")
        if (existingFoodItems.length > 0) {
          const firstItemRestaurantId = existingFoodItems[0]?.restaurantId
          const firstItemRestaurantName = existingFoodItems[0]?.restaurant
          const newItemRestaurantId = item?.restaurantId
          const newItemRestaurantName = item?.restaurant
          const normalizeName = (name) => (name ? String(name).trim().toLowerCase() : '')

          const firstRestaurantNameNormalized = normalizeName(firstItemRestaurantName)
          const newRestaurantNameNormalized = normalizeName(newItemRestaurantName)
          const hasNameMismatch =
            firstRestaurantNameNormalized &&
            newRestaurantNameNormalized &&
            firstRestaurantNameNormalized !== newRestaurantNameNormalized

          const hasIdMismatch =
            !firstRestaurantNameNormalized &&
            !newRestaurantNameNormalized &&
            firstItemRestaurantId &&
            newItemRestaurantId &&
            String(firstItemRestaurantId) !== String(newItemRestaurantId)

          if (hasNameMismatch || hasIdMismatch) {
            setReplaceModal({
              isOpen: true,
              existingRestaurant: firstItemRestaurantName || 'another restaurant',
              newRestaurant: newItemRestaurantName || 'Restaurant',
              pendingItem: item,
              pendingSourcePosition: sourcePosition
            })
            const message = `Cart already contains items from "${firstItemRestaurantName || 'another restaurant'}". Please clear food cart first.`
            return { ok: false, error: message, code: 'RESTAURANT_MISMATCH', silent: true }
          }
        }
      } else if (nextOrderType === "quick") {
        const existingQuickItems = safeCart.filter(i => getItemOrderType(i) === "quick");
        if (existingQuickItems.length > 0) {
          const firstItemStoreId = existingQuickItems[0]?.sourceId;
          const firstItemStoreName = existingQuickItems[0]?.sourceName;
          const newItemStoreId = getItemSourceId(item, "quick");
          const newItemStoreName = item?.quickStoreName || item?.storeName || item?.sellerName || item?.sourceName || "another store";

          if (firstItemStoreId && newItemStoreId && String(firstItemStoreId) !== String(newItemStoreId)) {
            const message = `Cart already contains items from "${firstItemStoreName || 'another store'}". Please clear your cart first.`;
            return { ok: false, error: message, code: 'STORE_MISMATCH' };
          }
        }
      }
    }

    if (nextOrderType === "food" && !item?.restaurantId && !item?.restaurant) {
      return {
        ok: false,
        error: 'Item is missing restaurant information.',
        code: 'MISSING_RESTAURANT'
      }
    }

    // Intercept items that have variants and don't have a variantId chosen yet
    const variants = getFoodVariants(item);
    if (nextOrderType !== "quick" && variants && variants.length > 0 && !item.variantId) {
      setVariantSelector({
        isOpen: true,
        dish: item,
        sourcePosition,
        restaurant: item.restaurant || item.restaurantName || "Restaurant",
        restaurantId: item.restaurantId || "",
      });
      return { ok: true, silent: true, deferred: true };
    }

    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      const existing = safePrev.find((i) => i.id === item.id)
      
      if (existing) {
        if (sourcePosition) {
          setLastAddEvent({
            product: { id: item.id, name: item.name, imageUrl: item.image || item.imageUrl },
            sourcePosition,
          })
          setTimeout(() => setLastAddEvent(null), 1500)
        }
        return safePrev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      
      const newItem = { ...item, quantity: 1 }
      if (sourcePosition) {
        setLastAddEvent({
          product: { id: item.id, name: item.name, imageUrl: item.image || item.imageUrl },
          sourcePosition,
        })
        setTimeout(() => setLastAddEvent(null), 1500)
      }
      return [...safePrev, newItem]
    })

    return { ok: true }
  }

  const removeFromCart = (itemId, sourcePosition = null, productInfo = null) => {
    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      const resolvedItemId = resolveCartEntryId(safePrev, itemId)
      const itemToRemove = safePrev.find((i) => i.id === resolvedItemId)
      if (itemToRemove && sourcePosition && productInfo) {
        setLastRemoveEvent({
          product: {
            id: productInfo.id || itemToRemove.id,
            name: productInfo.name || itemToRemove.name,
            imageUrl: productInfo.imageUrl || productInfo.image || itemToRemove.image || itemToRemove.imageUrl,
          },
          sourcePosition,
        })
        setTimeout(() => setLastRemoveEvent(null), 1500)
      }
      return safePrev.filter((i) => i.id !== resolvedItemId)
    })
  }

  const updateQuantity = (itemId, quantity, sourcePosition = null, productInfo = null) => {
    const safeCart = normalizeCartData(cart)
    const resolvedItemId = resolveCartEntryId(safeCart, itemId)
    if (quantity <= 0) {
      removeFromCart(itemId, sourcePosition, productInfo)
      return
    }
    
    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      const existingItem = safePrev.find((i) => i.id === resolvedItemId)
      if (existingItem && existingItem.isCustomCake && quantity > 1) {
        return safePrev
      }
      if (existingItem && quantity < existingItem.quantity && sourcePosition && productInfo) {
        setLastRemoveEvent({
          product: {
            id: productInfo.id || existingItem.id,
            name: productInfo.name || existingItem.name,
            imageUrl: productInfo.imageUrl || productInfo.image || existingItem.image || existingItem.imageUrl,
          },
          sourcePosition,
        })
        setTimeout(() => setLastRemoveEvent(null), 1500)
      }
      if (existingItem && quantity > existingItem.quantity && sourcePosition && productInfo) {
        setLastAddEvent({
          product: {
            id: productInfo.id || existingItem.id,
            name: productInfo.name || existingItem.name,
            imageUrl: productInfo.imageUrl || productInfo.image || existingItem.image || existingItem.imageUrl,
          },
          sourcePosition,
        })
        setTimeout(() => setLastAddEvent(null), 1500)
      }
      return safePrev.map((i) => (i.id === resolvedItemId ? { ...i, quantity } : i))
    })
  }

  const getCartCount = (type = "food") => {
    const safeCart = normalizeCartData(cart)
    if (type === "all") return safeCart.reduce((total, item) => total + (item.quantity || 0), 0)
    return safeCart
      .filter(item => getItemOrderType(item) === type)
      .reduce((total, item) => total + (item.quantity || 0), 0)
  }

  const isInCart = (itemId, variantId = "", type = "food") => {
    const safeCart = normalizeCartData(cart)
    const resolvedItemId = resolveCartEntryId(safeCart, itemId, variantId)
    return safeCart.some((i) => i.id === resolvedItemId && (type === "all" || getItemOrderType(i) === type))
  }

  const getCartItem = (itemId, variantId = "", type = "food") => {
    const safeCart = normalizeCartData(cart)
    const resolvedItemId = resolveCartEntryId(safeCart, itemId, variantId)
    return safeCart.find((i) => i.id === resolvedItemId && (type === "all" || getItemOrderType(i) === type)) || null
  }

  const clearCart = (type = null) => {
    if (!type) {
      setCart([])
    } else {
      setCart(prev => normalizeCartData(prev).filter(item => getItemOrderType(item) !== type))
    }
  }

  const replaceCart = (items) => {
    const normalizedItems = normalizeCartData(items).filter((item) => {
      const quantity = Number(item?.quantity)
      return item?.id && Number.isFinite(quantity) && quantity > 0
    })
    setCart(normalizedItems)
    return { ok: true, count: normalizedItems.length }
  }

  const cleanCartForRestaurant = (restaurantId, restaurantName) => {
    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      if (safePrev.length === 0) return safePrev;
      const normalizeName = (name) => name ? name.trim().toLowerCase() : '';
      const targetRestaurantNameNormalized = normalizeName(restaurantName);
      
      const cleanedCart = safePrev.filter((item) => {
        if (getItemOrderType(item) === "quick") return true; // Keep quick items
        
        const itemRestaurantId = item?.restaurantId;
        const itemRestaurantName = item?.restaurant;
        const itemRestaurantNameNormalized = normalizeName(itemRestaurantName);
        
        if (targetRestaurantNameNormalized && itemRestaurantNameNormalized) {
          return itemRestaurantNameNormalized === targetRestaurantNameNormalized;
        }
        if (restaurantId && itemRestaurantId) {
          return itemRestaurantId === restaurantId || String(itemRestaurantId) === String(restaurantId);
        }
        return false;
      });
      return cleanedCart;
    });
  }

  const decreaseVariantQuantity = (dish, sourcePosition = null) => {
    const dishId = dish.id || dish.itemId;
    const existingItems = cart.filter(item => (item.itemId === dishId || item.id === dishId || item.id?.split("::")[0] === dishId) && item.quantity > 0);
    if (existingItems.length > 0) {
      const itemToDecrement = existingItems[existingItems.length - 1];
      updateQuantity(itemToDecrement.id, itemToDecrement.quantity - 1, sourcePosition, {
        id: itemToDecrement.id,
        name: dish.name,
        imageUrl: dish.image || dish.imageUrl,
      });

      if (itemToDecrement.quantity - 1 === 0) {
        toast.success(`Removed ${itemToDecrement.variantName || dish.name} from cart`);
      } else {
        toast.success(`Decreased ${itemToDecrement.variantName || dish.name} quantity to ${itemToDecrement.quantity - 1}`);
      }
    }
  };

  const getCartItemQuantity = (dish) => {
    const dishId = dish?.id || dish?.itemId || "";
    const hasVariants = hasFoodVariants(dish);
    if (hasVariants) {
      return cart
        .filter((item) => item.itemId === dishId || item.id === dishId || item.id?.split("::")[0] === dishId)
        .reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    const itemInCart = cart.find(
      (item) => item.id === dishId || item.itemId === dishId || item.id?.split("::")[0] === dishId
    );
    return itemInCart ? itemInCart.quantity : 0;
  };

  const value = useMemo(
    () => ({
      _isProvider: true,
      cart,
      items: foodItems, // Compatibility for AddToCartAnimation
      foodItems,
      quickItems,
      itemCount: foodCount, // Compatibility for AddToCartAnimation
      foodCount,
      quickCount,
      total: foodTotal, // Compatibility for AddToCartAnimation
      foodTotal,
      quickTotal,
      lastAddEvent,
      lastRemoveEvent,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartCount,
      isInCart,
      getCartItem,
      clearCart,
      cleanCartForRestaurant,
      replaceCart,
      decreaseVariantQuantity,
      getCartItemQuantity,
    }),
    [cart, foodItems, quickItems, foodCount, quickCount, foodTotal, quickTotal, lastAddEvent, lastRemoveEvent, decreaseVariantQuantity, getCartItemQuantity]
  )

  return (
    <CartContext.Provider value={value}>
      {children}
      <ReplaceCartModal
        isOpen={replaceModal.isOpen}
        onClose={() => setReplaceModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmReplace}
        existingRestaurant={replaceModal.existingRestaurant}
        newRestaurant={replaceModal.newRestaurant}
      />
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {variantSelector.isOpen && variantSelector.dish && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setVariantSelector(prev => ({ ...prev, isOpen: false }))}
                  className="fixed inset-0 bg-black z-[99999]"
                />

                {/* Bottom Sheet */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-[#1a1a1a] rounded-t-[24px] z-[100000] flex flex-col shadow-2xl border-t border-gray-100 dark:border-gray-800"
                >
                  {/* Pull Indicator */}
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />

                  {/* Close button top right */}
                  <div className="absolute right-4 top-4">
                    <button
                      onClick={() => setVariantSelector(prev => ({ ...prev, isOpen: false }))}
                      className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow"
                    >
                      <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* Header */}
                  <div className="px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="shrink-0 w-4 h-4 border border-gray-300 dark:border-gray-750 rounded flex items-center justify-center p-[2.5px] bg-white">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: variantSelector.dish.isVeg ? "#1c7a43" : "#dc2626"
                          }}
                        />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-6 truncate">
                        {variantSelector.dish.name}
                      </h2>
                    </div>
                    {variantSelector.restaurant && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                        {variantSelector.restaurant}
                      </p>
                    )}
                  </div>

                  {/* Content / Variants List */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-450 dark:text-gray-400 mb-1">
                      Quantity per variant
                    </p>
                    {getFoodVariants(variantSelector.dish).map((variant) => {
                      const lineItemId = buildCartLineId(variantSelector.dish.id || variantSelector.dish.itemId, variant.id);
                      const cartItem = getCartItem(lineItemId);
                      const quantity = cartItem ? cartItem.quantity : 0;

                      return (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50 pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {variant.name}
                            </p>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                              ₹{Math.round(variant.price)}
                            </p>
                          </div>

                          {/* Plus/Minus quantity selector inside bottom sheet */}
                          {quantity > 0 ? (
                            <div className="flex items-center gap-3 border rounded-full px-2.5 py-1 bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={(e) => {
                                  updateQuantity(lineItemId, quantity - 1, null, {
                                    id: lineItemId,
                                    name: variantSelector.dish.name,
                                    imageUrl: variantSelector.dish.image || variantSelector.dish.imageUrl,
                                  });
                                  if (quantity - 1 === 0) {
                                    toast.success(`Removed ${variant.name} from cart`);
                                  } else {
                                    toast.success(`Decreased ${variant.name} quantity to ${quantity - 1}`);
                                  }
                                }}
                                className="w-5 h-5 flex items-center justify-center text-gray-550 hover:opacity-80 active:scale-75 dark:text-gray-300"
                              >
                                <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                              </button>
                              <span className="text-[13px] font-black text-gray-900 dark:text-white min-w-[12px] text-center select-none">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  updateQuantity(lineItemId, quantity + 1, variantSelector.sourcePosition, {
                                    id: lineItemId,
                                    name: variantSelector.dish.name,
                                    imageUrl: variantSelector.dish.image || variantSelector.dish.imageUrl,
                                  });
                                  toast.success(`Increased ${variant.name} quantity to ${quantity + 1}`);
                                  setVariantSelector(prev => ({ ...prev, isOpen: false })); // Close on increase!
                                }}
                                className="w-5 h-5 flex items-center justify-center text-gray-550 hover:opacity-80 active:scale-75 dark:text-gray-300"
                              >
                                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const cartItemData = {
                                  id: lineItemId,
                                  lineItemId,
                                  itemId: variantSelector.dish.id || variantSelector.dish.itemId,
                                  name: variantSelector.dish.name,
                                  price: variant.price,
                                  variantId: variant.id,
                                  variantName: variant.name,
                                  variantPrice: variant.price,
                                  image: variantSelector.dish.image || variantSelector.dish.imageUrl,
                                  restaurant: variantSelector.restaurant,
                                  restaurantId: variantSelector.restaurantId,
                                  description: variantSelector.dish.description || "",
                                  originalPrice: variantSelector.dish.originalPrice || variantSelector.dish.price,
                                };
                                const result = addToCart(cartItemData, variantSelector.sourcePosition);
                                if (result?.ok === false) {
                                  if (!result.silent) {
                                    toast.error(result.error || "Failed to add item.");
                                  }
                                } else {
                                  toast.success(`Added ${variantSelector.dish.name} (${variant.name}) to cart!`);
                                  setVariantSelector(prev => ({ ...prev, isOpen: false })); // Close on add!
                                }
                              }}
                              className="px-4 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 flex items-center gap-1 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/40"
                              style={{
                                color: "#DC021B",
                                borderColor: "#DC021B33"
                              }}
                            >
                              <Plus className="h-3 w-3" strokeWidth={3} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50">
                    <Button
                      onClick={() => setVariantSelector(prev => ({ ...prev, isOpen: false }))}
                      className="w-full h-11 text-white font-bold text-sm rounded-xl shadow-md bg-[#DC021B] hover:bg-[#c10217]"
                    >
                      Done
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </CartContext.Provider>
  )
}

const ReplaceCartModal = ({ isOpen, onClose, onConfirm, existingRestaurant, newRestaurant }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1a1a1a]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mt-2 text-left">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Replace cart item?
              </h3>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your cart contains dishes from <span className="font-semibold text-gray-700 dark:text-gray-300">{existingRestaurant}</span>. Do you want to discard the selection and add dishes from <span className="font-semibold text-gray-700 dark:text-gray-300">{newRestaurant}</span>?
              </p>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-full bg-[#eafbf1] py-3 text-center text-sm font-bold text-[#09793e] hover:bg-[#dbf7e7] transition-colors"
              >
                No
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-full bg-[#09793e] py-3 text-center text-sm font-bold text-white hover:bg-[#076232] transition-colors"
              >
                Yes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context || context._isProvider !== true) return defaultCartContext
  return context
}

