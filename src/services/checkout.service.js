import mongoose from "mongoose";

import Cart from "../models/Cart.js";
import CartItem from "../models/CartItem.js";
import User from "../models/User.js";
import { calculateFinalPricing } from "../utils/promotionEngine.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getCheckoutSummary = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw createError("User not found", 404);
  }

  const cart = await Cart.findOne({ userId, status: "ACTIVE" });

  if (!cart) {
    throw createError("Cart not found", 404);
  }

  const items = await CartItem.find({ cartId: cart._id }).lean();

  if (items.length === 0) {
    throw createError("Cart is empty", 400);
  }

  const pricing = calculateFinalPricing(items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const uniqueProducts = new Set(items.map((item) => item.productId)).size;

  return {
    cartId: cart._id,
    totalItems,
    uniqueProducts,
    ...pricing,
  };
};
