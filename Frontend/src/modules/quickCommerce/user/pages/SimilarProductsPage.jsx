import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import ProductCard from '../components/shared/ProductCard';
import ProductDetailSheet from '../components/shared/ProductDetailSheet';
import { useProductDetail } from '../context/ProductDetailContext';
import { customerApi } from '../services/customerApi';
import MiniCart from '../components/shared/MiniCart';
import { useLocation as useAppLocation } from '../context/LocationContext';

const SimilarProductsPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { currentLocation } = useAppLocation();
    const { isOpen: isProductDetailOpen } = useProductDetail();
    
    const [currentProduct, setCurrentProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!productId) return;
        setIsLoading(true);

        try {
            // 1. Fetch current product details to get its subcategory and seller
            const response = await customerApi.getProductDetails(productId);
            const result =
                response?.data?.result ||
                response?.data?.data ||
                response?.data?.product ||
                null;

            if (!result) {
                throw new Error("Product not found");
            }

            setCurrentProduct(result);

            const catId = result.subcategoryId?._id || result.subcategoryId || result.categoryId?._id || result.categoryId;
            const storeId = result.sellerId || result.storeId || (result.seller?._id || result.seller?.id);

            if (catId) {
                // 2. Fetch products with the same subcategory/category and store/seller
                const prodRes = await customerApi.getProducts({
                    categoryId: catId,
                    storeId: storeId,
                    limit: 100
                });

                if (prodRes?.data?.success) {
                    const rawResult = prodRes.data.result;
                    const dbProds = Array.isArray(prodRes.data.results)
                        ? prodRes.data.results
                        : Array.isArray(rawResult?.items)
                            ? rawResult.items
                            : Array.isArray(rawResult)
                                ? rawResult
                                : [];

                    const formattedProds = dbProds.map(p => ({
                        ...p,
                        id: p._id || p.id,
                        image: p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
                        price: p.salePrice || p.price,
                        originalPrice: p.price,
                        weight: p.weight || p.unit || "1 unit",
                        deliveryTime: "8-15 mins"
                    }));

                    // Filter out the current product itself
                    const filteredProds = formattedProds.filter(p => String(p.id) !== String(productId));
                    setProducts(filteredProds);
                }
            }
        } catch (error) {
            console.error("Error fetching similar products page data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [productId, currentLocation?.latitude, currentLocation?.longitude]);

    const safeProducts = Array.isArray(products) ? products : [];

    // Helper to format the address text short and clean like in reference
    const formattedAddress = currentLocation?.name 
        ? (currentLocation.name.length > 35 ? currentLocation.name.substring(0, 35) + "..." : currentLocation.name)
        : "Select Location";

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-background font-sans pt-0 transition-colors duration-500">
            <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col">
                {/* Header matching 4th reference image */}
                <header className={cn(
                    "sticky top-0 z-30 px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-border shadow-sm backdrop-blur-md bg-white/90 dark:bg-card/90",
                    isProductDetailOpen && "hidden md:flex"
                )}>
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                        >
                            <ChevronLeft size={24} className="text-foreground" />
                        </button>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-[18px] font-bold text-foreground tracking-tight leading-tight">
                                Similar products
                            </h1>
                            <span className="text-[11px] font-medium text-slate-500 truncate">
                                Delivering to : <span className="font-extrabold text-[#0c831f]">{formattedAddress}</span>
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/quick/search')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Search size={22} className="text-foreground" />
                    </button>
                </header>

                {/* Grid List View matching reference image (3-column layout on mobile) */}
                <div className="flex flex-1 relative items-start">
                    <main className="flex-1 px-4 pt-6 pb-24 bg-white dark:bg-background transition-colors w-full">
                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 gap-y-4 md:gap-4 lg:gap-6">
                            {isLoading ? (
                                Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl aspect-[3/4] w-full border border-gray-200/50 dark:border-white/10"></div>
                                ))
                            ) : (
                                safeProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} compact={true} />
                                ))
                            )}
                            {safeProducts.length === 0 && !isLoading && (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-gray-400 font-bold italic">No similar products found</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                <MiniCart />
                <ProductDetailSheet />
            </div>
        </div>
    );
};

export default SimilarProductsPage;
