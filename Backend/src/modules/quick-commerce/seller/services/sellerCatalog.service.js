import mongoose from "mongoose";
import { QuickCategory } from "../../models/category.model.js";
import { SellerNotification } from "../models/sellerNotification.model.js";

const DEFAULT_CATEGORY_TREE = [
  {
    name: "Catalog",
    slug: "catalog",
    children: [
      {
        name: "Groceries",
        slug: "groceries",
        children: [
          { name: "Staples", slug: "staples" },
          { name: "Dairy & Breakfast", slug: "dairy-breakfast" },
          { name: "Snacks", slug: "snacks" },
        ],
      },
      {
        name: "Fresh",
        slug: "fresh",
        children: [
          { name: "Fruits", slug: "fruits" },
          { name: "Vegetables", slug: "vegetables" },
          { name: "Herbs", slug: "herbs" },
        ],
      },
      {
        name: "Beverages",
        slug: "beverages",
        children: [
          { name: "Soft Drinks", slug: "soft-drinks" },
          { name: "Tea & Coffee", slug: "tea-coffee" },
          { name: "Juices", slug: "juices" },
        ],
      },
      {
        name: "Home Essentials",
        slug: "home-essentials",
        children: [
          { name: "Cleaning", slug: "cleaning" },
          { name: "Laundry", slug: "laundry" },
          { name: "Kitchen Care", slug: "kitchen-care" },
        ],
      },
      {
        name: "Personal Care",
        slug: "personal-care",
        children: [
          { name: "Skin Care", slug: "skin-care" },
          { name: "Hair Care", slug: "hair-care" },
          { name: "Daily Hygiene", slug: "daily-hygiene" },
        ],
      },
    ],
  },
];

const categoryNode = (doc) => ({
  _id: doc._id,
  id: doc._id,
  name: doc.name,
  slug: doc.slug,
  type: doc.type || "header",
  parentId: doc.parentId || null,
  children: [],
});

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const walkSeed = async (nodes, parentId = null, depth = 0, parentKey = "") => {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const type =
      depth <= 0 ? "header" : depth === 1 ? "category" : "subcategory";
    const doc = await QuickCategory.findOneAndUpdate(
      { slug: node.slug, parentId },
      {
        $set: {
          isActive: true,
          status: "active",
        },
        $setOnInsert: {
          name: node.name,
          slug: node.slug,
          parentId,
          type,
          sortOrder: index,
        },
      },
      { upsert: true, new: true },
    );

    if (Array.isArray(node.children) && node.children.length) {
      await walkSeed(node.children, doc._id, depth + 1, parentKey);
    }
  }
};

export const ensureSellerCategoriesSeeded = async () => {
  const existingCount = await QuickCategory.countDocuments();
  if (existingCount > 0) return;
  await walkSeed(DEFAULT_CATEGORY_TREE);
};

export const buildSellerCategoryTree = async () => {
  await ensureSellerCategoriesSeeded();
  const docs = await QuickCategory.find({ isActive: { $ne: false } })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const lookup = new Map();
  const roots = [];

  docs.forEach((doc) => {
    lookup.set(String(doc._id), categoryNode(doc));
  });

  docs.forEach((doc) => {
    const current = lookup.get(String(doc._id));
    if (doc.parentId && lookup.has(String(doc.parentId))) {
      lookup.get(String(doc.parentId)).children.push(current);
    } else {
      roots.push(current);
    }
  });

  return roots;
};

export const getDefaultSellerCategoryPath = async () => {
  await ensureSellerCategoriesSeeded();
  const category = await QuickCategory.findOne({ type: "category", isActive: { $ne: false } })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  if (!category) return null;

  const subcategory = await QuickCategory.findOne({
    parentId: category._id,
    type: "subcategory",
    isActive: { $ne: false },
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return {
    headerId: category._id,
    categoryId: category._id,
    subcategoryId: subcategory?._id || null,
  };
};

export const resolveSellerCategoryIds = async ({
  headerId,
  categoryId,
  subcategoryId,
}) => {
  await ensureSellerCategoriesSeeded();
  const selectedIds = [headerId, categoryId, subcategoryId]
    .map((value) => toObjectId(value))
    .filter(Boolean);

  if (selectedIds.length >= 1) {
    const docs = await QuickCategory.find({ _id: { $in: selectedIds } }).lean();
    const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
    
    const subcatDoc = subcategoryId ? byId.get(String(subcategoryId)) : null;
    let finalCategoryId = categoryId || (subcatDoc?.parentId ? String(subcatDoc.parentId) : null);
    
    const catDoc = finalCategoryId ? byId.get(String(finalCategoryId)) : null;
    
    if (catDoc && (catDoc.type === "category" || catDoc.type === "header")) {
      return {
        headerId: catDoc._id,
        categoryId: catDoc._id,
        subcategoryId: (subcatDoc && String(subcatDoc.parentId) === String(catDoc._id)) ? subcatDoc._id : null,
      };
    }
  }

  return getDefaultSellerCategoryPath();
};

const notificationPayloadForProduct = (product) => {
  if (!product || typeof product.stock !== "number") return null;

  if (product.stock <= 0) {
    return {
      key: `inventory:${product._id}:out`,
      type: "inventory",
      title: `Out of stock: ${product.name}`,
      message: `${product.name} is unavailable until you restock it.`,
      metadata: { productId: String(product._id), stock: product.stock },
    };
  }

  if (product.stock <= Number(product.lowStockAlert || 5)) {
    return {
      key: `inventory:${product._id}:low`,
      type: "inventory",
      title: `Low stock: ${product.name}`,
      message: `Only ${product.stock} unit(s) are left for ${product.name}.`,
      metadata: { productId: String(product._id), stock: product.stock },
    };
  }

  return null;
};

export const syncSellerInventoryNotification = async (sellerId, product) => {
  if (!sellerId || !product?._id) return;

  const staleKeys = [
    `inventory:${product._id}:low`,
    `inventory:${product._id}:out`,
  ];

  const nextNotification = notificationPayloadForProduct(product);

  if (!nextNotification) {
    await SellerNotification.deleteMany({
      sellerId,
      key: { $in: staleKeys },
    });
    return;
  }

  await SellerNotification.deleteMany({
    sellerId,
    key: { $in: staleKeys.filter((key) => key !== nextNotification.key) },
  });

  await SellerNotification.findOneAndUpdate(
    { sellerId, key: nextNotification.key },
    {
      $set: {
        type: nextNotification.type,
        title: nextNotification.title,
        message: nextNotification.message,
        metadata: nextNotification.metadata,
      },
      $setOnInsert: { isRead: false },
    },
    { upsert: true, new: true },
  );
};
