import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { getWithDedupe } from '@core/api/dedupe';
import { isTokenExpired } from '@core/utils/token';

const AuthContext = createContext(undefined);

const getCurrentDeviceFcm = async (moduleName) => {
    let platform = localStorage.getItem(`fcm_registered_platform_${moduleName}`) === 'mobile'
        ? 'mobile'
        : 'web';
    let fcmToken = null;

    try {
        if (window.flutter_inappwebview?.callHandler) {
            platform = 'mobile';
            for (const handler of ['getFcmToken', 'getFCMToken', 'getPushToken', 'getFirebaseToken']) {
                const token = await window.flutter_inappwebview.callHandler(handler, { module: moduleName });
                if (typeof token === 'string' && token.trim()) {
                    fcmToken = token.trim();
                    break;
                }
            }
        } else if (window.MobileApp?.getFcmToken) {
            platform = 'mobile';
            fcmToken = String(await Promise.resolve(window.MobileApp.getFcmToken()) || '').trim() || null;
        }
    } catch (error) {
        console.warn('Unable to read native FCM token during logout', error);
    }

    if (!fcmToken) {
        fcmToken = localStorage.getItem(`fcm_web_registered_token_${moduleName}`) || null;
    }

    return { fcmToken, platform };
};

const ROLE_STORAGE_KEYS = {
    customer: 'auth_customer',
    seller: 'auth_seller',
    admin: 'auth_admin',
    delivery: 'auth_delivery'
};

const LEGACY_ROLE_STORAGE_KEYS = {
    customer: ['user_accessToken'],
    seller: ['seller_accessToken'],
    admin: ['admin_accessToken'],
    delivery: ['delivery_accessToken']
};

const extractProfilePayload = (response) => {
    const raw = response?.data?.result ?? response?.data?.data ?? null;
    if (raw && typeof raw === 'object' && raw.user) {
        return raw.user;
    }
    return raw;
};

const getProfileEndpoint = (role) => {
    if (role === 'seller') return '/seller/profile';
    return '/auth/me';
};

export const AuthProvider = ({ children }) => {
    // Current role based on URL
    const getCurrentRoleFromUrl = () => {
        const pathname = window.location.pathname || '';
        const hash = (window.location.hash || '').replace(/^#\/?/, '/');
        // If hash contains a real path, prioritize it over pathname since we use HashRouter in APK
        const path = hash !== '/' && hash ? hash : pathname;

        if (path.startsWith('/seller')) return 'seller';
        if (path.startsWith('/admin')) return 'admin';
        if (path.startsWith('/delivery')) return 'delivery';
        return 'customer';
    };

    const getSafeToken = (key) => {
        const val = localStorage.getItem(ROLE_STORAGE_KEYS[key]);
        const fallbackVal =
            val ||
            LEGACY_ROLE_STORAGE_KEYS[key]?.map((storageKey) => localStorage.getItem(storageKey)).find(Boolean) ||
            null;
        if (!fallbackVal) return null;
        const normalizedVal = fallbackVal;
        if (normalizedVal.startsWith('{')) {
            try { return JSON.parse(normalizedVal).token; } catch { return normalizedVal; }
        }
        return normalizedVal;
    };

    const [authData, setAuthData] = useState({
        customer: getSafeToken('customer'),
        seller: getSafeToken('seller'),
        admin: getSafeToken('admin'),
        delivery: getSafeToken('delivery'),
    });

    const currentRole = getCurrentRoleFromUrl();
    const [user, setUser] = useState(null);
    const token = authData[currentRole];
    const [isLoading, setIsLoading] = useState(Boolean(authData[currentRole]));
    const isAuthenticated = !!token && !isTokenExpired(token);

    // Fetch user profile on mount or token change
    useEffect(() => {
        const fetchProfile = async () => {
            if (token) {
                setIsLoading(true);
                try {
                    // Use deduplicated fetch to avoid multiple simultaneous profile calls
                    const requestConfig = { ttl: 5000, contextModule: currentRole };
                    if (token) {
                        requestConfig.headers = { Authorization: `Bearer ${token}` };
                    }
                    const response = await getWithDedupe(
                        getProfileEndpoint(currentRole),
                        {},
                        requestConfig
                    );
                    setUser(extractProfilePayload(response));
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    // If 401, axios interceptor will handle it
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUser(null);
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [token, currentRole]);

    const login = (userData) => {
        const role = userData.role?.toLowerCase() || 'customer';
        const storageKey = ROLE_STORAGE_KEYS[role];

        if (storageKey && userData.token) {
            // Save ONLY the token string as requested by the user
            localStorage.setItem(storageKey, userData.token);

            setAuthData(prev => ({ ...prev, [role]: userData.token }));
            setUser(userData); // Set full data initially
        } else {
            console.error('Invalid role or missing token for login:', role);
        }
    };

    const logout = async () => {
        const path = window.location.pathname;
        const moduleName = currentRole === 'customer' ? 'user' : currentRole;
        const currentAccessToken = authData[currentRole] || localStorage.getItem(`${moduleName}_accessToken`);
        const currentRefreshToken = localStorage.getItem(`${moduleName}_refreshToken`);

        try {
            const { fcmToken, platform } = await getCurrentDeviceFcm(moduleName);

            // Remove this exact device token while the access token is still available.
            if (fcmToken && currentAccessToken) {
                await axiosInstance.delete(`/fcm-tokens/remove/${encodeURIComponent(fcmToken)}`, {
                    data: { token: fcmToken, platform },
                    headers: { Authorization: `Bearer ${currentAccessToken}` },
                    contextModule: moduleName,
                });
            }

            // Invalidate the server refresh session as well.
            if (currentRefreshToken) {
                await axiosInstance.post('/food/auth/logout', {
                    refreshToken: currentRefreshToken,
                    ...(fcmToken ? { fcmToken, platform } : {}),
                }, {
                    headers: currentAccessToken
                        ? { Authorization: `Bearer ${currentAccessToken}` }
                        : undefined,
                    contextModule: moduleName,
                });
            }
        } catch (error) {
            console.warn('Backend logout/FCM cleanup failed; continuing local logout', error);
        }

        // Clear all role-specific tokens from localStorage
        Object.values(ROLE_STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        Object.values(LEGACY_ROLE_STORAGE_KEYS).flat().forEach(key => {
            localStorage.removeItem(key);
        });

        // Also clear common/compat keys used by older module code.
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        ['admin', 'seller', 'delivery', 'user'].forEach((module) => {
            localStorage.removeItem(`${module}_accessToken`);
            localStorage.removeItem(`${module}_refreshToken`);
            localStorage.removeItem(`${module}_authenticated`);
            localStorage.removeItem(`${module}_user`);
            localStorage.removeItem(`fcm_web_registered_token_${module}`);
            localStorage.removeItem(`fcm_registered_platform_${module}`);
        });

        setAuthData({
            customer: null,
            seller: null,
            admin: null,
            delivery: null,
        });
        setUser(null);

        if (path.startsWith('/admin')) window.location.href = '/admin/login';
        else if (path.startsWith('/seller')) window.location.href = '/seller/auth';
        else if (path.startsWith('/delivery')) window.location.href = '/delivery/auth';
        else window.location.href = '/user/auth/login';
    };
    const refreshUser = async () => {
        if (token) {
            try {
                const response = await axiosInstance.get(getProfileEndpoint(currentRole));
                const payload = extractProfilePayload(response);
                setUser(payload);
                return payload;
            } catch (error) {
                console.error('Failed to refresh profile:', error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token, // Added token to context
            role: currentRole,
            isAuthenticated,
            isLoading,
            authData,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
