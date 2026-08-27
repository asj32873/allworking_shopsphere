const { z } = require("zod");

const createIssueSchema = z.object({
  subject: z.string().min(2),
  description: z.string().min(2),
  orderId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM")
});

const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  assignedTo: z.string().nullable().optional(),
  response: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional()
});

module.exports = { createIssueSchema, updateIssueSchema };
