import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

const getCustomerToken = () =>
    localStorage.getItem('auth_customer') ||
    localStorage.getItem('user_accessToken') ||
    null;

const LOGIN_PATHS = {
    seller: '/seller/auth',
    admin: '/admin/login',
    delivery: '/food/delivery/login',
    customer: '/user/auth/login',
};

const MODULE_STORAGE_KEYS = {
    seller: ['auth_seller', 'seller_accessToken', 'seller_refreshToken', 'seller_authenticated', 'seller_user', 'token'],
    admin: ['auth_admin', 'admin_accessToken', 'admin_refreshToken', 'admin_authenticated', 'admin_user', 'adminToken', 'adminInfo', 'token'],
    delivery: ['auth_delivery', 'delivery_accessToken', 'delivery_refreshToken', 'delivery_authenticated', 'delivery_user', 'token'],
    customer: ['auth_customer', 'user_accessToken', 'user_refreshToken', 'user_authenticated', 'user_user', 'accessToken', 'refreshToken', 'token'],
};

const isAuthenticationRequest = (url = '') => {
    const normalized = String(url || '').toLowerCase();
    const isAuthRoute = normalized.includes('/auth/');
    return (
        (isAuthRoute && normalized.includes('/request-otp')) ||
        (isAuthRoute && normalized.includes('/verify-otp')) ||
        (isAuthRoute && normalized.includes('/login')) ||
        (isAuthRoute && normalized.includes('/signup')) ||
        (isAuthRoute && normalized.includes('/refresh-token')) ||
        (isAuthRoute && normalized.includes('/forgot-password'))
    );
};

const getCurrentAppPath = () => {
    const hashPath = String(window.location.hash || '').replace(/^#/, '');
    return hashPath.startsWith('/') ? hashPath : window.location.pathname;
};

let redirectingToLogin = false;

const redirectToLogin = (module) => {
    const normalizedModule = LOGIN_PATHS[module] ? module : 'customer';
    const loginPath = LOGIN_PATHS[normalizedModule];
    const currentPath = getCurrentAppPath();

    (MODULE_STORAGE_KEYS[normalizedModule] || ['token']).forEach((key) => {
        localStorage.removeItem(key);
    });
    window.dispatchEvent(new Event(`${normalizedModule === 'customer' ? 'user' : normalizedModule}AuthChanged`));

    if (currentPath.startsWith(loginPath) || redirectingToLogin) return;

    redirectingToLogin = true;
    window.location.replace(loginPath);
};

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    (config) => {
        let token = null;
        const url = config.url;
        const pagePath = window.location.pathname;

        // Determination strategy: 
        // 1. If we are on a module-specific page (e.g. /seller/dashboard), prioritize that module's token
        // This is crucial for shared APIs like /products or /admin/categories
        if (pagePath.startsWith('/seller')) {
            token = localStorage.getItem('auth_seller');
        } else if (pagePath.startsWith('/admin')) {
            token = localStorage.getItem('auth_admin');
        } else if (pagePath.startsWith('/delivery')) {
            token = localStorage.getItem('auth_delivery');
        } else if (pagePath.startsWith('/customer')) {
            token = getCustomerToken();
        }

        // 2. Fallback to URL-based detection
        if (!token) {
            if (url.startsWith('/seller')) token = localStorage.getItem('auth_seller');
            else if (url.startsWith('/admin')) token = localStorage.getItem('auth_admin');
            else if (url.startsWith('/delivery')) token = localStorage.getItem('auth_delivery');
            else if (url.startsWith('/customer') || url.startsWith('/cart') || url.startsWith('/wishlist') || url.startsWith('/categories') || url.startsWith('/products')) {
                token = getCustomerToken();
            }
        }

        // 3. Final default: if we are on a general page and STILL no token, try customer token
        if (!token && !pagePath.startsWith('/admin') && !pagePath.startsWith('/seller') && !pagePath.startsWith('/delivery')) {
            token = getCustomerToken();
        }

        // 3. Last fallback: Check common 'token' key if implemented
        if (!token) {
            token = localStorage.getItem('token');
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest) {
            if (isAuthenticationRequest(originalRequest.url)) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            const path = getCurrentAppPath();
            const requestUrl = String(originalRequest?.url || '');
            const currentModule = path.startsWith('/seller')
                ? 'seller'
                : path.startsWith('/admin')
                    ? 'admin'
                    : path.startsWith('/delivery')
                        ? 'delivery'
                        : 'customer';
            const requestModule = requestUrl.startsWith('/seller')
                ? 'seller'
                : requestUrl.startsWith('/admin')
                    ? 'admin'
                    : requestUrl.startsWith('/delivery')
                        ? 'delivery'
                        : requestUrl.startsWith('/user') || requestUrl.startsWith('/customer') || requestUrl.startsWith('/auth')
                            ? 'customer'
                            : null;

            // Prevent cross-module 401s from logging out the active session
            // (e.g. seller page accidentally calling an admin endpoint).
            if (requestModule && requestModule !== currentModule) {
                return Promise.reject(error);
            }

            redirectToLogin(currentModule);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
