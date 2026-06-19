const PROMOTION_TIERS = [
  {
    name: "TIER_3",
    minimumAmount: 20000,
    discountPercentage: 15,
  },
  {
    name: "TIER_2",
    minimumAmount: 10000,
    discountPercentage: 10,
  },
  {
    name: "TIER_1",
    minimumAmount: 5000,
    discountPercentage: 5,
  },
];

const DIVERSITY_BONUS = {
  minimumUniqueProducts: 5,
  bonusPercentage: 3,
};

const roundCurrency = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const validateSubtotal = (subtotal) => {
  if (typeof subtotal !== "number" || !Number.isFinite(subtotal) || subtotal < 0) {
    throw new TypeError("Subtotal must be a non-negative number");
  }
};

export const calculateSubtotal = (items) => {
  if (!Array.isArray(items)) {
    throw new TypeError("Items must be an array");
  }

  const subtotal = items.reduce((total, item) => {
    const { price, quantity } = item ?? {};

    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      throw new TypeError("Item price must be a non-negative number");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new TypeError("Item quantity must be a positive whole number");
    }

    return total + price * quantity;
  }, 0);

  return roundCurrency(subtotal);
};

export const getPromotionTier = (subtotal) => {
  validateSubtotal(subtotal);

  return PROMOTION_TIERS.find((tier) => subtotal >= tier.minimumAmount) ?? null;
};

export const calculateTierDiscount = (subtotal) => {
  validateSubtotal(subtotal);

  const tier = getPromotionTier(subtotal);
  const percentage = tier?.discountPercentage ?? 0;

  return {
    promotionTier: tier?.name ?? null,
    tierDiscountPercentage: percentage,
    tierDiscountAmount: roundCurrency((subtotal * percentage) / 100),
  };
};

export const calculateDiversityBonus = (subtotal, uniqueProducts) => {
  validateSubtotal(subtotal);

  if (!Number.isInteger(uniqueProducts) || uniqueProducts < 0) {
    throw new TypeError("Unique products must be a non-negative whole number");
  }

  const percentage =
    uniqueProducts >= DIVERSITY_BONUS.minimumUniqueProducts
      ? DIVERSITY_BONUS.bonusPercentage
      : 0;

  return {
    diversityBonusPercentage: percentage,
    diversityBonusAmount: roundCurrency((subtotal * percentage) / 100),
  };
};

export const calculateFinalPricing = (items) => {
  const subtotal = calculateSubtotal(items);
  const uniqueProducts = new Set(items.map((item) => item.productId)).size;
  const tierDiscount = calculateTierDiscount(subtotal);
  const diversityBonus = calculateDiversityBonus(subtotal, uniqueProducts);
  const requestedDiscount =
    tierDiscount.tierDiscountAmount + diversityBonus.diversityBonusAmount;
  const totalDiscount = roundCurrency(Math.min(subtotal, requestedDiscount));
  const finalAmount = roundCurrency(Math.max(0, subtotal - totalDiscount));

  return {
    subtotal,
    ...tierDiscount,
    ...diversityBonus,
    totalDiscount,
    finalAmount,
  };
};
