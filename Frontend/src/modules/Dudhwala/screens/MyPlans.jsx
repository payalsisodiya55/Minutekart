import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milk, Calendar, Clock, ChevronRight, Pause, Play, AlertCircle, Loader2, CheckCircle2, History, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@food/components/ui/button';
import { Card, CardContent } from '@food/components/ui/card';
import { Badge } from '@food/components/ui/badge';
import { dudhwalaAPI } from '@food/api';
import BottomNavigation from '../components/BottomNavigation';
import { toast } from 'react-hot-toast';

const MyPlans = () => {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState({ active: [], history: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [startY, setStartY] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await dudhwalaAPI.getMyPlans();
            if (res.data.success) {
                setPlans(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            toast.error('Failed to load your plans');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'pending_approval': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'expired': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading && !isRefreshing) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (startY > 0 && window.scrollY === 0) {
            const y = e.touches[0].clientY;
            const distance = y - startY;
            if (distance > 0) {
                setPullDistance(Math.min(distance * 0.4, 80)); // Add resistance and cap at 80px
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance >= 60 && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(60); // Hold at refresh position
            await fetchPlans();
            setIsRefreshing(false);
        }
        setPullDistance(0);
        setStartY(0);
    };

    return (
        <div 
            ref={containerRef}
            className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-20 relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            <motion.div 
                className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none"
                animate={{ y: pullDistance > 0 ? pullDistance - 40 : -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="bg-white rounded-full p-2 shadow-md flex items-center justify-center">
                    <RefreshCw 
                        size={20} 
                        className={`text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`} 
                        style={{ transform: `rotate(${pullDistance * 3}deg)` }}
                    />
                </div>
            </motion.div>

            <motion.div
                animate={{ y: isRefreshing ? 20 : pullDistance > 0 ? pullDistance : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="px-4 pt-4 pb-2">
                <h1 className="text-2xl font-semibold tracking-tight">My Milk Plans</h1>
                <p className="text-sm text-slate-500">Manage your active and past subscriptions.</p>
            </div>

            {/* Active Plans */}
            <div className="px-4 space-y-3">
                {plans.active.length > 0 ? (
                    plans.active.map(plan => (
                        <Card key={plan._id} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white dark:bg-[#1a1a1a]">
                            <CardContent className="p-0">
                                <div className="px-3 py-2 flex items-start justify-between border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600">
                                            <Milk size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg tracking-tight leading-tight">{plan.productType}</h3>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">{plan.quantity} • {plan.timeSlot}</p>
                                            <Badge className={`mt-1 border px-2 py-0 h-5 text-[10px] ${getStatusColor(plan.status)}`} variant="outline">
                                                {plan.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Remaining</p>
                                        <p className="text-2xl font-semibold text-sky-600 tracking-tighter leading-none">{plan.remainingDays} <span className="text-[10px] text-slate-400 tracking-normal">Days</span></p>
                                    </div>
                                </div>
                                
                                <div className="px-3 py-2 grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={13} />
                                        <span className="text-xs font-semibold tracking-tight">Expires: {new Date(plan.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 justify-end">
                                        <Clock size={13} />
                                        <span className="text-xs font-semibold tracking-tight">Slot: {plan.timeSlot}</span>
                                    </div>
                                </div>

                                {plan.status === 'pending_approval' && (
                                    <div className="px-3 pb-3">
                                        <div className="rounded-2xl bg-blue-50 p-3 flex items-center gap-3 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
                                            <AlertCircle size={18} className="text-blue-600 shrink-0" />
                                            <p className="text-[10px] font-bold text-blue-700 leading-tight">Your payment is verified. Admin will activate your plan shortly.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-300 mb-4">
                            <Milk size={40} />
                        </div>
                        <p className="text-slate-400 font-bold">No active plans found</p>
                        <Button variant="link" className="text-sky-600 font-black mt-2">Subscribe Now</Button>
                    </div>
                )}
            </div>

            {/* Past Plans / History */}
            {plans.history.length > 0 && (
                <div className="mt-4 px-4">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <History size={16} /> Past Subscriptions
                    </h2>
                    <div className="space-y-3">
                        {plans.history.map(plan => (
                            <div key={plan._id} className="flex flex-col gap-2 px-3 py-2 rounded-3xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                            plan.status === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                            {plan.status === 'rejected' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold tracking-tight">{plan.productType}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                {plan.totalDays} Days • {plan.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </div>
                                
                                {plan.status === 'rejected' && plan.refundInfo && plan.refundInfo.status !== 'none' && (
                                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                                            <p className="text-[11px] font-medium text-rose-700 leading-tight">
                                                {plan.refundInfo.message}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </motion.div>

            <BottomNavigation />
        </div>
    );
};

export default MyPlans;
