import { MilkConfigService } from '../services/MilkConfig.service.js';

export const MilkConfigController = {
  async addConfig(req, res) {
    try {
      const config = await MilkConfigService.createConfig(req.body);
      res.status(201).json({ success: true, data: config });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getConfigs(req, res) {
    try {
      const configs = await MilkConfigService.getAllConfigs(req.query);
      res.status(200).json({ success: true, data: configs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getPublicConfigs(req, res) {
    try {
      const { type } = req.params;
      const configs = await MilkConfigService.getConfigByType(type);
      res.status(200).json({ success: true, data: configs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateConfig(req, res) {
    try {
      const config = await MilkConfigService.updateConfig(req.params.id, req.body);
      res.status(200).json({ success: true, data: config });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async removeConfig(req, res) {
    try {
      await MilkConfigService.deleteConfig(req.params.id);
      res.status(200).json({ success: true, message: 'Config deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getBootstrap(req, res) {
    try {
      const data = await MilkConfigService.getBootstrapData();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
