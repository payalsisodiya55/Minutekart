import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ShoppingBag, ShoppingCart } from 'lucide-react';
import Lottie from 'lottie-react';
import { useCart } from '../../context/CartContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import shoppingCartAnimation from "@/assets/lottie/shopping-cart.json";
import {
    getQuickCartPath,
    isEmbeddedQuickPath,
} from '../../utils/routes';
import { resolveQuickImageUrl } from '../../utils/image';

const MiniCart = ({
    position = "center",
    linkTo,
    className = "",
}) => {
    const { cart, cartCount, cartTotal } = useCart();
    const location = useLocation();

    // Show up to 3 latest added product images (items at the end of the cart array)
    const displayItems = cart.slice(-3).reverse();

    const savingsTotal = cart.reduce(
        (total, item) => total + Math.max(0, ((item.originalPrice || item.mrp || 0) - (item.price || 0)) * item.quantity),
        0
    );

    const path = location.pathname.replace(/\/$/, '') || '/';
    const normalizedQuickPath =
        path.replace(/^\/quick(?:-commerce(?:\/user)?)?/, '') || '/';
    const isEmbedded = isEmbeddedQuickPath(path);
    const resolvedLinkTo = linkTo || getQuickCartPath(path);

    // Hide MiniCart on checkout page, order details page, profile page, wallet, transactions, wishlist, addresses, support, privacy, and about page
    const isCheckoutPage = isEmbedded ? path === '/food/user/cart' : normalizedQuickPath === '/checkout';
    const isOrderDetailsPage = isEmbedded ? false : normalizedQuickPath.startsWith('/orders');
    const isProfilePage = isEmbedded ? false : normalizedQuickPath === '/profile';
    const isWalletPage = isEmbedded ? false : normalizedQuickPath === '/wallet';
    const isTransactionsPage = isEmbedded ? false : normalizedQuickPath === '/transactions';
    const isWishlistPage = isEmbedded ? false : normalizedQuickPath.startsWith('/wishlist');
    const isAddressesPage = isEmbedded ? false : normalizedQuickPath.startsWith('/addresses');
    const isSupportPage = isEmbedded ? false : normalizedQuickPath.startsWith('/support');
    const isPrivacyPage = isEmbedded ? false : normalizedQuickPath.startsWith('/privacy');
    const isAboutPage = isEmbedded ? false : normalizedQuickPath.startsWith('/about');
    const isBottomRight = position === "bottom-right";
    const isProductDetailPage = normalizedQuickPath.startsWith('/product/') && !normalizedQuickPath.includes('/similar');

    const miniCartContent = (
        <AnimatePresence>
            {cartCount > 0 && !isCheckoutPage && !isOrderDetailsPage && !isProfilePage && !isWalletPage && !isTransactionsPage && !isWishlistPage && !isAddressesPage && !isSupportPage && !isPrivacyPage && !isAboutPage && (
                <div
                    key="mini-cart-wrapper"
                    id="mini-cart-target"
                    className={cn(
                        "fixed z-[100] pointer-events-auto",
                        isProductDetailPage ? "bottom-[130px] md:bottom-[92px]" : "bottom-[84px]",
                        "left-0 right-0 px-4 flex justify-center w-full max-w-full",
                        className,
                    )}
                >
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="w-full max-w-xl pointer-events-auto"
                    >
                        <Link
                            to={resolvedLinkTo}
                            className="flex items-center justify-between gap-3 h-[58px] bg-[#0c831f] text-white rounded-[16px] shadow-[0_8px_25px_rgba(12,131,31,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300 px-4 w-full relative overflow-hidden"
                        >
                            <div className="flex items-center gap-3">
                                {/* Shopping Cart Icon with Red Circle Badge */}
                                <div className="relative p-1">
                                    <ShoppingCart size={24} className="text-white" />
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#e23737] text-white text-[9.5px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border border-white shadow-sm">
                                        {cartCount}
                                    </span>
                                </div>

                                <div className="flex flex-col text-left">
                                    <span className="text-[13.5px] md:text-[14.5px] font-extrabold tracking-wide leading-tight text-white whitespace-nowrap">
                                        {cartCount} Item{cartCount === 1 ? '' : 's'} | ₹{cartTotal.toLocaleString()}
                                    </span>
                                    {savingsTotal > 0 && (
                                        <span className="text-[9.5px] md:text-[10.5px] font-semibold text-[#FFE500] leading-tight mt-0.5">
                                            You saved ₹{savingsTotal.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* White Button: View Cart -> */}
                            <div className="flex items-center gap-1.5 bg-white text-[#0c831f] font-black text-[13px] md:text-[14px] px-3.5 py-1.5 rounded-[10px] shadow-sm hover:bg-white/95 transition-colors">
                                <span>View Cart</span>
                                <ChevronRight size={13} strokeWidth={3} className="text-[#0c831f]" />
                            </div>
                        </Link>
                    </motion.div>
                </div>
            )}
            <style>
                {`
                    @keyframes mini-cart-shimmer {
                        0% { transform: translateX(-140%); }
                        100% { transform: translateX(320%); }
                    }
                `}
            </style>
        </AnimatePresence>
    );

    if (typeof window !== "undefined" && document.body) {
        return createPortal(miniCartContent, document.body);
    }
    
    return miniCartContent;
};

export default MiniCart;
