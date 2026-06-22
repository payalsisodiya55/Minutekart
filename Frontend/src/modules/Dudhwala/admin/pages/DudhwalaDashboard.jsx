import React, { useState, useEffect } from 'react';
import { 
    Milk, ShoppingBag, PlayCircle, PauseCircle, 
    History, XCircle, TrendingUp, Users, 
    Clock, AlertCircle, CheckCircle2,
    ArrowUpRight, Activity, DollarSign, Package
} from 'lucide-react';
import { dudhwalaAPI } from '@food/api';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/card';
import { Button } from '@food/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DudhwalaDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        active: 0,
        paused: 0,
        expired: 0,
        rejected: 0,
        totalPlans: 0,
        totalRevenue: 0,
        totalSubscribers: 0,
        expiringSoon: 0,
        expiredToday: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await dudhwalaAPI.adminGetDashboardStats();
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading operations command...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pb-10 lg:px-6 pt-4 bg-slate-50 min-h-screen">
            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_120px_-60px_rgba(0,0,0,0.28)]">
                <div className="flex flex-col gap-4 border-b border-neutral-200 bg-linear-to-br from-white via-neutral-50 to-neutral-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-bold">Dudhwala Overview</p>
                        <h1 className="text-2xl font-semibold text-neutral-900">Milk Operations Command</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-neutral-200 bg-white shadow-sm hover:bg-slate-50 transition-all"
                            onClick={fetchStats}
                        >
                            <History className="mr-2 h-4 w-4" />
                            Refresh Stats
                        </Button>
                    </div>
                </div>

                <div className="space-y-6 px-6 py-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            title="Active Subscriptions"
                            value={stats.active.toLocaleString()}
                            helper="Currently active milk plans"
                            icon={<PlayCircle className="h-5 w-5 text-emerald-600" />}
                            accent="bg-emerald-200/40"
                            path="/admin/dudhwala/plans/active"
                        />
                        <MetricCard
                            title="Pending Approvals"
                            value={stats.pending.toLocaleString()}
                            helper="Plans awaiting verification"
                            icon={<ShoppingBag className="h-5 w-5 text-sky-600" />}
                            accent="bg-sky-200/40"
                            path="/admin/dudhwala/plans/management"
                        />
                        <MetricCard
                            title="Total Revenue"
                            value={`₹${stats.totalRevenue.toLocaleString()}`}
                            helper="Cumulative subscription earnings"
                            icon={<DollarSign className="h-5 w-5 text-amber-600" />}
                            accent="bg-amber-200/40"
                            path="/admin/dudhwala/plans/management"
                        />
                        <MetricCard
                            title="Milk Subscribers"
                            value={stats.totalSubscribers.toLocaleString()}
                            helper="Total unique customers"
                            icon={<Users className="h-5 w-5 text-indigo-600" />}
                            accent="bg-indigo-200/40"
                            path="/admin/dudhwala/plans/management"
                        />
                        <MetricCard
                            title="Expiring Soon"
                            value={stats.expiringSoon.toLocaleString()}
                            helper="Renewals due in 48 hours"
                            icon={<Clock className="h-5 w-5 text-rose-600" />}
                            accent="bg-rose-200/40"
                            path="/admin/dudhwala/plans/active"
                        />
                        <MetricCard
                            title="Expired Today"
                            value={stats.expiredToday.toLocaleString()}
                            helper="Plans ended in last 24h"
                            icon={<History className="h-5 w-5 text-slate-600" />}
                            accent="bg-slate-200/40"
                            path="/admin/dudhwala/plans/expired"
                        />
                        <MetricCard
                            title="Paused Plans"
                            value={stats.paused.toLocaleString()}
                            helper="Temporarily suspended"
                            icon={<PauseCircle className="h-5 w-5 text-orange-600" />}
                            accent="bg-orange-200/40"
                            path="/admin/dudhwala/plans/paused"
                        />
                        <MetricCard
                            title="Total Plans"
                            value={stats.totalPlans.toLocaleString()}
                            helper="Total lifetime subscriptions"
                            icon={<Package className="h-5 w-5 text-purple-600" />}
                            accent="bg-purple-200/40"
                            path="/admin/dudhwala/plans/management"
                        />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border-neutral-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
                                <CardTitle className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-sky-600" />
                                    Growth Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 px-6 pb-6">
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="h-20 w-20 rounded-full bg-sky-50 flex items-center justify-center mb-4 ring-4 ring-white shadow-sm">
                                        <Milk className="h-10 w-10 text-sky-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Expanding the Network</h3>
                                    <p className="text-neutral-500 max-w-xs mx-auto text-sm leading-relaxed">
                                        Your milk subscription service is growing. Keep monitoring renewals to maintain steady revenue.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-neutral-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
                                <CardTitle className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-emerald-600" />
                                    Operational Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 px-6 pb-6">
                                <div className="space-y-6">
                                    <HealthItem 
                                        label="Active vs Paused" 
                                        percentage={(stats.active / (stats.active + stats.paused || 1)) * 100}
                                        color="bg-emerald-500"
                                    />
                                    <HealthItem 
                                        label="Approval Rate" 
                                        percentage={(stats.active / (stats.totalPlans || 1)) * 100}
                                        color="bg-sky-500"
                                    />
                                    <HealthItem 
                                        label="Renewal Potential" 
                                        percentage={100 - (stats.expired / (stats.totalPlans || 1)) * 100}
                                        color="bg-indigo-500"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

function MetricCard({ title, value, helper, icon, accent, path }) {
    return (
        <Card 
            className="group relative overflow-hidden border-neutral-200 bg-white p-0 transition-all duration-300 rounded-2xl"
        >
            <CardContent className="relative flex flex-col gap-2 px-4 pb-4 pt-4 h-full">
                <div className={`absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${accent}`} />
                <div className="relative flex items-center justify-between z-10">
                    <div className="flex-1 min-w-0 mr-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-bold mb-1 truncate">{title}</p>
                        <p className="text-xl font-bold text-neutral-900 leading-tight mb-1">{value}</p>
                        <p className="text-[10px] text-neutral-500 font-medium line-clamp-1">{helper}</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 ring-1 ring-neutral-200 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-md">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function HealthItem({ label, percentage, color }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-600">
                <span>{label}</span>
                <span>{Math.round(percentage)}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className={`h-full ${color} transition-all duration-1000 ease-out shadow-sm`} 
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default DudhwalaDashboard;
