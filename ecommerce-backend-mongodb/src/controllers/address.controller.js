const Address = require("../models/Address");
const { ok, fail } = require("../utils/apiResponse");

async function list(req, res) {
  ok(res, await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 }));
}

async function create(req, res) {
  const existing = await Address.exists({ userId: req.user._id });
  const address = await Address.create({
    ...req.body,
    userId: req.user._id,
    isDefault: !existing
  });
  ok(res, address, "Address created.", 201);
}

async function update(req, res) {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!address) return fail(res, "Address not found.", 404);
  ok(res, address, "Address updated.");
}

async function remove(req, res) {
  const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!address) return fail(res, "Address not found.", 404);

  const replacement = await Address.findOne({ userId: req.user._id }).sort({ createdAt: 1 });
  if (replacement) await Address.findByIdAndUpdate(replacement._id, { isDefault: true });
  ok(res, null, "Address deleted.");
}

async function setDefault(req, res) {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) return fail(res, "Address not found.", 404);

  await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();
  ok(res, address, "Default address updated.");
}

module.exports = { list, create, update, remove, setDefault };
