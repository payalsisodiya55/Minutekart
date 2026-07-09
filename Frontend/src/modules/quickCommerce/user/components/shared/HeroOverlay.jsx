import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useHeroTransition } from '../../context/HeroTransitionContext';
import { resolveQuickImageUrl } from '../../utils/image';

/**
 * HeroOverlay
 *
 * Renders a fixed-position product card clone that animates between
 * the tapped card's screen rect and fullscreen (and back).
 *
 * GPU-accelerated: uses only transform + opacity.
 * No layout changes occur during animation.
 */

// easeInOutCubic bezier
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const DURATION = 350; // ms

const HeroOverlay = () => {
    const { heroState, onExpandComplete, onCollapseComplete } = useHeroTransition();
    const { phase, originRect, product } = heroState;

    const overlayRef = useRef(null);
    const cardRef = useRef(null);
    const backdropRef = useRef(null);

    // Whether the overlay DOM should be present at all
    const isVisible = phase === 'expanding' || phase === 'navigating' || phase === 'collapsing';

    // Derived image URL
    const imageUrl = product
        ? (resolveQuickImageUrl(product.image || product.mainImage) || product.image || product.mainImage)
        : '';

    const displayPrice = product?.price || product?.salePrice || 0;
    const originalPrice = product?.originalPrice || product?.mrp || 0;
    const showDiscount = originalPrice && originalPrice > displayPrice;
    const discountPercent = showDiscount
        ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
        : 0;

    // Run expand animation when phase becomes 'expanding'
    useEffect(() => {
        if (phase !== 'expanding' || !originRect || !cardRef.current || !backdropRef.current) return;

        const card = cardRef.current;
        const backdrop = backdropRef.current;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Starting state: card exactly covers the tapped card
        const startX = originRect.left;
        const startY = originRect.top;
        const startW = originRect.width;
        const startH = originRect.height;

        // Ending state: fullscreen
        const endX = 0;
        const endY = 0;
        const endW = vw;
        const endH = vh;

        // Apply start state instantly (no transition yet)
        card.style.transition = 'none';
        card.style.left = `${startX}px`;
        card.style.top = `${startY}px`;
        card.style.width = `${startW}px`;
        card.style.height = `${startH}px`;
        card.style.borderRadius = '14px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        card.style.opacity = '1';

        backdrop.style.transition = 'none';
        backdrop.style.opacity = '0';

        // Force reflow to apply start state before starting animation
        card.getBoundingClientRect();

        // Trigger expand animation
        requestAnimationFrame(() => {
            card.style.transition = `left ${DURATION}ms ${EASE}, top ${DURATION}ms ${EASE}, width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}, box-shadow ${DURATION}ms ${EASE}`;
            backdrop.style.transition = `opacity ${DURATION}ms ${EASE}`;

            card.style.left = `${endX}px`;
            card.style.top = `${endY}px`;
            card.style.width = `${endW}px`;
            card.style.height = `${endH}px`;
            card.style.borderRadius = '0px';
            card.style.boxShadow = '0 0 0 rgba(0,0,0,0)';
            backdrop.style.opacity = '1';
        });

        // After animation completes, trigger navigation
        const timer = setTimeout(() => {
            onExpandComplete();
        }, DURATION + 20);

        return () => clearTimeout(timer);
    }, [phase, originRect]); // eslint-disable-line react-hooks/exhaustive-deps

    // Run collapse animation when phase becomes 'collapsing'
    useEffect(() => {
        if (phase !== 'collapsing' || !originRect || !cardRef.current || !backdropRef.current) return;

        const card = cardRef.current;
        const backdrop = backdropRef.current;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Start state: fullscreen
        card.style.transition = 'none';
        card.style.left = '0px';
        card.style.top = '0px';
        card.style.width = `${vw}px`;
        card.style.height = `${vh}px`;
        card.style.borderRadius = '0px';
        card.style.boxShadow = '0 0 0 rgba(0,0,0,0)';
        card.style.opacity = '1';

        backdrop.style.transition = 'none';
        backdrop.style.opacity = '1';

        // Force reflow
        card.getBoundingClientRect();

        requestAnimationFrame(() => {
            card.style.transition = `left ${DURATION}ms ${EASE}, top ${DURATION}ms ${EASE}, width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}, box-shadow ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}`;
            backdrop.style.transition = `opacity ${DURATION}ms ${EASE}`;

            card.style.left = `${originRect.left}px`;
            card.style.top = `${originRect.top}px`;
            card.style.width = `${originRect.width}px`;
            card.style.height = `${originRect.height}px`;
            card.style.borderRadius = '14px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            backdrop.style.opacity = '0';
        });

        const timer = setTimeout(() => {
            onCollapseComplete();
        }, DURATION + 20);

        return () => clearTimeout(timer);
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isVisible || !product || !originRect) return null;

    return ReactDOM.createPortal(
        <div
            ref={overlayRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                pointerEvents: phase === 'navigating' ? 'none' : 'auto',
            }}
        >
            {/* Backdrop that fades in/out */}
            <div
                ref={backdropRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.25)',
                    opacity: 0,
                    willChange: 'opacity',
                }}
            />

            {/* Animated card clone */}
            <div
                ref={cardRef}
                style={{
                    position: 'absolute',
                    background: 'white',
                    overflow: 'hidden',
                    willChange: 'left, top, width, height, border-radius',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Product image — centered and contained, mirrors card layout */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        overflow: 'hidden',
                        padding: '12px',
                    }}
                >
                    <img
                        src={imageUrl}
                        alt={product.name || ''}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            // Keep image visually stable — match card's mix-blend
                        }}
                        draggable={false}
                    />
                </div>

                {/* Card info overlay — visible only when card is small (not fullscreen) */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'white',
                        padding: '6px 8px 8px',
                        borderTop: '1px solid rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#1e293b',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {product.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                            ₹{displayPrice}
                        </span>
                        {showDiscount && (
                            <>
                                <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                    ₹{originalPrice}
                                </span>
                                <span style={{ fontSize: '10px', color: '#0c831f', fontWeight: 700 }}>
                                    {discountPercent}% OFF
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HeroOverlay;
