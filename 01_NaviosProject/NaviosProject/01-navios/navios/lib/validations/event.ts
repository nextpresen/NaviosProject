import { z } from "zod";

export const imageSchema = z
  .string()
  .min(1)
  .max(7_000_000)
  .refine((value) => {
    if (value.startsWith("data:image/")) {
      return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
    }
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Invalid image format");
