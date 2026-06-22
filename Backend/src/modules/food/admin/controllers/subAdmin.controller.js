import { FoodAdmin } from '../../../../core/admin/admin.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export const createSubAdmin = async (req, res, next) => {
    try {
        const { name, email, password, servicesAccess, isActive } = req.body;
        
        if (!email || !password) {
            return sendError(res, 400, 'Email and password are required');
        }

        const existing = await FoodAdmin.findOne({ email: email.toLowerCase() });
        if (existing) {
            return sendError(res, 400, 'Admin with this email already exists');
        }

        const subAdmin = new FoodAdmin({
            name,
            email,
            password,
            servicesAccess: servicesAccess || ['food'],
            isActive: isActive !== undefined ? isActive : true,
            role: 'SUB_ADMIN'
        });

        await subAdmin.save();

        const responseData = subAdmin.toObject();
        delete responseData.password;

        return sendResponse(res, 201, 'Sub-admin created successfully', responseData);
    } catch (error) {
        next(error);
    }
};

export const getSubAdmins = async (req, res, next) => {
    try {
        const subAdmins = await FoodAdmin.find({ role: 'SUB_ADMIN' }).select('-password').sort({ createdAt: -1 }).lean();
        return sendResponse(res, 200, 'Sub-admins retrieved successfully', subAdmins);
    } catch (error) {
        next(error);
    }
};

export const updateSubAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, servicesAccess, isActive } = req.body;

        const subAdmin = await FoodAdmin.findOne({ _id: id, role: 'SUB_ADMIN' });
        if (!subAdmin) {
            return sendError(res, 404, 'Sub-admin not found');
        }

        if (email && email.toLowerCase() !== subAdmin.email) {
            const existing = await FoodAdmin.findOne({ email: email.toLowerCase() });
            if (existing) {
                return sendError(res, 400, 'Email is already in use by another account');
            }
            subAdmin.email = email;
        }

        if (name !== undefined) subAdmin.name = name;
        if (servicesAccess !== undefined) subAdmin.servicesAccess = servicesAccess;
        if (isActive !== undefined) subAdmin.isActive = isActive;
        if (password) subAdmin.password = password; // Pre-save hook will hash it

        await subAdmin.save();

        const responseData = subAdmin.toObject();
        delete responseData.password;

        return sendResponse(res, 200, 'Sub-admin updated successfully', responseData);
    } catch (error) {
        next(error);
    }
};

export const deleteSubAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subAdmin = await FoodAdmin.findOneAndDelete({ _id: id, role: 'SUB_ADMIN' });
        if (!subAdmin) {
            return sendError(res, 404, 'Sub-admin not found');
        }
        return sendResponse(res, 200, 'Sub-admin deleted successfully');
    } catch (error) {
        next(error);
    }
};
