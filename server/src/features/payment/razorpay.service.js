import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../../config/index.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

let razorpayInstance;

if (config.razorpay.keyId && config.razorpay.keySecret) {
  razorpayInstance = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
}

export const createOrder = async (amount, receipt) => {
  if (!razorpayInstance) {
    throw new AppError('Razorpay is not configured', HTTP_STATUS.INTERNAL_SERVER);
  }

  const options = {
    amount, // amount in smallest currency unit (paise)
    currency: 'INR',
    receipt,
  };

  try {
    return await razorpayInstance.orders.create(options);
  } catch (error) {
    throw new AppError(`Razorpay Error: ${error.message}`, HTTP_STATUS.INTERNAL_SERVER);
  }
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!config.razorpay.keySecret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};
