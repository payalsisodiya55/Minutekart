import { z } from 'zod';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import { sendResponse } from '../../../../utils/response.js';
import { FoodCustomCakeRequest } from '../models/customCakeRequest.model.js';
import { FoodRestaurant } from '../models/restaurant.model.js';
import { notifyOwnerSafely } from '../../../../core/notifications/firebase.service.js';

// Validation Schemas
const createRequestSchema = z.object({
    restaurantId: z.string().min(1, 'Restaurant id required'),
    cakeType: z.string().min(1, 'Cake type required'),
    flavour: z.string().min(1, 'Flavour required'),
    weight: z.number().min(0.1, 'Weight must be greater than 0'),
    shape: z.string().min(1, 'Shape required'),
    theme: z.string().optional().default(''),
    eggless: z.boolean().optional().default(true),
    deliveryDate: z.string().min(1, 'Delivery date required'),
    cakeMessage: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    images: z.array(z.string()).optional().default([])
});

const quoteSchema = z.object({
    quotePrice: z.number().min(1, 'Price must be greater than 0'),
    preparationTimeMinutes: z.number().int().min(10, 'Preparation time must be at least 10 minutes')
});

const rejectSchema = z.object({
    rejectionReason: z.string().min(1, 'Rejection reason required')
});

// User Handlers
export async function createUserCustomCakeRequest(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ValidationError('Authentication required');

        const parsed = createRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.errors?.[0]?.message || 'Validation failed');
        }
        const dto = parsed.data;

        const bakery = await FoodRestaurant.findById(dto.restaurantId);
        if (!bakery) {
            throw new NotFoundError('Bakery not found');
        }
        if (bakery.status !== 'approved') {
            throw new ValidationError('Bakery is not approved to take orders');
        }
        if (bakery.businessType !== 'home_bakery') {
            throw new ValidationError('This outlet does not accept custom cake orders');
        }

        const requestId = 'CCR-' + Math.floor(100000 + Math.random() * 900000);
        const newRequest = await FoodCustomCakeRequest.create({
            requestId,
            userId,
            ...dto,
            status: 'pending'
        });

        // Send push notification to the bakery/restaurant owner
        void notifyOwnerSafely(
            {
                ownerType: 'RESTAURANT',
                ownerId: String(dto.restaurantId)
            },
            {
                title: 'New Custom Cake Request',
                body: `New request ${requestId} for a ${dto.weight}kg ${dto.flavour} cake. Open dashboard to view details and send quotation.`,
                data: {
                    type: 'NEW_CUSTOM_CAKE_REQUEST',
                    requestId: String(newRequest._id),
                    link: '/restaurant/orders'
                }
            }
        );

        return sendResponse(res, 201, 'Custom cake request submitted successfully', { request: newRequest });
    } catch (err) {
        next(err);
    }
}

export async function listUserCustomCakeRequests(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ValidationError('Authentication required');

        const requests = await FoodCustomCakeRequest.find({ userId })
            .populate('restaurantId', 'restaurantName profileImage addressLine1 area city')
            .sort({ createdAt: -1 });

        return sendResponse(res, 200, 'Custom cake requests retrieved', { requests });
    } catch (err) {
        next(err);
    }
}

export async function getUserCustomCakeRequestDetail(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const requestDoc = await FoodCustomCakeRequest.findOne({ _id: id, userId })
            .populate('restaurantId', 'restaurantName profileImage ownerPhone location addressLine1 area city')
            .populate('orderId');

        if (!requestDoc) {
            throw new NotFoundError('Request not found');
        }

        return sendResponse(res, 200, 'Request detail retrieved', { request: requestDoc });
    } catch (err) {
        next(err);
    }
}

export async function confirmCustomCakeQuotation(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const requestDoc = await FoodCustomCakeRequest.findOne({ _id: id, userId });
        if (!requestDoc) {
            throw new NotFoundError('Request not found');
        }
        if (requestDoc.status !== 'quoted') {
            throw new ValidationError(`Cannot confirm request in status: ${requestDoc.status}`);
        }

        requestDoc.status = 'confirmed';
        await requestDoc.save();

        return sendResponse(res, 200, 'Quotation confirmed successfully', { request: requestDoc });
    } catch (err) {
        next(err);
    }
}

export async function userRejectCustomCakeQuotation(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const requestDoc = await FoodCustomCakeRequest.findOne({ _id: id, userId });
        if (!requestDoc) {
            throw new NotFoundError('Request not found');
        }
        if (!['pending', 'quoted'].includes(requestDoc.status)) {
            throw new ValidationError(`Cannot reject request in status: ${requestDoc.status}`);
        }

        requestDoc.status = 'rejected';
        requestDoc.rejectionReason = 'Quotation rejected by customer';
        await requestDoc.save();

        // Send push notification to the bakery/restaurant owner
        void notifyOwnerSafely(
            {
                ownerType: 'RESTAURANT',
                ownerId: String(requestDoc.restaurantId)
            },
            {
                title: 'Custom Cake Request Rejected',
                body: `The customer has rejected the quotation for request ${requestDoc.requestId}.`,
                data: {
                    type: 'CUSTOM_CAKE_REJECTED_BY_USER',
                    requestId: String(requestDoc._id),
                    link: '/restaurant/orders'
                }
            }
        );

        return sendResponse(res, 200, 'Quotation rejected successfully', { request: requestDoc });
    } catch (err) {
        next(err);
    }
}

// Bakery Handlers
export async function listBakeryCustomCakeRequests(req, res, next) {
    try {
        const restaurantId = req.user?.userId;
        if (!restaurantId) throw new ValidationError('Authentication required');

        const requests = await FoodCustomCakeRequest.find({ restaurantId })
            .sort({ createdAt: -1 });

        return sendResponse(res, 200, 'Custom cake requests retrieved', { requests });
    } catch (err) {
        next(err);
    }
}

export async function quoteCustomCakeRequest(req, res, next) {
    try {
        const restaurantId = req.user?.userId;
        const { id } = req.params;
        if (!restaurantId) throw new ValidationError('Authentication required');

        const parsed = quoteSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.errors?.[0]?.message || 'Validation failed');
        }
        const { quotePrice, preparationTimeMinutes } = parsed.data;

        const requestDoc = await FoodCustomCakeRequest.findOne({ _id: id, restaurantId });
        if (!requestDoc) {
            throw new NotFoundError('Request not found');
        }
        if (requestDoc.status !== 'pending') {
            throw new ValidationError(`Cannot send quotation for request in status: ${requestDoc.status}`);
        }

        requestDoc.status = 'quoted';
        requestDoc.quotePrice = quotePrice;
        requestDoc.preparationTimeMinutes = preparationTimeMinutes;
        await requestDoc.save();

        // Send push notification to the user
        void notifyOwnerSafely(
            {
                ownerType: 'USER',
                ownerId: String(requestDoc.userId)
            },
            {
                title: 'Custom Cake Quotation Received',
                body: `Your request ${requestDoc.requestId} has received a quote of ₹${quotePrice} (Prep: ${preparationTimeMinutes} mins).`,
                data: {
                    type: 'CUSTOM_CAKE_QUOTATION',
                    requestId: String(requestDoc._id),
                    link: '/food/user/orders'
                }
            }
        );

        return sendResponse(res, 200, 'Quotation sent successfully', { request: requestDoc });
    } catch (err) {
        next(err);
    }
}

export async function rejectCustomCakeRequest(req, res, next) {
    try {
        const restaurantId = req.user?.userId;
        const { id } = req.params;
        if (!restaurantId) throw new ValidationError('Authentication required');

        const parsed = rejectSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new ValidationError(parsed.error.errors?.[0]?.message || 'Validation failed');
        }
        const { rejectionReason } = parsed.data;

        const requestDoc = await FoodCustomCakeRequest.findOne({ _id: id, restaurantId });
        if (!requestDoc) {
            throw new NotFoundError('Request not found');
        }
        if (requestDoc.status !== 'pending') {
            throw new ValidationError(`Cannot reject request in status: ${requestDoc.status}`);
        }

        requestDoc.status = 'rejected';
        requestDoc.rejectionReason = rejectionReason;
        await requestDoc.save();

        // Send push notification to the user about rejection
        void notifyOwnerSafely(
            {
                ownerType: 'USER',
                ownerId: String(requestDoc.userId)
            },
            {
                title: 'Custom Cake Request Rejected',
                body: `Your request ${requestDoc.requestId} has been rejected by the bakery: ${rejectionReason}`,
                data: {
                    type: 'CUSTOM_CAKE_REJECTED',
                    requestId: String(requestDoc._id),
                    link: '/food/user/orders'
                }
            }
        );

        return sendResponse(res, 200, 'Request rejected successfully', { request: requestDoc });
    } catch (err) {
        next(err);
    }
}
