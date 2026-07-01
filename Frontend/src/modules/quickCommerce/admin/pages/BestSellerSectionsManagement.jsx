import React, { useEffect, useMemo, useState } from "react";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Modal from "@shared/components/ui/Modal";
import { useToast } from "@shared/components/ui/Toast";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowUpCircle,
  HiOutlineArrowDownCircle,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { adminApi } from "../services/adminApi";

const BestSellerSectionsManagement = () => {
  const { showToast } = useToast();
  const [cards, setCards] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    subcategoryId: "",
    order: 0,
    status: "active",
  });

  // Load all categories
  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories({ flat: true, limit: 1000 });
      const list = res.data.results || res.data.result || [];
      setAllCategories(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load categories", "error");
    }
  };

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBestSellerSections();
      const list = res.data.results || res.data.result || res.data;
      setCards(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load best seller cards", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadCards();
  }, []);

  // Filter: Parent categories (type === 'header')
  const parentCategories = useMemo(() => {
    return allCategories.filter((c) => c.type === "header");
  }, [allCategories]);

  // When categoryId changes, compute subcategories (Main Categories, type === 'category') that belong to it
  useEffect(() => {
    if (!formData.categoryId) {
      setSubcategories([]);
      return;
    }
    const subs = allCategories.filter(
      (c) =>
        c.type === "category" &&
        String(c.parentId) === String(formData.categoryId)
    );
    setSubcategories(subs);
  }, [formData.categoryId, allCategories]);

  const resetForm = () => {
    setFormData({
      categoryId: "",
      subcategoryId: "",
      order: cards.length + 1,
      status: "active",
    });
    setEditingCard(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (cardItem) => {
    setEditingCard(cardItem);
    setFormData({
      categoryId: cardItem.categoryId || "",
      subcategoryId: cardItem.subcategoryId || "",
      order: cardItem.order ?? 0,
      status: cardItem.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      showToast("Please select a Category", "warning");
      return;
    }
    if (!formData.subcategoryId) {
      showToast("Please select a Subcategory", "warning");
      return;
    }

    const payload = {
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      order: Number(formData.order) || 0,
      status: formData.status,
    };

    try {
      if (editingCard) {
        await adminApi.updateBestSellerSection(editingCard._id, payload);
        showToast("Card updated", "success");
      } else {
        await adminApi.createBestSellerSection(payload);
        showToast("Card created", "success");
      }
      setIsModalOpen(false);
      loadCards();
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to save card",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this best seller card?")) return;
    try {
      await adminApi.deleteBestSellerSection(id);
      setCards((prev) => prev.filter((c) => c._id !== id));
      showToast("Card deleted", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to delete card", "error");
    }
  };

  const handleReorder = async (direction, cardItem) => {
    const idx = cards.findIndex((c) => c._id === cardItem._id);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cards.length) return;
    const copy = [...cards];
    const [removed] = copy.splice(idx, 1);
    copy.splice(newIdx, 0, removed);
    const items = copy.map((c, i) => ({ id: c._id, order: i + 1 }));
    try {
      await adminApi.reorderBestSellerSections(items);
      setCards(copy.map((c, i) => ({ ...c, order: i + 1 })));
    } catch (e) {
      console.error(e);
      showToast("Failed to reorder cards", "error");
    }
  };

  return (
    <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1 mb-6">
        <div>
          <h1 className="ds-h1 flex items-center gap-3">
            Best Sellers
            <Badge
              variant="primary"
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Blinkit-style Cards
            </Badge>
          </h1>
          <p className="ds-description mt-1">
            Redesigned Best Seller feature matching Blinkit. Add subcategory cards that automatically fetch and preview products.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          <HiOutlinePlus className="h-5 w-5" />
          Add Best Seller Card
        </button>
      </div>

      <Card className="border-none shadow-xl ring-1 ring-slate-100 bg-white rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Best Seller Cards ({cards.length})
          </h2>
          {isLoading && (
            <span className="text-[10px] font-bold text-slate-400">
              Loading...
            </span>
          )}
        </div>

        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-[80px_1fr_1fr_100px_120px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Order</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subcategory</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</span>
        </div>

        <div className="divide-y divide-slate-50">
          {cards.map((cardItem, idx) => {
            return (
              <div
                key={cardItem._id}
                className="px-6 py-4 md:grid md:grid-cols-[80px_1fr_1fr_100px_120px] md:items-center gap-4 flex flex-col hover:bg-slate-50/40 transition-colors"
              >
                {/* Order */}
                <span className="text-xs font-black text-slate-700 md:text-center">
                  {cardItem.order ?? idx + 1}
                </span>

                {/* Category */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest md:hidden block mb-0.5">Category</span>
                  <span className="text-sm font-bold text-slate-900">{cardItem.categoryName}</span>
                </div>

                {/* Subcategory */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest md:hidden block mb-0.5">Subcategory</span>
                  <span className="text-sm font-bold text-slate-700">{cardItem.subcategoryName}</span>
                </div>

                {/* Status */}
                <div className="md:flex md:justify-center">
                  <Badge
                    variant={cardItem.status === "active" ? "success" : "secondary"}
                    className="text-[10px] font-bold"
                  >
                    {cardItem.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-center mt-2 md:mt-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleReorder("up", cardItem)}
                    className={cn(
                      "p-1.5 rounded-xl border text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                      idx === 0 && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <HiOutlineArrowUpCircle className="h-4 w-4" />
                  </button>
                  <button
                    disabled={idx === cards.length - 1}
                    onClick={() => handleReorder("down", cardItem)}
                    className={cn(
                      "p-1.5 rounded-xl border text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                      idx === cards.length - 1 && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <HiOutlineArrowDownCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(cardItem)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl"
                  >
                    <HiOutlinePencilSquare className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cardItem._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
          {cards.length === 0 && !isLoading && (
            <div className="p-16 text-center">
              <HiOutlineSquares2X2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-900">
                No best seller cards yet
              </h3>
              <p className="text-sm font-bold text-slate-400 mt-2">
                Click &quot;Add Best Seller Card&quot; to configure a card.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Add / Edit Card Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCard ? "Edit Best Seller Card" : "Add Best Seller Card"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  categoryId: e.target.value,
                  subcategoryId: "", // Reset subcategory when category changes
                }))
              }
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none ring-1 ring-transparent focus:ring-primary/20"
            >
              <option value="">-- Select Category --</option>
              {parentCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Subcategory *
            </label>
            <select
              value={formData.subcategoryId}
              disabled={!formData.categoryId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subcategoryId: e.target.value,
                }))
              }
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none ring-1 ring-transparent focus:ring-primary/20 disabled:opacity-50"
            >
              <option value="">-- Select Subcategory --</option>
              {subcategories.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Display Order + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Display Order *
              </label>
              <input
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, order: e.target.value }))
                }
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {editingCard ? "Save Changes" : "Add Card"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BestSellerSectionsManagement;
