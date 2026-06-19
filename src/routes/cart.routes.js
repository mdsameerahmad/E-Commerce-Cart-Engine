import { Router } from "express";

import { getUserCart } from "../controllers/cart.controller.js";

const router = Router();

router.get("/:userId/cart", getUserCart);

export default router;
