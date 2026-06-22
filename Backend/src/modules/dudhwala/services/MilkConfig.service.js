import { MilkConfig } from '../models/MilkConfig.model.js';
import { MilkPricing } from '../models/MilkPricing.model.js';

export const MilkConfigService = {
  async createConfig(data) {
    return await MilkConfig.create(data);
  },

  async getAllConfigs(query = {}) {
    return await MilkConfig.find(query).sort({ order: 1, createdAt: -1 });
  },

  async getConfigByType(type) {
    return await MilkConfig.find({ type, isActive: true }).sort({ order: 1 });
  },

  async updateConfig(id, data) {
    return await MilkConfig.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteConfig(id) {
    return await MilkConfig.findByIdAndDelete(id);
  },

  async getBootstrapData() {
    const [configs, pricing] = await Promise.all([
      MilkConfig.find({ isActive: true }).sort({ type: 1, order: 1 }),
      MilkPricing.find({ isActive: true }).lean()
    ]);

    const result = {
      product_type: configs.filter(c => c.type === 'product_type'),
      quantity: configs.filter(c => c.type === 'quantity'),
      time_slot: configs.filter(c => c.type === 'time_slot'),
      plan_duration: configs.filter(c => c.type === 'plan_duration'),
      why_dudhwala: configs.filter(c => c.type === 'why_dudhwala'),
      pricing: pricing
    };

    return result;
  }
};
