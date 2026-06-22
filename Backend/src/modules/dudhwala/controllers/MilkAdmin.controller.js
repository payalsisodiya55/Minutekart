import { MilkAdminService } from '../services/MilkAdmin.service.js';
import { sendResponse } from '../../../utils/response.js';

export const MilkAdminController = {
  async listAllPlans(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        userId: req.query.userId,
        zoneId: req.query.zoneId,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search
      };
      
      const result = await MilkAdminService.listAllPlans(filters);
      return sendResponse(res, 200, 'Milk plans fetched successfully', result);
    } catch (error) {
      next(error);
    }
  },

  async getPlanDetails(req, res, next) {
    try {
      const plan = await MilkAdminService.getPlanDetails(req.params.id);
      return sendResponse(res, 200, 'Plan details fetched successfully', plan);
    } catch (error) {
      next(error);
    }
  },

  async updatePlanStatus(req, res, next) {
    try {
      const { action, remarks } = req.body;
      const adminId = req.user.id;
      
      const plan = await MilkAdminService.updatePlanStatus(req.params.id, action, adminId, remarks);
      return sendResponse(res, 200, `Plan ${action} successfully`, plan);
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await MilkAdminService.getDashboardStats();
      return sendResponse(res, 200, 'Dashboard stats fetched successfully', stats);
    } catch (error) {
      next(error);
    }
  },

  async listConfigs(req, res, next) {
    try {
      const { type } = req.query;
      const configs = await MilkAdminService.listConfigs(type);
      return sendResponse(res, 200, 'Configurations fetched successfully', configs);
    } catch (error) {
      next(error);
    }
  },

  async upsertConfig(req, res, next) {
    try {
      const config = await MilkAdminService.upsertConfig(req.body);
      return sendResponse(res, 200, 'Configuration saved successfully', config);
    } catch (error) {
      next(error);
    }
  },

  async deleteConfig(req, res, next) {
    try {
      await MilkAdminService.deleteConfig(req.params.id);
      return sendResponse(res, 200, 'Configuration deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async listPricing(req, res, next) {
    try {
      const pricing = await MilkAdminService.listPricing();
      return sendResponse(res, 200, 'Pricing fetched successfully', pricing);
    } catch (error) {
      next(error);
    }
  },

  async upsertPricing(req, res, next) {
    try {
      const pricing = await MilkAdminService.upsertPricing(req.body);
      return sendResponse(res, 200, 'Pricing saved successfully', pricing);
    } catch (error) {
      next(error);
    }
  },

  async deletePricing(req, res, next) {
    try {
      await MilkAdminService.deletePricing(req.params.id);
      return sendResponse(res, 200, 'Pricing deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};
