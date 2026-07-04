import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, User, ChevronLeft, Package, ShoppingCart, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import {
    getQuickCategoriesPath,
    getQuickHomePath,
    getQuickProfilePath,
    getQuickOrdersPath,
    getQuickCartPath,
} from '../../utils/routes';
import DraggableModuleSwitcher from "../../../../common/components/DraggableModuleSwitcher";

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const cartContext = useCart();
    let cartCount = cartContext ? cartContext.cartCount : 0;
    if (!cartContext) {
        try {
            const stored = localStorage.getItem("quick_commerce_cart");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    cartCount = parsed.reduce((sum, item) => sum + (item.quantity || 0), 0);
                }
            }
        } catch (e) {}
    }

    const isSharedQuickProfileRoute =
        location.pathname === '/profile' &&
        (new URLSearchParams(location.search).get('from') === 'quick' ||
         new URLSearchParams(location.search).get('from') === 'food');

    const isActivePath = (targetPath) => {
        if ((targetPath === getQuickProfilePath() || targetPath === '/profile?from=quick') && isSharedQuickProfileRoute) {
            return true;
        }
        if (targetPath === getQuickHomePath(location.pathname)) {
            return location.pathname === targetPath;
        }
        return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
    };

    const items = [
        { type: 'link', label: 'Home', icon: Home, path: getQuickHomePath() },
        { type: 'link', label: 'Category', icon: LayoutGrid, path: getQuickCategoriesPath() },
        { type: 'link', label: 'Orders', icon: Package, path: getQuickOrdersPath() },
        { type: 'link', label: 'Cart', icon: ShoppingCart, path: getQuickCartPath(), hasBadge: true },
        { type: 'link', label: 'Profile', icon: User, path: '/profile?from=quick' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[500] md:hidden transition-all duration-300">
            <DraggableModuleSwitcher />
            <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border-t border-gray-100 dark:border-border flex items-center justify-between h-[65px] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)]">
                {items.map((item, index) => {
                    const isActive = item.type === 'link' && isActivePath(item.path);
                    const IconComponent = item.icon;

                    const content = (
                        <div className="flex flex-col items-center justify-center relative w-full h-full">
                            <div className="relative">
                                <IconComponent
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        "transition-colors duration-300",
                                        isActive ? "text-[#0c831f]" : "text-gray-400 dark:text-slate-500"
                                    )}
                                />
                                {item.hasBadge && cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 bg-[#e23737] text-white text-[8px] font-black rounded-full min-w-[14px] h-[14px] px-0.5 flex items-center justify-center border border-white shadow-sm">
                                        {cartCount}
                                    </span>
                                )}
                            </div>

                            {item.label && (
                                <span
                                    className={cn(
                                        "text-[9px] font-extrabold tracking-tight mt-1 transition-colors duration-300 leading-none",
                                        isActive ? "text-[#0c831f]" : "text-gray-400 dark:text-slate-500"
                                    )}
                                >
                                    {item.label}
                                </span>
                            )}
                        </div>
                    );

                    if (item.type === 'link') {
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex-1 flex flex-col items-center justify-center h-full relative group transition-all"
                            >
                                {content}
                                {isActive && (
                                    <motion.div
                                        layoutId="topLine"
                                        className="absolute top-0 w-8 h-[3px] bg-[#0c831f] rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={`action-${index}`}
                            onClick={item.action}
                            className="flex-1 flex flex-col items-center justify-center h-full bg-transparent border-0 outline-none p-0 cursor-pointer"
                        >
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
