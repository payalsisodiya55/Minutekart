import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check, Loader2, Calendar, MapPin, CreditCard, Info, Milk } from 'lucide-react';
import { useNavigate, useLocation as useLocationReact } from 'react-router-dom';
import { Button } from '@food/components/ui/button';
import { Card, CardContent } from '@food/components/ui/card';
import { Badge } from '@food/components/ui/badge';
import { dudhwalaAPI } from '@/services/api';
import MilkAddressSelector from '../components/MilkAddressSelector';
import { useProfile } from '@food/context/ProfileContext';
import { Input } from '@food/components/ui/input';
import { Label } from '@food/components/ui/label';
import { Textarea } from '@food/components/ui/textarea';
import { useLocation as useGeoLocation } from "@food/hooks/useLocation";
import { useSettings } from "@core/context/SettingsContext";
import { initRazorpayPayment } from "@food/utils/razorpay";
import { toast } from 'sonner';
import { Search, Navigation, Crosshair, MapPin as MapPinIcon, X as CloseIcon, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@food/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const SubscriptionFlow = () => {
    const navigate = useNavigate();
    const routerLocation = useLocationReact();
    const { addresses, getDefaultAddress } = useProfile();
    const { settings } = useSettings();
    const { location: geo, requestLocation } = useGeoLocation();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isManualSlot, setIsManualSlot] = useState(false);
    const [manualSlotValue, setManualSlotValue] = useState("");

    // Config Data
    const [config, setConfig] = useState({
        products: [],
        quantities: [],
        slots: [],
        durations: [],
        pricing: []
    });

    // Selection State
    const [selection, setSelection] = useState(() => {
        const saved = localStorage.getItem('milk_subscription_selection');
        const initialSelection = saved ? JSON.parse(saved) : {
            product: null,
            quantity: null,
            slot: null,
            duration: null,
            startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            address: null
        };

        // Always respect address from router state if present
        if (routerLocation.state?.selectedAddress) {
            initialSelection.address = routerLocation.state.selectedAddress;
        } else if (!initialSelection.address) {
            initialSelection.address = getDefaultAddress() || null;
        }

        return initialSelection;
    });

    useEffect(() => {
        localStorage.setItem('milk_subscription_selection', JSON.stringify(selection));
    }, [selection]);

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        if (routerLocation.state?.selectedAddress) {
            setSelection(prev => ({ ...prev, address: routerLocation.state.selectedAddress }));
        }
    }, [routerLocation.state]);

    const fetchConfig = async () => {
        try {
            const res = await dudhwalaAPI.getBootstrap();
            if (res.data.success) {
                const d = res.data.data;
                setConfig({
                    products: d.product_type || [],
                    quantities: d.quantity || [],
                    slots: d.time_slot || [],
                    durations: d.plan_duration || [],
                    pricing: d.pricing || []
                });

                // Only set defaults if not already selected from storage
                setSelection(prev => ({
                    ...prev,
                    product: prev.product || d.product_type?.[0] || null,
                    quantity: prev.quantity || d.quantity?.[0] || null,
                    slot: prev.slot || d.time_slot?.[0] || null,
                    duration: prev.duration || d.plan_duration?.[0] || null
                }));
            }
        } catch (err) {
            console.error('Failed to fetch milk config:', err);
            toast.error('Failed to load subscription settings');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        const productId = selection.product?._id || selection.product;
        const quantityId = selection.quantity?._id || selection.quantity;
        const durationId = selection.duration?._id || selection.duration;

        if (!productId || !quantityId || !durationId) return 0;

        const priceObj = config.pricing.find(p =>
            (p.productId?._id || p.productId) === productId &&
            (p.quantityId?._id || p.quantityId) === quantityId
        );

        if (!priceObj) return 0;

        const durationObj = config.durations.find(d => d._id === durationId);
        const days = durationObj ? parseInt(durationObj.value) : 0;

        return (priceObj.pricePerDay || 0) * days;
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async () => {
        if (!selection.address) {
            toast.error("Please select a delivery address");
            return;
        }

        const productId = selection.product?._id || selection.product;
        const quantityId = selection.quantity?._id || selection.quantity;
        const slotId = selection.slot?._id || selection.slot;
        const durationId = selection.duration?._id || selection.duration;

        if (!productId || !quantityId || !slotId || !durationId) {
            toast.error("Please fill all fields");
            return;
        }

        const productObj = config.products.find(p => p._id === productId);
        const quantityObj = config.quantities.find(q => q._id === quantityId);
        const slotObj = config.slots.find(s => s._id === slotId);
        const durationObj = config.durations.find(d => d._id === durationId);

        setProcessing(true);
        try {
            const orderData = {
                planConfig: {
                    productId,
                    productLabel: productObj?.label || "Milk",
                    quantityId,
                    quantityLabel: quantityObj?.label || "",
                    timeSlotId: slotId,
                    timeSlotLabel: slotId === 'manual' ? manualSlotValue : (slotObj?.label || ""),
                    durationId,
                    durationLabel: durationObj?.label || "",
                    totalDays: parseInt(durationObj?.value || 30),
                    startDate: selection.startDate
                },
                address: {
                    fullAddress: [selection.address.additionalDetails, selection.address.street, selection.address.city].filter(Boolean).join(', '),
                    city: selection.address.city,
                    pincode: selection.address.pincode,
                    location: selection.address.location || (selection.address.latitude ? { type: 'Point', coordinates: [selection.address.longitude, selection.address.latitude] } : null),
                    isManual: true
                },
                zoneId: selection.address.zoneId || 'default-zone',
                zoneName: 'Milk Subscription Zone',
                amount: calculateTotal()
            };

            const res = await dudhwalaAPI.createOrder(orderData);
            if (res.data.success) {
                const { razorpayOrderId, orderId, amount, key } = res.data.data;

                const isLoaded = await loadRazorpay();
                if (!isLoaded) {
                    toast.error('Razorpay SDK failed to load');
                    setProcessing(false);
                    return;
                }

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || key,
                    amount: amount,
                    currency: 'INR',
                    name: "Oye Chotuu",
                    description: `Subscription: ${productObj?.label || "Milk"}`,
                    order_id: razorpayOrderId,
                    handler: async (response) => {
                        setProcessing(true);
                        try {
                            const verifyRes = await dudhwalaAPI.verifyPayment({
                                orderId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature
                            });

                            if (verifyRes.data.success) {
                                toast.success('Subscription active!');
                                navigate('/dudhwala/my-plans');
                            }
                        } catch (err) {
                            toast.error('Payment verification failed');
                        } finally {
                            setProcessing(false);
                        }
                    },
                    prefill: {
                        name: "",
                        email: "",
                        contact: ""
                    },
                    theme: { color: "#00AEEF" },
                    modal: { ondismiss: () => setProcessing(false) }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                setProcessing(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to initiate subscription");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
                <Loader2 className="animate-spin text-[#00AEEF]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-10 font-sans">
            {/* Premium Header with Sky Blue Theme */}
            <header className="relative overflow-hidden bg-[#00AEEF] px-4 py-5 flex items-center gap-4">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute right-16 top-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/dudhwala')}
                    className="rounded-full hover:bg-white/20 text-white active:bg-white/30 transition-all"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Subscribe
                    </h1>
                    <p className="text-sky-100 text-xs font-medium">Fresh milk delivered daily</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Milk size={20} className="text-white" />
                </div>
            </header>

            <div className="px-4 max-w-md mx-auto space-y-4 pt-3">
                {/* Main Form Card - Premium Style */}
                <Card className="rounded-[20px] border-none shadow-xl shadow-slate-200/60 dark:shadow-slate-900/50 bg-white dark:bg-[#1a1a1a]">
                    <CardContent className="px-2.5 py-1.5 space-y-2">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-[#00AEEF]/10 flex items-center justify-center">
                                <Milk size={16} className="text-[#00AEEF]" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-tight">Select Your Plan</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                            {/* Milk Type */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase tracking-tighter text-slate-400 truncate">Milk Type</Label>
                                <Select
                                    value={selection.product?.label || selection.product}
                                    onValueChange={(val) => {
                                        const obj = config.products.find(p => p.label === val || p === val);
                                        setSelection({ ...selection, product: obj || val });
                                    }}
                                >
                                    <SelectTrigger className="w-full !h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#141414] text-xs font-bold focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-0 px-2 shadow-sm">
                                        <SelectValue placeholder="Milk" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                                        {config.products.map(p => {
                                            const label = p.label || p;
                                            return <SelectItem key={label} value={label} className="py-3 text-sm">{label}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase tracking-tighter text-slate-400 truncate">Quantity</Label>
                                <Select
                                    value={selection.quantity?.label || selection.quantity}
                                    onValueChange={(val) => {
                                        const obj = config.quantities.find(q => q.label === val || q === val);
                                        setSelection({ ...selection, quantity: obj || val });
                                    }}
                                >
                                    <SelectTrigger className="w-full !h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#141414] text-xs font-bold focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-0 px-2 shadow-sm">
                                        <SelectValue placeholder="Qty" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                                        {config.quantities.map(q => {
                                            const label = q.label || q;
                                            return <SelectItem key={label} value={label} className="py-3 text-sm">{label}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Duration */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase tracking-tighter text-slate-400 truncate">Duration</Label>
                                <Select
                                    value={selection.duration?.label || selection.duration}
                                    onValueChange={(val) => {
                                        const obj = config.durations.find(d => d.label === val || d === val);
                                        setSelection({ ...selection, duration: obj || val });
                                    }}
                                >
                                    <SelectTrigger className="w-full !h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#141414] text-xs font-bold focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-0 px-2 shadow-sm">
                                        <SelectValue placeholder="Days" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                                        {config.durations.map(d => {
                                            const label = d.label || d;
                                            return <SelectItem key={label} value={label} className="py-3 text-sm">{label}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Section Card */}
                <Card className="rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/50 dark:shadow-none bg-white dark:bg-[#1a1a1a]">
                    <CardContent className="px-2.5 py-1.5 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                <Calendar size={16} className="text-sky-600" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-tight">Schedule Delivery</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">

                        {/* Slot */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase tracking-tighter text-slate-400">Delivery Time</Label>
                            <Select
                                value={isManualSlot ? "other" : (selection.slot?.label || selection.slot)}
                                onValueChange={(val) => {
                                    if (val === 'other') {
                                        setIsManualSlot(true);
                                        setSelection({ ...selection, slot: manualSlotValue });
                                    } else {
                                        setIsManualSlot(false);
                                        const obj = config.slots.find(s => s.label === val || s === val);
                                        setSelection({ ...selection, slot: obj || val });
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full !h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#141414] text-xs font-bold focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-0 px-2 shadow-sm">
                                    <SelectValue placeholder="Time Slot" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                                    {config.slots.map(s => {
                                        const label = s.label || s;
                                        return <SelectItem key={label} value={label} className="py-3 text-sm">{label}</SelectItem>;
                                    })}
                                    <SelectItem value="other" className="py-3 text-sm font-medium text-[#00AEEF]">Other (Custom)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Starting Date */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold uppercase tracking-tighter text-slate-400">Start Date</Label>
                            <div className="relative">
                                <DatePicker
                                    value={selection.startDate}
                                    onChange={(val) => setSelection({ ...selection, startDate: val })}
                                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                    placeholder="Start Date"
                                    align="right"
                                    className="!h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#141414] text-xs font-bold px-2 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {isManualSlot && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mt-2">
                            <Label className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 mb-1 block">Custom Time</Label>
                            <Input
                                placeholder="e.g. 6:30 AM"
                                value={manualSlotValue}
                                onChange={(e) => {
                                    setManualSlotValue(e.target.value);
                                    setSelection({ ...selection, slot: e.target.value });
                                }}
                                className="!h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-[#141414] text-xs font-bold focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-0"
                            />
                        </motion.div>
                    )}
                    </CardContent>
                </Card>

                {/* Address Section Card */}
                <Card className="rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/50 dark:shadow-none bg-white dark:bg-[#1a1a1a]">
                    <CardContent className="px-2.5 py-1.5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                <MapPin size={16} className="text-sky-600" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-tight">Delivery Address</h2>
                        </div>

                        {selection.address ? (
                            <div
                                onClick={() => navigate('/dudhwala/select-address', { state: { from: '/dudhwala/subscribe' } })}
                                className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-[#141414] border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-[#00AEEF]/30 dark:hover:border-[#00AEEF]/50 transition-all active:scale-[0.99]"
                            >
                                <div className="w-11 !h-11 rounded-xl bg-[#00AEEF]/10 flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-[#00AEEF]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{selection.address.label || "Home"}</p>
                                    <p className="text-xs text-slate-500 truncate">{selection.address.street}, {selection.address.city}</p>
                                </div>
                                <ChevronDown className="text-slate-400" size={18} />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dudhwala/select-address', { state: { from: '/dudhwala/subscribe' } })}
                                className="w-full h-12 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-600 hover:border-[#00AEEF] hover:bg-[#00AEEF]/5 text-slate-500 font-medium transition-all"
                            >
                                <MapPinIcon size={18} className="mr-2 text-[#00AEEF]" />
                                Select Address
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Price Summary Card - Premium Gradient */}
                <Card className="rounded-[20px] border-none shadow-xl shadow-slate-200/60 dark:shadow-slate-900/50 overflow-hidden bg-gradient-to-br from-[#00AEEF] to-[#0090cc] text-white">
                    <CardContent className="px-2.5 py-1.5">
                        <div className="flex items-center justify-between mb-1.5">
                            <div>
                                <p className="text-sky-100 text-[11px] font-semibold uppercase tracking-wider">Total Amount</p>
                                <p className="text-3xl font-bold mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>₹{calculateTotal()}</p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <CreditCard size={20} />
                            </div>
                        </div>

                        {(() => {
                            const productId = selection.product?._id || selection.product;
                            const quantityId = selection.quantity?._id || selection.quantity;
                            const durationId = selection.duration?._id || selection.duration;
                            const priceObj = config.pricing.find(p => 
                                (p.productId?._id || p.productId) === productId && 
                                (p.quantityId?._id || p.quantityId) === quantityId
                            );
                            const durationObj = config.durations.find(d => d._id === durationId);
                            if (!priceObj || !durationObj) return null;
                            return (
                                <div className="mt-1.5 pt-1.5 border-t border-white/10 space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-sky-100/80 font-medium">Daily Subscription</span>
                                        <span className="font-bold">₹{priceObj.pricePerDay} × {durationObj.value} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-sky-100/60 font-medium uppercase tracking-tighter">
                                        <span>Price Breakdown</span>
                                        <span>Tax Included</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* Submit Button - Premium CTA */}
                {settings?.onlinePaymentEnabled === false ? (
                    <div className="w-full h-14 rounded-[20px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-inner cursor-not-allowed">
                        <p className="text-slate-500 font-semibold text-sm flex items-center gap-2">
                            <Info size={16} /> Online payments are currently disabled
                        </p>
                    </div>
                ) : (
                    <Button
                        onClick={handleSubscribe}
                        disabled={processing}
                        className="w-full h-14 rounded-[20px] bg-gradient-to-r from-[#00AEEF] to-[#0090cc] hover:opacity-90 text-white font-semibold text-base shadow-xl shadow-[#00AEEF]/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Pay & Subscribe
                            </>
                        )}
                    </Button>
                )}

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-6 py-2 text-slate-400">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Check size={14} className="text-green-500" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Check size={14} className="text-green-500" />
                        <span>Cancel Anytime</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionFlow;
