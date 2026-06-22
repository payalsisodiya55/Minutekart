import React, { useState, useEffect } from 'react';
import { 
    Settings2, Plus, Edit2, Trash2, 
    Save, X, Loader2, CheckCircle2, AlertTriangle,
    Milk, Ruler, Clock, CalendarDays, DollarSign,
    Power, PowerOff, LayoutGrid, ChevronRight, RefreshCw
} from 'lucide-react';
import { dudhwalaAPI } from '@food/api';
import { Button } from '@food/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/card';
import { Input } from '@food/components/ui/input';
import { Badge } from '@food/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@food/utils/utils';

const DropdownManagement = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('product_type');
    const [configs, setConfigs] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [editingId, setEditingId] = useState(null);
    
    // Form States
    const [configForm, setConfigForm] = useState({
        label: '',
        value: '',
        order: 0,
        isActive: true,
        startTime: '',
        endTime: ''
    });

    const [pricingForm, setPricingForm] = useState({
        productId: '',
        quantityId: '',
        pricePerDay: 0,
        isActive: true
    });

    const tabs = [
        { id: 'product_type', label: 'Product Types', icon: Milk, color: 'text-sky-600', bg: 'bg-sky-50' },
        { id: 'quantity', label: 'Quantities', icon: Ruler, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'time_slot', label: 'Time Slots', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'plan_duration', label: 'Plan Durations', icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'pricing', label: 'Pricing Management', icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [configRes, pricingRes] = await Promise.all([
                dudhwalaAPI.adminGetConfigs(),
                dudhwalaAPI.adminGetPricing()
            ]);
            
            if (configRes.data.success) setConfigs(configRes.data.data);
            if (pricingRes.data.success) setPricing(pricingRes.data.data);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleConfigSave = async () => {
        if (!configForm.label || (!configForm.value && activeTab !== 'time_slot')) {
            toast.error('Required fields are missing');
            return;
        }

        try {
            const payload = {
                ...configForm,
                type: activeTab,
                id: editingId
            };
            if (activeTab === 'time_slot' && !payload.value) payload.value = payload.label;

            const res = await dudhwalaAPI.adminUpsertConfig(payload);
            if (res.data.success) {
                toast.success('Configuration saved');
                resetForms();
                fetchAllData();
            }
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    const handlePricingSave = async () => {
        if (!pricingForm.productId || !pricingForm.quantityId || pricingForm.pricePerDay <= 0) {
            toast.error('Please fill all pricing fields correctly');
            return;
        }

        try {
            const res = await dudhwalaAPI.adminUpsertPricing({
                ...pricingForm,
                id: editingId
            });
            if (res.data.success) {
                toast.success('Pricing saved');
                resetForms();
                fetchAllData();
            }
        } catch (err) {
            toast.error('Failed to save pricing');
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            const res = type === 'pricing' 
                ? await dudhwalaAPI.adminDeletePricing(id)
                : await dudhwalaAPI.adminDeleteConfig(id);
            
            if (res.data.success) {
                toast.success('Deleted successfully');
                fetchAllData();
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const resetForms = () => {
        setConfigForm({ label: '', value: '', order: 0, isActive: true, startTime: '', endTime: '' });
        setPricingForm({ productId: '', quantityId: '', pricePerDay: 0, isActive: true });
        setEditingId(null);
    };

    const startEdit = (item, type) => {
        setEditingId(item._id);
        if (type === 'pricing') {
            setPricingForm({
                productId: item.productId?._id || item.productId,
                quantityId: item.quantityId?._id || item.quantityId,
                pricePerDay: item.pricePerDay,
                isActive: item.isActive
            });
        } else {
            setConfigForm({
                label: item.label,
                value: item.value,
                order: item.order || 0,
                isActive: item.isActive,
                startTime: item.startTime || '',
                endTime: item.endTime || ''
            });
        }
    };

    const filteredConfigs = configs.filter(c => c.type === activeTab);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading configurations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 lg:p-4 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                <Settings2 className="h-5 w-5 text-sky-600" />
                            </div>
                            System Configurations
                        </h1>
                        <p className="text-slate-500">Manage dropdown options, timings and pricing models.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
                            onClick={fetchAllData}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Data
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); resetForms(); }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300",
                                    activeTab === tab.id 
                                        ? "bg-white text-slate-900 shadow-md border-l-4 border-l-sky-500 translate-x-1" 
                                        : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-lg", activeTab === tab.id ? tab.bg : "bg-slate-100")}>
                                    <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? tab.color : "text-slate-400")} />
                                </div>
                                {tab.label}
                                <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", activeTab === tab.id ? "rotate-0 opacity-100" : "rotate-0 opacity-0")} />
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-3">
                        {/* Editor Card */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-3 py-1.5 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Edit2 size={18} className="text-sky-600" /> 
                                    {editingId ? 'Modify Entry' : 'Add New Entry'}
                                </CardTitle>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={resetForms} className="h-7 text-slate-400 hover:text-rose-500">
                                        <X size={14} className="mr-1" /> Cancel
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-2">
                                {activeTab === 'pricing' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Product</label>
                                            <select 
                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500"
                                                value={pricingForm.productId}
                                                onChange={e => setPricingForm({...pricingForm, productId: e.target.value})}
                                            >
                                                <option value="">Select Product</option>
                                                {configs.filter(c => c.type === 'product_type').map(p => (
                                                    <option key={p._id} value={p._id}>{p.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Quantity</label>
                                            <select 
                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500"
                                                value={pricingForm.quantityId}
                                                onChange={e => setPricingForm({...pricingForm, quantityId: e.target.value})}
                                            >
                                                <option value="">Select Qty</option>
                                                {configs.filter(c => c.type === 'quantity').map(q => (
                                                    <option key={q._id} value={q._id}>{q.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Price / Day</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input 
                                                    type="number" 
                                                    min="0"
                                                    className="pl-8 h-10 rounded-xl border-slate-200" 
                                                    value={pricingForm.pricePerDay}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (val === '' || Number(val) >= 0) {
                                                            setPricingForm({...pricingForm, pricePerDay: val === '' ? '' : parseFloat(val)})
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <Button className="h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm" onClick={handlePricingSave}>
                                            <Save size={16} className="mr-2" /> Save Pricing
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Display Label</label>
                                            <Input 
                                                className="h-10 rounded-xl border-slate-200 focus:ring-sky-500" 
                                                placeholder="e.g. Buffalo Milk" 
                                                value={configForm.label}
                                                onChange={e => setConfigForm({...configForm, label: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Value / Key</label>
                                            <Input 
                                                type={activeTab === 'plan_duration' ? 'number' : 'text'}
                                                min={activeTab === 'plan_duration' ? '0' : undefined}
                                                className="h-10 rounded-xl border-slate-200 focus:ring-sky-500" 
                                                placeholder="e.g. buffalo_milk" 
                                                value={configForm.value}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (activeTab === 'plan_duration') {
                                                        if (val === '' || Number(val) >= 0) {
                                                            setConfigForm({...configForm, value: val});
                                                        }
                                                    } else {
                                                        setConfigForm({...configForm, value: val});
                                                    }
                                                }}
                                            />
                                        </div>
                                        {activeTab === 'time_slot' && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Time</label>
                                                    <Input 
                                                        type="time" 
                                                        className="h-10 rounded-xl border-slate-200" 
                                                        value={configForm.startTime}
                                                        onChange={e => setConfigForm({...configForm, startTime: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">End Time</label>
                                                    <Input 
                                                        type="time" 
                                                        className="h-10 rounded-xl border-slate-200" 
                                                        value={configForm.endTime}
                                                        onChange={e => setConfigForm({...configForm, endTime: e.target.value})}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <Button className={cn("h-10 rounded-xl font-bold shadow-sm", editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-sky-600 hover:bg-sky-700")} onClick={handleConfigSave}>
                                            {editingId ? <CheckCircle2 size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                                            {editingId ? 'Update' : 'Add Option'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* List Card */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-3 py-1.5">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <LayoutGrid size={18} className="text-slate-400" /> Current Configurations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {activeTab === 'pricing' ? (
                                        pricing.length === 0 ? (
                                            <EmptyState />
                                        ) : pricing.map((item) => (
                                            <div key={item._id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
                                                        <DollarSign className="h-5 w-5 text-sky-600" />

                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{item.productId?.label} - {item.quantityId?.label}</p>
                                                        <p className="text-xs font-bold text-sky-600">₹{item.pricePerDay} per day</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50" onClick={() => startEdit(item, 'pricing')}>
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item._id, 'pricing')}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        filteredConfigs.length === 0 ? (
                                            <EmptyState />
                                        ) : filteredConfigs.map((item) => (
                                            <div key={item._id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                        <p className="text-xs font-black text-slate-400">{item.order || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{item.label}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Value: {item.value}</span>
                                                            {item.startTime && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded">{item.startTime} - {item.endTime}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!item.isActive && <Badge className="bg-rose-50 text-rose-500 border-rose-100 text-[9px] uppercase tracking-tighter">Disabled</Badge>}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50" onClick={() => startEdit(item, 'config')}>
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item._id, 'config')}>
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

function EmptyState() {
    return (
        <div className="py-20 text-center flex flex-col items-center justify-center">
            <LayoutGrid className="h-12 w-12 text-slate-100 mb-3" />
            <p className="text-sm font-medium text-slate-400">No configurations found in this category</p>
        </div>
    );
}

export default DropdownManagement;
