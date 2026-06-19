import * as cartItemService from "../services/cartItem.service.js";

export const addCartItem = async (req, res) => {
  const cart = await cartItemService.addItemToCart(req.body);

  res.status(201).json({
    success: true,
    message: "Item added to cart",
    data: cart,
  });
};

export const updateCartItem = async (req, res) => {
  const item = await cartItemService.updateItemQuantity({
    userId: req.body.userId,
    itemId: req.params.itemId,
    quantity: req.body.quantity,
  });

  res.status(200).json({
    success: true,
    message: "Item quantity updated",
    data: item,
  });
};

export const removeCartItem = async (req, res) => {
  await cartItemService.removeItemFromCart({
    userId: req.body.userId,
    itemId: req.params.itemId,
  });

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
  });
};

export const viewCart = async (req, res) => {
  const cart = await cartItemService.getCompleteCart(req.params.userId);

  res.status(200).json({
    success: true,
    data: cart,
  });
};
