import React, { useState, useEffect } from 'react';
import { 
    Milk, Search, Filter, MoreVertical, 
    CheckCircle2, XCircle, PauseCircle, PlayCircle, 
    Calendar, MapPin, User, ArrowUpDown, Loader2,
    Clock, AlertCircle, Eye, Download, ChevronDown
} from 'lucide-react';
import { dudhwalaAPI } from '@food/api';
import { Button } from '@food/components/ui/button';
import { Card, CardContent } from '@food/components/ui/card';
import { Input } from '@food/components/ui/input';
import { Badge } from '@food/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@food/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PlansManagement = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1
    });
    const [stats, setStats] = useState({
        pending: 0,
        active: 0,
        paused: 0,
        expired: 0
    });

    useEffect(() => {
        fetchPlans();
        fetchStats();
    }, [filters.status, filters.page]);

    const fetchStats = async () => {
        try {
            const res = await dudhwalaAPI.adminGetDashboardStats();
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        }
    };

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await dudhwalaAPI.adminGetAllPlans(filters);
            if (res.data.success) {
                const result = res.data.data;
                setPlans(result.data || result.docs || (Array.isArray(result) ? result : []));
            }
        } catch (err) {
            console.error('Failed to fetch admin plans:', err);
            toast.error('Failed to load subscription plans');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (planId, action) => {
        const remarks = prompt(`Enter remarks for ${action}:`, `Action performed by admin`);
        if (remarks === null) return;

        try {
            const res = await dudhwalaAPI.adminUpdatePlanStatus(planId, { action, remarks });
            if (res.data.success) {
                toast.success(`Plan ${action}ed successfully`);
                fetchPlans();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${action} plan`);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
            case 'paused': return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Paused</Badge>;
            case 'pending_approval': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Pending</Badge>;
            case 'expired': return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Expired</Badge>;
            case 'rejected': return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Rejected</Badge>;
            default: return <Badge className="bg-neutral-100 text-neutral-700 border-neutral-200">{status}</Badge>;
        }
    };

    return (
        <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Plans Management</h1>
                        <p className="text-slate-500">Approve, monitor and manage milk subscription plans</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm"
                            onClick={fetchPlans}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Active" count={stats.active} icon={PlayCircle} color="emerald" />
                    <StatCard title="Pending" count={stats.pending} icon={Clock} color="blue" />
                    <StatCard title="Paused" count={stats.paused} icon={PauseCircle} color="amber" />
                    <StatCard title="Expired" count={stats.expired} icon={History} color="slate" />
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search by customer name or phone..." 
                                className="pl-10 border-slate-200 rounded-xl h-11 focus:ring-blue-500 focus:border-blue-500"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                onKeyPress={(e) => e.key === 'Enter' && fetchPlans()}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                className="h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                            >
                                <option value="">All Status</option>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Plans Table */}
                <Card className="bg-white rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100">
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Customer</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Milk Type</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Duration</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Amount</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Status</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                                                <p className="text-xs text-slate-400 font-medium">Fetching plans...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : plans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                                <Milk className="h-8 w-8 opacity-20" />
                                                <p className="text-sm font-medium">No subscription plans found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    plans.map((plan) => (
                                        <TableRow key={plan._id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                        {plan.userId?.name?.charAt(0) || <User className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">{plan.userId?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{plan.userId?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                                        <Milk className="h-4 w-4 text-sky-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{plan.productType} ({plan.quantity})</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="font-medium">{plan.totalDays} Days</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900">₹{plan.orderId?.payment?.amount?.toLocaleString() || '0'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{plan.orderId?.payment?.status || 'N/A'}</p>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {getStatusBadge(plan.status)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-colors">
                                                            <MoreVertical className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 bg-white rounded-xl shadow-xl border-slate-200 p-1.5 z-50">
                                                        <DropdownMenuItem 
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-700 text-sm font-medium"
                                                            onClick={() => navigate(`/admin/dudhwala/plans/${plan._id}`)}
                                                        >
                                                            <Eye className="h-4 w-4 text-slate-400" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        {plan.status === 'pending_approval' && (
                                                            <>
                                                                <DropdownMenuItem 
                                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-emerald-50 text-emerald-600 font-bold text-sm"
                                                                    onClick={() => handleAction(plan._id, 'approve')}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Approve Plan
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-rose-50 text-rose-600 font-bold text-sm"
                                                                    onClick={() => handleAction(plan._id, 'reject')}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                    Reject Plan
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {plan.status === 'active' && (
                                                            <DropdownMenuItem 
                                                                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-amber-50 text-amber-600 font-bold text-sm"
                                                                onClick={() => handleAction(plan._id, 'pause')}
                                                            >
                                                                <PauseCircle className="h-4 w-4" />
                                                                Pause Plan
                                                            </DropdownMenuItem>
                                                        )}
                                                        {plan.status === 'paused' && (
                                                            <DropdownMenuItem 
                                                                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-emerald-50 text-emerald-600 font-bold text-sm"
                                                                onClick={() => handleAction(plan._id, 'resume')}
                                                            >
                                                                <PlayCircle className="h-4 w-4" />
                                                                Resume Plan
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const StatCard = ({ title, count, icon: Icon, color }) => {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
        blue: "bg-blue-50 text-blue-600 ring-blue-100",
        amber: "bg-amber-50 text-amber-600 ring-amber-100",
        slate: "bg-slate-100 text-slate-600 ring-slate-200"
    };

    return (
        <Card className="border-slate-200 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900">{count.toLocaleString()}</h3>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ring-1 transition-transform group-hover:scale-110 group-hover:rotate-3 ${colors[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
};

export default PlansManagement;
