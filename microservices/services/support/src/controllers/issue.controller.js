const Issue = require("../models/CustomerIssue");
const { getJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");

const ORDER =
  () => process.env.ORDER_SERVICE_URL || "http://localhost:5005";

async function create(req, res) {
  if (req.body.orderId) {
    const result = await getJson(
      ORDER(),
      `/api/orders/${req.body.orderId}`,
      {
        authorization: req.headers.authorization || "",
      }
    );

    if (!result.ok) {
      return fail(res, "Order does not belong to you.", 403);
    }
  }

  const issue = await Issue.create({
    ...req.body,
    userId: req.user._id || req.user.id,
  });

  return ok(res, issue, "Issue submitted.", 201);
}

async function list(req, res) {
  let filter = {};

  const userId = req.user._id || req.user.id;

  if (req.user.role === "USER") {
    filter.userId = userId;
  } else if (req.user.role === "VENDOR") {
    const result = await getJson(
      ORDER(),
      `/internal/orders/vendor/${userId}/order-ids`
    );

    filter = {
      $or: [
        { assignedTo: userId },
        {
          orderId: {
            $in: result.data?.data || [],
          },
        },
      ],
    };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  if (req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  }

  const issues = await Issue.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, issues);
}

async function getById(req, res) {
  const issue = await Issue.findById(req.params.id).lean();

  if (!issue) {
    return fail(res, "Issue not found.", 404);
  }

  const userId = req.user._id || req.user.id;

  if (
    req.user.role === "USER" &&
    issue.userId.toString() !== userId.toString()
  ) {
    return fail(res, "Issue not found.", 404);
  }

  return ok(res, issue);
}

async function update(req, res) {
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return fail(res, "Issue not found.", 404);
  }

  const userId = req.user._id || req.user.id;

  if (
    req.user.role === "USER" &&
    issue.userId.toString() !== userId.toString()
  ) {
    return fail(res, "Issue not found.", 404);
  }

  if (req.user.role === "VENDOR") {
    const allowed = ["status", "response"];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        issue[key] = req.body[key];
      }
    }
  } else {
    Object.assign(issue, req.body);
  }

  if (
    issue.status === "RESOLVED" ||
    issue.status === "CLOSED"
  ) {
    issue.resolvedAt = issue.resolvedAt || new Date();
  } else {
    issue.resolvedAt = undefined;
  }

  await issue.save();

  return ok(res, issue, "Issue updated.");
}

/*
 * Internal service endpoint.
 *
 * Used by another backend service to obtain the number
 * of unresolved issues associated with a vendor.
 */

async function internalVendorCount(req, res) {
  const vendorId = req.params.vendorId;

  const result = await getJson(
    ORDER(),
    `/internal/orders/vendor/${vendorId}/order-ids`
  );

  if (!result.ok) {
    return fail(
      res,
      "Unable to retrieve vendor orders.",
      502
    );
  }

  const orderIds = result.data?.data || [];

  const count = await Issue.countDocuments({
    $or: [
      { assignedTo: vendorId },
      { orderId: { $in: orderIds } },
    ],
    status: {
      $nin: ["RESOLVED", "CLOSED"],
    },
  });

  return ok(res, {
    vendorId,
    count,
  });
}

// async function internalVendorCount(req, res) {
//   const vendorId = req.params.vendorId;

//   const count = await Issue.countDocuments({
//     $or: [
//       { assignedTo: vendorId },
//       {
//         orderId: {
//           $in: [],
//         },
//       },
//     ],
//     status: {
//       $nin: ["RESOLVED", "CLOSED"],
//     },
//   });

//   return ok(res, {
//     vendorId,
//     count,
//   });
// }

module.exports = {
  create,
  list,
  getById,
  update,
  internalVendorCount,
};



// const Issue = require("../models/CustomerIssue");
// const { getJson } = require("../utils/serviceClient");
// const { ok, fail } = require("../utils/apiResponse");
// const ORDER = () => process.env.ORDER_SERVICE_URL || "http://localhost:5005";
// async function create(req, res) {
//   if (req.body.orderId) {
//     const r = await getJson(ORDER(), `/api/orders/${req.body.orderId}`, {
//       authorization: req.headers.authorization || "",
//     });
//     if (!r.ok) return fail(res, "Order does not belong to you.", 403);
//   }
//   const i = await Issue.create({ ...req.body, userId: req.user.id });
//   ok(res, i, "Issue submitted.", 201);
// }
// async function list(req, res) {
//   let filter = {};
//   if (req.user.role === "USER") filter.userId = req.user.id;
//   else if (req.user.role === "VENDOR") {
//     const r = await getJson(
//       ORDER(),
//       `/internal/orders/vendor/${req.user.id}/order-ids`,
//     );
//     filter = {
//       $or: [
//         { assignedTo: req.user.id },
//         { orderId: { $in: r.data?.data || [] } },
//       ],
//     };
//   }
//   if (req.query.status) filter.status = req.query.status;
//   if (req.query.priority) filter.priority = req.query.priority;
//   if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
//   ok(res, await Issue.find(filter).sort({ createdAt: -1 }).lean());
// }
// async function getById(req, res) {
//   const i = await Issue.findById(req.params.id).lean();
//   if (!i) return fail(res, "Issue not found.", 404);
//   if (
//     req.user.role === "USER" &&
//     i.userId.toString() !== req.user.id.toString()
//   )
//     return fail(res, "Issue not found.", 404);
//   ok(res, i);
// }
// async function update(req, res) {
//   const i = await Issue.findById(req.params.id);
//   if (!i) return fail(res, "Issue not found.", 404);
//   if (
//     req.user.role === "USER" &&
//     i.userId.toString() !== req.user.id.toString()
//   )
//     return fail(res, "Issue not found.", 404);
//   if (req.user.role === "VENDOR") {
//     for (const k of ["status", "response"])
//       if (req.body[k] !== undefined) i[k] = req.body[k];
//   } else Object.assign(i, req.body);
//   if (["RESOLVED", "CLOSED"].includes(i.status))
//     i.resolvedAt = i.resolvedAt || new Date();
//   else i.resolvedAt = undefined;
//   await i.save();
//   ok(res, i, "Issue updated.");
// }
// module.exports = { create, list, getById, update };
