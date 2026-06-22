import Joi from 'joi';

export const validateCreateMilkOrder = (data) => {
  const schema = Joi.object({
    planConfig: Joi.object({
      productId: Joi.string().required(),
      productLabel: Joi.string().required(),
      quantityId: Joi.string().required(),
      quantityLabel: Joi.string().required(),
      timeSlotId: Joi.string().required(),
      timeSlotLabel: Joi.string().required(),
      durationId: Joi.string().required(),
      durationLabel: Joi.string().required(),
      totalDays: Joi.number().required(),
      startDate: Joi.date().required(),
    }).required(),
    address: Joi.object({
      addressId: Joi.string().optional(),
      fullAddress: Joi.string().required(),
      landmark: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      pincode: Joi.string().allow('', null),
      location: Joi.object({
        type: Joi.string().valid('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2)
      }).optional(),
      isManual: Joi.boolean().optional()
    }).required(),
    zoneId: Joi.string().optional().allow('', null),
    zoneName: Joi.string().optional().allow('', null),
    amount: Joi.number().required()
  });

  const { error, value } = schema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return value;
};

export const validateVerifyMilkPayment = (data) => {
  const schema = Joi.object({
    orderId: Joi.string().required(),
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required()
  });

  const { error, value } = schema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return value;
};
