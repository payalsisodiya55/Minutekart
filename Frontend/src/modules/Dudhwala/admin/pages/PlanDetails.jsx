import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Milk, ArrowLeft, Calendar, Clock, MapPin, 
    User, Phone, Mail, History, Info, 
    CheckCircle2, XCircle, PauseCircle, PlayCircle, Loader2,
    DollarSign, Package, ShieldCheck, CreditCard

} from 'lucide-react';
import { dudhwalaAPI } from '@food/api';
import { Button } from '@food/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/card';
import { Badge } from '@food/components/ui/badge';
import { toast } from 'sonner';

const PlanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        fetchPlanDetails();
    }, [id]);

    const fetchPlanDetails = async () => {
        try {
            setLoading(true);
            const res = await dudhwalaAPI.adminGetPlanDetails(id);
            if (res.data.success) {
                setPlan(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch plan details:', err);
            toast.error('Failed to load plan details');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        const remarks = prompt(`Enter remarks for ${action}:`, `Action performed by admin`);
        if (remarks === null) return;

        try {
            const res = await dudhwalaAPI.adminUpdatePlanStatus(id, { action, remarks });
            if (res.data.success) {
                toast.success(`Plan ${action}ed successfully`);
                fetchPlanDetails();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${action} plan`);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">Active</Badge>;
            case 'paused': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1 rounded-full text-xs font-bold">Paused</Badge>;
            case 'pending_approval': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 rounded-full text-xs font-bold">Pending Approval</Badge>;
            case 'expired': return <Badge className="bg-slate-100 text-slate-700 border-slate-200 px-3 py-1 rounded-full text-xs font-bold">Expired</Badge>;
            case 'rejected': return <Badge className="bg-rose-100 text-rose-700 border-rose-200 px-3 py-1 rounded-full text-xs font-bold">Rejected</Badge>;
            default: return <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Fetching plan details...</p>
                </div>
            </div>
        );
    }

    if (!plan) return (
        <div className="p-20 text-center bg-slate-50 min-h-screen">
            <div className="max-w-md mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                <Info className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Plan Not Found</h3>
                <p className="text-slate-500 mb-6">The subscription plan you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate(-1)} className="rounded-xl w-full">Go Back</Button>
            </div>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            className="rounded-xl h-12 w-12 p-0 bg-white border-slate-200 shadow-sm hover:bg-slate-50 transition-all" 
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Details</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">ID: {plan._id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Plan Configuration */}
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Milk size={16} className="text-sky-600" /> Plan Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <DetailItem 
                                        icon={<Milk className="h-5 w-5 text-sky-500" />} 
                                        label="Milk Type" 
                                        value={plan.productType || 'Cow Milk'} 
                                        subValue={`${plan.quantity || '0'} per delivery`}
                                    />
                                    <DetailItem 
                                        icon={<Clock className="h-5 w-5 text-indigo-500" />} 
                                        label="Delivery Slot" 
                                        value={plan.timeSlot} 
                                        subValue="Scheduled Morning Delivery"
                                    />
                                    <DetailItem 
                                        icon={<Calendar className="h-5 w-5 text-emerald-500" />} 
                                        label="Duration" 
                                        value={`${plan.totalDays} Days Plan`} 
                                        subValue={`Started: ${new Date(plan.startDate).toLocaleDateString()}`}
                                    />
                                    <DetailItem 
                                        icon={<ShieldCheck className="h-5 w-5 text-purple-500" />} 
                                        label="Remaining Days" 
                                        value={`${plan.remainingDays} Days Left`} 
                                        subValue={`Expiry: ${new Date(plan.expiryDate).toLocaleDateString()}`}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Information */}
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <User size={16} className="text-indigo-600" /> Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row gap-8">
                                    <div className="h-20 w-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                                        <User className="h-10 w-10 text-indigo-500" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1">
                                        <DetailItem label="Full Name" value={plan.userId?.name || 'N/A'} />
                                        <DetailItem label="Phone Number" value={plan.userId?.phone || 'N/A'} icon={<Phone className="h-4 w-4 text-slate-400" />} />
                                        <DetailItem label="Member Since" value={new Date(plan.userId?.createdAt).toLocaleDateString()} />
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                                            <MapPin className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Delivery Address</p>
                                            <p className="text-sm font-bold text-slate-900 leading-relaxed max-w-lg">
                                                {plan.addressSnapshot || plan.orderId?.address?.fullAddress || plan.userId?.address || 'Address not provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Actions & Summary */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <DollarSign size={16} className="text-emerald-600" /> Payment Summary

                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center justify-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Amount Paid</p>
                                    <h2 className="text-3xl font-black text-emerald-700">₹{plan.orderId?.payment?.amount || plan.orderId?.amount || '0'}</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Method</span>
                                        <span className="text-sm font-bold text-slate-900 uppercase">
                                            {plan.orderId?.payment?.method || 'Online Payment'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500">Transaction ID</span>
                                        <span className="text-xs font-mono text-slate-400">
                                            {plan.orderId?.payment?.razorpayPaymentId || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Refund Information */}
                        {plan.refundInfo && plan.refundInfo.status !== 'none' && (
                            <Card className={`rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden ${
                                plan.refundInfo.status === 'failed' ? 'ring-1 ring-rose-100' : 'ring-1 ring-sky-100'
                            }`}>
                                <CardHeader className={`border-b border-slate-100 px-6 py-4 ${
                                    plan.refundInfo.status === 'failed' ? 'bg-rose-50/50' : 'bg-sky-50/50'
                                }`}>
                                    <CardTitle className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                                        plan.refundInfo.status === 'failed' ? 'text-rose-600' : 'text-sky-600'
                                    }`}>
                                        <DollarSign size={16} /> Refund Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-sm text-slate-500">Refund Status</span>
                                            <Badge className={`uppercase text-[10px] ${
                                                plan.refundInfo.status === 'initiated' ? 'bg-blue-100 text-blue-700' : 
                                                plan.refundInfo.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {plan.refundInfo.status}
                                            </Badge>
                                        </div>
                                        {plan.refundInfo.refundId && (
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-sm text-slate-500">Refund ID</span>
                                                <span className="text-xs font-mono text-slate-400">{plan.refundInfo.refundId}</span>
                                            </div>
                                        )}
                                        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                                "{plan.refundInfo.message}"
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Admin Actions */}
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-rose-600" /> Admin Control
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                {plan.status === 'pending_approval' && (
                                    <>
                                        <Button 
                                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-sm"
                                            onClick={() => handleAction('approve')}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Subscription
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-11"
                                            onClick={() => handleAction('reject')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Reject Request
                                        </Button>
                                    </>
                                )}
                                {plan.status === 'active' && (
                                    <Button 
                                        className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 shadow-sm"
                                        onClick={() => handleAction('pause')}
                                    >
                                        <PauseCircle className="mr-2 h-4 w-4" /> Pause Deliveries
                                    </Button>
                                )}
                                {plan.status === 'paused' && (
                                    <Button 
                                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-sm"
                                        onClick={() => handleAction('resume')}
                                    >
                                        <PlayCircle className="mr-2 h-4 w-4" /> Resume Deliveries
                                    </Button>
                                )}
                                {plan.remarks && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Latest Remarks</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">"{plan.remarks}"</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

function DetailItem({ icon, label, value, subValue }) {
    return (
        <div className="flex gap-4">
            {icon && (
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {icon}
                </div>
            )}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-900 leading-tight">{value}</p>
                {subValue && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subValue}</p>}
            </div>
        </div>
    );
}

export default PlanDetails;
