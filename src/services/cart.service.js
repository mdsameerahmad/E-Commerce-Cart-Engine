import mongoose from "mongoose";

import Cart from "../models/Cart.js";
import User from "../models/User.js";

const CART_EXPIRATION_MINUTES = 30;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getCartExpiration = () =>
  new Date(Date.now() + CART_EXPIRATION_MINUTES * 60 * 1000);

export const refreshCartExpiration = async (cartId) => {
  const expiresAt = getCartExpiration();
  const cart = await Cart.findByIdAndUpdate(
    cartId,
    { $set: { expiresAt } },
    { returnDocument: "after", runValidators: true },
  );

  if (!cart) {
    throw createError("Cart not found", 404);
  }

  return cart;
};

export const createCartForUser = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw createError("User not found", 404);
  }

  const existingCart = await Cart.findOne({ userId, status: "ACTIVE" });

  if (existingCart) {
    throw createError("User already has an active cart", 409);
  }

  try {
    return await Cart.create({
      userId,
      expiresAt: getCartExpiration(),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError("User already has an active cart", 409);
    }

    throw error;
  }
};

export const getCartByUserId = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw createError("User not found", 404);
  }

  const cart = await Cart.findOne({ userId, status: "ACTIVE" })
    .populate("userId", "name email")
    .lean();

  if (!cart) {
    throw createError("Cart not found", 404);
  }

  const { userId: user, ...cartData } = cart;

  return {
    ...cartData,
    user,
  };
};
