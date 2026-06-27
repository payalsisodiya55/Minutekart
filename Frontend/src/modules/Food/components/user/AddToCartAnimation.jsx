import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from "@food/context/CartContext";
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}



/**
 * AddToCartAnimation Component
 * 
 * A self-contained component that handles:
 * - Fly-to-cart animation when products are added
 * - Bounce-out animation when products are removed
 * - Pulse animation on cart changes
 * - "View cart" button display at bottom center
 * 
 * This component automatically integrates with the CartContext and
 * listens for cart changes to trigger appropriate animations.
 */
export default function AddToCartAnimation({
  bottomOffset = 96,
  pillClassName = '',
  hideOnPages = true,
  linkTo = '/food/user/cart',
  dynamicBottom = null,
}) {
  const { items, itemCount, total, lastAddEvent, lastRemoveEvent, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const linkRef = useRef(null);
  const [removedProduct, setRemovedProduct] = useState(null);
  const [flyingProduct, setFlyingProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const removedThumbnailRef = useRef(null);
  const flyingThumbnailRef = useRef(null);
  const prevItemsRef = useRef(items);

  const safeItems = Array.isArray(items) ? items : [];
  const firstItem = safeItems[0] || {};
  const restaurantName = firstItem.restaurant || "Restaurant";
  const restaurantImage = firstItem.image || firstItem.imageUrl || "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop";
  const restaurantSlug = restaurantName.toLowerCase().replace(/\s+/g, "-");

  // Hide pill on cart pages, order pages, and account page (if enabled)
  const iscartPage = location.pathname === '/cart' ||
    location.pathname === '/user/cart' ||
    location.pathname.startsWith('/cart/') ||
    location.pathname.startsWith('/user/cart/');
  const isOrderPage = location.pathname.startsWith('/orders/');
  const isAccountPage = location.pathname === '/account';
  const shouldHidePill = hideOnPages && (iscartPage || isOrderPage || isAccountPage);

  // Handle removal animation when product is removed
  useEffect(() => {
    if (lastRemoveEvent && lastRemoveEvent.sourcePosition && linkRef.current) {
      const { product, sourcePosition } = lastRemoveEvent;

      // Store the sourcePosition immediately to prevent it from being lost
      const savedSourcePosition = { ...sourcePosition };
      const savedProduct = { ...product };

      setRemovedProduct({ product: savedProduct, targetPos: savedSourcePosition });

      // Wait a bit to ensure pill is rendered
      setTimeout(() => {
        if (removedThumbnailRef.current && linkRef.current) {
          const thumbnail = removedThumbnailRef.current;
          // Get fresh position of the pill (viewport-relative)
          const pillRect = linkRef.current.getBoundingClientRect();
          // Start position: center of the pill (where thumbnails are)
          const startX = pillRect.left + 16; // Approximate position of first thumbnail
          const startY = pillRect.top + pillRect.height / 2; // Vertical center of pill

          // Calculate current viewport position accounting for scroll changes
          // Check multiple sources to get accurate scroll position
          const getScrollX = () => {
            if (window.scrollX !== undefined) return window.scrollX
            if (window.pageXOffset !== undefined) return window.pageXOffset
            if (document.documentElement && document.documentElement.scrollLeft !== undefined) {
              return document.documentElement.scrollLeft
            }
            if (document.body && document.body.scrollLeft !== undefined) {
              return document.body.scrollLeft
            }
            return 0
          }

          const getScrollY = () => {
            if (window.scrollY !== undefined) return window.scrollY
            if (window.pageYOffset !== undefined) return window.pageYOffset
            if (document.documentElement && document.documentElement.scrollTop !== undefined) {
              return document.documentElement.scrollTop
            }
            if (document.body && document.body.scrollTop !== undefined) {
              return document.body.scrollTop
            }
            return 0
          }

          const currentScrollX = getScrollX()
          const currentScrollY = getScrollY()

          // Determine target position (support both new format with viewportX/Y and old format with x/y)
          let targetX, targetY

          if (savedSourcePosition.viewportX !== undefined && savedSourcePosition.viewportY !== undefined) {
            // New format: stored viewport position + scroll at capture time
            // Adjust for scroll changes since capture
            const scrollDeltaX = currentScrollX - (savedSourcePosition.scrollX || 0)
            const scrollDeltaY = currentScrollY - (savedSourcePosition.scrollY || 0)
            // If page scrolled right/down, button moved left/up in viewport
            targetX = savedSourcePosition.viewportX - scrollDeltaX
            targetY = savedSourcePosition.viewportY - scrollDeltaY
          } else {
            // Old format: document-relative position (backward compatibility)
            targetX = savedSourcePosition.x - currentScrollX
            targetY = savedSourcePosition.y - currentScrollY
          }

          // Calculate thumbnail center offset (16px = half of 32px thumbnail)
          const thumbnailCenterOffset = 16;

          // Position at pill location initially (viewport-relative)
          gsap.killTweensOf(thumbnail);
          gsap.set(thumbnail, {
            position: 'fixed',
            left: startX - thumbnailCenterOffset,
            top: startY - thumbnailCenterOffset,
            zIndex: 100000,
            scale: 1,
            rotation: 0,
            opacity: 1,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            x: 0,
            y: 0,
          });

          // Calculate relative movement from pill to source position
          // Both positions are now viewport-relative
          const deltaX = targetX - startX;
          const deltaY = targetY - startY;

          // Fly back to source animation
          const tl = gsap.timeline({
            onComplete: () => {
              setRemovedProduct(null);
            },
          });

          // Step 1: Pop out from pill (scale up slightly)
          tl.to(thumbnail, {
            scale: 1.3,
            duration: 0.15,
            ease: 'power2.out',
          })
            // Step 2: Fly towards source with rotation
            .to(thumbnail, {
              x: deltaX * 0.98, // Slight overshoot for bounce
              y: deltaY,
              rotation: -360,
              scale: 1.1,
              duration: 0.4,
              ease: 'power2.inOut',
            })
            // Step 3: Bounce back slightly
            .to(thumbnail, {
              x: deltaX,
              y: deltaY,
              scale: 0.9,
              duration: 0.15,
              ease: 'power2.out',
            })
            // Step 4: Final bounce into position
            .to(thumbnail, {
              scale: 0.85,
              duration: 0.1,
              ease: 'power2.in',
            })
            // Step 5: Fade out smoothly
            .to(thumbnail, {
              scale: 0.7,
              opacity: 0,
              duration: 0.15,
              ease: 'power2.in',
            });
        }
      }, 10);
    }
  }, [lastRemoveEvent]);

  // Handle fly-to-cart animation when product is added
  useEffect(() => {
    console.log('AddToCartAnimation: lastAddEvent changed:', lastAddEvent, 'linkRef.current:', !!linkRef.current);
    if (lastAddEvent && lastAddEvent.sourcePosition && linkRef.current) {
      const { product, sourcePosition } = lastAddEvent;

      // Store the sourcePosition immediately to prevent it from being lost
      const savedSourcePosition = { ...sourcePosition };
      const savedProduct = { ...product };

      console.log('AddToCartAnimation: Setting flying product:', savedProduct);
      setFlyingProduct({ product: savedProduct, startPos: savedSourcePosition });

      // Wait a bit longer to ensure pill is fully rendered and in position
      setTimeout(() => {
        console.log('AddToCartAnimation timeout: flyingThumbnailRef.current:', !!flyingThumbnailRef.current, 'linkRef.current:', !!linkRef.current);
        if (flyingThumbnailRef.current && linkRef.current) {
          const thumbnail = flyingThumbnailRef.current;
          // Get fresh position after pill animation completes
          const pillRect = linkRef.current.getBoundingClientRect();
          // Target position: center of the pill (viewport-relative)
          const endX = pillRect.left + pillRect.width / 2; // Horizontal center of pill
          const endY = pillRect.top + pillRect.height / 2; // Vertical center of pill

          // Calculate current viewport position accounting for scroll changes
          // Check multiple sources to get accurate scroll position
          const getScrollX = () => {
            if (window.scrollX !== undefined) return window.scrollX
            if (window.pageXOffset !== undefined) return window.pageXOffset
            if (document.documentElement && document.documentElement.scrollLeft !== undefined) {
              return document.documentElement.scrollLeft
            }
            if (document.body && document.body.scrollLeft !== undefined) {
              return document.body.scrollLeft
            }
            return 0
          }

          const getScrollY = () => {
            if (window.scrollY !== undefined) return window.scrollY
            if (window.pageYOffset !== undefined) return window.pageYOffset
            if (document.documentElement && document.documentElement.scrollTop !== undefined) {
              return document.documentElement.scrollTop
            }
            if (document.body && document.body.scrollTop !== undefined) {
              return document.body.scrollTop
            }
            return 0
          }

          const currentScrollX = getScrollX()
          const currentScrollY = getScrollY()

          // Determine source position (support both new format with viewportX/Y and old format with x/y)
          let sourceX, sourceY

          if (savedSourcePosition.viewportX !== undefined && savedSourcePosition.viewportY !== undefined) {
            // New format: stored viewport position + scroll at capture time
            // Adjust for scroll changes since capture
            const scrollDeltaX = currentScrollX - (savedSourcePosition.scrollX || 0)
            const scrollDeltaY = currentScrollY - (savedSourcePosition.scrollY || 0)
            // If page scrolled right/down, button moved left/up in viewport
            sourceX = savedSourcePosition.viewportX - scrollDeltaX
            sourceY = savedSourcePosition.viewportY - scrollDeltaY
          } else {
            // Old format: document-relative position (backward compatibility)
            sourceX = savedSourcePosition.x - currentScrollX
            sourceY = savedSourcePosition.y - currentScrollY
          }

          // Calculate thumbnail center offset (16px = half of 32px thumbnail)
          const thumbnailCenterOffset = 16;

          // Position at source (center of button) - use viewport-relative position
          // Set initial position so the center of thumbnail is at sourcePosition
          gsap.killTweensOf(thumbnail);
          gsap.set(thumbnail, {
            position: 'fixed',
            left: sourceX - thumbnailCenterOffset,
            top: sourceY - thumbnailCenterOffset,
            zIndex: 100000,
            scale: 1,
            rotation: 0,
            opacity: 1,
            width: '32px',
            height: '32px',
            borderRadius: '50%', // Ensure circular
            x: 0,
            y: 0,
          });

          // Fly to cart animation with bounce
          const tl = gsap.timeline({
            onComplete: () => {
              setFlyingProduct(null);
            },
          });

          // Calculate relative movement from source center to target center
          // Both positions are now viewport-relative, so delta is direct
          const deltaX = endX - sourceX;
          const deltaY = endY - sourceY;

          // Step 1: Pop out from button (scale up slightly)
          tl.to(thumbnail, {
            scale: 1.3,
            duration: 0.15,
            ease: 'power2.out',
          })
            // Step 2: Fly towards cart with rotation (no Y overshoot to prevent going below)
            .to(thumbnail, {
              x: deltaX * 0.98, // Slight X overshoot for bounce
              y: deltaY, // No overshoot on Y to prevent going below pill
              rotation: 360,
              scale: 1.1,
              duration: 0.4,
              ease: 'power2.inOut',
            })
            // Step 3: Bounce back slightly on X only (overshoot correction)
            .to(thumbnail, {
              x: deltaX,
              y: deltaY, // Keep Y at exact target
              scale: 0.9,
              duration: 0.15,
              ease: 'power2.out',
            })
            // Step 4: Final bounce into position
            .to(thumbnail, {
              scale: 0.85,
              duration: 0.1,
              ease: 'power2.in',
            })
            // Step 5: Fade out smoothly
            .to(thumbnail, {
              scale: 0.7,
              opacity: 0,
              duration: 0.15,
              ease: 'power2.in',
            });
        }
      }, 150); // Increased delay to ensure pill animation completes
    }
  }, [lastAddEvent]);

  // Enhanced GSAP pulse animation when cart changes (but not on removal or fly-to-cart)
  useEffect(() => {
    if (itemCount > 0 && linkRef.current && !removedProduct && !flyingProduct && !lastRemoveEvent) {
      // Kill any existing animations first
      gsap.killTweensOf(linkRef.current);

      // Enhanced pulse animation with glow effect
      const tl = gsap.timeline();

      // Step 1: Scale up with glow
      tl.to(linkRef.current, {
        scale: 1.08,
        boxShadow: '0 10px 25px rgba(220, 2, 27, 0.4)',
        duration: 0.15,
        ease: 'power2.out',
        transformOrigin: 'center center',
        force3D: true,
      })
        // Step 2: Bounce back
        .to(linkRef.current, {
          scale: 1.0,
          boxShadow: '0 4px 12px rgba(220, 2, 27, 0.3)',
          duration: 0.2,
          ease: 'power2.inOut',
        })
        // Step 3: Subtle second pulse
        .to(linkRef.current, {
          scale: 1.04,
          duration: 0.1,
          ease: 'power1.out',
        })
        .to(linkRef.current, {
          scale: 1.0,
          duration: 0.15,
          ease: 'power1.in',
        });
    }
  }, [itemCount, total, removedProduct, flyingProduct, lastRemoveEvent]);

  // Get up to 3 most recently added items for thumbnails
  // Since items are added to the end of the array, we take the last 3
  const thumbnailItems = safeItems
    .slice(-3)
    .reverse()
    .filter((item) => item && typeof item === 'object');

  return (
    <>
      {/* Removed product thumbnail - flying back to source */}
      {removedProduct && (
        <div
          ref={removedThumbnailRef}
          className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0 shadow-lg z-[100000]"
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        >
          {(removedProduct.product?.imageUrl || removedProduct.product?.image || removedProduct.product?.image_url) ? (
            <img
              src={removedProduct.product.imageUrl || removedProduct.product.image || removedProduct.product.image_url}
              alt={removedProduct.product.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400 text-xs font-semibold rounded-full">
              {removedProduct.product?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}

      {/* Flying product thumbnail - going to cart */}
      {flyingProduct && (
        <div
          ref={flyingThumbnailRef}
          className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0 shadow-lg z-[100000]"
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        >
          {(flyingProduct?.product?.imageUrl || flyingProduct?.product?.image || flyingProduct?.product?.image_url) ? (
            <img
              src={flyingProduct.product.imageUrl || flyingProduct.product.image || flyingProduct.product.image_url}
              alt={flyingProduct?.product?.name || 'Item'}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400 text-xs font-semibold rounded-full">
              {flyingProduct?.product?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {itemCount > 0 && !shouldHidePill && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.8 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{ y: 60, opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              position: 'fixed',
              bottom: dynamicBottom ? undefined : `${bottomOffset || 20}px`,
              pointerEvents: 'auto',
            }}
            className={`left-0 right-0 z-[9999] flex justify-center px-4 pb-4 md:pb-6 transition-all duration-300 ease-in-out bg-transparent ${dynamicBottom || ''}`}
          >
            <div className="bg-white dark:bg-[#0a0a0a] dark:text-white rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.18)] border border-gray-150 dark:border-neutral-800 p-2.5 flex items-center justify-between gap-3 w-full max-w-[380px] md:max-w-md pointer-events-auto">
              {/* Left: Restaurant Image & View Menu */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex-shrink-0 flex items-center">
                  {safeItems.length > 1 ? (
                    <div className="flex items-center -space-x-3.5 overflow-visible pl-1">
                      {safeItems.slice(0, 3).map((item, idx) => (
                        <img
                          key={item.id || idx}
                          src={item.image || item.imageUrl || "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop"}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-[#0a0a0a] shadow-md relative"
                          style={{ zIndex: idx }}
                        />
                      ))}
                    </div>
                  ) : (
                    <img
                      src={restaurantImage}
                      alt={restaurantName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-neutral-800"
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="font-extrabold text-gray-900 dark:text-gray-100 text-[13px] sm:text-[14px] truncate leading-tight">
                    {restaurantName}
                  </h4>
                  <Link
                    to={`/food/user/restaurants/${restaurantSlug}`}
                    className="text-[11px] font-bold text-green-700 dark:text-green-500 hover:text-green-800 underline flex items-center gap-0.5 mt-1"
                  >
                    View Menu
                  </Link>
                </div>
              </div>

              {/* Middle: VIEW CART Pill Button */}
              <button
                ref={linkRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  debugLog('View cart clicked, navigating to:', linkTo);
                  navigate(linkTo);
                }}
                className="flex-shrink-0 bg-[#0f8a3c] hover:bg-green-700 text-white px-5 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-md shadow-green-900/10 cursor-pointer"
              >
                <span className="text-[10px] font-medium leading-none opacity-90">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} | ₹{Math.round(total)}
                </span>
                <span className="text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
                  VIEW CART <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </span>
              </button>

              {/* Right: Red Delete/Trash Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmModal(true);
                }}
                className="flex-shrink-0 w-11 h-11 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center transition-all active:scale-95 border border-red-100/50 dark:border-red-900/10 cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-150 dark:border-neutral-800 relative pointer-events-auto text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button X */}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-2">
                Clear cart?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Are you sure you want to clear your cart from {restaurantName}?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold text-center transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/10 active:scale-95 cursor-pointer"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    setShowConfirmModal(false);
                  }}
                  className="flex-1 py-3 px-6 rounded-full bg-[#0f8a3c] text-white font-bold text-center transition-all hover:bg-green-700 active:scale-95 cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

