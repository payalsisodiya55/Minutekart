import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, 
    Save, X, Loader2, CheckCircle2,
    Sparkles, Trash
} from 'lucide-react';
import { dudhwalaAPI } from '@food/api';
import { Button } from '@food/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@food/components/ui/card';
import { Input } from '@food/components/ui/input';
import { toast } from 'sonner';

const WhyChotuuManagement = () => {
    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [form, setForm] = useState({
        label: '',
        value: '',
        description: '',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await dudhwalaAPI.adminGetConfigs({ type: 'why_dudhwala' });
            if (res.data.success) {
                setConfigs(res.data.data);
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.label || !form.value || !form.description) {
            toast.error('Required fields are missing');
            return;
        }

        try {
            setIsSaving(true);
            const payload = {
                ...form,
                type: 'why_dudhwala',
                id: editingId
            };

            const res = await dudhwalaAPI.adminUpsertConfig(payload);
            if (res.data.success) {
                toast.success('Benefit saved successfully');
                resetForm();
                fetchData();
            }
        } catch (err) {
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this benefit?')) return;
        try {
            const res = await dudhwalaAPI.adminDeleteConfig(id);
            if (res.data.success) {
                toast.success('Deleted successfully');
                fetchData();
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const resetForm = () => {
        setForm({ label: '', value: '', description: '', order: 0, isActive: true });
        setEditingId(null);
    };

    const startEdit = (item) => {
        setEditingId(item._id);
        setForm({
            label: item.label,
            value: item.value,
            description: item.description || '',
            order: item.order || 0,
            isActive: item.isActive
        });
    };

    return (
        <div className="p-4 space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={24} />
                        Why Chotuu Dudhwala?
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Manage benefits and trust markers for the Dudhwala module.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Form Card */}
                <Card className="lg:col-span-4 rounded-2xl border-slate-200 shadow-sm overflow-hidden h-fit sticky top-4">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-4 py-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            {editingId ? <Edit2 size={14} className="text-sky-600" /> : <Plus size={14} className="text-emerald-600" />}
                            {editingId ? 'Edit Benefit' : 'Add New Benefit'}
                        </CardTitle>
                        {editingId && (
                            <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 px-2 text-slate-400 hover:text-rose-500 rounded-lg">
                                <X size={14} className="mr-1" /> Cancel
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title / Label</label>
                            <Input 
                                className="h-10 rounded-xl border-slate-200 focus:ring-purple-500" 
                                placeholder="e.g. Zero Adulteration" 
                                value={form.label}
                                onChange={e => setForm({...form, label: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Key / Slug</label>
                            <Input 
                                className="h-10 rounded-xl border-slate-200 focus:ring-purple-500" 
                                placeholder="e.g. zero_adulteration" 
                                value={form.value}
                                onChange={e => setForm({...form, value: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Description</label>
                            <textarea 
                                className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="Describe the benefit..."
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Order</label>
                                <Input 
                                    type="number"
                                    min="0"
                                    className="h-10 rounded-xl border-slate-200" 
                                    value={form.order}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === '' || Number(val) >= 0) {
                                            setForm({...form, order: val === '' ? '' : parseInt(val)})
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                                <Button
                                    variant="outline"
                                    onClick={() => setForm({...form, isActive: !form.isActive})}
                                    className={cn(
                                        "w-full h-10 rounded-xl border-dashed transition-all",
                                        form.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-rose-200 bg-rose-50 text-rose-600"
                                    )}
                                >
                                    {form.isActive ? "Active" : "Disabled"}
                                </Button>
                            </div>
                        </div>
                        <Button 
                            className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-100"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                            {editingId ? 'Update Benefit' : 'Save Benefit'}
                        </Button>
                    </CardContent>
                </Card>

                {/* List Card */}
                <Card className="lg:col-span-8 rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-4 py-3">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Benefits</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="animate-spin mb-4" size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest">Loading benefits...</p>
                                </div>
                            ) : configs.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                                    <Sparkles className="mb-4 opacity-20" size={48} />
                                    <p className="text-xs font-bold uppercase tracking-widest">No benefits added yet</p>
                                </div>
                            ) : (
                                configs.map((item) => (
                                    <div key={item._id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                                                <p className="text-xs font-black text-purple-600">{item.order || 0}</p>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                                                    {!item.isActive && <span className="text-[8px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-rose-100">Hidden</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mt-1 block">Key: {item.value}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50" onClick={() => startEdit(item)}>
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item._id)}>
                                                <Trash size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default WhyChotuuManagement;
