import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import cartItemRouter from "./routes/cartItem.routes.js";
import cartRouter from "./routes/cart.routes.js";
import checkoutRouter from "./routes/checkout.routes.js";
import healthRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", rateLimiter);

app.use("/api/health", healthRouter);
app.use("/api/cart", cartItemRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/users", cartRouter);
app.use("/api/users", userRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
