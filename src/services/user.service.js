import mongoose from "mongoose";

import User from "../models/User.js";
import { createCartForUser } from "./cart.service.js";

export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create(userData);

  try {
    await createCartForUser(user._id);
    return user;
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
};

export const getUserById = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};
