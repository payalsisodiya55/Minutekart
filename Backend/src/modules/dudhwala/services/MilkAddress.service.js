import { MilkAddress } from '../models/MilkAddress.model.js';

export const MilkAddressService = {
  async listAddresses(userId) {
    return MilkAddress.find({ userId }).sort({ isDefault: -1, updatedAt: -1 });
  },

  async addAddress(userId, data) {
    if (data.isDefault) {
      await MilkAddress.updateMany({ userId }, { isDefault: false });
    }
    const address = await MilkAddress.create({ ...data, userId });
    return address;
  },

  async updateAddress(userId, addressId, data) {
    if (data.isDefault) {
      await MilkAddress.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    }
    const address = await MilkAddress.findOneAndUpdate(
      { _id: addressId, userId },
      { $set: data },
      { new: true }
    );
    return address;
  },

  async deleteAddress(userId, addressId) {
    return MilkAddress.findOneAndDelete({ _id: addressId, userId });
  },

  async setDefault(userId, addressId) {
    await MilkAddress.updateMany({ userId }, { isDefault: false });
    return MilkAddress.findOneAndUpdate(
      { _id: addressId, userId },
      { $set: { isDefault: true } },
      { new: true }
    );
  }
};
