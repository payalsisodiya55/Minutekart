import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, PauseCircle, Power, 
    User, Clock, MoreVertical, Loader2, ArrowUpDown,
    CheckCircle2, Info, Eye, Milk, Calendar, RefreshCw
} from 'lucide-react';
import { dudhwalaAPI } from '@food/api';
import { Button } from '@food/components/ui/button';
import { Card, CardContent } from '@food/components/ui/card';
import { Input } from '@food/components/ui/input';
import { Badge } from '@food/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@food/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ActivePlans = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [filters, setFilters] = useState({
        status: 'active',
        search: '',
        page: 1
    });

    useEffect(() => {
        fetchPlans();
    }, [filters.page, filters.status]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await dudhwalaAPI.adminGetAllPlans({
                ...filters,
                // Ensure search is passed
            });
            if (res.data.success) {
                const result = res.data.data;
                setPlans(result.data || result.docs || (Array.isArray(result) ? result : []));
            }
        } catch (err) {
            toast.error('Failed to load active plans');
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

    return (
        <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            Active Subscriptions
                        </h1>
                        <p className="text-slate-500">Managing ongoing milk delivery plans.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm"
                            onClick={fetchPlans}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search active users..." 
                                className="pl-10 border-slate-200 rounded-xl h-11 focus:ring-emerald-500 focus:border-emerald-500"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && fetchPlans()}
                            />
                        </div>
                        <Button 
                            onClick={fetchPlans} 
                            className="rounded-xl h-11 bg-emerald-600 text-white hover:bg-emerald-700 transition-all px-8 shadow-sm font-bold"
                        >
                            Search
                        </Button>
                    </div>
                </div>

                <Card className="bg-white rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100">
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Customer</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Product</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4 text-center">Remaining</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Expiry</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Status</TableHead>
                                    <TableHead className="text-right px-6 py-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                                                <p className="text-xs text-slate-400 font-medium">Fetching active plans...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : plans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                                <Info className="h-8 w-8 opacity-20" />
                                                <p className="text-sm font-medium">No active subscriptions found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    plans.map((plan) => (
                                        <TableRow key={plan._id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100 shadow-sm">
                                                        {plan.userId?.name?.charAt(0) || <User className="h-4 w-4" />}
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
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 leading-tight">{plan.productType}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{plan.timeSlot}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-sm font-black text-emerald-600">{plan.remainingDays}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Days Left</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                    <Calendar className="h-4 w-4 text-slate-300" />
                                                    {new Date(plan.expiryDate).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
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
                                                        <DropdownMenuItem 
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-amber-50 text-amber-600 font-bold text-sm"
                                                            onClick={() => handleAction(plan._id, 'pause')}
                                                        >
                                                            <PauseCircle className="h-4 w-4" />
                                                            Pause Plan
                                                        </DropdownMenuItem>
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

export default ActivePlans;
