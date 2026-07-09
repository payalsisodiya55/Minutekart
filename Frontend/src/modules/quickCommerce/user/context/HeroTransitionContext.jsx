import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

/**
 * HeroTransitionContext
 *
 * Coordinates the Blinkit-style card → fullscreen hero animation.
 *
 * Animation phases:
 *  idle        — no animation running
 *  expanding   — card clone animating from card rect to fullscreen
 *  navigating  — route change happening (overlay still visible)
 *  collapsing  — card clone animating from fullscreen back to origin rect
 */

const HeroTransitionContext = createContext(null);

export const useHeroTransition = () => {
    const ctx = useContext(HeroTransitionContext);
    if (!ctx) throw new Error('useHeroTransition must be used within HeroTransitionProvider');
    return ctx;
};

export const HeroTransitionProvider = ({ children }) => {
    const [heroState, setHeroState] = useState({
        phase: 'idle',          // 'idle' | 'expanding' | 'navigating' | 'collapsing'
        originRect: null,       // DOMRect of the tapped card
        product: null,          // product data for the clone
        scrollY: 0,             // scroll position at tap time
    });

    // Ref for the pending navigate callback — set externally by CategoryProductsPage
    const pendingNavigateRef = useRef(null);
    // Ref to the product detail page's back callback
    const collapseCallbackRef = useRef(null);

    /**
     * Called when user taps a product card.
     * @param {DOMRect} rect - getBoundingClientRect() of the tapped card
     * @param {Object} product - product data
     * @param {Function} navigateFn - function to call after expand animation completes
     */
    const triggerHeroExpand = useCallback((rect, product, navigateFn) => {
        pendingNavigateRef.current = navigateFn;

        setHeroState({
            phase: 'expanding',
            originRect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            },
            product,
            scrollY: window.scrollY,
        });
    }, []);

    /**
     * Called by HeroOverlay after expansion animation completes.
     * Triggers the route navigation while the overlay stays on screen.
     */
    const onExpandComplete = useCallback(() => {
        setHeroState(prev => ({ ...prev, phase: 'navigating' }));
        if (pendingNavigateRef.current) {
            pendingNavigateRef.current();
            pendingNavigateRef.current = null;
        }
    }, []);

    /**
     * Called by ProductDetailPage when it has mounted and is ready to reveal.
     * The overlay fades out and the product page becomes visible.
     */
    const onDetailMounted = useCallback(() => {
        // Small delay to allow ProductDetailPage to render before dismissing overlay
        setTimeout(() => {
            setHeroState(prev => ({ ...prev, phase: 'idle' }));
        }, 80);
    }, []);

    /**
     * Called when user presses Back on the ProductDetailPage.
     * Starts the collapse animation — the overlay re-appears and shrinks back to the origin rect.
     * @param {Function} navigateBackFn - function to call after collapse animation completes
     */
    const triggerHeroCollapse = useCallback((navigateBackFn) => {
        collapseCallbackRef.current = navigateBackFn;

        setHeroState(prev => ({
            ...prev,
            phase: 'collapsing',
        }));
    }, []);

    /**
     * Called by HeroOverlay after collapse animation completes.
     */
    const onCollapseComplete = useCallback(() => {
        if (collapseCallbackRef.current) {
            collapseCallbackRef.current();
            collapseCallbackRef.current = null;
        }
        setHeroState({
            phase: 'idle',
            originRect: null,
            product: null,
            scrollY: 0,
        });
    }, []);

    const value = {
        heroState,
        triggerHeroExpand,
        onExpandComplete,
        onDetailMounted,
        triggerHeroCollapse,
        onCollapseComplete,
    };

    return (
        <HeroTransitionContext.Provider value={value}>
            {children}
        </HeroTransitionContext.Provider>
    );
};

export default HeroTransitionContext;
