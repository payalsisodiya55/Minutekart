import React, { useState, useEffect } from "react";
import { adminAPI } from "@food/api";
import { Button } from "@food/components/ui/button";
import { Input } from "@food/components/ui/input";
import { Label } from "@food/components/ui/label";
import { Checkbox } from "@food/components/ui/checkbox";
import { Switch } from "@food/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@food/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@food/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@food/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2, Users } from "lucide-react";

export default function SubAdminManagement() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    isActive: true,
    servicesAccess: ["food"],
  });

  const availableModules = [
    { id: "food", label: "Chotuu Food" },
    { id: "quickCommerce", label: "Chotuu Mart" },
    { id: "dudhwala", label: "Chotuu Dudhwala" },
  ];

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSubAdmins();
      setSubAdmins(res?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load sub admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const handleOpenDialog = (admin = null) => {
    if (admin) {
      setCurrentEdit(admin._id);
      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        password: "", // Empty for security, only typed if changed
        isActive: admin.isActive,
        servicesAccess: admin.servicesAccess || ["food"],
      });
    } else {
      setCurrentEdit(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        isActive: true,
        servicesAccess: ["food"],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCheckboxChange = (moduleId, checked) => {
    setFormData((prev) => {
      let newAccess = [...prev.servicesAccess];
      if (checked) {
        if (!newAccess.includes(moduleId)) newAccess.push(moduleId);
      } else {
        newAccess = newAccess.filter((id) => id !== moduleId);
      }
      return { ...prev, servicesAccess: newAccess };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) return toast.error("Email is required");
    if (!currentEdit && !formData.password) return toast.error("Password is required for new sub-admin");
    if (formData.servicesAccess.length === 0) return toast.error("Select at least one module");

    setSaving(true);
    try {
      if (currentEdit) {
        await adminAPI.updateSubAdmin(currentEdit, formData);
        toast.success("Sub-admin updated successfully");
      } else {
        await adminAPI.createSubAdmin(formData);
        toast.success("Sub-admin created successfully");
      }
      setIsDialogOpen(false);
      fetchSubAdmins();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save sub-admin");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-admin?")) return;
    try {
      await adminAPI.deleteSubAdmin(id);
      toast.success("Sub-admin deleted");
      fetchSubAdmins();
    } catch (error) {
      toast.error("Failed to delete sub-admin");
    }
  };

  const toggleStatus = async (admin) => {
    try {
      await adminAPI.updateSubAdmin(admin._id, { isActive: !admin.isActive });
      toast.success("Status updated");
      fetchSubAdmins();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-700" />
            <CardTitle>Sub-Admins Management</CardTitle>
          </div>
          <CardDescription>
            Create and manage sub-admins. Restrict their access to specific modules.
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-black text-white hover:bg-neutral-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Sub-Admin
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Modules Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                      No sub-admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  subAdmins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell className="font-medium">{admin.name || "—"}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.servicesAccess?.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold capitalize border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={admin.isActive} 
                          onCheckedChange={() => toggleStatus(admin)} 
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(admin)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(admin._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{currentEdit ? "Edit Sub-Admin" : "Add Sub-Admin"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-neutral-700">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  className="h-11 px-3 py-2 w-full border border-neutral-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-neutral-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="h-11 px-3 py-2 w-full border border-neutral-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-neutral-700">
                  {currentEdit ? "New Password (Optional)" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="text"
                  required={!currentEdit}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={currentEdit ? "Leave empty to keep unchanged" : "Set password"}
                  className="h-11 px-3 py-2 w-full border border-neutral-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold text-neutral-700">Modules Access</Label>
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  {availableModules.map((module) => (
                    <div className="flex items-center space-x-3" key={module.id}>
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={formData.servicesAccess.includes(module.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(module.id, checked)}
                        className="w-5 h-5 border-2 border-neutral-400 rounded-sm data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white flex items-center justify-center transition-all"
                      />
                      <Label htmlFor={`module-${module.id}`} className="text-sm font-medium cursor-pointer text-neutral-700">
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2 pb-2 bg-neutral-50 p-3 rounded-md border border-neutral-200">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-neutral-300"
                />
                <Label htmlFor="isActive" className="font-semibold cursor-pointer text-neutral-700 text-sm">
                  Active Account
                </Label>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-black text-white hover:bg-neutral-800" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {currentEdit ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
