import mongoose from "mongoose";

import Cart from "../models/Cart.js";
import CartItem from "../models/CartItem.js";
import User from "../models/User.js";
import { refreshCartExpiration } from "./cart.service.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateUserId = (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID", 400);
  }
};

const findActiveCart = async (userId) => {
  validateUserId(userId);

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw createError("User not found", 404);
  }

  const cart = await Cart.findOne({ userId, status: "ACTIVE" });

  if (!cart) {
    throw createError("Cart not found", 404);
  }

  return cart;
};

const validateProduct = ({ productId, productName, price, quantity }) => {
  if (typeof productId !== "string" || !productId.trim()) {
    throw createError("Product ID is required", 400);
  }

  if (typeof productName !== "string" || !productName.trim()) {
    throw createError("Product name is required", 400);
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    throw createError("Price must be a non-negative number", 400);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError("Quantity must be a positive whole number", 400);
  }
};

const validateQuantity = (quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError("Quantity must be a positive whole number", 400);
  }
};

const validateItemId = (itemId) => {
  if (!mongoose.isValidObjectId(itemId)) {
    throw createError("Invalid item ID", 400);
  }
};

export const getCompleteCart = async (userId) => {
  const cart = await findActiveCart(userId);
  const items = await CartItem.find({ cartId: cart._id }).sort({ createdAt: 1 }).lean();
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return {
    cartId: cart._id,
    items,
    subtotal,
  };
};

export const addItemToCart = async ({ userId, productId, productName, price, quantity }) => {
  validateProduct({ productId, productName, price, quantity });

  const cart = await findActiveCart(userId);

  await CartItem.findOneAndUpdate(
    {
      cartId: cart._id,
      productId: productId.trim(),
    },
    {
      $inc: { quantity },
      $set: {
        productName: productName.trim(),
        price,
      },
      $setOnInsert: {
        cartId: cart._id,
        productId: productId.trim(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  await refreshCartExpiration(cart._id);

  return getCompleteCart(userId);
};

export const updateItemQuantity = async ({ userId, itemId, quantity }) => {
  validateItemId(itemId);
  validateQuantity(quantity);

  const cart = await findActiveCart(userId);
  const item = await CartItem.findOneAndUpdate(
    {
      _id: itemId,
      cartId: cart._id,
    },
    {
      $set: { quantity },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!item) {
    throw createError("Item not found", 404);
  }

  await refreshCartExpiration(cart._id);

  return item;
};

export const removeItemFromCart = async ({ userId, itemId }) => {
  validateItemId(itemId);

  const cart = await findActiveCart(userId);
  const item = await CartItem.findOneAndDelete({
    _id: itemId,
    cartId: cart._id,
  });

  if (!item) {
    throw createError("Item not found", 404);
  }

  await refreshCartExpiration(cart._id);
};
