import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useHeroTransition } from '../../context/HeroTransitionContext';
import { resolveQuickImageUrl } from '../../utils/image';
import { ArrowLeft, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const OPEN_DURATION = 420;
const CLOSE_DURATION = 360;

const HeroOverlay = () => {
    const { heroState, onExpandComplete, onCollapseComplete } = useHeroTransition();
    const { phase, originRect, product } = heroState;

    const [isExpanded, setIsExpanded] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    const isVisible = phase === 'expanding' || phase === 'navigating' || phase === 'collapsing';

    // Track responsive layout
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const checkSize = () => setIsDesktop(window.innerWidth >= 768);
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Set transition states based on animation phases
    useEffect(() => {
        if (phase === 'expanding') {
            setIsExpanded(false);
            const t1 = requestAnimationFrame(() => {
                const t2 = requestAnimationFrame(() => {
                    setIsExpanded(true);
                });
                return () => cancelAnimationFrame(t2);
            });
            return () => cancelAnimationFrame(t1);
        } else if (phase === 'collapsing') {
            setIsExpanded(true);
            const t1 = requestAnimationFrame(() => {
                const t2 = requestAnimationFrame(() => {
                    setIsExpanded(false);
                });
                return () => cancelAnimationFrame(t2);
            });
            return () => cancelAnimationFrame(t1);
        }
    }, [phase]);

    // Handle animation completion events
    useEffect(() => {
        if (!isVisible) return;

        const duration = phase === 'expanding' ? OPEN_DURATION : CLOSE_DURATION;
        const timer = setTimeout(() => {
            if (phase === 'expanding') {
                onExpandComplete();
            } else if (phase === 'collapsing') {
                onCollapseComplete();
            }
        }, duration + 10);

        return () => clearTimeout(timer);
    }, [phase, isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isVisible || !product || !originRect) return null;

    const imageUrl = resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage;
    const displayPrice = product.price || product.salePrice || 0;
    const originalPrice = product.originalPrice || product.mrp || 0;
    const showDiscount = originalPrice && originalPrice > displayPrice;
    const discountPercent = showDiscount ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

    const duration = phase === 'expanding' ? OPEN_DURATION : CLOSE_DURATION;
    const transitionStyle = { transition: `all ${duration}ms ${EASE}` };

    // Layout configuration values
    const desktopLeft = 12; // vw
    const desktopWidth = 76; // vw
    const desktopTop = 72; // px
    const desktopHeight = 'calc(100vh - 88px)';

    // 1. Fullscreen / Card Wrapper Styles
    const containerStyle = {
        position: 'fixed',
        zIndex: 9999,
        left: isExpanded 
            ? (isDesktop ? `${desktopLeft}vw` : '0px') 
            : `${originRect.left}px`,
        top: isExpanded 
            ? (isDesktop ? `${desktopTop}px` : '0px') 
            : `${originRect.top}px`,
        width: isExpanded 
            ? (isDesktop ? `${desktopWidth}vw` : '100vw') 
            : `${originRect.width}px`,
        height: isExpanded 
            ? (isDesktop ? desktopHeight : '100vh') 
            : `${originRect.height}px`,
        borderRadius: isExpanded 
            ? (isDesktop ? '24px' : '0px') 
            : '14px',
        boxShadow: isExpanded 
            ? '0 25px 50px -12px rgba(0,0,0,0.15)' 
            : '0 2px 8px rgba(0,0,0,0.04)',
        background: 'white',
        border: isExpanded ? 'none' : '1px solid rgba(226, 232, 240, 0.6)',
        overflow: 'hidden',
        willChange: 'left, top, width, height, border-radius, box-shadow',
        display: 'flex',
        flexDirection: isDesktop && isExpanded ? 'row' : 'column',
        ...transitionStyle,
    };

    // 2. Backdrop Overlay
    const backdropStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        opacity: isExpanded ? 1 : 0,
        willChange: 'opacity',
        ...transitionStyle,
    };

    // 3. Image Section Container
    const imageContainerStyle = {
        width: isDesktop && isExpanded ? '42%' : '100%',
        height: isExpanded 
            ? (isDesktop ? '100%' : '42vh') 
            : `${originRect.height * 0.55}px`,
        background: isExpanded ? '#F8F9FA' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isExpanded ? '24px' : '8px',
        position: 'relative',
        flexShrink: 0,
        ...transitionStyle,
    };

    // 4. Product Info Wrapper
    const infoContainerStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: isExpanded ? (isDesktop ? '40px 32px' : '24px') : '8px 10px',
        background: 'white',
        ...transitionStyle,
    };

    return ReactDOM.createPortal(
        <>
            {/* Dark background overlay */}
            <div style={backdropStyle} />

            {/* Animating Product Card */}
            <div 
                className="text-slate-800 dark:text-slate-100 dark:bg-neutral-900 border-slate-200/60 dark:border-neutral-800"
                style={containerStyle}
            >
                {/* Header elements inside card */}
                {isExpanded && (
                    <div 
                        style={{
                            position: 'absolute',
                            top: isDesktop ? '20px' : '16px',
                            left: isDesktop ? '20px' : '16px',
                            right: isDesktop ? '20px' : '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 10,
                            pointerEvents: 'none',
                        }}
                    >
                        {/* Back Arrow */}
                        <div 
                            style={{
                                opacity: isExpanded ? 1 : 0,
                                transform: isExpanded ? 'translateX(0px)' : 'translateX(-12px)',
                                transition: `all ${duration}ms ${EASE}`,
                                pointerEvents: 'auto',
                            }}
                            className="w-10 h-10 bg-white dark:bg-neutral-800 shadow-md rounded-full flex items-center justify-center border border-slate-100 dark:border-neutral-700"
                        >
                            <ArrowLeft size={20} className="text-slate-700 dark:text-slate-200" strokeWidth={2.5} />
                        </div>

                        {/* Favorite Badge */}
                        <div 
                            style={{
                                opacity: isExpanded ? 1 : 0,
                                transform: isExpanded ? 'translateX(0px)' : 'translateX(12px)',
                                transition: `all ${duration}ms ${EASE}`,
                                pointerEvents: 'auto',
                            }}
                            className="w-10 h-10 bg-white dark:bg-neutral-800 shadow-md rounded-full flex items-center justify-center border border-slate-100 dark:border-neutral-700"
                        >
                            <Heart size={20} className="text-slate-400 dark:text-neutral-500" strokeWidth={2.5} />
                        </div>
                    </div>
                )}

                {/* Left Column / Top Section: Image Area */}
                <div style={imageContainerStyle}>
                    {/* Time Badge (visible only in collapsed card) */}
                    {!isExpanded && (
                        <div 
                            style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: '#E5F7ED',
                                color: '#0c831f',
                                fontWeight: 'bold',
                                fontSize: '9px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                            }}
                        >
                            {product.deliveryTime || "10-15 mins"}
                        </div>
                    )}

                    <img 
                        src={imageUrl} 
                        alt={product.name || ''} 
                        style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            userSelect: 'none',
                        }}
                    />
                </div>

                {/* Right Column / Bottom Section: Product Info */}
                <div style={infoContainerStyle}>
                    {/* Category Label (Expanded details layout only) */}
                    {isExpanded && (
                        <div 
                            style={{
                                opacity: isExpanded ? 1 : 0,
                                transform: isExpanded ? 'translateY(0px)' : 'translateY(8px)',
                                transition: `all ${duration}ms ${EASE}`,
                                display: 'inline-block',
                                marginBottom: '12px',
                            }}
                        >
                            <span className="rounded-full border border-[#0c831f]/20 bg-[#0c831f]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#0c831f]">
                                {product.category || "Grocery"}
                            </span>
                        </div>
                    )}

                    {/* Product Name */}
                    <div 
                        style={{
                            fontSize: isExpanded ? (isDesktop ? '26px' : '22px') : '12px',
                            fontWeight: isExpanded ? '800' : 'bold',
                            color: 'inherit',
                            lineHeight: 1.25,
                            margin: 0,
                            overflow: isExpanded ? 'visible' : 'hidden',
                            textOverflow: isExpanded ? 'clip' : 'ellipsis',
                            whiteSpace: isExpanded ? 'normal' : 'nowrap',
                            ...transitionStyle,
                        }}
                    >
                        {product.name}
                    </div>

                    {/* Weight */}
                    <div 
                        style={{
                            fontSize: isExpanded ? '13px' : '10px',
                            fontWeight: isExpanded ? '600' : 'bold',
                            color: '#94a3b8',
                            marginTop: isExpanded ? '6px' : '0px',
                            ...transitionStyle,
                        }}
                    >
                        {product.weight || "1 unit"}
                    </div>

                    {/* Price Block */}
                    <div 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'baseline', 
                            gap: isExpanded ? '12px' : '6px', 
                            marginTop: isExpanded ? '16px' : '4px',
                            ...transitionStyle,
                        }}
                    >
                        <span 
                            style={{ 
                                fontSize: isExpanded ? '28px' : '13px', 
                                fontWeight: '900', 
                                color: isExpanded ? '#0c831f' : '#0f172a',
                                ...transitionStyle,
                            }}
                        >
                            ₹{displayPrice}
                        </span>

                        {showDiscount && (
                            <>
                                <span 
                                    style={{ 
                                        fontSize: isExpanded ? '16px' : '10px', 
                                        color: '#94a3b8', 
                                        textDecoration: 'line-through',
                                        fontWeight: 'semibold',
                                        ...transitionStyle,
                                    }}
                                >
                                    ₹{originalPrice}
                                </span>
                                <span 
                                    style={{ 
                                        fontSize: isExpanded ? '12px' : '10px', 
                                        color: '#0c831f', 
                                        fontWeight: '700',
                                        ...transitionStyle,
                                    }}
                                >
                                    {discountPercent}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Collapsed Add Button (Matches card look) */}
                    {!isExpanded && (
                        <div 
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                height: '30px',
                                border: '1px solid #0c831f',
                                color: '#0c831f',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'black',
                                background: 'white',
                            }}
                        >
                            ADD
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
};

export default HeroOverlay;
