import * as checkoutService from "../services/checkout.service.js";

export const getCheckout = async (req, res) => {
  const checkout = await checkoutService.getCheckoutSummary(req.params.userId);

  res.status(200).json({
    success: true,
    data: checkout,
  });
};
