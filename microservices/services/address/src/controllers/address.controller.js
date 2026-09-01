const Address = require("../models/Address");
const { ok, fail } = require("../utils/apiResponse");

function getUserId(req) {
  return req.user?._id?.toString() || req.user?.id || req.auth?.id;
}

async function list(req, res) {
  const userId = getUserId(req);

  console.log("LIST ADDRESS USER ID:", userId);

  const addresses = await Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  console.log("ADDRESSES FOUND:", addresses.length);
  console.log("ADDRESSES:", addresses);

  ok(res, addresses);
}

async function create(req, res) {
  const userId = getUserId(req);

  console.log("CREATE ADDRESS USER ID:", userId);

  if (!userId) {
    return fail(res, "User ID not found.", 401);
  }

  const existing = await Address.exists({ userId });

  const a = await Address.create({
    ...req.body,
    userId,
    isDefault: !existing,
  });

  ok(res, a, "Address created.", 201);
}

async function update(req, res) {
  const userId = getUserId(req);

  const a = await Address.findOneAndUpdate(
    {
      _id: req.params.id,
      userId,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!a) {
    return fail(res, "Address not found.", 404);
  }

  ok(res, a, "Address updated.");
}

async function remove(req, res) {
  const userId = getUserId(req);

  const a = await Address.findOneAndDelete({
    _id: req.params.id,
    userId,
  });

  if (!a) {
    return fail(res, "Address not found.", 404);
  }

  const replacement = await Address.findOne({ userId }).sort({
    createdAt: 1,
  });

  if (replacement) {
    await Address.findByIdAndUpdate(replacement._id, {
      isDefault: true,
    });
  }

  ok(res, null, "Address deleted.");
}

async function setDefault(req, res) {
  const userId = getUserId(req);

  const a = await Address.findOne({
    _id: req.params.id,
    userId,
  });

  if (!a) {
    return fail(res, "Address not found.", 404);
  }

  await Address.updateMany({ userId }, { isDefault: false });

  a.isDefault = true;
  await a.save();

  ok(res, a, "Default address updated.");
}

async function internalGet(req, res) {
  const a = await Address.findOne({
    _id: req.params.id,
    userId: req.params.userId,
  }).lean();

  if (!a) {
    return fail(res, "Address not found.", 404);
  }

  ok(res, a);
}

module.exports = {
  list,
  create,
  update,
  remove,
  setDefault,
  internalGet,
};
