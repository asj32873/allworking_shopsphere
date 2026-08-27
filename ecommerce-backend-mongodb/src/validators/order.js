const { z } = require("zod");

const createOrderSchema = z.object({
  addressId: z.string().min(1)
});

const statusSchema = z.object({
  status: z.enum(["PLACED", "CONFIRMED", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"]),
  remarks: z.string().max(500).optional()
});

module.exports = { createOrderSchema, statusSchema };
