import { z } from "zod";

export const createUserSchema = z.object({
  body: z
    .object({
      name: z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters"),
      email: z
        .string({ error: "Email is required" })
        .trim()
        .email("Invalid email format")
        .transform((email) => email.toLowerCase()),
    })
    .strict(),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
  }),
});
