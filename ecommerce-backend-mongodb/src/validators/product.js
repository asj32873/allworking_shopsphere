const { z } = require("zod");

const categories = ["ELECTRONICS", "MOBILE", "LAPTOP", "AUDIO", "TV", "HOME_APPLIANCES", "ACCESSORIES", "OTHER"];

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  brand: z.string().min(1),
  category: z.enum(categories),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal(""))
});

module.exports = { productSchema };
