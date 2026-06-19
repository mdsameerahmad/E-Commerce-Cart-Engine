import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
  });
});

export default router;
