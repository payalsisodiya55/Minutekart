import {
    registerRestaurant,
    listApprovedRestaurants,
    getApprovedRestaurantByIdOrSlug,
    getCurrentRestaurantProfile,
    updateRestaurantProfile,
    updateRestaurantAcceptingOrders,
    updateCurrentRestaurantDiningSettings,
    uploadRestaurantProfileImage,
    uploadRestaurantMenuImage,
    uploadRestaurantCoverImages,
    uploadRestaurantMenuImages,
    listPublicOffers,
    getRestaurantComplaints,
    deleteRestaurantAccount,
    getRestaurantDraft,
    updateRestaurantDraft
} from '../services/restaurant.service.js';
import { validateRestaurantRegisterDto } from '../validators/restaurant.validator.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

export const registerRestaurantController = async (req, res, next) => {
    try {
        const validated = validateRestaurantRegisterDto(req.body);
        const restaurant = await registerRestaurant(validated, req.files);
        return sendResponse(res, 201, 'Restaurant registered successfully', restaurant);
    } catch (error) {
        next(error);
    }
};

export const listApprovedRestaurantsController = async (req, res, next) => {
    try {
        const data = await listApprovedRestaurants(req.query);
        return sendResponse(res, 200, 'Restaurants fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

export const getApprovedRestaurantController = async (req, res, next) => {
    try {
        const restaurant = await getApprovedRestaurantByIdOrSlug(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        return sendResponse(res, 200, 'Restaurant fetched successfully', { restaurant });
    } catch (error) {
        next(error);
    }
};

export const getCurrentRestaurantController = async (req, res, next) => {
    try {
        const restaurantId = req.user.userId;
        const profile = await getCurrentRestaurantProfile(restaurantId);
        sendResponse(res, 200, 'Current restaurant profile fetched successfully', { restaurant: profile });
    } catch (err) {
        next(err);
    }
};

export const getRestaurantDraftController = async (req, res, next) => {
    try {
        const restaurantId = req.user.userId;
        const draft = await getRestaurantDraft(restaurantId);
        sendResponse(res, 200, 'Draft fetched successfully', { draft });
    } catch (err) {
        next(err);
    }
};

export const updateRestaurantDraftController = async (req, res, next) => {
    try {
        const restaurantId = req.user.userId;
        const draftData = req.body?.draft;
        if (!draftData || typeof draftData !== 'object' || Array.isArray(draftData)) {
            return sendError(res, 400, 'Draft payload must be an object');
        }
        const updatedDraft = await updateRestaurantDraft(restaurantId, draftData);
        return sendResponse(res, 200, 'Draft updated successfully', { draft: updatedDraft });
    } catch (err) {
        next(err);
    }
};

export const updateRestaurantProfileController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const restaurant = await updateRestaurantProfile(restaurantId, req.body || {});
        return sendResponse(res, 200, 'Restaurant updated successfully', { restaurant });
    } catch (error) {
        next(error);
    }
};

export const updateRestaurantAcceptingOrdersController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const restaurant = await updateRestaurantAcceptingOrders(restaurantId, req.body?.isAcceptingOrders);
        return sendResponse(res, 200, 'Restaurant availability updated successfully', { restaurant });
    } catch (error) {
        next(error);
    }
};

export const updateCurrentRestaurantDiningSettingsController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const restaurant = await updateCurrentRestaurantDiningSettings(restaurantId, req.body || {});
        return sendResponse(res, 200, 'Dining settings updated successfully', { restaurant });
    } catch (error) {
        next(error);
    }
};

export const uploadRestaurantProfileImageController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const result = await uploadRestaurantProfileImage(restaurantId, req.file);
        return sendResponse(res, 200, 'Profile image uploaded successfully', result);
    } catch (error) {
        next(error);
    }
};

export const uploadRestaurantMenuImageController = async (req, res, next) => {
    try {
        const result = await uploadRestaurantMenuImage(req.file);
        return sendResponse(res, 200, 'Menu image uploaded successfully', result);
    } catch (error) {
        next(error);
    }
};

export const uploadRestaurantCoverImagesController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const result = await uploadRestaurantCoverImages(restaurantId, req.files || []);
        return sendResponse(res, 200, 'Restaurant photos uploaded successfully', result);
    } catch (error) {
        next(error);
    }
};

export const uploadRestaurantMenuImagesController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const result = await uploadRestaurantMenuImages(restaurantId, req.files || []);
        return sendResponse(res, 200, 'Menu photos uploaded successfully', result);
    } catch (error) {
        next(error);
    }
};

export const listPublicOffersController = async (req, res, next) => {
    try {
        const data = await listPublicOffers(req.query || {});
        return sendResponse(res, 200, 'Offers fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

export const getRestaurantComplaintsController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const data = await getRestaurantComplaints(restaurantId, req.query || {});
        return sendResponse(res, 200, 'Complaints fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurantAccountController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const result = await deleteRestaurantAccount(restaurantId);
        return sendResponse(res, 200, 'Account deleted successfully', result);
    } catch (error) {
        next(error);
    }
};

