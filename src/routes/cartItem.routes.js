import { Router } from "express";

import {
  addCartItem,
  removeCartItem,
  updateCartItem,
  viewCart,
} from "../controllers/cartItem.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  addCartItemSchema,
  removeCartItemSchema,
  updateCartItemSchema,
  viewCartSchema,
} from "../validators/cartItem.validator.js";

const router = Router();

router.post("/items", validateRequest(addCartItemSchema), addCartItem);
router.put("/items/:itemId", validateRequest(updateCartItemSchema), updateCartItem);
router.delete("/items/:itemId", validateRequest(removeCartItemSchema), removeCartItem);
router.get("/:userId", validateRequest(viewCartSchema), viewCart);

export default router;
