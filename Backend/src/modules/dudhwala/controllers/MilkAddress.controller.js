import { MilkAddressService } from '../services/MilkAddress.service.js';
import { sendResponse } from '../../../utils/response.js';

export const MilkAddressController = {
  async listAddresses(req, res, next) {
    try {
      const result = await MilkAddressService.listAddresses(req.user.userId);
      return sendResponse(res, 200, 'Addresses retrieved', result);
    } catch (err) {
      next(err);
    }
  },

  async addAddress(req, res, next) {
    try {
      const result = await MilkAddressService.addAddress(req.user.userId, req.body);
      return sendResponse(res, 201, 'Address added', result);
    } catch (err) {
      next(err);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const result = await MilkAddressService.updateAddress(req.user.userId, req.params.id, req.body);
      return sendResponse(res, 200, 'Address updated', result);
    } catch (err) {
      next(err);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      await MilkAddressService.deleteAddress(req.user.userId, req.params.id);
      return sendResponse(res, 200, 'Address deleted');
    } catch (err) {
      next(err);
    }
  },

  async setDefault(req, res, next) {
    try {
      const result = await MilkAddressService.setDefault(req.user.userId, req.params.id);
      return sendResponse(res, 200, 'Default address set', result);
    } catch (err) {
      next(err);
    }
  }
};
