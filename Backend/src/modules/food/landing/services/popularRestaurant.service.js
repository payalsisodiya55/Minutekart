import { FoodPopularRestaurant } from '../models/popularRestaurant.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { v2 as cloudinary } from 'cloudinary';
import { uploadImageBufferDetailed } from '../../../../services/cloudinary.service.js';

const CLOUDINARY_FOLDER = 'food/popular-restaurants';

/**
 * List all popular restaurants (admin). Sorted by order.
 */
export const listPopularRestaurants = async () => {
    return FoodPopularRestaurant.find()
        .sort({ order: 1, createdAt: -1 })
        .populate({
            path: 'restaurantId',
            select: 'restaurantName estimatedDeliveryTime profileImage rating cuisines slug pureVegRestaurant',
            model: 'FoodRestaurant'
        })
        .lean();
};

/**
 * Get next order for new item.
 */
const getNextOrder = async () => {
    const last = await FoodPopularRestaurant.findOne().sort({ order: -1 }).select('order').lean();
    return (last?.order ?? -1) + 1;
};

/**
 * Upload buffer to Cloudinary and return { secure_url, public_id }.
 */
const uploadImageToCloudinary = (buffer) => {
    return uploadImageBufferDetailed(buffer, CLOUDINARY_FOLDER)
        .then((result) => ({ secure_url: result.secure_url, public_id: result.public_id }));
};

/**
 * Create one popular restaurant entry.
 * @param {{ buffer: Buffer }} file - multer file (req.file)
 * @param {{ restaurantId: string }} meta
 */
export const createPopularRestaurant = async (file, meta) => {
    if (!file?.buffer) {
        throw new Error('Image file is required');
    }
    const restaurantId = meta?.restaurantId;
    if (!restaurantId) {
        throw new Error('Restaurant ID is required');
    }

    const { secure_url, public_id } = await uploadImageToCloudinary(file.buffer);
    const order = await getNextOrder();

    const doc = await FoodPopularRestaurant.create({
        restaurantId,
        imageUrl: secure_url,
        publicId: public_id,
        order,
        isActive: true
    });

    return doc.toObject();
};

/**
 * Update popular restaurant order.
 */
export const updatePopularRestaurantOrder = async (id, order) => {
    const num = Number(order);
    if (Number.isNaN(num)) return null;
    const updated = await FoodPopularRestaurant.findByIdAndUpdate(id, { order: num }, { new: true }).lean();
    return updated;
};

/**
 * Toggle isActive. Returns updated doc or null.
 */
export const togglePopularRestaurantStatus = async (id) => {
    const doc = await FoodPopularRestaurant.findById(id);
    if (!doc) return null;
    const isActive = !doc.isActive;
    const updated = await FoodPopularRestaurant.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
    return updated;
};

/**
 * Delete popular restaurant entry and Cloudinary asset.
 */
export const deletePopularRestaurant = async (id) => {
    const doc = await FoodPopularRestaurant.findById(id);
    if (!doc) {
        return { deleted: false };
    }
    if (doc.publicId) {
        try {
            await cloudinary.uploader.destroy(doc.publicId);
        } catch {
            // ignore
        }
    }
    await doc.deleteOne();
    return { deleted: true };
};

/**
 * Fetch all active popular restaurants populated with their restaurant documents.
 */
export const getPublicPopularRestaurants = async () => {
    const docs = await FoodPopularRestaurant.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .lean();

    const restaurantIds = docs.map((d) => d.restaurantId);
    const restaurants = await FoodRestaurant.find({ _id: { $in: restaurantIds } })
        .select('restaurantName area city profileImage rating cuisines slug pureVegRestaurant location estimatedDeliveryTime')
        .lean();

    const restaurantMap = new Map(restaurants.map((r) => [r._id.toString(), r]));

    return docs.map((item) => {
        const r = restaurantMap.get(item.restaurantId.toString());
        return {
            ...item,
            restaurant: r ? {
                _id: r._id,
                name: r.restaurantName,
                restaurantName: r.restaurantName,
                rating: r.rating || 0,
                profileImage: r.profileImage ? { url: r.profileImage } : null,
                area: r.area,
                city: r.city,
                cuisines: r.cuisines || [],
                slug: r.slug,
                pureVegRestaurant: r.pureVegRestaurant,
                location: r.location,
                estimatedDeliveryTime: r.estimatedDeliveryTime
            } : null
        };
    }).filter(it => it.restaurant);
};
