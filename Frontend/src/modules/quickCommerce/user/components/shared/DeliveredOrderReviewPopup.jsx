import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Star, X, Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { customerApi } from "../../services/customerApi";
import { orderAPI } from "@/services/api";
import { useUserNotifications } from "@food/hooks/useUserNotifications";
import { cn } from "@/lib/utils";

const REVIEW_SHOWN_KEY = "quickReviewShownOrders";

const getShownOrderIds = () => {
  try {
    const stored = localStorage.getItem(REVIEW_SHOWN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markOrderAsShown = (orderId) => {
  try {
    const shown = getShownOrderIds();
    shown.add(String(orderId));
    localStorage.setItem(REVIEW_SHOWN_KEY, JSON.stringify(Array.from(shown)));
  } catch {}
};

export default function DeliveredOrderReviewPopup() {
  useUserNotifications(); // Start socket connection to listen for real-time status updates
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [productRatings, setProductRatings] = useState({});
  const [productComments, setProductComments] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const lastCheckedRef = useRef(0);

  const checkForDeliveredOrders = useCallback(async (force = false) => {
    // Check if token exists before calling API to avoid errors
    const token =
      localStorage.getItem("auth_customer") ||
      localStorage.getItem("user_accessToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      "";
    if (!token) return;

    // Avoid double fetching too close together (throttle to 5 seconds unless forced)
    const now = Date.now();
    if (!force && now - lastCheckedRef.current < 5000) return;
    lastCheckedRef.current = now;

    try {
      console.log("[ReviewPopup] Fetching orders...");
      const res = await customerApi.getMyOrders({}, { forceRefresh: true });
      
      // Match the exact response format used in OrdersPage.jsx
      const rawList = res?.data?.result || res?.data?.results || res?.data?.data?.orders || res?.data?.data?.data || res?.data?.data || [];
      
      // Filter to quick commerce orders only
      const orders = Array.isArray(rawList) ? rawList.filter(order => {
        const type = order.orderType || order.module || 'quick';
        const oid = String(order.orderId || order.id || order._id || '');
        return type === 'quick' || oid.startsWith('QC') || (!oid.startsWith('FOD') && !oid.startsWith('ORD') && type !== 'food');
      }) : [];

      console.log("[ReviewPopup] Found", orders.length, "quick orders");

      if (orders.length === 0) return;

      const shownIds = getShownOrderIds();

      // Find first delivered order that hasn't been shown and hasn't been rated
      const unratedOrder = orders.find((o) => {
        const status = (
          o.orderStatus ||
          o.status ||
          ""
        ).toLowerCase();
        const isDelivered =
          status === "delivered" || status === "completed";
        
        const id = String(o._id || o.orderId || "");
        
        if (!isDelivered) return false;
        if (!id || shownIds.has(id)) return false;

        // Check if already rated
        const hasRating = o.ratings?.restaurant?.rating != null;
        if (hasRating) return false;

        return true;
      });

      if (unratedOrder) {
        console.log("[ReviewPopup] Found unrated delivered order:", unratedOrder._id || unratedOrder.orderId);
        // Delay popup for better UX
        setTimeout(() => {
          setOrder(unratedOrder);
          setOpen(true);
          markOrderAsShown(
            String(unratedOrder._id || unratedOrder.orderId)
          );
        }, 1500);
      } else {
        console.log("[ReviewPopup] No unrated delivered orders found");
      }
    } catch (err) {
      console.error("[ReviewPopup] Check failed:", err);
    }
  }, []);

  // Trigger check on mount
  useEffect(() => {
    checkForDeliveredOrders();
  }, [checkForDeliveredOrders]);

  // Trigger check on page navigation
  useEffect(() => {
    checkForDeliveredOrders();
  }, [location.pathname, checkForDeliveredOrders]);

  // Trigger check on real-time order status notification socket events
  useEffect(() => {
    const handleOrderStatusNotification = (event) => {
      const payload = event?.detail || {};
      const status = (payload.status || payload.orderStatus || "").toLowerCase();
      console.log("[ReviewPopup] Socket event received:", payload);
      if (status === "delivered" || status === "completed") {
        console.log("[ReviewPopup] Order completed in real-time. Triggering review check!");
        checkForDeliveredOrders(true);
      }
    };

    window.addEventListener('orderStatusNotification', handleOrderStatusNotification);
    return () => {
      window.removeEventListener('orderStatusNotification', handleOrderStatusNotification);
    };
  }, [checkForDeliveredOrders]);

  // Trigger check periodically in background (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForDeliveredOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkForDeliveredOrders]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setOrder(null);
    setProductRatings({});
    setProductComments({});
  }, []);

  const handleSubmit = useCallback(async () => {
    const ratedProductIds = Object.keys(productRatings);
    if (ratedProductIds.length === 0) {
      toast.error("Please rate at least one product");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Submit product reviews concurrently
      const productReviewPromises = Object.entries(productRatings).map(
        ([prodId, rating]) =>
          customerApi.submitReview({
            productId: prodId,
            rating,
            comment: productComments[prodId] || "",
          })
      );

      await Promise.allSettled(productReviewPromises);

      // 2. Silently mark the order as rated in the backend by submitting a default store rating
      try {
        const targetId = order._id || order.orderId;
        await orderAPI.submitOrderRatings(targetId, {
          restaurantRating: 5,
          restaurantComment: "Product reviews submitted"
        });
      } catch (err) {
        console.debug("Silent order rating submit failed:", err);
      }

      toast.success("Thanks for reviewing the products!");
      handleClose();
    } catch (error) {
      console.error("Error submitting reviews:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit reviews. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    order,
    productRatings,
    productComments,
    handleClose,
  ]);

  if (!open || !order) return null;

  const items = order.items || [];
  const storeName =
    order.restaurantName ||
    order.restaurant ||
    order.pickupPoints?.[0]?.sourceName ||
    "Store";
  const hasDeliveryPartner = !!(
    order.deliveryPartnerId || order.dispatch?.deliveryPartnerId
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-border"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-800 px-6 py-5 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Star className="w-5 h-5 fill-white" />
                Write a Review
              </h2>
              <p className="text-xs font-bold text-white/95 mt-0.5">
                Share your experience with the products
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
            {/* Product reviews list */}
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const prodId =
                    item.itemId || item.productId || item._id || "";
                  if (!prodId) return null;
                  const rating = productRatings[prodId] || 0;
                  const comment = productComments[prodId] || "";

                  return (
                    <div
                      key={prodId || idx}
                      className="p-5 bg-card dark:bg-neutral-800 rounded-[2rem] border border-border space-y-4 shadow-sm"
                    >
                      <p className="text-sm font-black text-foreground">
                        {item.name} {item.variantName && `(${item.variantName})`}
                      </p>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isActive = rating >= num;
                          return (
                            <button
                              key={`prod-${prodId}-${num}`}
                              type="button"
                              onClick={() =>
                                setProductRatings((prev) => ({
                                  ...prev,
                                  [prodId]: num,
                                }))
                              }
                              className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95",
                                isActive
                                  ? "bg-red-50 dark:bg-red-950/30 text-red-500"
                                  : "bg-card dark:bg-background text-slate-300 dark:text-slate-600 border border-border"
                              )}
                            >
                              <Star
                                className={cn("h-5.5 w-5.5", isActive && "fill-current")}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        rows={2}
                        value={comment}
                        onChange={(e) =>
                          setProductComments((prev) => ({
                            ...prev,
                            [prodId]: e.target.value,
                          }))
                        }
                        className="min-h-[70px] w-full rounded-2xl bg-card dark:bg-background border border-border p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-[#0c831f]/20 text-foreground resize-none"
                        placeholder="What did you like or dislike?"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-center text-slate-500 font-bold">
                No items in this order to rate.
              </p>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={submitting || Object.keys(productRatings).length === 0}
              onClick={handleSubmit}
              className="h-14 w-full rounded-2xl bg-foreground font-black text-background shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
            </button>

            {Object.keys(productRatings).length === 0 && (
              <p className="text-[10px] text-center font-bold uppercase tracking-widest text-slate-400">
                Please rate at least one product
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
