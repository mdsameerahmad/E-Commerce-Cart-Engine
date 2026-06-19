import { z } from "zod";

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const addCartItemSchema = z.object({
  body: z
    .object({
      userId: objectId("Invalid user ID"),
      productId: z.string({ error: "Product ID is required" }).trim().min(1, "Product ID is required"),
      productName: z
        .string({ error: "Product name is required" })
        .trim()
        .min(1, "Product name is required"),
      price: z
        .number({ error: "Price is required and must be a number" })
        .positive("Price must be greater than 0"),
      quantity: z
        .number({ error: "Quantity is required and must be a number" })
        .int("Quantity must be a whole number")
        .positive("Quantity must be greater than 0"),
    })
    .strict(),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: objectId("Invalid item ID"),
  }),
  body: z
    .object({
      userId: objectId("Invalid user ID"),
      quantity: z
        .number({ error: "Quantity is required and must be a number" })
        .int("Quantity must be a whole number")
        .positive("Quantity must be greater than 0"),
    })
    .strict(),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: objectId("Invalid item ID"),
  }),
  body: z
    .object({
      userId: objectId("Invalid user ID"),
    })
    .strict(),
});

export const viewCartSchema = z.object({
  params: z.object({
    userId: objectId("Invalid user ID"),
  }),
});
