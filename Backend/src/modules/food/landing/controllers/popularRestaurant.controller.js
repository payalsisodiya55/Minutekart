import {
    listPopularRestaurants,
    createPopularRestaurant,
    updatePopularRestaurantOrder,
    togglePopularRestaurantStatus,
    deletePopularRestaurant,
    getPublicPopularRestaurants
} from '../services/popularRestaurant.service.js';
import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';

export const listPopularRestaurantsController = async (req, res, next) => {
    try {
        const data = await listPopularRestaurants();
        return sendResponse(res, 200, 'Popular restaurants fetched successfully', { restaurants: data });
    } catch (error) {
        next(error);
    }
};

export const createPopularRestaurantController = async (req, res, next) => {
    try {
        const file = req.file;
        const restaurantId = req.body?.restaurantId;

        if (!file) {
            throw new ValidationError('Image file is required');
        }
        if (!restaurantId) {
            throw new ValidationError('Restaurant ID is required');
        }

        const created = await createPopularRestaurant(file, { restaurantId });
        return sendResponse(res, 201, 'Popular restaurant created successfully', { restaurant: created });
    } catch (error) {
        next(error);
    }
};

export const deletePopularRestaurantController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Item id is required');
        }
        const result = await deletePopularRestaurant(id);
        return sendResponse(
            res,
            200,
            result.deleted ? 'Popular restaurant deleted' : 'Popular restaurant not found',
            result
        );
    } catch (error) {
        next(error);
    }
};

export const togglePopularRestaurantStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Item id is required');
        }
        const updated = await togglePopularRestaurantStatus(id);
        if (!updated) {
            return sendResponse(res, 404, 'Popular restaurant not found', null);
        }
        return sendResponse(res, 200, 'Popular restaurant status updated', { restaurant: updated });
    } catch (error) {
        next(error);
    }
};

export const updatePopularRestaurantOrderController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = req.body?.order;
        if (!id) {
            throw new ValidationError('Item id is required');
        }
        if (order === undefined || order === null) {
            throw new ValidationError('order is required');
        }
        const num = Number(order);
        if (Number.isNaN(num)) {
            throw new ValidationError('order must be a number');
        }
        const updated = await updatePopularRestaurantOrder(id, num);
        if (!updated) {
            return sendResponse(res, 404, 'Popular restaurant not found', null);
        }
        return sendResponse(res, 200, 'Popular restaurant order updated', { restaurant: updated });
    } catch (error) {
        next(error);
    }
};

export const getPublicPopularRestaurantsController = async (req, res, next) => {
    try {
        const data = await getPublicPopularRestaurants();
        return sendResponse(res, 200, 'Public popular restaurants fetched successfully', { restaurants: data });
    } catch (error) {
        next(error);
    }
};
