import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
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
    const { cart, cartCount } = useCart();
    const location = useLocation();

    // Show up to 3 latest added product images (items at the end of the cart array)
    const displayItems = cart.slice(-3).reverse();

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

    const miniCartContent = (
        <AnimatePresence>
            {cartCount > 0 && !isCheckoutPage && !isOrderDetailsPage && !isProfilePage && !isWalletPage && !isTransactionsPage && !isWishlistPage && !isAddressesPage && !isSupportPage && !isPrivacyPage && !isAboutPage && (
                <div
                    key="mini-cart-wrapper"
                    id="mini-cart-target"
                    className={cn(
                        "fixed z-[100] pointer-events-auto",
                        "bottom-[92px] left-1/2 -translate-x-1/2 flex justify-center w-auto max-w-[90vw]",
                        className,
                    )}
                >
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="w-full pointer-events-auto"
                    >
                        <Link
                            to={resolvedLinkTo}
                            className="flex items-center justify-between gap-3 h-[46px] bg-[#0c831f] text-white rounded-full shadow-[0_10px_35px_rgba(12,131,31,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 px-4 min-w-[210px] relative overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                {/* Stack of up to 3 latest product images */}
                                <div className="flex items-center -space-x-3 pl-0.5">
                                    {displayItems.map((item, idx) => (
                                        <div
                                            key={item.id || item._id || idx}
                                            className="w-8 h-8 rounded-full bg-white border-2 border-[#0c831f] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
                                            style={{ zIndex: 10 - idx }}
                                        >
                                            <img
                                                src={resolveQuickImageUrl(item.image || item.mainImage)}
                                                alt={item.name}
                                                className="w-full h-full object-contain p-0.5"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://cdn-icons-png.flaticon.com/128/2321/2321831.png";
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col text-left">
                                    <span className="text-[12.5px] font-extrabold tracking-wide leading-none text-white">
                                        View cart
                                    </span>
                                    <span className="text-[9px] font-bold text-white/95 leading-none mt-0.5">
                                        {cartCount} {cartCount === 1 ? 'item' : 'items'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 ml-2">
                                <ChevronRight size={14} strokeWidth={3} className="text-white" />
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
