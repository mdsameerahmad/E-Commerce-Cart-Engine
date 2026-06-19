import { Router } from "express";

import { getCheckout } from "../controllers/checkout.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { checkoutSchema } from "../validators/checkout.validator.js";

const router = Router();

router.get("/:userId", validateRequest(checkoutSchema), getCheckout);

export default router;
