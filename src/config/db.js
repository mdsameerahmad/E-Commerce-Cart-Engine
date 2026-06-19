import mongoose from "mongoose";

const connectDB = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in the environment");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
};

export default connectDB;
