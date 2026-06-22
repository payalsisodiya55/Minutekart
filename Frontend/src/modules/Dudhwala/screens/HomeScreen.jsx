import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Milk, Info, ShieldCheck, Timer, Calendar, CheckCircle2, ChevronRight, Package, Droplets } from 'lucide-react';
import { Button } from '@food/components/ui/button';
import { Card, CardContent } from '@food/components/ui/card';
import { Badge } from '@food/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import BottleImg from '../assets/bottle.png';
import { dudhwalaAPI } from '@food/api';
import { cn } from '@food/utils/utils';

const PASTEL_THEMES = [
    { bg: 'bg-emerald-50/80', icon: 'text-emerald-600', darkBg: 'dark:bg-emerald-500/5', border: 'border-emerald-100/50' },
    { bg: 'bg-amber-50/80', icon: 'text-amber-600', darkBg: 'dark:bg-amber-500/5', border: 'border-amber-100/50' },
    { bg: 'bg-sky-50/80', icon: 'text-sky-600', darkBg: 'dark:bg-sky-500/5', border: 'border-sky-100/50' },
    { bg: 'bg-purple-50/80', icon: 'text-purple-600', darkBg: 'dark:bg-purple-500/5', border: 'border-purple-100/50' },
    { bg: 'bg-rose-50/80', icon: 'text-rose-600', darkBg: 'dark:bg-rose-500/5', border: 'border-rose-100/50' },
];

const DudhwalaHomeScreen = () => {
    const navigate = useNavigate();
    const [whyConfigs, setWhyConfigs] = useState([]);

    useEffect(() => {
        const fetchWhyConfigs = async () => {
            try {
                const res = await dudhwalaAPI.getConfig({ type: 'why_dudhwala' });
                if (res.data.success) {
                    // Filter for only 'why_dudhwala' type and active status
                    const benefits = res.data.data
                        .filter(c => c.type === 'why_dudhwala' && c.isActive)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));
                    setWhyConfigs(benefits);
                }
            } catch (err) {
                console.error("Failed to fetch why configs", err);
            }
        };
        fetchWhyConfigs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-16 font-sans">
            {/* Hero Section / Promotion - Premium Milk Banner with Extrusion */}
            <div className="relative mb-12"> {/* Container for the whole hero + extrusion */}
                <div className="relative overflow-visible bg-[#00AEEF] p-6 text-white shadow-sm min-h-[150px] flex items-center">
                    {/* Dynamic Splash Background - Now contained within overflow-hidden div */}
                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-sky-400/30 rounded-full blur-2xl"></div>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[180px] h-[180px] border-[12px] border-white/10 rounded-full"></div>
                    <div className="absolute right-20 top-1/2 -translate-y-1/2 w-[100px] h-[100px] border-[6px] border-white/5 rounded-full"></div>

                    <div className="relative z-10 flex-1 pr-32">
                        <h1 className="text-3xl font-bold leading-tight mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Daily Delivery<br/>At Your Doorstep</h1>
                        <p className="text-sky-50 text-xs font-medium leading-relaxed max-w-[200px]">
                            Organic fresh from the farm, extremely creamy, fresh and is amazing to taste.
                        </p>
                        <Button
                            onClick={() => navigate('/dudhwala/subscribe')}
                            className="mt-4 bg-white text-[#00AEEF] hover:bg-sky-50 rounded-full px-6 h-10 text-sm font-black shadow-xl"
                        >
                            Make Plan
                        </Button>
                    </div>
                    <img
                        src={BottleImg}
                        alt="Milk Bottle"
                        className="absolute right-[0px] bottom-[-75px] w-[220px] h-auto object-contain pointer-events-none select-none z-20 drop-shadow-xl"
                    />
                </div>

            </div>

            {/* Features */}
            <div className="mt-5 px-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-2xl bg-sky-50/50 p-2.5 shadow-sm border border-sky-100/50 dark:bg-sky-900/10 dark:border-sky-800/30">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-sky-600/70 tracking-tight leading-none mb-0.5">Quality</p>
                            <p className="text-sm font-semibold tracking-tight text-sky-900 dark:text-sky-100 leading-none">Lab Tested</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-amber-50/50 p-2.5 shadow-sm border border-amber-100/50 dark:bg-amber-900/10 dark:border-amber-800/30">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                            <Timer size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-amber-600/70 tracking-tight leading-none mb-0.5">Timing</p>
                            <p className="text-sm font-semibold tracking-tight text-amber-900 dark:text-amber-100 leading-none">Flexible</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / New Subscription */}
            <div className="mt-4 px-4">
                <Card className="rounded-[20px] border-none shadow-xl shadow-slate-200/60 dark:shadow-slate-900/50 bg-gradient-to-br from-white to-sky-50/30 dark:from-[#1a1a1a] dark:to-sky-900/10 p-0 relative">
                    <CardContent className="p-0 overflow-visible">
                        <div className="p-5 flex items-center relative">
                            <div className="flex-1 px-1 z-10">
                                <h2 className="mb-0.5 text-lg font-semibold tracking-tight flex items-center gap-2">
                                    Start Your Subscription <Package size={16} className="text-sky-600" />
                                </h2>
                                <p className="text-xs text-slate-500 mb-3">Experience fresh milk daily with our hassle-free subscription plans.</p>

                                <Button
                                    onClick={() => navigate('/dudhwala/subscribe')}
                                    className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-base shadow-lg shadow-sky-200 dark:shadow-none"
                                >
                                    Subscribe Now
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Why Chotuu Dudhwala? */}
            {whyConfigs.length > 0 && (
                <div className="mt-6 px-4 mb-0">
                    <div className="rounded-[28px] bg-white p-5 dark:bg-[#1a1a1a] shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-[10px] mb-4 uppercase tracking-widest text-slate-400 ml-1">Why Chotuu Dudhwala?</h3>
                        <ul className="space-y-3">
                            {whyConfigs.map((benefit, idx) => {
                                const theme = PASTEL_THEMES[idx % PASTEL_THEMES.length];
                                return (
                                    <li key={benefit._id} className={cn(
                                        "flex gap-4 p-3 rounded-[22px] border transition-all",
                                        theme.bg, theme.darkBg, theme.border
                                    )}>
                                        <div className={cn(
                                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm",
                                            theme.icon
                                        )}>
                                            <CheckCircle2 size={22} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-[15px] font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight mb-0.5">{benefit.label}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-tight opacity-80">{benefit.description || benefit.value}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}

            {/* App Watermark */}
            <div className="flex justify-center items-center pt-4 pb-2 opacity-40">
                <span className="text-xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">
                    OyeChotuu
                </span>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default DudhwalaHomeScreen;
