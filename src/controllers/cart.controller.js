import * as cartService from "../services/cart.service.js";

export const getUserCart = async (req, res) => {
  const cart = await cartService.getCartByUserId(req.params.userId);

  res.status(200).json({
    success: true,
    data: cart,
  });
};
