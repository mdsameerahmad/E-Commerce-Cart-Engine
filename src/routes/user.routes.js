import { Router } from "express";

import { getUser, registerUser } from "../controllers/user.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { createUserSchema, getUserSchema } from "../validators/user.validator.js";

const router = Router();

router.post("/register", validateRequest(createUserSchema), registerUser);
router.get("/:id", validateRequest(getUserSchema), getUser);

export default router;
